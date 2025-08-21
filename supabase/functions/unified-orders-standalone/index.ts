import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Standalone version - no shared dependencies
const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function ok(data: any) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

function fail(error: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

serve(async (req) => {
  console.log(`[unified-orders] Received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const correlationId = crypto.randomUUID();
    console.log(`[unified-orders:${correlationId}] Starting request processing`);
    
    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
    if (!authHeader) {
      console.warn(`[unified-orders:${correlationId}] Missing Authorization header`);
      return fail('Missing Authorization header', 401);
    }
    
    const supabase = makeClient(authHeader);

    const body = await req.json();
    const { integration_account_id, status, limit = 50, offset = 0 } = body;

    if (!integration_account_id) {
      console.log(`[unified-orders:${correlationId}] Missing integration_account_id`);
      return fail("integration_account_id é obrigatório", 400);
    }

    console.log(`[unified-orders:${correlationId}] Processing account_id=${integration_account_id}, status=${status}, limit=${limit}, offset=${offset}`);

    // Get integration account details
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .maybeSingle();

    if (accountError || !account) {
      console.log(`[unified-orders:${correlationId}] Integration account not found:`, accountError);
      return fail("Integration account not found", 404);
    }

    if (!account.is_active) {
      console.log(`[unified-orders:${correlationId}] Integration account is not active`);
      return fail("Integration account is not active", 400);
    }

    if (account.provider === 'mercadolivre') {
      // Validate encryption key
      if (!ENC_KEY) {
        console.error(`[unified-orders:${correlationId}] ENC_KEY not configured`);
        return fail("Encryption key not configured", 500);
      }

      console.log(`[unified-orders:${correlationId}] Decrypting secrets for provider=${account.provider}, seller_id=${account.account_identifier}...`);
      
      // Get integration secrets using RPC
      const { data: secretsData, error: secretsError } = await supabase.rpc("decrypt_integration_secret", {
        p_account_id: integration_account_id,
        p_provider: account.provider,
        p_encryption_key: ENC_KEY,
      });

      if (secretsError || !secretsData) {
        console.error(`[unified-orders:${correlationId}] Failed to decrypt secrets:`, secretsError);
        return fail("Failed to retrieve integration secrets", 500);
      }

      console.log(`[unified-orders:${correlationId}] Secrets decrypted successfully, checking token expiry...`);

      let secrets = secretsData;

      // Check if token needs refresh (5 min buffer)
      const now = new Date();
      const expiresAt = secrets.expires_at ? new Date(secrets.expires_at) : new Date(now.getTime() + 60000);
      const needsRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

      if (needsRefresh) {
        console.log('[unified-orders] Token expiring soon, refreshing...');
        
        const { data: refreshData, error: refreshError } = await supabase.functions.invoke('mercadolibre-token-refresh', {
          body: {
            integration_account_id: integration_account_id,
            provider: account.provider
          }
        });

        if (refreshError || !refreshData?.success) {
          console.error('[unified-orders] Token refresh failed:', refreshError);
          return fail("Failed to refresh token", 401);
        }

        secrets = {
          ...secrets,
          access_token: refreshData.access_token,
          expires_at: refreshData.expires_at
        };
        
        console.log('[unified-orders] Token refreshed successfully');
      }

      // Determine seller ID - priority: account_identifier, then payload.user_id
      const sellerId = account.account_identifier || secrets.payload?.user_id;
      if (!sellerId) {
        console.error(`[unified-orders:${correlationId}] No seller ID found`);
        return fail("Seller ID not found in account_identifier or payload.user_id", 400);
      }

      // Fetch orders from Mercado Livre API
      console.log(`[unified-orders:${correlationId}] Fetching orders from ML API: seller=${sellerId}, status=${status || 'all'}, limit=${limit}, offset=${offset}`);
      
      const mlUrl = new URL('https://api.mercadolibre.com/orders/search');
      mlUrl.searchParams.set('seller', sellerId);
      if (status) mlUrl.searchParams.set('order.status', status);
      mlUrl.searchParams.set('limit', limit.toString());
      mlUrl.searchParams.set('offset', offset.toString());

      const mlResponse = await fetch(mlUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${secrets.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mlResponse.ok) {
        console.error(`[unified-orders:${correlationId}] ML API error: status=${mlResponse.status}, seller_id=${sellerId}`);
        
        if (mlResponse.status === 403) {
          const errorText = await mlResponse.text();
          if (errorText.includes('invalid_operator_user_id')) {
            console.error(`[unified-orders:${correlationId}] invalid_operator_user_id error - token does not have admin permissions`);
            return fail("invalid_operator_user_id - Token does not have permission to access this seller", 403);
          }
        }
        
        const errorText = await mlResponse.text();
        return fail(`Mercado Livre API error: ${mlResponse.status} - ${errorText}`, mlResponse.status);
      }

      const mlData = await mlResponse.json();
      console.log(`[unified-orders:${correlationId}] ML API success: fetched ${mlData.results?.length || 0} orders, total=${mlData.paging?.total || 0}`);
      
      // Transform ML orders to unified format
      const unifiedOrders = transformMLOrders(mlData.results || [], integration_account_id);

      return ok({
        results: mlData.results || [],
        unified: unifiedOrders,
        paging: mlData.paging,
        count: mlData.paging?.total || 0
      });
    }

    // For other providers, return empty results
    console.log(`[unified-orders:${correlationId}] Provider ${account.provider} not supported yet`);
    return ok({
      results: [],
      unified: [],
      paging: { total: 0, limit, offset },
      count: 0
    });

  } catch (error) {
    const correlationId = 'error-' + crypto.randomUUID().split('-')[0];
    console.error(`[unified-orders:${correlationId}] Unexpected error:`, error);
    return fail(error.message || 'Internal server error', 500);
  }
});

// Transform ML orders to unified format
function transformMLOrders(mlOrders: any[], integrationAccountId: string): any[] {
  return mlOrders.map(order => ({
    id: order.id.toString(),
    numero: order.id.toString(),
    nome_cliente: order.buyer?.nickname || order.buyer?.first_name || null,
    cpf_cnpj: null,
    data_pedido: order.date_created?.split('T')[0] || null,
    data_prevista: order.estimated_delivery?.date || null,
    situacao: mapMLStatus(order.status),
    valor_total: order.total_amount || 0,
    valor_frete: order.shipping?.cost || 0,
    valor_desconto: 0,
    numero_ecommerce: order.id.toString(),
    numero_venda: null,
    empresa: 'MercadoLivre',
    cidade: order.shipping?.receiver_address?.city || null,
    uf: order.shipping?.receiver_address?.state?.name || null,
    codigo_rastreamento: order.shipping?.tracking_number || null,
    url_rastreamento: null,
    obs: null,
    obs_interna: null,
    integration_account_id: integrationAccountId,
    created_at: order.date_created,
    updated_at: order.last_updated || order.date_created
  }));
}

// Map ML status to unified status
function mapMLStatus(mlStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento',
    'partially_paid': 'Parcialmente Pago',
    'paid': 'Pago',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido',
    'shipped': 'Enviado',
    'delivered': 'Entregue'
  };
  return statusMap[mlStatus] || mlStatus;
}