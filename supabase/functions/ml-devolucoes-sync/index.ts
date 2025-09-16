import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call, x-internal-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function fail(msg, status = 400, details) {
  return ok({
    ok: false,
    error: msg,
    details
  }, status);
}

const API_BASE = "https://api.mercadolibre.com";

function dayStartISO(d) {
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

function dayEndISO(d) {
  return new Date(`${d}T23:59:59.999Z`).toISOString();
}

async function refreshTokenIfNeeded(integration_account_id, supabaseUrl, authHeader, internalToken) {
  try {
    console.log(`🔄 [ML Devoluções] Tentando refresh do token para conta: ${integration_account_id}`);
    const r = await fetch(`${supabaseUrl}/functions/v1/mercadolibre-token-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
        "x-internal-call": "true",
        ...internalToken ? {
          "x-internal-token": internalToken
        } : {}
      },
      body: JSON.stringify({
        integration_account_id
      })
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error(`❌ [ML Devoluções] Erro no refresh (${r.status}):`, t.slice(0, 200));
      return null;
    }

    const j = await r.json().catch(() => ({}));
    if (j?.access_token) {
      console.log("✅ [ML Devoluções] Token renovado com sucesso");
      return j.access_token;
    }
    return null;
  } catch (e) {
    console.error("❌ [ML Devoluções] Erro crítico no refresh:", e?.message);
    return null;
  }
}

async function fetchWithRetry(url, options, integration_account_id, supabaseUrl, authHeader, internalToken) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    console.log("🔄 [ML Devoluções] Token expirado (401), tentando refresh...");
    const newToken = await refreshTokenIfNeeded(integration_account_id, supabaseUrl, authHeader, internalToken);
    if (newToken) {
      const newOptions = {
        ...options,
        headers: {
          ...options.headers || {},
          Authorization: `Bearer ${newToken}`
        }
      };
      response = await fetch(url, newOptions);
      console.log(`🔄 [ML Devoluções] Retry após refresh: ${response.status}`);
    }
  }

  return response;
}

async function fetchAllPages(baseUrl, headers, integration_account_id, supabaseUrl, authHeader, internalToken, maxPages = 20) {
  const allResults = [];
  let offset = 0;
  const limit = 50;

  for (let page = 0; page < maxPages; page++) {
    const url = `${baseUrl}&limit=${limit}&offset=${offset}`;
    console.log(`📄 [ML Devoluções] Buscando página ${page + 1}, offset: ${offset}`);

    const resp = await fetchWithRetry(url, {
      headers,
      method: "GET"
    }, integration_account_id, supabaseUrl, authHeader, internalToken);

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error(`❌ [ML Devoluções] Erro na página ${page + 1} (${resp.status}): ${txt.slice(0, 200)}`);
      break;
    }

    const json = await resp.json().catch(() => ({}));
    const results = json?.results ?? json?.data ?? (Array.isArray(json) ? json : []);
    console.log(`📦 [ML Devoluções] Página ${page + 1}: ${Array.isArray(results) ? results.length : 0} itens`);

    if (!Array.isArray(results) || results.length === 0) break;

    allResults.push(...results);
    if (results.length < limit) break;
    offset += limit;

    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allResults;
}

async function fetchClaimsData(opts) {
  const { accessToken, sellerId, dateFromISO, dateToISO, status, integration_account_id, supabaseUrl, authHeader, internalToken } = opts;

  console.log("🔍 [ML Devoluções] Buscando Claims...");
  
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };

  let baseUrl = `${API_BASE}/post-purchase/v1/claims/search?seller_id=${sellerId}`;
  if (dateFromISO) baseUrl += `&date_created=${encodeURIComponent(dateFromISO)}`;
  if (dateToISO) baseUrl += `&last_updated=${encodeURIComponent(dateToISO)}`;
  if (status) baseUrl += `&status=${status}`;

  console.log(`📅 [ML Devoluções] Buscando claims de ${dateFromISO} até ${dateToISO} para seller ${sellerId}`);

  try {
    const claims = await fetchAllPages(baseUrl, headers, integration_account_id, supabaseUrl, authHeader, internalToken);
    console.log(`📦 [ML Devoluções] Claims encontrados: ${claims.length}`);
    return claims;
  } catch (error) {
    console.error(`❌ [ML Devoluções] Erro ao buscar claims:`, error);
    return [];
  }
}

async function fetchReturnsFromClaims(claims, opts) {
  const { accessToken, integration_account_id, supabaseUrl, authHeader, internalToken } = opts;

  console.log("🔍 [ML Devoluções] Buscando Returns de cada Claim...");
  
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };

  const allReturns = [];

  for (const claim of claims) {
    if (!claim.id) continue;
    
    try {
      console.log(`📦 [ML Devoluções] Buscando returns do claim ${claim.id}`);
      
      const url = `${API_BASE}/post-purchase/v2/claims/${claim.id}/returns`;
      
      const resp = await fetchWithRetry(url, {
        headers,
        method: "GET"
      }, integration_account_id, supabaseUrl, authHeader, internalToken);

      if (!resp.ok) {
        console.warn(`⚠️ [ML Devoluções] Claim ${claim.id} sem returns (${resp.status})`);
        continue;
      }

      const json = await resp.json().catch(() => ({}));
      const returns = json?.results ?? json?.data ?? (Array.isArray(json) ? json : []);
      
      if (Array.isArray(returns) && returns.length > 0) {
        console.log(`✅ [ML Devoluções] Claim ${claim.id}: ${returns.length} returns encontrados`);
        // Adicionar referência ao claim em cada return
        returns.forEach(ret => {
          ret._source_claim = claim;
        });
        allReturns.push(...returns);
      }

      // Pequena pausa entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ [ML Devoluções] Erro ao buscar returns do claim ${claim.id}:`, error);
    }
  }

  console.log(`📦 [ML Devoluções] Total de returns encontrados: ${allReturns.length}`);
  return allReturns;
}

