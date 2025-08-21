import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY, ok, fail, corsHeaders } from '../_shared/client.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    
    const supabase = makeClient(req.headers.get("Authorization"));

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
      .single();

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

      // Use let instead of const to allow reassignment
      let secrets = secretsData;

      // Check if token needs refresh
      if (secrets.expires_at && new Date(secrets.expires_at) <= new Date()) {
        console.log('[unified-orders] Token expired, refreshing...');
        
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

        // Update secrets with refreshed token
        secrets = {
          ...secrets,
          access_token: refreshData.access_token,
          expires_at: refreshData.expires_at
        };
        
        console.log('[unified-orders] Token refreshed successfully');
      }

      // Fetch orders from Mercado Livre API
      console.log(`[unified-orders:${correlationId}] Fetching orders from ML API: seller=${account.account_identifier}, status=${status || 'all'}, limit=${limit}, offset=${offset}`);
      
      const mlUrl = new URL('https://api.mercadolibre.com/orders/search');
      mlUrl.searchParams.set('seller', account.account_identifier);
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
        console.error(`[unified-orders:${correlationId}] ML API error: status=${mlResponse.status}, seller_id=${account.account_identifier}`);
        
        if (mlResponse.status === 403) {
          const errorText = await mlResponse.text();
          if (errorText.includes('invalid_operator_user_id')) {
            console.error(`[unified-orders:${correlationId}] invalid_operator_user_id error - token does not have admin permissions`);
            return fail("invalid_operator_user_id - Token does not have permission to access this seller", 403);
          }
        }
        
        if (mlResponse.status === 401) {
          // Try one more token refresh
          console.log('[unified-orders] 401 error, attempting token refresh...');
          
          const { data: refreshData, error: refreshError } = await supabase.functions.invoke('mercadolibre-token-refresh', {
            body: {
              integration_account_id: integration_account_id,
              provider: account.provider
            }
          });
          
          if (!refreshError && refreshData?.success) {
            const retryResponse = await fetch(mlUrl.toString(), {
              headers: {
                'Authorization': `Bearer ${refreshData.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log(`[unified-orders] Retry successful, returning ${retryData.results?.length || 0} orders`);
              
              return ok({
                results: retryData.results || [],
                unified: transformMLOrders(retryData.results || []),
                paging: retryData.paging,
                count: retryData.paging?.total || 0
              });
            }
          }
        }
        
        const errorText = await mlResponse.text();
        return fail(`Mercado Livre API error: ${mlResponse.status} - ${errorText}`, mlResponse.status);
      }

      const mlData = await mlResponse.json();
      console.log(`[unified-orders:${correlationId}] ML API success: fetched ${mlData.results?.length || 0} orders, total=${mlData.paging?.total || 0}`);
      
      // Transform ML orders to unified format
      const unifiedOrders = transformMLOrders(mlData.results || []);

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
function transformMLOrders(mlOrders: any[]): any[] {
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
    integration_account_id: null,
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