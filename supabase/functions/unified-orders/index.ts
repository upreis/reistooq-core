import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptAESGCM, decryptAESGCMLegacy } from "../_shared/crypto.ts";
import { SUPABASE_URL, SERVICE_KEY, ANON_KEY, CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function ok(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

export function fail(error: string, status = 400, detail?: unknown, cid?: string) {
  const body = { ok: false, error, ...(detail && { detail }), ...(cid && { cid }) };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

// Client de serviço - bypass RLS para integration_secrets
function makeServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Client de usuário - mantém contexto para validações org/permissão
function makeUserClient(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: auth ? { Authorization: auth } : {} },
  });
}

// Legacy para compatibilidade (se existia decrypt antigo)
async function decryptLegacyIfAny(payloadB64: string, key: string) {
  // Se existia um decrypt antigo, implementar aqui; caso contrário rejeitar
  return Promise.reject("no-legacy");
}

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');
  const siteId = Deno.env.get('ML_SITE_ID') || 'MLB';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI are required');
  }

  return { clientId, clientSecret, redirectUri, siteId };
}

async function refreshIfNeeded(serviceClient: any, secrets: any, cid: string, authHeader: string) {
  if (!secrets?.access_token || !secrets?.refresh_token) {
    console.log(`[unified-orders:${cid}] Refresh ignorado: tokens ausentes`);
    return secrets;
  }

  const now = Date.now();
  const expires = secrets.expires_at ? new Date(secrets.expires_at).getTime() : 0;
  const safetyMargin = 5 * 60 * 1000; // 5 minutos

  if (expires > now + safetyMargin) {
    console.log(`[unified-orders:${cid}] Token ainda válido`);
    return secrets;
  }

  try {
    console.log(`[unified-orders:${cid}] Token expirado/próximo, fazendo refresh...`);
    const refreshResult = await serviceClient.functions.invoke('mercadolibre-token-refresh', {
      body: { integration_account_id: secrets.account_id },
      headers: { Authorization: authHeader, 'x-internal-call': 'true' }
    });

    if (refreshResult.error || !refreshResult.data?.ok) {
      console.error(`[unified-orders:${cid}] Refresh falhou:`, refreshResult.error || refreshResult.data);
      return secrets; // Continuar com token expirado
    }

    console.log(`[unified-orders:${cid}] Refresh realizado com sucesso`);
    return {
      ...secrets,
      access_token: refreshResult.data.access_token,
      refresh_token: refreshResult.data.refresh_token,
      expires_at: refreshResult.data.expires_at
    };
  } catch (error) {
    console.error(`[unified-orders:${cid}] Erro no refresh:`, error);
    return secrets; // Continuar com token original
  }
}

