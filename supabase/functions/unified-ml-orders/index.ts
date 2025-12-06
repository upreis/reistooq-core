/**
 * 🔄 UNIFIED ML ORDERS - SINGLE SOURCE OF TRUTH
 * Edge Function unificada para busca de pedidos do Mercado Livre
 * Implementa write-through caching com fallback para ML API
 * 
 * 🔧 CORREÇÃO: Busca direto da ML API ao invés de chamar unified-orders
 *              para evitar CPU timeout por chamadas aninhadas
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RequestParams {
  integration_account_ids: string[];
  date_from?: string;
  date_to?: string;
  force_refresh?: boolean;
  offset?: number;
  limit?: number;
}

const CACHE_TTL_MINUTES = 15;
const ML_API_BASE = 'https://api.mercadolibre.com';

/**
 * 🔧 HELPER: Buscar token ML para conta
 */
async function getMLToken(supabaseAdmin: any, accountId: string, authHeader: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const response = await fetch(`${supabaseUrl}/functions/v1/get-ml-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        integration_account_id: accountId,
        provider: 'mercadolivre'
      })
    });

    if (!response.ok) {
      console.error(`❌ Erro ao obter token ML para ${accountId}:`, response.status);
      return null;
    }

    const data = await response.json();
    return data?.access_token || null;
  } catch (error) {
    console.error(`❌ Erro ao buscar token ML:`, error);
    return null;
  }
}

/**
 * 🔧 HELPER: Buscar seller_id da conta
 */
async function getSellerId(supabaseAdmin: any, accountId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('integration_accounts')
    .select('account_identifier')
    .eq('id', accountId)
    .single();
  
  return data?.account_identifier || null;
}

/**
 * 🔧 HELPER: Buscar pedidos direto da ML API
 */
async function fetchOrdersFromML(
  accessToken: string,
  sellerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<any[]> {
  const orders: any[] = [];
  let offset = 0;
  const limit = 50;
  const MAX_ITERATIONS = 10; // Máximo 500 pedidos por conta
  
  // Construir filtro de data
  let dateFilter = '';
  if (dateFrom) {
    const from = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00.000Z`;
    dateFilter += `&order.date_created.from=${encodeURIComponent(from)}`;
  }
  if (dateTo) {
    const to = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
    dateFilter += `&order.date_created.to=${encodeURIComponent(to)}`;
  }
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const url = `${ML_API_BASE}/orders/search?seller=${sellerId}&offset=${offset}&limit=${limit}${dateFilter}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ ML API error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const results = data.results || [];
      orders.push(...results);
      
      // Verificar se há mais páginas
      const total = data.paging?.total || 0;
      offset += limit;
      
      if (offset >= total || results.length === 0) {
        break;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar ML API:`, error);
      break;
    }
  }
  
  return orders;
}

/**
 * 🔧 HELPER: Extrai campos estruturados do order_data para ml_orders
 */
