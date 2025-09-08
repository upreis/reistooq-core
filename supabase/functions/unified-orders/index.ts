import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptCompat, decryptAESGCM } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const INTEGRATIONS_CRYPTO_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!; // mesma var usada pelo store-secret

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
      .select('secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    console.log(`[unified-orders:${cid}] Resultado busca secrets:`, { 
      hasRow: !!secretRow, 
      hasSecretEnc: !!secretRow?.secret_enc, 
      hasLegacyTokens: !!(secretRow?.access_token || secretRow?.refresh_token)
    });

    let accessToken = '';
    let refreshToken = '';
    let expiresAt = '';
    
    if (!secretRow?.secret_enc) {
      console.log(`[unified-orders:${cid}] DEBUG: Tokens diretos não encontrados, usando integrations-get-secret`);
      // ✅ 3. Se não encontrou encrypted secret, chama get-secret
      const { data: secretData, error: getSecretError } = await serviceClient.functions.invoke('integrations-get-secret', {
        body: {
          integration_account_id,
          provider: 'mercadolivre'
        },
        headers: { 
          'x-internal-call': 'true',
          'x-internal-token': Deno.env.get('INTERNAL_SHARED_TOKEN') || ''
        }
      });

      console.log(`[unified-orders:${cid}] DEBUG: get-secret response:`, {
        hasData: !!secretData,
        hasError: !!getSecretError,
        secDataKeys: secretData ? Object.keys(secretData) : [],
        error: getSecretError
      });

      if (getSecretError || !secretData?.ok) {
        console.error(`[unified-orders:${cid}] FALHA: get-secret`, getSecretError || secretData);
        return fail('Failed to get integration secret', 500, getSecretError || secretData, cid);
      }

      const secretPayload = secretData.secret;
      
      console.log(`[unified-orders:${cid}] DEBUG: Payload extracted:`, {
        hasAccessToken: !!secretPayload?.access_token,
        hasRefreshToken: !!secretPayload?.refresh_token,
        hasSecretEnc: !!secretPayload?.secret_enc,
        payloadKeys: secretPayload ? Object.keys(secretPayload) : []
      });
      
      accessToken = secretPayload?.access_token || '';
      refreshToken = secretPayload?.refresh_token || '';
      expiresAt = secretPayload?.expires_at || '';
    } else {
      // ✅ 4. Decifrar usando a MESMA derivação do store-secret
      try {
        const secretJson = await decryptCompat(secretRow.secret_enc, INTEGRATIONS_CRYPTO_KEY, decryptLegacyIfAny);
        const secret = JSON.parse(secretJson);
        
        console.log(`[unified-orders:${cid}] DEBUG: Secret decrypted successfully:`, {
          hasAccessToken: !!secret?.access_token,
          hasRefreshToken: !!secret?.refresh_token,
          secretKeys: Object.keys(secret || {})
        });
        
        accessToken = secret?.access_token || '';
        refreshToken = secret?.refresh_token || '';
        expiresAt = secret?.expires_at || secretRow.expires_at || '';
      } catch (decryptError) {
        console.error(`[unified-orders:${cid}] ERRO: Falha ao decriptar secret_enc`, decryptError);
        
        // FALLBACK ROBUSTO: Tentar múltiplas estratégias
        try {
          // 1. Tokens diretos nas colunas
          if (secretRow.access_token || secretRow.refresh_token) {
            console.log(`[unified-orders:${cid}] FALLBACK: Usando tokens diretos das colunas`);
            accessToken = secretRow.access_token || '';
            refreshToken = secretRow.refresh_token || '';
            expiresAt = secretRow.expires_at || '';
          }
          // 2. secret_enc pode ser JSON direto (não base64)
          else if (secretRow.secret_enc) {
            console.log(`[unified-orders:${cid}] FALLBACK: Tentando secret_enc como JSON direto`);
            const directParsed = JSON.parse(secretRow.secret_enc);
            accessToken = directParsed.access_token || '';
            refreshToken = directParsed.refresh_token || '';
            expiresAt = directParsed.expires_at || '';
          }
        } catch (fallbackError) {
          console.error(`[unified-orders:${cid}] FALLBACK também falhou:`, fallbackError);
          accessToken = '';
          refreshToken = '';
        }
      }
    }

    console.log(`[unified-orders:${cid}] DEBUG: Final token resolution check:`, {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasSecretRow: !!secretRow,
      accountId: integration_account_id,
      provider: 'mercadolivre'
    });

    if (!accessToken && !refreshToken) {
      console.error(`[unified-orders:${cid}] ERRO CRÍTICO: Token ausente mesmo após todos os fallbacks`, {
        hasRow: !!secretRow,
        hasDirectTokens: !!(secretRow?.access_token || secretRow?.refresh_token),
        hasSecretEnc: !!secretRow?.secret_enc,
        accountId: integration_account_id
      });
      return fail('No valid tokens found for this integration account', 401, null, cid);
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
    
    // Aplicar filtros de status
    if (status) {
      const allowedStatuses = ['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'cancelled', 'invalid'];
      if (allowedStatuses.includes(status)) {
        mlUrl.searchParams.set('order.status', status);
      }
    }

    // Aplicar filtros de data
    if (date_from) {
      mlUrl.searchParams.set('order.date_created.from', `${date_from}T00:00:00.000-03:00`);
    }
    if (date_to) {
      mlUrl.searchParams.set('order.date_created.to', `${date_to}T23:59:59.999-03:00`);
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