import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY, ok, fail } from "../_shared/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '3600',
};

interface UnifiedOrdersRequest {
  integration_account_id?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  situacoes?: string[];
  fonte?: 'interno' | 'mercadolivre' | 'shopee' | 'tiny';
  limit?: number;
  offset?: number;
  // New filters requested
  tags?: string;
  q?: string;
  sort?: string;
  date_last_updated_from?: string;
  date_last_updated_to?: string;
  debug?: boolean;
  status?: string;
}

interface MLOrder {
  id: number;
  date_created: string;
  date_closed?: string;
  last_updated: string;
  status: string;
  status_detail?: string;
  currency_id: string;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  shipping?: {
    id: number;
    status: string;
    tracking_number?: string;
    tracking_method?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
      variation_id?: number;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  payments?: Array<{
    id: number;
    status: string;
    transaction_amount: number;
    payment_method_id: string;
  }>;
}

interface UnifiedOrder {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista: string | null;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
}

// Map ML status to internal status
function mapMLStatus(mlStatus: string): string {
  const statusMap: Record<string, string> = {
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento',
    'paid': 'Pago',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido',
  };
  return statusMap[mlStatus] || 'Pendente';
}

// Map ML order to unified order format
function mapMLOrderToUnified(mlOrder: MLOrder, accountId: string): UnifiedOrder {
  const now = new Date().toISOString();
  
  return {
    id: `ml_${mlOrder.id}`,
    numero: mlOrder.id.toString(),
    nome_cliente: mlOrder.buyer.nickname || 'Cliente ML',
    cpf_cnpj: null, // ML doesn't provide this in basic order data
    data_pedido: mlOrder.date_created,
    data_prevista: mlOrder.date_closed || null,
    situacao: mapMLStatus(mlOrder.status),
    valor_total: mlOrder.total_amount,
    valor_frete: 0, // Could be calculated from shipping info if needed
    valor_desconto: 0, // Could be calculated from price differences
    numero_ecommerce: mlOrder.id.toString(),
    numero_venda: mlOrder.id.toString(),
    empresa: 'mercadolivre',
    cidade: null, // Would need to fetch from shipping details
    uf: null, // Would need to fetch from shipping details
    codigo_rastreamento: mlOrder.shipping?.tracking_number || null,
    url_rastreamento: null, // ML doesn't provide direct tracking URL
    obs: mlOrder.status_detail || null,
    obs_interna: `ML Order ID: ${mlOrder.id}, Buyer: ${mlOrder.buyer.nickname}`,
    integration_account_id: accountId,
    created_at: mlOrder.date_created,
    updated_at: mlOrder.last_updated,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Support both GET and POST methods
  let body: UnifiedOrdersRequest = {};
  
  if (req.method === "GET") {
    const url = new URL(req.url);
    body = {
      integration_account_id: url.searchParams.get('integration_account_id') || undefined,
      search: url.searchParams.get('search') || url.searchParams.get('q') || undefined,
      startDate: url.searchParams.get('startDate') || url.searchParams.get('date_from') || undefined,
      endDate: url.searchParams.get('endDate') || url.searchParams.get('date_to') || undefined,
      tags: url.searchParams.get('tags') || undefined,
      sort: url.searchParams.get('sort') || undefined,
      date_last_updated_from: url.searchParams.get('date_last_updated_from') || undefined,
      date_last_updated_to: url.searchParams.get('date_last_updated_to') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      debug: url.searchParams.get('debug') === 'true',
      status: url.searchParams.get('status') || undefined,
      fonte: url.searchParams.get('fonte') as any || undefined,
    };
  } else if (req.method === "POST") {
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('[Unified Orders] JSON parse error:', error);
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid JSON body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = makeClient(req.headers.get("Authorization"));
    
    console.log('[Unified Orders] Request received:', body);

    let allOrders: UnifiedOrder[] = [];

    // 1. Get internal orders (if no source filter or source is interno)
    if (!body.fonte || body.fonte === 'interno') {
      try {
        console.log('[Unified Orders] Fetching internal orders...');
        
        const { data: internalOrders, error: internalError } = await supabase.rpc('get_pedidos_masked', {
          _search: body.search || null,
          _start: body.startDate || null,
          _end: body.endDate || null,
          _limit: body.limit || 100,
          _offset: body.offset || 0,
        });

        if (internalError) {
          console.error('[Unified Orders] Internal orders error:', internalError);
        } else {
          console.log('[Unified Orders] Found', internalOrders?.length || 0, 'internal orders');
          allOrders.push(...(internalOrders || []));
        }
      } catch (error) {
        console.error('[Unified Orders] Internal orders exception:', error);
      }
    }

    // 2. Get MercadoLibre orders (if no source filter or source is mercadolivre)
    if (!body.fonte || body.fonte === 'mercadolivre') {
      try {
        console.log('[Unified Orders] Fetching ML orders...');

        // Get ML integration accounts (filter by integration_account_id if provided)
        let accountQuery = supabase
          .from('integration_accounts')
          .select('id, name, account_identifier')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);

        if (body.integration_account_id) {
          accountQuery = accountQuery.eq('id', body.integration_account_id);
        }

        const { data: mlAccounts, error: accountsError } = await accountQuery;

        if (accountsError) {
          console.error('[Unified Orders] ML accounts error:', accountsError);
        } else if (mlAccounts && mlAccounts.length > 0) {
          console.log('[Unified Orders] Found', mlAccounts.length, 'ML accounts');

          // Fetch orders from each ML account
          for (const account of mlAccounts) {
            try {
              // Decrypt integration secrets
              const { data: secrets, error: secretsError } = await supabase.rpc('decrypt_integration_secret', {
                p_account_id: account.id,
                p_provider: 'mercadolivre',
                p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY') || ''
              });

              if (secretsError || !secrets) {
                console.error(`[Unified Orders] Failed to get secrets for account ${account.id}:`, secretsError);
                continue;
              }

              let accessToken = secrets.access_token;
              const refreshToken = secrets.refresh_token;
              const expiresAt = secrets.expires_at;

              // Check if token needs refresh (less than 5 minutes remaining)
              if (expiresAt && new Date(expiresAt) < new Date(Date.now() + 5 * 60 * 1000)) {
                console.log(`[Unified Orders] Token expires soon for account ${account.id}, refreshing...`);
                
                try {
                  const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      grant_type: 'refresh_token',
                      client_id: secrets.client_id,
                      client_secret: secrets.client_secret,
                      refresh_token: refreshToken
                    })
                  });

                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    accessToken = refreshData.access_token;
                    
                    // Store refreshed token
                    await supabase.rpc('encrypt_integration_secret', {
                      p_account_id: account.id,
                      p_provider: 'mercadolivre',
                      p_client_id: secrets.client_id,
                      p_client_secret: secrets.client_secret,
                      p_access_token: refreshData.access_token,
                      p_refresh_token: refreshData.refresh_token || refreshToken,
                      p_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                      p_payload: secrets.payload,
                      p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY') || ''
                    });
                    
                    console.log(`[Unified Orders] Token refreshed for account ${account.id}`);
                  }
                } catch (refreshError) {
                  console.warn(`[Unified Orders] Token refresh failed for account ${account.id}, continuing with existing token:`, refreshError);
                }
              }

              // Get seller_id (fallback to payload.user_id, then fetch from /users/me)
              let sellerId = secrets.payload?.user_id;
              if (!sellerId) {
                try {
                  const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    sellerId = userData.id;
                  }
                } catch (error) {
                  console.warn(`[Unified Orders] Failed to get seller_id from /users/me for account ${account.id}:`, error);
                }
              }

              if (!sellerId) {
                console.error(`[Unified Orders] No seller_id available for account ${account.id}`);
                continue;
              }

              // Build ML orders search URL with all filters
              const params = new URLSearchParams();
              params.append('seller', sellerId.toString());
              if (body.status) params.append('order.status', body.status);
              if (body.startDate || body.date_from) params.append('order.date_created.from', body.startDate || body.date_from!);
              if (body.endDate || body.date_to) params.append('order.date_created.to', body.endDate || body.date_to!);
              if (body.date_last_updated_from) params.append('order.date_last_updated.from', body.date_last_updated_from);
              if (body.date_last_updated_to) params.append('order.date_last_updated.to', body.date_last_updated_to);
              if (body.q || body.search) params.append('q', body.q || body.search!);
              if (body.tags) params.append('tags', body.tags);
              if (body.sort) params.append('sort', body.sort);
              params.append('limit', (body.limit || 50).toString());
              params.append('offset', (body.offset || 0).toString());

              const mlUrl = `https://api.mercadolibre.com/orders/search?${params.toString()}`;
              
              if (body.debug) {
                console.log(`[Unified Orders] ML URL for account ${account.id}:`, mlUrl);
              }

              // Fetch orders from MercadoLibre API
              const mlResponse = await fetch(mlUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              });