function extractOrderFields(order: any, accountId: string, organizationId: string) {
  let buyerId: number | null = null;
  try {
    if (order.buyer?.id) {
      buyerId = typeof order.buyer.id === 'number' 
        ? order.buyer.id 
        : parseInt(order.buyer.id, 10);
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse buyer_id:', order.buyer?.id);
  }

  let packId: number | null = null;
  try {
    if (order.pack_id) {
      packId = typeof order.pack_id === 'number'
        ? order.pack_id
        : parseInt(order.pack_id, 10);
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse pack_id:', order.pack_id);
  }

  return {
    ml_order_id: order.id?.toString() || order.order_id,
    organization_id: organizationId,
    integration_account_id: accountId,
    status: order.status || null,
    date_created: order.date_created || null,
    date_closed: order.date_closed || null,
    last_updated: order.last_updated || null,
    order_date: order.date_created || null,
    total_amount: order.total_amount || 0,
    paid_amount: order.paid_amount || 0,
    currency_id: order.currency_id || 'BRL',
    buyer_id: buyerId,
    buyer_nickname: order.buyer?.nickname || null,
    buyer_email: order.buyer?.email || null,
    fulfilled: order.fulfilled || false,
    pack_id: packId,
    order_data: order,
    last_synced_at: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadBase64] = jwt.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    
    if (!userId) {
      console.error('❌ No user ID in JWT');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ User authenticated:', userId);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organizacao_id')
      .eq('id', userId)
      .single();

    const organization_id = profile?.organizacao_id;
    if (!organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: RequestParams = await req.json();
    const { integration_account_ids, date_from, date_to, force_refresh = false, offset = 0, limit = 50 } = params;

    if (!integration_account_ids || integration_account_ids.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_account_ids is required and must not be empty' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Unified ML Orders - Request:', {
      organization_id,
      accounts: integration_account_ids.length,
      date_from,
      date_to,
      force_refresh,
      offset,
      limit
    });

    // ETAPA 1: Verificar cache primeiro
    if (!force_refresh) {
      console.log('🔍 Checking cache...');
      
      const { data: cachedOrders, error: cacheError } = await supabaseAdmin
        .from('ml_orders_cache')
        .select('*')
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids)
        .gt('ttl_expires_at', new Date().toISOString());

      if (!cacheError && cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ Cache HIT - ${cachedOrders.length} orders from cache`);
        
        let filteredOrders = cachedOrders.map(entry => entry.order_data);
        
        // Filtrar por data
        if (date_from || date_to) {
          filteredOrders = filteredOrders.filter((order: any) => {
            const orderDate = new Date(order.date_created || order.data_criacao);
            if (date_from && orderDate < new Date(date_from)) return false;
            if (date_to && orderDate > new Date(date_to)) return false;
            return true;
          });
        }
        
        // Ordenar por data
        filteredOrders.sort((a: any, b: any) => {
          const dateA = new Date(a.date_created || 0).getTime();
          const dateB = new Date(b.date_created || 0).getTime();
          return dateB - dateA;
        });
        
        const totalReal = filteredOrders.length;
        const paginatedOrders = filteredOrders.slice(offset, offset + limit);
        
        console.log(`📊 Cache: ${paginatedOrders.length} de ${totalReal} orders`);
        
        return new Response(
          JSON.stringify({
            success: true,
            orders: paginatedOrders,
            total: totalReal,
            paging: { total: totalReal, offset, limit: paginatedOrders.length },
            source: 'cache',
            cached_at: cachedOrders[0]?.cached_at,
            expires_at: cachedOrders[0]?.ttl_expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('❌ Cache MISS - fetching from ML API');
    } else {
      // Force refresh: invalidar cache antigo
      console.log('🔄 Force refresh - invalidating old cache');
      await supabaseAdmin
        .from('ml_orders_cache')
        .delete()
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids);
    }

    // ETAPA 2: Buscar direto da ML API (OTIMIZADO - sem chamar unified-orders)
    const allOrders: any[] = [];
    
    // Processar contas em paralelo (máximo 2 para evitar rate limit)
    const BATCH_SIZE = 2;
    for (let i = 0; i < integration_account_ids.length; i += BATCH_SIZE) {
      const batch = integration_account_ids.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(batch.map(async (accountId) => {
        console.log(`📡 Fetching orders for account ${accountId}...`);
        
        // Buscar token e seller_id
        const [accessToken, sellerId] = await Promise.all([
          getMLToken(supabaseAdmin, accountId, authHeader),
          getSellerId(supabaseAdmin, accountId)
        ]);
        
        if (!accessToken || !sellerId) {
          console.error(`❌ Missing token or sellerId for account ${accountId}`);
          return [];
        }
        
        // Buscar pedidos direto da ML API
        const orders = await fetchOrdersFromML(accessToken, sellerId, date_from, date_to);
        console.log(`✅ Fetched ${orders.length} orders for account ${accountId}`);
        
        // Salvar no cache em background
        if (orders.length > 0) {
          const cacheEntries = orders.map((order: any) => ({
            organization_id,
            integration_account_id: accountId,
            order_id: order.id?.toString(),
            order_data: order,
            cached_at: new Date().toISOString(),
            ttl_expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
          }));

          supabaseAdmin
            .from('ml_orders_cache')
            .upsert(cacheEntries, { onConflict: 'organization_id,integration_account_id,order_id' })
            .then(({ error }) => {
              if (error) console.error('⚠️ Cache error:', error);
              else console.log(`💾 Cached ${cacheEntries.length} orders`);
            });
        }
        
        return orders;
      }));
      
      batchResults.forEach(orders => allOrders.push(...orders));
    }

    // Ordenar por data (mais recentes primeiro)
    allOrders.sort((a, b) => {
      const dateA = new Date(a.date_created || 0).getTime();
      const dateB = new Date(b.date_created || 0).getTime();
      return dateB - dateA;
    });

    const totalFromAPI = allOrders.length;
    const paginatedOrders = allOrders.slice(offset, offset + limit);
    
    console.log(`📊 Total: ${totalFromAPI}, Page: ${paginatedOrders.length} (offset=${offset}, limit=${limit})`);

    return new Response(
      JSON.stringify({
        success: true,
        orders: paginatedOrders,
        total: totalFromAPI,
        paging: { total: totalFromAPI, offset, limit },
        source: 'ml_api',
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unified ML Orders Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});