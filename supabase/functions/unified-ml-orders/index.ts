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

/**
 * 🔧 HELPER: Extrai campos estruturados do order_data para ml_orders
 */
function extractOrderFields(order: any, accountId: string, organizationId: string) {
  // Conversão segura de buyer_id para bigint
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

  // Conversão segura de pack_id
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
    order_date: order.date_created || null, // 🔧 Adicionar order_date (igual a date_created)
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
    // ✅ CRITICAL: Como verify_jwt = true, Supabase já validou o JWT
    // Podemos criar um service client e extrair o user ID do JWT
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrair user do JWT (já validado pelo Supabase via verify_jwt)
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

    // Buscar organization_id do usuário
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
      
      const { data: cachedOrders, error: cacheError } = await supabaseAdmin
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
      console.log('🔄 Force refresh - bypassing cache and invalidating old cache');
      
      // Invalidar cache antigo das contas especificadas antes de buscar novos dados
      const { error: deleteError } = await supabaseAdmin
        .from('ml_orders_cache')
        .delete()
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids);
      
      if (deleteError) {
        console.error('⚠️ Error invalidating old cache:', deleteError);
      } else {
        console.log('✅ Old cache invalidated for accounts:', integration_account_ids);
      }
    }

    // ETAPA 2: Buscar da ML API (cache miss ou force refresh)
    const allOrders: any[] = [];
    
    for (const accountId of integration_account_ids) {
      console.log(`📡 Fetching orders for account ${accountId}...`);
      
      // Chamar unified-orders existente para buscar dados
      const unifiedOrdersResponse = await supabaseAdmin.functions.invoke('unified-orders', {
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

      // ETAPA 3: Write-through caching - salvar no cache E na tabela permanente
      if (accountOrders.length > 0) {
        console.log(`💾 Saving ${accountOrders.length} orders to cache and ml_orders...`);
        
        // 3.1: Salvar em ml_orders_cache (TTL cache temporário)
        const cacheEntries = accountOrders.map((order: any) => ({
          organization_id,
          integration_account_id: accountId,
          order_id: order.id?.toString() || order.order_id,
          order_data: order,
          cached_at: new Date().toISOString(),
          ttl_expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
        }));

        const { error: cacheError } = await supabaseAdmin
          .from('ml_orders_cache')
          .upsert(cacheEntries, {
            onConflict: 'organization_id,integration_account_id,order_id'
          });

        if (cacheError) {
          console.error('❌ Error saving to cache:', cacheError);
        } else {
          console.log(`✅ Cache: Saved ${cacheEntries.length} orders`);
        }

        // 3.2: Salvar em ml_orders (persistência permanente com campos estruturados)
        try {
          const mlOrdersEntries = accountOrders.map((order: any) => 
            extractOrderFields(order, accountId, organization_id)
          );

          const { error: mlOrdersError, data: mlOrdersData } = await supabaseAdmin
            .from('ml_orders')
            .upsert(mlOrdersEntries, {
              onConflict: 'organization_id,integration_account_id,ml_order_id',
              ignoreDuplicates: false // Atualizar se já existir
            });

          if (mlOrdersError) {
            // Log mas não falha - cache temporário já foi salvo
            console.error('⚠️ Error saving to ml_orders:', mlOrdersError);
            console.error('⚠️ This is non-critical - cache is still functional');
          } else {
            console.log(`✅ ml_orders: Saved ${mlOrdersEntries.length} orders permanently`);
          }
        } catch (error) {
          console.error('⚠️ Exception in ml_orders persistence:', error);
          console.error('⚠️ This is non-critical - cache is still functional');
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
