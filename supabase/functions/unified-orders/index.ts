// supabase/functions/unified-orders/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // sem Authorization
  return createClient(url, key);
}

function ok(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(error: string, status = 400, detail?: unknown, cid?: string) {
  const payload: Record<string, unknown> = { ok: false, error, status };
  if (detail !== undefined) payload.detail = detail;
  if (cid) payload.correlation_id = cid;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function getMlConfig() {
  const clientId = Deno.env.get("ML_CLIENT_ID");
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Missing ML_CLIENT_ID / ML_CLIENT_SECRET");
  return { clientId, clientSecret };
}

async function refreshIfNeeded(sb: ReturnType<typeof serviceClient>, secrets: any, cid: string) {
  const safetyMs = 5 * 60 * 1000; // 5min de margem
  const now = Date.now();
  const exp = secrets?.expires_at ? new Date(secrets.expires_at).getTime() : 0;
  if (secrets?.access_token && exp > now + safetyMs) return secrets; // ainda válido

  console.log(`[unified-orders:${cid}] Access token expirado/expirando, fazendo refresh...`);

  const { clientId, clientSecret } = getMlConfig();
  if (!secrets?.refresh_token) throw new Error("Missing refresh_token");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: secrets.refresh_token,
  });

  const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: params.toString(),
  });

  const raw = await resp.text();
  if (!resp.ok) {
    console.error(`[unified-orders:${cid}] Refresh ML falhou`, resp.status, raw);
    throw new Error(`ML refresh failed ${resp.status}: ${raw}`);
  }

  const data = JSON.parse(raw);
  const newExpiresAt = new Date(Date.now() + (data.expires_in ?? 0) * 1000).toISOString();

  // persiste de volta
  const { error: upErr } = await sb.from('integration_secrets').upsert({
    integration_account_id: secrets.account_id,
    provider: 'mercadolivre',
    access_token: data.access_token,
    refresh_token: data.refresh_token || secrets.refresh_token,
    expires_at: newExpiresAt,
    meta: secrets.meta ?? {},
    updated_at: new Date().toISOString()
  }, { onConflict: 'integration_account_id,provider' });
  if (upErr) {
    console.error(`[unified-orders:${cid}] Falha ao salvar novos tokens`, upErr);
    throw new Error("Failed to save refreshed tokens");
  }

  console.log(`[unified-orders:${cid}] Refresh OK`);
  return {
    ...secrets,
    access_token: data.access_token,
    refresh_token: data.refresh_token || secrets.refresh_token,
    expires_at: newExpiresAt,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const reqHeaders = req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type";
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Access-Control-Allow-Headers": reqHeaders } });
  }
  if (req.method !== "POST") return fail("Method Not Allowed", 405);

  const cid = crypto.randomUUID().slice(0, 8);
  try {
    if (!ENC_KEY) return fail("Encryption key not configured (APP_ENCRYPTION_KEY)", 500, null, cid);

    // opcional: ainda exigimos Authorization do usuário para disciplina de uso,
    // mas NÃO vamos usá-lo nos acessos ao banco (service role cuidará disso).
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) return fail("Missing Authorization header", 401, null, cid);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { 
      integration_account_id, 
      status, 
      shipping_status, 
      date_from, 
      date_to, 
      seller_id, 
      q, 
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      limit: rawLimit = 50, 
      offset = 0 
    } = body || {};
    
    // 🔧 AUDITORIA: Log detalhado para debug de filtros
    console.log(`[unified-orders:${cid}] Filtros detalhados:`, {
      integration_account_id,
      filtros_geograficos: { cidade, uf },
      filtros_valor: { valorMin, valorMax },
      filtros_busca: { q, search },
      filtros_data: { date_from, date_to },
      filtros_status: { status, shipping_status }
    });
    
    // 🚨 VALIDAÇÃO: Mercado Livre API aceita máximo 51, limitamos a 50 para segurança
    const limit = Math.min(rawLimit, 50);
    if (rawLimit > 50) {
      console.warn(`[unified-orders:${cid}] Limit reduzido de ${rawLimit} para ${limit} (máximo permitido: 50)`);
    }
    
    console.log(`[unified-orders:${cid}] filters`, { 
      integration_account_id, status, shipping_status, date_from, date_to, 
      cidade, uf, valorMin, valorMax, search, q, limit, offset 
    });
    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400, null, cid);

    const sb = serviceClient();

    // 1) Conta
    const { data: account, error: accErr } = await sb
      .from("integration_accounts")
      .select("*")
      .eq("id", integration_account_id)
      .maybeSingle();

    if (accErr || !account) return fail("Integration account not found", 404, accErr, cid);
    if (!account.is_active) return fail("Integration account is not active", 400, null, cid);
    if (account.provider !== "mercadolivre") {
      return ok({ results: [], unified: [], paging: { total: 0, limit, offset }, count: 0 });
    }

    // 2) Segredos
    const { data: secrets, error: secErr } = await sb
      .from('integration_secrets')
      .select('access_token, refresh_token, expires_at, meta')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secErr || !secrets?.access_token) return fail("Segredos não encontrados", 404, secErr, cid);

    // anexa account_id para o refresh salvar
    const secretsWithAccountId = { ...secrets, account_id: integration_account_id };

    // 3) Garantir token válido
    const validSecrets = await refreshIfNeeded(sb, secretsWithAccountId, cid);
    const accessToken = validSecrets.access_token as string;

    // 4) Chamada ML Orders
    // Seller ID robusto: evita "undefined"/"null" ao converter
    const sellerFromAccount = account.account_identifier ? String(account.account_identifier) : '';
    const sellerFromSecrets = validSecrets.meta?.user_id ? String(validSecrets.meta?.user_id) : '';
    const effectiveSeller = seller_id ? String(seller_id) : (sellerFromAccount || sellerFromSecrets);
    if (!effectiveSeller || effectiveSeller === 'undefined' || effectiveSeller === 'null' || !/^\d+$/.test(effectiveSeller)) {
      return fail("Seller ID not found (account_identifier/payload)", 400, { sellerFromAccount, sellerFromSecrets, seller_id }, cid);
    }

    // Normalização de datas (aceita YYYY-MM-DD e ISO). Garante range válido usando offset local (-03:00 por padrão)
    const tzOffset = Deno.env.get('ML_TZ_OFFSET') || '-03:00';
    const toOffsetDate = (d?: string, endOfDay = false) => {
      if (!d) return undefined;
      // Já é ISO com tempo
      if (/T/.test(d)) return d;
      // Para YYYY-MM-DD, anexar offset local do negócio para evitar "véspera"
      return `${d}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${tzOffset}`;
    };
    let fromISO = toOffsetDate(String(date_from || ''));
    let toISO = toOffsetDate(String(date_to || ''), true);
    if (fromISO && toISO) {
      const fromTime = Date.parse(fromISO);
      const toTime = Date.parse(toISO);
      if (!isNaN(fromTime) && !isNaN(toTime) && fromTime > toTime) {
        // Swap se range invertido
        const tmp = fromISO; fromISO = toISO; toISO = tmp;
      }
    }

    console.log(`[unified-orders:${cid}] date filters normalized (offset ${tzOffset}):`, { date_from, date_to, fromISO, toISO });

    const mlUrl = new URL("https://api.mercadolibre.com/orders/search");
    mlUrl.searchParams.set("seller", effectiveSeller);

    const allowedStatuses = new Set(["confirmed","payment_required","payment_in_process","paid","shipped","delivered","cancelled","invalid"]);
    if (status && allowedStatuses.has(String(status))) {
      mlUrl.searchParams.set("order.status", String(status));
    }
    if (fromISO) mlUrl.searchParams.set("order.date_created.from", fromISO);
    if (toISO) mlUrl.searchParams.set("order.date_created.to", toISO);
    mlUrl.searchParams.set("limit", String(limit));
    mlUrl.searchParams.set("offset", String(offset));
    console.log(`[unified-orders:${cid}] url`, mlUrl.toString());

    const mlResp = await fetch(mlUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });

    const mlRaw = await mlResp.text();
    if (!mlResp.ok) {
      if (mlResp.status === 403 && mlRaw.includes("invalid_operator_user_id")) {
        return fail("invalid_operator_user_id - reconecte com a conta ADMIN da loja no ML", 403, mlRaw, cid);
      }
      return fail(`Mercado Livre API error: ${mlResp.status}`, mlResp.status, mlRaw, cid);
    }

    const json = JSON.parse(mlRaw);
    
    // 5) Buscar detalhes de shipping para cada pedido
    const enrichedOrders = await enrichOrdersWithShipping(json.results ?? [], accessToken, cid);
    
    // 6) Aplicar filtros de shipping_status no servidor
    let filteredOrders = enrichedOrders;
    if (shipping_status) {
      const targetStatuses = Array.isArray(shipping_status) ? shipping_status : [shipping_status];
      filteredOrders = enrichedOrders.filter(order => {
        const orderShippingStatus = order.shipping?.status || '';
        return targetStatuses.some(targetStatus => 
          orderShippingStatus.toLowerCase() === targetStatus.toLowerCase() ||
          orderShippingStatus === targetStatus
        );
      });
      console.log(`[unified-orders:${cid}] Filtered by shipping_status: ${enrichedOrders.length} -> ${filteredOrders.length}`);
    }
    
    // 7) ✅ NOVO: Aplicar filtros de busca por texto
    if (search || q) {
      const searchTerm = (search || q || '').toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const searchableFields = [
          order.id,
          order.buyer?.first_name,
          order.buyer?.last_name,
          order.buyer?.nickname,
          order.buyer?.identification?.number,
          order.order_items?.map((item: any) => item.item?.title).join(' ')
        ].join(' ').toLowerCase();
        
        return searchableFields.includes(searchTerm);
      });
      console.log(`[unified-orders:${cid}] Filtered by search "${searchTerm}": ${filteredOrders.length} orders`);
    }
    
    // 8) ✅ NOVO: Aplicar filtros de valor
    if (valorMin !== undefined || valorMax !== undefined) {
      filteredOrders = filteredOrders.filter(order => {
        const orderValue = order.total_amount || 0;
        if (valorMin !== undefined && orderValue < valorMin) return false;
        if (valorMax !== undefined && orderValue > valorMax) return false;
        return true;
      });
      console.log(`[unified-orders:${cid}] Filtered by value range [${valorMin}, ${valorMax}]: ${filteredOrders.length} orders`);
    }
    
    // 9) ✅ CRÍTICO: Aplicar filtros geográficos (cidade/UF)
    if (cidade || uf) {
      filteredOrders = filteredOrders.filter(order => {
        // Extrair cidade e UF do shipping destination
        const destCity = order.shipping?.destination?.shipping_address?.city?.name || '';
        const destState = order.shipping?.destination?.shipping_address?.state?.name || '';
        
        // Filtro por cidade (busca parcial case-insensitive)
        if (cidade && !destCity.toLowerCase().includes(cidade.toLowerCase())) {
          return false;
        }
        
        // Filtro por UF (busca exata)
        if (uf && destState !== uf) {
          return false;
        }
        
        return true;
      });
      console.log(`[unified-orders:${cid}] Filtered by location (cidade: ${cidade}, uf: ${uf}): ${filteredOrders.length} orders`);
    }
    
    // Debug: log a amostra dos dados enriquecidos
    if (filteredOrders.length > 0) {
      console.log(`[unified-orders:${cid}] Sample enriched order shipping data:`, 
        JSON.stringify(filteredOrders[0]?.shipping, null, 2));
    }
    
    const serverTotal = Number(json?.paging?.total ?? json?.paging?.count ?? filteredOrders.length);
    return ok({
      results: filteredOrders,
      unified: transformMLOrders(filteredOrders, integration_account_id),
      paging: { ...json.paging, total: serverTotal, limit, offset },
      total: serverTotal,
      count: filteredOrders.length,
      has_more: (offset + limit) < serverTotal,
      correlation_id: cid,
      server_filtering_applied: Boolean(shipping_status)
    });
  } catch (err: any) {
    console.error(`[unified-orders:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});

// ------ helpers ------

// Função para buscar detalhes de shipping dos pedidos
async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  const enrichedOrders = [];
  
  for (const order of orders) {
    try {
      let enrichedOrder = { ...order };
      
      // Se tem shipping ID, buscar detalhes completos do shipment
      if (order.shipping?.id) {
        const shippingUrl = `https://api.mercadolibre.com/shipments/${order.shipping.id}`;
        const shippingResp = await fetch(shippingUrl, {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'x-format-new': 'true'  // Header necessário para o novo formato JSON
          }
        });
        
        if (shippingResp.ok) {
          const shippingData = await shippingResp.json();
          
          // Enriquecer com todos os dados de shipping disponíveis
          // Buscar pagamentos e custos do envio no novo formato (x-format-new)
          const [payResp, costsResp] = await Promise.all([
            fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/payments`, {
              headers: { Authorization: `Bearer ${accessToken}`, 'x-format-new': 'true' }
            }),
            fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
              headers: { Authorization: `Bearer ${accessToken}`, 'x-format-new': 'true' }
            })
          ]);

          const paymentsData = payResp.ok ? await payResp.json() : [];
          const costsData = costsResp.ok ? await costsResp.json() : null;

          // Somente pagamentos aprovados e valores positivos
          const approvedPayments = Array.isArray(paymentsData)
            ? paymentsData.filter((p: any) => String(p?.status || '').toLowerCase() === 'approved')
            : [];
          const paymentsSum = approvedPayments.reduce((acc: number, p: any) => {
            const amt = Number(p?.amount ?? 0);
            return acc + (Number.isFinite(amt) && amt > 0 ? amt : 0);
          }, 0);

          // Compensação (bônus) ao vendedor via /costs -> senders[].compensation
          const costsComp = Array.isArray(costsData?.senders)
            ? costsData.senders.reduce((acc: number, s: any) => acc + (Number(s?.compensation ?? 0) || 0), 0)
            : 0;

          const bonusTotal = (costsComp > 0 ? costsComp : paymentsSum) || 0;

          enrichedOrder.shipping = {
            ...order.shipping,
            // Dados básicos
            tracking_number: shippingData.tracking_number,
            status: shippingData.status,
            substatus: shippingData.substatus,
            
            // Endereços completos
            origin: shippingData.origin,
            destination: shippingData.destination,
            
            // Informações de logística e método de envio
            logistic: shippingData.logistic,
            lead_time: shippingData.lead_time,
            
            // Dados importantes para "Forma Enrega"
            shipping_method: shippingData.lead_time?.shipping_method,
            delivery_type: shippingData.lead_time?.delivery_type,
            
            // Pagamentos de envio (não usados no bônus do vendedor, apenas para referência)
            payments: approvedPayments,
            shipping_payments: approvedPayments,
            costs: costsData,

            // Bônus por envio (Flex): SOMENTE compensações do vendedor em /costs
            bonus: (() => {
              const senders = Array.isArray(costsData?.senders) ? costsData.senders : [];
              const total = senders.reduce((acc: number, s: any) => {
                const compNum = Number(s?.compensation ?? 0);
                const compList = Array.isArray(s?.compensations) ? s.compensations : [];
                const compListSum = compList.reduce((a: number, c: any) => a + (Number(c?.amount ?? 0) || 0), 0);
                return acc + (Number.isFinite(compNum) ? compNum : 0) + compListSum;
              }, 0);
              return total;
            })(),
            bonus_total: (() => {
              const senders = Array.isArray(costsData?.senders) ? costsData.senders : [];
              const total = senders.reduce((acc: number, s: any) => {
                const compNum = Number(s?.compensation ?? 0);
                const compList = Array.isArray(s?.compensations) ? s.compensations : [];
                const compListSum = compList.reduce((a: number, c: any) => a + (Number(c?.amount ?? 0) || 0), 0);
                return acc + (Number.isFinite(compNum) ? compNum : 0) + compListSum;
              }, 0);
              return total;
            })(),

            // Informações adicionais
            tags: shippingData.tags,
            dimensions: shippingData.dimensions,
            declared_value: shippingData.declared_value
          };
          console.log(`[unified-orders:${cid}] Enriched shipping for order ${order.id}`);
        } else {
          console.log(`[unified-orders:${cid}] Failed to fetch shipping ${order.shipping.id}: ${shippingResp.status}`);
        }
      }
      
      enrichedOrders.push(enrichedOrder);
    } catch (err) {
      console.error(`[unified-orders:${cid}] Error enriching order ${order.id}:`, err);
      enrichedOrders.push(order); // Fallback para order original
    }
  }
  
  return enrichedOrders;
}

function transformMLOrders(mlOrders: any[], integrationAccountId: string) {
  return (mlOrders ?? []).map((order) => {
    // Calcular frete: primeiro tentar payments[].shipping_cost, depois shipping.cost
    const shippingCost = order.payments?.[0]?.shipping_cost || order.shipping?.cost || 0;
    
    // Extrair SKUs dos itens para observações
    const orderItems = order.order_items || [];
    const skuList = orderItems.map((item: any) => 
      item.item?.seller_sku || item.item?.seller_custom_field || item.item?.title?.substring(0, 30)
    ).filter(Boolean);
    
    // Calcular desconto: diferença entre full_unit_price e unit_price
    let valorDesconto = 0;
    orderItems.forEach((item: any) => {
      if (item.full_unit_price && item.unit_price) {
        valorDesconto += (item.full_unit_price - item.unit_price) * item.quantity;
      }
    });
    
    // Calcular quantidade total de itens comprados
    const quantidadeTotalItens = orderItems.reduce((total: number, item: any) => {
      return total + (item.quantity || 0);
    }, 0);
    
    // Dados Financeiros Detalhados
    const receitaPorProdutos = (order.total_amount || 0) - shippingCost;
    const tarifasVenda = orderItems.reduce((total: number, item: any) => total + (item.sale_fee || 0), 0);
    
    // Extrair impostos - tentar múltiplas fontes
    let impostos = 0;
    if (order.payments && Array.isArray(order.payments)) {
      // Tentar taxes_amount do primeiro payment
      impostos = order.payments[0]?.taxes_amount || 0;
      
      // Se não encontrou, tentar somar taxes de todos os payments
      if (impostos === 0) {
        impostos = order.payments.reduce((total: number, payment: any) => {
          return total + (payment.taxes_amount || payment.taxes || 0);
        }, 0);
      }
    }
    
    // Receita com envio (bônus Flex) somente pelas compensações do vendedor em /costs
    const bonusCosts = Array.isArray(order.shipping?.costs?.senders)
      ? order.shipping.costs.senders.reduce((acc: number, s: any) => {
          const compNum = Number(s?.compensation ?? 0) || 0;
          const compList = Array.isArray(s?.compensations) ? s.compensations : [];
          const compListSum = compList.reduce((a: number, c: any) => a + (Number(c?.amount ?? 0) || 0), 0);
          return acc + compNum + compListSum;
        }, 0)
      : 0;
    const receitaPorEnvio = Number(order.shipping?.bonus_total ?? order.shipping?.bonus ?? bonusCosts) || 0;
    
    const valorPagoTotal = order.paid_amount || 0;
    
    // Debug: Log dos dados financeiros para auditoria
    if (order.id) {
      console.log(`[transform] Order ${order.id} financial data:`, {
        total_amount: order.total_amount,
        payments_count: order.payments?.length || 0,
        first_payment_taxes: order.payments?.[0]?.taxes_amount,
        calculated_impostos: impostos,
        shipping_cost: shippingCost,
        paid_amount: order.paid_amount
      });
    }
    
    // Dados do Produto/Anúncio (primeiro item como representativo)
    const primeiroItem = orderItems[0]?.item || {};
    const tituloAnuncio = primeiroItem.title || "";
    const categoriaML = primeiroItem.category_id || "";
    const condicao = primeiroItem.condition || "";
    const garantia = primeiroItem.warranty || "";
    const tipoListagem = orderItems[0]?.listing_type_id || "";
    const atributosVariacao = primeiroItem.variation_attributes || [];
    const atributosTexto = atributosVariacao.map((attr: any) => `${attr.name}: ${attr.value_name}`).join(", ");
    
    // Extrair dados de envio detalhados - corrigir caminhos
    const cidade = order.shipping?.destination?.shipping_address?.city?.name || 
                   order.shipping?.receiver_address?.city?.name || "";
    const uf = order.shipping?.destination?.shipping_address?.state?.name || 
               order.shipping?.receiver_address?.state?.name || "";
    const codigoRastreamento = order.shipping?.tracking_number || "";
    const urlRastreamento = order.shipping?.tracking_url || "";
    
    // Dados de Envio Detalhados - usando dados completos do endpoint /shipments
    const shippingMethod = order.shipping?.shipping_method || order.shipping?.lead_time?.shipping_method;
    const logisticType = order.shipping?.logistic?.type || order.shipping?.logistic_type;
    const deliveryType = order.shipping?.delivery_type || order.shipping?.lead_time?.delivery_type;
    
    // Modo de Envio - identificar fulfillment vs normal
    const modoEnvio = logisticType === 'fulfillment' ? 'Mercado Livre Fulfillment' :
                      logisticType === 'drop_off' ? 'Mercado Envios' :
                      logisticType === 'cross_docking' ? 'Cross Docking' :
                      order.shipping?.shipping_mode || 'Normal';
    
    // Forma de Entrega - mais detalhada
    const formaEntrega = shippingMethod?.name || 
                         deliveryType || 
                         (logisticType === 'fulfillment' ? 'Fulfillment ML' : 
                          logisticType === 'drop_off' ? 'Mercado Envios' : 
                          'Envio Normal');
    
    // Novos campos de rastreamento e logística - corrigir caminhos
    const trackingMethod = order.shipping?.tracking_method || "";
    const substatus = order.shipping?.substatus || "";
    const logisticMode = order.shipping?.logistic?.mode || "";
    
    // Debug: Log dos dados de shipping para auditoria
    if (order.id && order.shipping) {
      console.log(`[transform] Order ${order.id} shipping data:`, {
        tracking_method: order.shipping?.tracking_method,
        substatus: order.shipping?.substatus,
        logistic_mode: order.shipping?.logistic?.mode,
        city: order.shipping?.destination?.shipping_address?.city?.name,
        state: order.shipping?.destination?.shipping_address?.state?.name
      });
    }
    
    const preferenciaEntrega = order.shipping?.destination?.shipping_address?.delivery_preference || "";
    const enderecoCompleto = [
      order.shipping?.destination?.shipping_address?.street_name,
      order.shipping?.destination?.shipping_address?.street_number,
      order.shipping?.destination?.shipping_address?.neighborhood?.name
    ].filter(Boolean).join(", ");
    const cep = order.shipping?.destination?.shipping_address?.zip_code || "";
    const comentarioEndereco = order.shipping?.destination?.shipping_address?.comment || "";
    const nomeDestinatario = order.shipping?.destination?.receiver_name || "";
    
    // Status detalhado do pedido combinando order status + shipping status
    const statusDetalhado = mapDetailedStatus(order.status, order.shipping?.status, order.status_detail);
    
    return {
      id: `ml_${order.id}`,
      numero: `ML-${order.id}`,
      nome_cliente: order.buyer?.nickname || order.buyer?.first_name || `Cliente ML ${order.buyer?.id}`,
      cpf_cnpj: null, // Requer chamada para /users/{buyer.id}
      data_pedido: order.date_created?.split("T")[0] || null,
      data_prevista: order.date_closed?.split("T")[0] || null,
      situacao: statusDetalhado,
      valor_total: order.total_amount || 0,
      valor_frete: shippingCost,
      valor_desconto: Math.max(0, valorDesconto),
      numero_ecommerce: String(order.id),
      numero_venda: String(order.id),
      empresa: "mercadolivre",
      cidade,
      uf,
      codigo_rastreamento: codigoRastreamento,
      url_rastreamento: urlRastreamento,
      
      // Novos campos de logística e fulfillment
      shipping_mode: modoEnvio,
      forma_entrega: formaEntrega,
      logistic_type: logisticType,
      delivery_type: deliveryType,
      is_fulfillment: logisticType === 'fulfillment',
      obs: skuList.length > 0 ? `SKUs: ${skuList.join(", ")}` : order.status_detail,
      obs_interna: `ML Order ID: ${order.id} | Buyer ID: ${order.buyer?.id} | ${order.currency_id} | Qtd Total: ${quantidadeTotalItens}`,
      integration_account_id: integrationAccountId,
      created_at: order.date_created,
      updated_at: order.last_updated || order.date_created,
      quantidade_itens: quantidadeTotalItens,
      status_original: order.status,
      status_shipping: order.shipping?.status || null,
      
      // Dados Financeiros Detalhados
      receita_produtos: receitaPorProdutos,
      tarifas_venda: tarifasVenda,
      impostos: impostos,
      receita_envio: receitaPorEnvio,
      valor_pago_total: valorPagoTotal,
      
      // Dados do Produto/Anúncio
      titulo_anuncio: tituloAnuncio,
      categoria_ml: categoriaML,
      condicao: condicao,
      garantia: garantia,
      tipo_listagem: tipoListagem,
      atributos_variacao: atributosTexto,
      
      // Dados de Envio Detalhados
      preferencia_entrega: preferenciaEntrega,
      endereco_completo: enderecoCompleto,
      cep: cep,
      comentario_endereco: comentarioEndereco,
      nome_destinatario: nomeDestinatario,
      
      // Novos campos de rastreamento e logística
      tracking_method: trackingMethod,
      substatus: substatus,
      logistic_mode: logisticMode,
    };
  });
}

function mapMLStatus(status: string): string {
  const statusMap: Record<string, string> = {
    confirmed: "Confirmado",
    payment_required: "Aguardando Pagamento",
    payment_in_process: "Pagamento em Processamento",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    invalid: "Inválido",
    not_delivered: "Não Entregue",
    partially_paid: "Parcialmente Pago",
    not_processed: "Não Processado",
    pending: "Pendente",
    active: "Ativo",
    completed: "Concluído",
    expired: "Expirado",
    paused: "Pausado",
  };
  return statusMap[status?.toLowerCase()] || status;
}

// Função para mapear status detalhado combinando order status + shipping status
function mapDetailedStatus(orderStatus: string, shippingStatus?: string, statusDetail?: string): string {
  // Status de pedido + shipping para dar contexto completo
  const baseStatus = mapMLStatus(orderStatus);
  
  if (!shippingStatus) return baseStatus;
  
  const shippingMap: Record<string, string> = {
    // Status principais
    pending: "Pendente de Envio",
    handling: "Preparando para Envio", 
    ready_to_ship: "Pronto para Envio",
    shipped: "A Caminho",
    delivered: "Entregue",
    not_delivered: "Não Entregue",
    cancelled: "Envio Cancelado",
    returned: "Devolvido",
    lost: "Extraviado",
    
    // Sub-status detalhados em português
    in_transit: "Em Trânsito",
    out_for_delivery: "Saiu para Entrega",
    returning_to_sender: "Retornando ao Remetente",
    delivery_failed: "Falha na Entrega",
    receiver_absent: "Destinatário Ausente",
    damaged: "Danificado",
    delayed: "Atrasado",
    picked_up: "Coletado",
    dropped_off: "Despachado",
    at_customs: "Na Alfândega",
    delayed_at_customs: "Retido na Alfândega",
    left_customs: "Liberado da Alfândega",
    refused_delivery: "Recusou a Entrega",
    waiting_for_withdrawal: "Aguardando Retirada",
    contact_with_carrier_required: "Contato com Transportadora Necessário",
    not_localized: "Não Localizado",
    forwarded_to_third: "Encaminhado para Terceiros",
    soon_deliver: "Entrega em Breve",
    bad_address: "Endereço Incorreto",
    changed_address: "Endereço Alterado",
    stale: "Parado",
    claimed_me: "Reclamado pelo Comprador",
    retained: "Retido",
    stolen: "Roubado",
    confiscated: "Confiscado",
    destroyed: "Destruído",
    in_storage: "Em Depósito",
    pending_recovery: "Aguardando Recuperação",
    agency_unavailable: "Agência Indisponível",
    rejected_damaged: "Rejeitado por Danos",
    refunded_by_delay: "Reembolsado por Atraso",
    shipment_stopped: "Envio Parado",
    awaiting_tax_documentation: "Aguardando Documentação Fiscal"
  };
  
  const mappedShipping = shippingMap[shippingStatus] || shippingStatus;
  
  // Combinar status do pedido com status de envio
  if (orderStatus === 'paid' && shippingStatus) {
    return `Pago - ${mappedShipping}`;
  }
  
  return `${baseStatus}${mappedShipping ? ` - ${mappedShipping}` : ''}`;
}