              if (!mlResponse.ok) {
                console.error(`[Unified Orders] ML API error for account ${account.id}:`, mlResponse.status, await mlResponse.text());
                continue;
              }

              const mlData = await mlResponse.json();
              if (mlData.results && mlData.results.length > 0) {
                const mappedOrders = mlData.results.map((mlOrder: MLOrder) => 
                  mapMLOrderToUnified(mlOrder, account.id)
                );

                allOrders.push(...mappedOrders);
                console.log(`[Unified Orders] Added ${mappedOrders.length} orders from ML account ${account.name}`);
              }
              
            } catch (error) {
              console.error(`[Unified Orders] Exception fetching ML orders for account ${account.id}:`, error);
            }
          }
        } else {
          console.log('[Unified Orders] No active ML accounts found');
        }
      } catch (error) {
        console.error('[Unified Orders] ML orders exception:', error);
      }
    }

    // 3. Sort all orders by date (newest first)
    allOrders.sort((a, b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime());

    // 4. Apply pagination to combined results
    const offset = body.offset || 0;
    const limit = body.limit || 100;
    const paginatedOrders = allOrders.slice(offset, offset + limit);

    console.log('[Unified Orders] Returning', paginatedOrders.length, 'of', allOrders.length, 'total orders');

    const response: any = {
      ok: true,
      url: req.url,
      paging: { total: allOrders.length, offset: offset, limit: limit },
      results: paginatedOrders,
      data: paginatedOrders,
      count: allOrders.length,
    };

    // Add debug info if requested
    if (body.debug) {
      response.raw = {
        request_body: body,
        ml_accounts_found: 0, // Will be updated if ML accounts are processed
        internal_orders_count: 0,
        ml_orders_count: 0,
        processing_time: Date.now()
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Unified Orders] Unexpected error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: String(error?.message ?? error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});