async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  if (!orders?.length) return orders;

  console.log(`[unified-orders:${cid}] Enriquecendo ${orders.length} pedidos com dados de envio`);
  
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      try {
        if (!order.shipping?.id) return order;

        const shippingResp = await fetch(
          `https://api.mercadolibre.com/shipments/${order.shipping.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (shippingResp.ok) {
          const shippingData = await shippingResp.json();
          return {
            ...order,
            shipping: {
              ...order.shipping,
              ...shippingData,
              enriched: true
            }
          };
        }
      } catch (error) {
        console.warn(`[unified-orders:${cid}] Erro ao enriquecer shipping ${order.shipping?.id}:`, error);
      }
      return order;
    })
  );

  console.log(`[unified-orders:${cid}] Enriquecimento de shipping concluído`);
  return enrichedOrders;
}

function transformMLOrders(orders: any[], integration_account_id: string) {
  return orders.map(order => {
    const buyer = order.buyer || {};
    const shipping = order.shipping || {};
    const payments = order.payments || [];
    const firstPayment = payments[0] || {};

    return {
      id: order.id?.toString() || '',
      numero: order.id?.toString() || '',
      nome_cliente: buyer.nickname || buyer.first_name || null,
      cpf_cnpj: buyer.identification?.number || null,
      data_pedido: order.date_created || null,
      data_prevista: shipping.date_first_printed || order.date_closed || null,
      situacao: order.status || null,
      valor_total: order.total_amount || 0,
      valor_frete: shipping.cost || 0,
      valor_desconto: order.coupon?.amount || 0,
      numero_ecommerce: order.pack_id?.toString() || null,
      numero_venda: order.id?.toString() || null,
      empresa: 'Mercado Livre',
      cidade: shipping.receiver_address?.city?.name || null,
      uf: shipping.receiver_address?.state?.id || null,
      codigo_rastreamento: shipping.tracking_number || null,
      url_rastreamento: shipping.tracking_method === 'custom' ? null : 
        shipping.tracking_number ? `https://www.mercadolivre.com.br/gz/tracking/${shipping.tracking_number}` : null,
      obs: order.buyer_comment || null,
      obs_interna: null,
      integration_account_id,
      created_at: order.date_created || new Date().toISOString(),
      updated_at: order.last_updated || order.date_created || new Date().toISOString()
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  // Criar dois clients: serviço (bypass RLS) e usuário (contexto org)
  const userClient = makeUserClient(req);
  const serviceClient = makeServiceClient();
  const cid = crypto.randomUUID().slice(0, 8);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return fail('Missing Authorization header', 401, null, cid);
    }

    const body = await req.json();
    const {
      integration_account_id,
      status,
      shipping_status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit = 25,
      offset = 0,
      enrich = true,
      debug = false,
      include_shipping = true
    } = body;

    console.log(`[unified-orders:${cid}] DEBUG START - Filtros detalhados:`, {
      integration_account_id,
      filtros_geograficos: { cidade, uf },
      filtros_valor: { valorMin, valorMax },
      filtros_busca: { q, search },
      filtros_data: { date_from, date_to },
      filtros_status: { status, shipping_status }
    });

    console.log(`[unified-orders:${cid}] filters`, {
      integration_account_id,
      status,
      shipping_status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit,
      offset
    });

    if (!integration_account_id) {
      return fail('integration_account_id é obrigatório', 400, null, cid);
    }

    // ✅ 1. Busca account com validação de usuário (RLS ativo)
    const { data: accountData, error: accountError } = await userClient
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .single();

    if (accountError) {
      console.error(`[unified-orders:${cid}] FALHA: Busca account`, accountError);
      return fail('Integration account not found', 404, accountError, cid);
    }

    // ✅ 2. Busca integration_secrets com SERVICE CLIENT (bypass RLS)
    const { data: secretRow, error: secretError } = await serviceClient
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    // Log com fingerprint da chave para debug
    const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
    
    console.log(`[unified-orders:${cid}] Resultado busca secrets:`, { 
      hasRow: !!secretRow, 
      hasSimpleTokens: !!secretRow?.simple_tokens,
      useSimple: secretRow?.use_simple,
      hasSecretEnc: !!secretRow?.secret_enc, 
      hasLegacyTokens: !!(secretRow?.access_token || secretRow?.refresh_token),
      keyFp: keyFingerprint
    });

    let accessToken = '';
    let refreshToken = '';
    let expiresAt = '';
    
    // ✅ 3. Primeiro: tentar nova estrutura simples
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        console.log(`[unified-orders:${cid}] Usando criptografia simples`);
        const { data: decryptedData, error: decryptError } = await serviceClient
          .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });

        if (decryptError) {
          console.error(`[unified-orders:${cid}] Erro descriptografia simples:`, decryptError);
        } else if (decryptedData) {
          const parsedPayload = JSON.parse(decryptedData);
          accessToken = parsedPayload.access_token || '';
          refreshToken = parsedPayload.refresh_token || '';
          expiresAt = parsedPayload.expires_at || '';
          console.log(`[unified-orders:${cid}] Descriptografia simples bem-sucedida`);
        }
      } catch (err) {
        console.error(`[unified-orders:${cid}] ERRO: Falha descriptografia simples`, err);
      }
    }
    
    // ✅ 4. SISTEMA BLINDADO: 4 Fallbacks sequenciais de decriptação
    if (!accessToken && !refreshToken && secretRow?.secret_enc) {
      console.log(`[unified-orders:${cid}] Iniciando sistema blindado de decriptação`);
      
      let decrypted = null;
      let fallbackUsed = '';
      
      // FALLBACK 1: Bytea PostgreSQL (\x format)
      try {
        let raw = secretRow.secret_enc as any;
        if (typeof raw === 'string' && raw.startsWith('\\x')) {
          console.log(`[unified-orders:${cid}] Tentando FALLBACK 1: Bytea PostgreSQL`);
          const hexString = raw.slice(2);
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
          const b64String = new TextDecoder().decode(bytes);
          decrypted = await decryptAESGCM(b64String);
          fallbackUsed = 'bytea';
        }
      } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 1 (bytea) falhou:`, e.message); }

      // FALLBACK 2: Buffer objects (Node.js)
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw && typeof raw === 'object' && (raw as any).type === 'Buffer' && Array.isArray((raw as any).data)) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 2: Buffer Node.js`);
            const b64String = new TextDecoder().decode(Uint8Array.from((raw as any).data));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'buffer';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 2 (buffer) falhou:`, e.message); }
      }

      // FALLBACK 3: Uint8Array direct
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw instanceof Uint8Array || (raw && typeof raw === 'object' && typeof (raw as ArrayBuffer).byteLength === 'number')) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 3: Uint8Array`);
            const b64String = raw instanceof Uint8Array ? 
              new TextDecoder().decode(raw) : 
              new TextDecoder().decode(new Uint8Array(raw as ArrayBuffer));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'uint8array';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 3 (uint8array) falhou:`, e.message); }
      }

      // FALLBACK 4: String simples + validação de integridade
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          const payload = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
          if (payload) {
          try { payload = String(raw ?? '').trim(); } catch { payload = ''; }
        }

        try {
          // Normalização final do payload como string limpa
          if (payload.startsWith('"') && payload.endsWith('"')) {
            payload = payload.slice(1, -1);
          }
          if (payload.startsWith("'") && payload.endsWith("'")) {
            payload = payload.slice(1, -1);
          }
          payload = payload.replace(/\n|\r/g, '').trim();

          // 1) Tentativa nova: usando config compartilhada
          const secretJson = await decryptAESGCM(payload);
          const secret = JSON.parse(secretJson);
          accessToken = secret?.access_token || '';
          refreshToken = secret?.refresh_token || '';
          expiresAt = secret?.expires_at || '';
          console.log(`[unified-orders:${cid}] Decrypt AES-GCM bem-sucedido (novo padrão)`);
        } catch (e1) {
          try {
            // 2) Fallback A: usando método legacy
            const secretJson2 = await decryptAESGCMLegacy(payload, CRYPTO_KEY);
            const secret2 = JSON.parse(secretJson2);
            accessToken = secret2?.access_token || '';
            refreshToken = secret2?.refresh_token || '';
            expiresAt = secret2?.expires_at || '';
            console.log(`[unified-orders:${cid}] Decrypt AES-GCM OK via legacy method`);
          } catch (e2) {
            try {
              // 3) Fallback B: caso secret_enc tenha sido salvo como JSON puro (sem base64)
              const altPayload = btoa(payload);
              const secretJson3 = await decryptAESGCMLegacy(altPayload, CRYPTO_KEY);
              const secret3 = JSON.parse(secretJson3);
              accessToken = secret3?.access_token || '';
              refreshToken = secret3?.refresh_token || '';
              expiresAt = secret3?.expires_at || '';
              console.log(`[unified-orders:${cid}] Decrypt AES-GCM OK via fallback JSON→b64`);
            } catch (e3) {
              try {
                // 4) Fallback C: payload já é JSON objeto {iv,data}
                const maybeObj = JSON.parse(payload);
                if (maybeObj?.iv && maybeObj?.data) {
                  const altPayload2 = btoa(JSON.stringify({ iv: maybeObj.iv, data: maybeObj.data }));
                  const secretJson4 = await decryptAESGCMLegacy(altPayload2, CRYPTO_KEY);
                  const secret4 = JSON.parse(secretJson4);
                  accessToken = secret4?.access_token || '';
                  refreshToken = secret4?.refresh_token || '';
                  expiresAt = secret4?.expires_at || '';
                  console.log(`[unified-orders:${cid}] Decrypt AES-GCM OK via fallback objeto→b64`);
                } else {
                  throw new Error('invalid-iv-data');
                }
              } catch (e4) {
                console.warn(`[unified-orders:${cid}] Decrypt failed - reconnect_required`, {
                  accountId: integration_account_id,
                  payloadLen: payload?.length ?? 0,
                  keyFp: keyFingerprint
                });
                return fail('reconnect_required', 401, null, cid);
              }
            }
          }
        }
      } catch (error) {
        console.error(`[unified-orders:${cid}] Erro na descriptografia AES-GCM:`, error);
        console.warn(`[unified-orders:${cid}] Decrypt failed - reconnect_required`, { accountId: integration_account_id });
        return fail('reconnect_required', 401, null, cid);
      }
    }
    
    console.log(`[unified-orders:${cid}] Final token status:`, {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasSecretRow: !!secretRow,
      accountId: integration_account_id
    });

    if (!accessToken && !refreshToken) {
      console.warn(`[unified-orders:${cid}] No tokens available - reconnect required`, {
        hasRow: !!secretRow,
        hasSecretEnc: !!secretRow?.secret_enc,
        accountId: integration_account_id
      });
      return fail('no_tokens', 401, null, cid);
    }

    // ✅ 5. Refresh do token se necessário (reusa o accessToken já resolvido)
    const refreshResult = await refreshIfNeeded(serviceClient, { access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt, account_id: integration_account_id }, cid, authHeader);
    const finalAccessToken = refreshResult.access_token || accessToken;

    // ✅ 6. Buscar pedidos no Mercado Livre
    const seller = accountData.account_identifier;
    if (!seller) {
      return fail('Seller ID not found in account_identifier', 400, null, cid);
    }

    const mlUrl = new URL('https://api.mercadolibre.com/orders/search');
    mlUrl.searchParams.set('seller', seller);
    
    // ✅ CORRIGIDO: Usar 'status' ao invés de 'shipping_status' para ML API
    if (status) {
      const allowedStatuses = ['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'cancelled', 'invalid'];
      if (allowedStatuses.includes(status)) {
        mlUrl.searchParams.set('order.status', status);
      }
    }
    
    // 🚨 REMOVIDO: shipping_status não é parâmetro válido para orders/search do ML
    // O filtro de shipping será aplicado client-side após buscar os pedidos

    // ✅ CORRIGIDO: Datas com conversão para ISO completo obrigatório
    if (date_from) {
      // Se já vier no formato ISO, usar direto; senão converter
      const fromDate = date_from.includes('T') ? new Date(date_from) : new Date(`${date_from}T00:00:00.000Z`);
      mlUrl.searchParams.set('order.date_created.from', fromDate.toISOString());
      console.log(`[unified-orders:${cid}] Data FROM convertida:`, date_from, '=>', fromDate.toISOString());
    }
    if (date_to) {
      // Se já vier no formato ISO, usar direto; senão converter para fim do dia
      const toDate = date_to.includes('T') ? new Date(date_to) : new Date(`${date_to}T23:59:59.999Z`);
      mlUrl.searchParams.set('order.date_created.to', toDate.toISOString());
      console.log(`[unified-orders:${cid}] Data TO convertida:`, date_to, '=>', toDate.toISOString());
    }
    // Fallback seguro: se nenhum range foi informado, ampliar janela para 90 dias
    if (!date_from && !date_to) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      mlUrl.searchParams.set('order.date_created.from', ninetyDaysAgo);
    }

    mlUrl.searchParams.set('limit', String(Math.min(limit, 50)));
    mlUrl.searchParams.set('offset', String(offset));

    console.log(`[unified-orders:${cid}] Fetching from ML:`, mlUrl.toString());

    const mlResponse = await fetch(mlUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${finalAccessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`[unified-orders:${cid}] ML API error:`, mlResponse.status, errorText);
      return fail(`ML API error: ${mlResponse.status}`, mlResponse.status, errorText, cid);
    }

    const mlData = await mlResponse.json();
    let orders = mlData.results || [];

    console.log(`[unified-orders:${cid}] Fetched ${orders.length} orders from ML`);

    // ✅ 7. Enriquecer com dados de shipping se solicitado
    if (include_shipping && enrich && orders.length > 0) {
      orders = await enrichOrdersWithShipping(orders, finalAccessToken, cid);
    }

    // ✅ 8. Aplicar filtros adicionais
    let filteredOrders = orders;

    // Filtro de status de envio
    if (shipping_status) {
      filteredOrders = filteredOrders.filter(order => {
        const shippingStatus = order.shipping?.status;
        if (shipping_status === 'delivered') {
          return shippingStatus === 'delivered';
        }
        if (shipping_status === 'shipped') {
          return ['shipped', 'ready_to_ship'].includes(shippingStatus);
        }
        return shippingStatus === shipping_status;
      });
    }

    // Filtro de busca textual
    if (q || search) {
      const searchTerm = (q || search).toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const searchableText = [
          order.id?.toString(),
          order.buyer?.nickname,
          order.buyer?.first_name,
          order.shipping?.receiver_address?.city?.name,
          order.shipping?.tracking_number,
          order.pack_id?.toString()
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }

    // Filtros geográficos
    if (cidade || uf) {
      filteredOrders = filteredOrders.filter(order => {
        const orderCidade = order.shipping?.receiver_address?.city?.name?.toLowerCase();
        const orderUf = order.shipping?.receiver_address?.state?.id?.toLowerCase();
        
        if (cidade && !orderCidade?.includes(cidade.toLowerCase())) return false;
        if (uf && orderUf !== uf.toLowerCase()) return false;
        
        return true;
      });
    }

    // Filtros de valor
    if (valorMin !== undefined || valorMax !== undefined) {
      filteredOrders = filteredOrders.filter(order => {
        const valor = order.total_amount || 0;
        if (valorMin !== undefined && valor < valorMin) return false;
        if (valorMax !== undefined && valor > valorMax) return false;
        return true;
      });
    }

    // ✅ 9. Transformar para formato unificado
    const unified = transformMLOrders(filteredOrders, integration_account_id);

    const response = {
      ok: true,
      results: filteredOrders,
      unified,
      paging: {
        total: mlData.paging?.total || filteredOrders.length,
        limit: Math.min(limit, 50),
        offset
      },
      count: filteredOrders.length,
      url: mlUrl.toString()
    };

    if (debug) {
      response.debug = {
        originalCount: orders.length,
        filteredCount: filteredOrders.length,
        filters: { status, shipping_status, date_from, date_to, cidade, uf, valorMin, valorMax, search, q },
        mlData: mlData.paging
      };
    }

    console.log(`[unified-orders:${cid}] Returning ${filteredOrders.length} filtered orders`);
    return ok(response);

  } catch (error) {
    console.error(`[unified-orders:${cid}] Fatal error:`, error);
    return fail(`Internal server error: ${error.message}`, 500, error, cid);
  }
});