// ===== ENRIQUECIMENTO DE DADOS =====

async function enrichOrder(orderId, accessToken, opts) {
  const { integration_account_id, supabaseUrl, authHeader, internalToken, include_messages = true, include_shipping = true, include_buyer_details = true } = opts;
  
  console.log(`🔍 [ML Devoluções] Enriquecendo order ${orderId}...`);
  
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };

  const enriched_data = {
    mediations: [],
    claims: [],
    messages: [],
    shipping_details: {},
    buyer_details: {},
    timeline: [],
    return_analysis: {
      has_mediation: false,
      has_refund: false,
      refund_amount: 0,
      refund_date: null,
      cancel_reason: null,
      cancel_date: null,
      days_to_cancel: 0,
      return_window_days: 0,
      can_return: false,
      total_timeline_events: 0
    }
  };

  try {
    // 1) Buscar detalhes do pedido primeiro
    const orderUrl = `${API_BASE}/orders/${orderId}`;
    const orderResp = await fetchWithRetry(orderUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
    
    let orderData = {};
    if (orderResp.ok) {
      orderData = await orderResp.json().catch(() => ({}));
      console.log(`📞 [ML Devoluções] Buscando detalhes do pedido: ${orderId}`);
      
      // Adicionar eventos do pedido à timeline
      if (orderData.date_created) {
        enriched_data.timeline.push({
          date: orderData.date_created,
          event: 'order_created',
          description: 'Pedido criado',
          data: { status: orderData.status }
        });
      }
      
      if (orderData.payments?.[0]?.date_approved) {
        enriched_data.timeline.push({
          date: orderData.payments[0].date_approved,
          event: 'payment_approved',
          description: 'Pagamento aprovado',
          data: { amount: orderData.payments[0].transaction_amount }
        });
      }

      // Calcular análises automáticas
      if (orderData.date_created) {
        const createdDate = new Date(orderData.date_created);
        const now = new Date();
        enriched_data.return_analysis.return_window_days = Math.max(0, 30 - Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));
        enriched_data.return_analysis.can_return = enriched_data.return_analysis.return_window_days > 0;
      }

      if (orderData.status === 'cancelled') {
        enriched_data.return_analysis.cancel_date = orderData.date_closed || orderData.last_updated;
        if (orderData.date_created && enriched_data.return_analysis.cancel_date) {
          const created = new Date(orderData.date_created);
          const cancelled = new Date(enriched_data.return_analysis.cancel_date);
          enriched_data.return_analysis.days_to_cancel = Math.floor((cancelled - created) / (1000 * 60 * 60 * 24));
        }
        enriched_data.return_analysis.cancel_reason = orderData.tags?.find(tag => tag.startsWith('cancel_reason_'))?.replace('cancel_reason_', '') || 'unknown';
      }
    }

    // 2) Buscar mediações se existirem
    if (orderData.mediations?.length > 0) {
      console.log(`🔍 [ML Devoluções] Encontradas ${orderData.mediations.length} mediações para o pedido ${orderId}`);
      
      for (const mediation of orderData.mediations) {
        if (mediation.id) {
          try {
            const mediationUrl = `${API_BASE}/mediations/${mediation.id}`;
            const mediationResp = await fetchWithRetry(mediationUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
            
            if (mediationResp.ok) {
              const mediationData = await mediationResp.json().catch(() => ({}));
              enriched_data.mediations.push(mediationData);
              enriched_data.return_analysis.has_mediation = true;
              
              console.log(`🔍 [ML Devoluções] Buscando dados completos do claim - Mediation ID: ${mediation.id}`);
              
              // Adicionar evento de mediação à timeline
              if (mediationData.date_created) {
                enriched_data.timeline.push({
                  date: mediationData.date_created,
                  event: 'mediation_created',
                  description: 'Mediação criada',
                  data: { mediation_id: mediation.id, status: mediationData.status }
                });
              }
            }
          } catch (e) {
            console.warn(`⚠️ [ML Devoluções] Erro ao buscar mediação ${mediation.id}:`, e.message);
          }
        }
      }
    }

    // 3) Buscar claims se existir claim_id
    if (orderData.claim_id) {
      try {
        const claimUrl = `${API_BASE}/claims/${orderData.claim_id}`;
        const claimResp = await fetchWithRetry(claimUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
        
        if (claimResp.ok) {
          const claimData = await claimResp.json().catch(() => ({}));
          enriched_data.claims.push(claimData);
          
          console.log(`✅ [ML Devoluções] Dados completos do claim obtidos para mediação ${orderData.claim_id}`);
          
          // Buscar mensagens do claim se solicitado
          if (include_messages) {
            try {
              const messagesUrl = `${API_BASE}/claims/${orderData.claim_id}/messages`;
              const messagesResp = await fetchWithRetry(messagesUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
              
              if (messagesResp.ok) {
                const messagesData = await messagesResp.json().catch(() => ({ results: [] }));
                enriched_data.messages = messagesData.results || messagesData.data || [];
                console.log(`💬 [ML Devoluções] ${enriched_data.messages.length} mensagens obtidas para claim ${orderData.claim_id}`);
                
                // Adicionar mensagens à timeline
                enriched_data.messages.forEach(msg => {
                  if (msg.date_created) {
                    enriched_data.timeline.push({
                      date: msg.date_created,
                      event: 'message_sent',
                      description: `Mensagem de ${msg.sender_role}`,
                      data: { message_id: msg.id, sender: msg.sender_role }
                    });
                  }
                });
              }
            } catch (e) {
              console.warn(`⚠️ [ML Devoluções] Erro ao buscar mensagens do claim ${orderData.claim_id}:`, e.message);
            }
          }

          // Analisar dados do claim para refund
          if (claimData.amount_refunded > 0) {
            enriched_data.return_analysis.has_refund = true;
            enriched_data.return_analysis.refund_amount = claimData.amount_refunded;
            enriched_data.return_analysis.refund_date = claimData.date_last_update;
          }
        }
      } catch (e) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar claim ${orderData.claim_id}:`, e.message);
      }
    }

    // 4) Buscar detalhes de envio se solicitado
    if (include_shipping && orderData.shipping?.id) {
      try {
        const shipmentUrl = `${API_BASE}/shipments/${orderData.shipping.id}`;
        const shipmentResp = await fetchWithRetry(shipmentUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
        
        if (shipmentResp.ok) {
          enriched_data.shipping_details = await shipmentResp.json().catch(() => ({}));
          console.log(`🚚 [ML Devoluções] Envio ${orderData.shipping.id} obtido com sucesso`);
          
          // Adicionar eventos de envio à timeline
          if (enriched_data.shipping_details.status_history) {
            enriched_data.shipping_details.status_history.forEach(status => {
              if (status.date_created) {
                enriched_data.timeline.push({
                  date: status.date_created,
                  event: 'shipping_status_update',
                  description: `Status do envio: ${status.status}`,
                  data: { status: status.status, substatus: status.substatus }
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar envio ${orderData.shipping.id}:`, e.message);
      }
    }

    // 5) Buscar detalhes do comprador se solicitado
    if (include_buyer_details && orderData.buyer?.id) {
      try {
        const buyerUrl = `${API_BASE}/users/${orderData.buyer.id}`;
        const buyerResp = await fetchWithRetry(buyerUrl, { headers, method: "GET" }, integration_account_id, supabaseUrl, authHeader, internalToken);
        
        if (buyerResp.ok) {
          enriched_data.buyer_details = await buyerResp.json().catch(() => ({}));
          console.log(`👤 [ML Devoluções] Dados do comprador ${orderData.buyer.id} obtidos com sucesso`);
        }
      } catch (e) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar comprador ${orderData.buyer.id}:`, e.message);
      }
    }

    // 6) Ordenar timeline por data e calcular estatísticas finais
    enriched_data.timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    enriched_data.return_analysis.total_timeline_events = enriched_data.timeline.length;

    console.log(`✅ [ML Devoluções] Order ${orderId} enriquecida com sucesso`);
    
    return {
      ...orderData,
      devolution_details: enriched_data
    };

  } catch (e) {
    console.error(`❌ [ML Devoluções] Erro ao enriquecer order ${orderId}:`, e.message);
    return null;
  }
}

// ===== FUNÇÃO PRINCIPAL =====

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });

  if (req.method !== "POST") return fail("Method not allowed", 405);

  try {
    const body = await req.json();
    const { 
      integration_account_id, 
      date_from, 
      date_to, 
      dateFrom, 
      dateTo, 
      sellerId, 
      status, 
      mode = "enriched",  // 'basic' | 'enriched' | 'full'
      include_messages = true,
      include_shipping = true,
      include_buyer_details = true,
      enrich_level = "complete"  // 'light' | 'complete'
    } = body || {};

    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente", 500);
    }

    const sb = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization") || "";
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";

    console.log(`🔍 [ML Devoluções] Processando conta: ${integration_account_id}, modo: ${mode}, enriquecimento: ${enrich_level}`);

    // 1) Conta
    const { data: account, error: accErr } = await sb.from("integration_accounts").select("*").eq("id", integration_account_id).eq("is_active", true).single();
    if (accErr || !account) return fail("Conta de integração não encontrada", 404, accErr);

    // 2) Token via integrations-get-secret
    let accessToken = "";
    let sellerFromSecret;

    const secRes = await fetch(`${supabaseUrl}/functions/v1/integrations-get-secret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "x-internal-call": "true",
        "x-internal-token": INTERNAL_TOKEN
      },
      body: JSON.stringify({
        integration_account_id,
        provider: "mercadolivre"
      })
    });

    if (!secRes.ok) {
      const t = await secRes.text().catch(() => "");
      return fail("Erro ao buscar token de acesso", 500, t.slice(0, 250));
    }

    const secJson = await secRes.json().catch(() => ({}));
    if (secJson?.secret?.access_token) {
      accessToken = secJson.secret.access_token;
      sellerFromSecret = secJson.secret.user_id;
    } else if (typeof secJson?.value === "string") {
      accessToken = secJson.value;
    } else {
      return fail("Token não encontrado na resposta do integrations-get-secret", 500, secJson);
    }

    console.log("🔑 [ML Devoluções] Token obtido com sucesso");

    const sellerParam = sellerId ?? sellerFromSecret ?? account?.account_identifier ?? account?.external_user_id;

    // 3) Datas em ISO completo
    const dateFromStr = (dateFrom ?? date_from) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateToStr = (dateTo ?? date_to) || new Date().toISOString().slice(0, 10);
    const dateFromISO = dayStartISO(dateFromStr);
    const dateToISO = dayEndISO(dateToStr);

    console.log(`📅 [ML Devoluções] Buscando de ${dateFromISO} até ${dateToISO} – mode=${mode} seller=${sellerParam}`);

    const all = [];

    // 4) Buscar Claims (sempre necessário para buscar returns)
    let claims = [];
    if (mode === "both" || mode === "claims" || mode === "returns" || mode === "enriched" || mode === "full") {
      claims = await fetchClaimsData({
        accessToken,
        sellerId: sellerParam,
        dateFromISO,
        dateToISO,
        status,
        integration_account_id,
        supabaseUrl,
        authHeader,
        internalToken: INTERNAL_TOKEN
      });

      // Adicionar claims aos resultados apenas se solicitado
      if (mode === "both" || mode === "claims") {
        for (const c of claims) {
          all.push({
            kind: "claim",
            data: c
          });
        }
      }
    }

    // 5) Buscar Returns baseado nos Claims encontrados
    if ((mode === "both" || mode === "returns" || mode === "enriched" || mode === "full") && claims.length > 0) {
      const returns = await fetchReturnsFromClaims(claims, {
        accessToken,
        integration_account_id,
        supabaseUrl,
        authHeader,
        internalToken: INTERNAL_TOKEN
      });

      for (const r of returns) {
        all.push({
          kind: "return",
          data: r
        });
      }
    } else if ((mode === "returns" || mode === "enriched" || mode === "full") && claims.length === 0) {
      console.log("⚠️ [ML Devoluções] Modo com returns solicitado mas nenhum claim encontrado. Returns requerem claims.");
    }

    // 6) ENRIQUECIMENTO DE DADOS (novo)
    if ((mode === "enriched" || mode === "full") && enrich_level === "complete") {
      console.log(`🔍 [ML Devoluções] Iniciando enriquecimento de ${all.length} itens...`);
      
      const enrichmentOpts = {
        integration_account_id,
        supabaseUrl,
        authHeader,
        internalToken: INTERNAL_TOKEN,
        include_messages,
        include_shipping,
        include_buyer_details
      };

      // Coletar order_ids únicos para enriquecimento
      const orderIds = new Set();
      all.forEach(item => {
        if (item.data?.order_id) {
          orderIds.add(item.data.order_id);
        }
        if (item.data?._source_claim?.order_id) {
          orderIds.add(item.data._source_claim.order_id);
        }
      });

      console.log(`🔍 [ML Devoluções] Enriquecendo ${orderIds.size} pedidos únicos...`);

      // Enriquecer cada pedido (máximo 100 para performance)
      const orderIdsArray = Array.from(orderIds).slice(0, 100);
      const enrichedOrders = {};

      // Processar em lotes para evitar sobrecarga
      const batchSize = 10;
      for (let i = 0; i < orderIdsArray.length; i += batchSize) {
        const batch = orderIdsArray.slice(i, i + batchSize);
        
        const enrichmentPromises = batch.map(async orderId => {
          try {
            const enriched = await enrichOrder(orderId, accessToken, enrichmentOpts);
            if (enriched) {
              enrichedOrders[orderId] = enriched;
            }
          } catch (e) {
            console.warn(`⚠️ [ML Devoluções] Falha no enriquecimento do pedido ${orderId}:`, e.message);
          }
        });

        await Promise.all(enrichmentPromises);
        
        // Pausa entre lotes para evitar rate limiting
        if (i + batchSize < orderIdsArray.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Aplicar dados enriquecidos aos itens
      all.forEach(item => {
        const orderId = item.data?.order_id || item.data?._source_claim?.order_id;
        if (orderId && enrichedOrders[orderId]) {
          item.enriched_order = enrichedOrders[orderId];
        }
      });

      console.log(`✅ [ML Devoluções] Enriquecimento concluído: ${Object.keys(enrichedOrders).length} pedidos enriquecidos`);
    }

    // 7) Persistir dados (incluindo enriquecimento)
    let persisted = 0;
    let errors = 0;

    for (const it of all) {
      try {
        if (it.kind === "claim") {
          const c = it.data ?? {};
          const buyer = c.buyer ?? { id: "", nickname: "", email: "" };
          const item = c.items?.[0] ?? c.item ?? { id: "", title: "", sku: "" };

          const record = {
            integration_account_id,
            order_id: c.order_id,
            claim_id: c.id,
            return_id: null,
            order_number: `ML-${c.order_id}`,
            claim_data: c,
            type: c.type ?? "claim",
            status: c.status,
            stage: c.stage,
            priority: "normal",
            processed_status: "pending",
            date_created: c.date_created ? new Date(c.date_created) : new Date(),
            date_last_update: new Date(c.date_last_update ?? c.date_created ?? Date.now()),
            amount_claimed: c.amount_claimed ?? 0,
            amount_refunded: c.amount_refunded ?? 0,
            currency: c.currency ?? "BRL",
            buyer_id: buyer.id,
            buyer_nickname: buyer.nickname,
            buyer_email: buyer.email,
            item_id: item.id,
            item_title: item.title,
            item_sku: item.sku,
            quantity: c.quantity ?? 1,
            unit_price: c.unit_price ?? 0,
            reason_code: c.reason_code,
            reason_description: c.reason_description,
            last_message: c.last_message,
            seller_response: c.seller_response,
            resolution: c.resolution,
            // Adicionar dados enriquecidos
            dados_claim: it.enriched_order?.devolution_details?.claims || null,
            dados_mensagens: it.enriched_order?.devolution_details?.messages || null,
            dados_return: it.enriched_order?.devolution_details || null,
            updated_at: new Date().toISOString()
          };

          const { error } = await sb.from("ml_devolucoes_reclamacoes").upsert(record, {
            onConflict: "integration_account_id, claim_id"
          });

          if (error) {
            console.error("Persist claim error:", error.message);
            errors++;
          } else persisted++;
        } else {
          const r = it.data ?? {};
          const sourceClaim = r?._source_claim ?? {};
          const claimItem = sourceClaim?.items?.[0] ?? sourceClaim?.item ?? {};

          const base = {
            integration_account_id,
            order_id: sourceClaim?.order_id ?? r?.order_id,
            claim_id: sourceClaim?.id,
            return_id: r?.id ?? null,
            order_number: `ML-${sourceClaim?.order_id ?? r?.order_id ?? ""}`,
            claim_data: {
              ...r,
              source_claim: sourceClaim
            },
            type: "return",
            status: r?.status ?? "pending",
            priority: "normal",
            processed_status: "pending",
            date_created: new Date(r?.date_created ?? sourceClaim?.date_created ?? new Date().toISOString()),
            date_last_update: new Date(),
            amount_claimed: sourceClaim?.amount_claimed ?? 0,
            amount_refunded: r?.amount_refunded ?? 0,
            currency: sourceClaim?.currency ?? "BRL",
            buyer_id: sourceClaim?.buyer?.id ?? "",
            buyer_nickname: sourceClaim?.buyer?.nickname ?? "",
            buyer_email: sourceClaim?.buyer?.email ?? "",
            item_id: claimItem?.id,
            item_title: claimItem?.title,
            item_sku: claimItem?.sku,
            quantity: r?.quantity ?? claimItem?.quantity ?? 1,
            unit_price: r?.unit_price ?? claimItem?.unit_price ?? 0,
            reason_code: r?.reason_code ?? sourceClaim?.reason_code,
            reason_description: r?.reason_description ?? sourceClaim?.reason_description,
            // Adicionar dados enriquecidos
            dados_claim: it.enriched_order?.devolution_details?.claims || null,
            dados_mensagens: it.enriched_order?.devolution_details?.messages || null,
            dados_return: it.enriched_order?.devolution_details || null,
            updated_at: new Date().toISOString()
          };

          const { error } = await sb.from("ml_devolucoes_reclamacoes").upsert(base, {
            onConflict: "integration_account_id, return_id"
          });

          if (error) {
            console.error("Persist return error:", error.message);
            errors++;
          } else persisted++;
        }
      } catch (e) {
        console.error("Persist fatal error:", e);
        errors++;
      }
    }

    console.log(`🚀 [ML Devoluções] Processamento concluído: ${all.length} devoluções encontradas`);
    console.log(`🎉 [ML Devoluções] Total de devoluções processadas: ${persisted}`);

    return ok({
      ok: true,
      total_found: all.length,
      persisted,
      errors,
      mode,
      enrich_level,
      enrichment_enabled: mode === "enriched" || mode === "full",
      range: {
        from: dateFromISO,
        to: dateToISO
      }
    });
  } catch (e) {
    return fail("Erro interno do servidor", 500, String(e?.message ?? e));
  }
});