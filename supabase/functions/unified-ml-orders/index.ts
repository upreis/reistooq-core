/**
 * 🔄 UNIFIED ML ORDERS - SINGLE SOURCE OF TRUTH
 * Edge Function unificada para busca de pedidos do Mercado Livre
 * Implementa write-through caching com fallback para ML API
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
}

const CACHE_TTL_MINUTES = 15;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // ✅ CORREÇÃO PROBLEMA 3: Obter organization_id do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    const organization_id = profile?.organizacao_id;
    if (!organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const params: RequestParams = await req.json();
    const { integration_account_ids, date_from, date_to, force_refresh = false } = params;

    // ✅ CORREÇÃO PROBLEMA 6: Validar array vazio
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
      force_refresh
    });

    // ETAPA 1: Verificar cache no Supabase (se não for force_refresh)
    if (!force_refresh) {
      console.log('🔍 Checking cache...');
      
      const { data: cachedOrders, error: cacheError } = await supabase
        .from('ml_orders_cache')
        .select('*')
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids)
        .gt('ttl_expires_at', new Date().toISOString());

      if (!cacheError && cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ Cache HIT - ${cachedOrders.length} orders from cache`);
        
        // Filtrar por data range se especificado
        let filteredOrders = cachedOrders.map(entry => entry.order_data);
        
        if (date_from || date_to) {
          filteredOrders = filteredOrders.filter((order: any) => {
            const orderDate = new Date(order.date_created || order.data_criacao);
            if (date_from && orderDate < new Date(date_from)) return false;
            if (date_to && orderDate > new Date(date_to)) return false;
            return true;
          });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            orders: filteredOrders,
            total: filteredOrders.length,
            source: 'cache',
            cached_at: cachedOrders[0]?.cached_at,
            expires_at: cachedOrders[0]?.ttl_expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('❌ Cache MISS - fetching from ML API');
    } else {
      console.log('🔄 Force refresh - bypassing cache');
    }

    // ETAPA 2: Buscar da ML API (cache miss ou force refresh)
    const allOrders: any[] = [];
    
    for (const accountId of integration_account_ids) {
      console.log(`📡 Fetching orders for account ${accountId}...`);
      
      // Chamar unified-orders existente para buscar dados
      const unifiedOrdersResponse = await supabase.functions.invoke('unified-orders', {
        body: {
          integration_account_id: accountId,
          date_from,
          date_to
        }
      });

      if (unifiedOrdersResponse.error) {
        console.error(`❌ Error fetching account ${accountId}:`, unifiedOrdersResponse.error);
        continue;
      }

      const accountOrders = unifiedOrdersResponse.data?.orders || [];
      console.log(`✅ Fetched ${accountOrders.length} orders for account ${accountId}`);
      
      allOrders.push(...accountOrders);

      // ETAPA 3: Write-through caching - salvar no cache
      if (accountOrders.length > 0) {
        console.log(`💾 Saving ${accountOrders.length} orders to cache...`);
        
        const cacheEntries = accountOrders.map((order: any) => ({
          organization_id, // ✅ CORREÇÃO PROBLEMA 3
          integration_account_id: accountId,
          order_id: order.id?.toString() || order.order_id,
          order_data: order,
          cached_at: new Date().toISOString(),
          ttl_expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
        }));

        // ✅ CORREÇÃO PROBLEMA 7: Usar UPSERT ao invés de DELETE+INSERT
        const { error: upsertError } = await supabase
          .from('ml_orders_cache')
          .upsert(cacheEntries, {
            onConflict: 'organization_id,integration_account_id,order_id'
          });

        if (upsertError) {
          console.error('❌ Error saving to cache:', upsertError);
        } else {
          console.log(`✅ Saved ${cacheEntries.length} orders to cache`);
        }
      }
    }

    console.log(`✅ Total orders fetched: ${allOrders.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        orders: allOrders,
        total: allOrders.length,
        source: 'ml_api',
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unified ML Orders Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
