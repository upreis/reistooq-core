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
  // Enrichment controls
  enrich?: boolean;
  enrich_users?: boolean;
  enrich_shipments?: boolean;
  max_concurrency?: number;
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

// Helper for controlled concurrency
async function poolLimit<T>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  const ret: T[] = [];
  const running = new Set<Promise<void>>();
  
  for (const t of tasks) {
    const p = t().then(v => { ret.push(v); }).finally(() => { running.delete(p); });
    running.add(p);
    if (running.size >= limit) await Promise.race(running);
  }
  
  await Promise.all(running);
  return ret;
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
      enrich: url.searchParams.get('enrich') !== 'false',
      enrich_users: url.searchParams.get('enrich_users') !== 'false',
      enrich_shipments: url.searchParams.get('enrich_shipments') !== 'false',
      max_concurrency: url.searchParams.get('max_concurrency') ? parseInt(url.searchParams.get('max_concurrency')!) : 3,
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

    // Declare once in request scope
    let mlOrdersForEnrichment: Array<{ order: any; accountId: string; accessToken: string }> = [];
    const mlUrls: string[] = [];
    const requested_endpoints: string[] = [];
    let allMLResults: any[] = [];
    
    // Parse enrichment flags with safe defaults
    const enrich = body.enrich !== false; // default true
    const enrich_users = body.enrich_users !== false; // default true  
    const enrich_shipments = body.enrich_shipments !== false; // default true
    const max_concurrency = Math.max(1, Math.min(10, body.max_concurrency || 3)); // safe range

    // Get MercadoLibre orders (if no source filter or source is mercadolivre)
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
              mlUrls.push(mlUrl);
              
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
                // Store raw ML results for stable contract
                allMLResults.push(...mlData.results);
                console.log(`[Unified Orders] Added ${mlData.results.length} raw orders from ML account ${account.name}`);
                
                // Store for enrichment
                mlData.results.forEach((mlOrder: any) => {
                  mlOrdersForEnrichment.push({ 
                    order: mlOrder, 
                    accountId: account.id, 
                    accessToken 
                  });
                });
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

    // ENRICHMENT PHASE - Get additional data from ML APIs
    let unified: any[] = [];
    let enrichment_logs: any = { users_cached: 0, shipments_cached: 0, errors: [] };
    
    if (enrich && mlOrdersForEnrichment.length > 0) {
      console.log(`[Unified Orders] Starting enrichment for ${mlOrdersForEnrichment.length} ML orders`);
      
      // Create caches to avoid duplicate API calls
      const usersCache = new Map<number, any>();
      const shipmentsCache = new Map<number, any>();
      
      // Helper functions for API calls with caching
      const getUser = async (uid: number, accessToken: string) => {
        if (usersCache.has(uid)) return usersCache.get(uid);
        const url = `https://api.mercadolibre.com/users/${uid}`;
        requested_endpoints.push(url);
        try {
          const r = await fetch(url, { 
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
          });
          const j = r.ok ? await r.json() : null;
          usersCache.set(uid, j);
          return j;
        } catch (error) {
          enrichment_logs.errors.push(`Users API error for ${uid}: ${error}`);
          usersCache.set(uid, null);
          return null;
        }
      };

      const getShipment = async (sid: number, accessToken: string) => {
        if (shipmentsCache.has(sid)) return shipmentsCache.get(sid);
        const url = `https://api.mercadolibre.com/shipments/${sid}`;
        requested_endpoints.push(url);
        try {
          const r = await fetch(url, { 
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
          });
          const j = r.ok ? await r.json() : null;
          shipmentsCache.set(sid, j);
          return j;
        } catch (error) {
          enrichment_logs.errors.push(`Shipments API error for ${sid}: ${error}`);
          shipmentsCache.set(sid, null);
          return null;
        }
      };

      // Create enrichment tasks
      const enrichmentTasks = mlOrdersForEnrichment.map(({order: o, accountId, accessToken}) => async () => {
        let user = null, ship = null;
        
        // Get user data if enabled and buyer ID exists
        if (enrich_users && o?.buyer?.id) {
          user = await getUser(o.buyer.id, accessToken);
        }
        
        // Get shipment data if enabled and shipping ID exists  
        if (enrich_shipments && o?.shipping?.id) {
          ship = await getShipment(o.shipping.id, accessToken);
        }

        // Build enriched name
        const first = user?.first_name?.trim?.() || '';
        const last = user?.last_name?.trim?.() || '';
        const nome = (first || last) ? `${first} ${last}`.trim() : (o?.buyer?.nickname ?? null);
        
        // Get document number from multiple possible sources
        const doc = user?.identification?.number ?? 
                   user?.billing_info?.doc_number ?? 
                   o?.buyer?.billing_info?.doc_number ?? null;

        // Calculate shipping cost from multiple sources
        const shipCostFromPayments = o?.payments?.find?.(() => true)?.shipping_cost ?? null;
        const shipCostFromShipment = ship?.shipping_option?.cost ?? null;
        
        // Calculate discount from coupon and price differences
        let totalDiscount = o?.coupon?.amount || 0;
        if (o?.order_items?.length > 0) {
          o.order_items.forEach((item: any) => {
            const itemDiscount = (item.full_unit_price - item.unit_price) * item.quantity;
            totalDiscount += Math.max(0, itemDiscount);
          });
        }

        // Extract location data
        const cidade = ship?.receiver_address?.city?.name ?? null;
        const uf = ship?.receiver_address?.state?.name ?? ship?.receiver_address?.state?.id ?? null;

        return {
          id: String(o.id),
          numero: String(o.id),
          nome_cliente: nome || null,
          cpf_cnpj: doc || null,
          data_pedido: o?.date_created ?? null,
          data_prevista: o?.date_closed ?? null,
          situacao: o?.status ?? null,
          valor_total: o?.total_amount ?? null,
          valor_frete: shipCostFromPayments ?? shipCostFromShipment ?? null,
          valor_desconto: totalDiscount,
          numero_ecommerce: String(o.id),
          numero_venda: String(o.id),
          empresa: 'mercadolivre',
          cidade,
          uf,
          codigo_rastreamento: ship?.tracking_number ?? null,
          url_rastreamento: ship?.tracking_url ?? null,
          obs: o?.status_detail ?? null,
          obs_interna: `ML order: ${o?.id}`,
          integration_account_id: accountId,
          created_at: o?.date_created ?? null,
          updated_at: o?.last_updated ?? null,
        };
      });

      // Execute enrichment with controlled concurrency
      try {
        unified = await poolLimit(max_concurrency, enrichmentTasks);
        enrichment_logs.users_cached = usersCache.size;
        enrichment_logs.shipments_cached = shipmentsCache.size;
        console.log(`[Unified Orders] Enrichment completed. Users: ${usersCache.size}, Shipments: ${shipmentsCache.size}`);
      } catch (error) {
        console.error('[Unified Orders] Enrichment error:', error);
        enrichment_logs.errors.push(`Enrichment failed: ${error}`);
        // Fallback to basic mapping if enrichment fails
        unified = mlOrdersForEnrichment.map(({order: o, accountId}) => ({
          id: String(o.id),
          numero: String(o.id),
          nome_cliente: o?.buyer?.nickname ?? null,
          cpf_cnpj: null,
          data_pedido: o?.date_created ?? null,
          data_prevista: o?.date_closed ?? null,
          situacao: o?.status ?? null,
          valor_total: o?.total_amount ?? null,
          valor_frete: null,
          valor_desconto: o?.coupon?.amount ?? 0,
          numero_ecommerce: String(o.id),
          numero_venda: String(o.id),
          empresa: 'mercadolivre',
          cidade: null,
          uf: null,
          codigo_rastreamento: null,
          url_rastreamento: null,
          obs: o?.status_detail ?? null,
          obs_interna: `ML order: ${o?.id}`,
          integration_account_id: accountId,
          created_at: o?.date_created ?? null,
          updated_at: o?.last_updated ?? null,
        }));
      }
    } else {
      // No enrichment - use basic mapping for ML orders
      unified = mlOrdersForEnrichment.map(({order: o, accountId}) => ({
        id: String(o.id),
        numero: String(o.id),
        nome_cliente: o?.buyer?.nickname ?? null,
        cpf_cnpj: null,
        data_pedido: o?.date_created ?? null,
        data_prevista: o?.date_closed ?? null,
        situacao: o?.status ?? null,
        valor_total: o?.total_amount ?? null,
        valor_frete: null,
        valor_desconto: o?.coupon?.amount ?? 0,
        numero_ecommerce: String(o.id),
        numero_venda: String(o.id),
        empresa: 'mercadolivre',
        cidade: null,
        uf: null,
        codigo_rastreamento: null,
        url_rastreamento: null,
        obs: o?.status_detail ?? null,
        obs_interna: `ML order: ${o?.id}`,
        integration_account_id: accountId,
        created_at: o?.date_created ?? null,
        updated_at: o?.last_updated ?? null,
      }));
    }

    // Sort both arrays by date (newest first) - maintaining same order
    const sortByDate = (a: any, b: any) => new Date(b.date_created || b.data_pedido).getTime() - new Date(a.date_created || a.data_pedido).getTime();
    allMLResults.sort(sortByDate);
    unified.sort(sortByDate);

    // Apply pagination to combined results - stable contract
    const offset = body.offset || 0;
    const limit = body.limit || 100;
    const resultsPage = allMLResults.slice(offset, offset + limit);
    const unifiedPage = unified.slice(offset, offset + limit);

    console.log('[Unified Orders] Returning', resultsPage.length, 'of', allMLResults.length, 'total ML orders');

    const response: any = {
      ok: true,
      paging: { total: allMLResults.length, offset: offset, limit: limit },
      results: resultsPage, // RAW ML data for compatibility
      unified: unifiedPage, // ENRICHED data with 22 columns
      count: allMLResults.length,
    };

    // Add debug info if requested
    if (body.debug) {
      response.ml_urls = mlUrls;
      response.requested_endpoints = Array.from(new Set(requested_endpoints));
      response.enrichment_logs = enrichment_logs;
      response.sample_unified = unifiedPage[0] || null;
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