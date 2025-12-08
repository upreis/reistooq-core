/**
 * 📦 GET VENDAS COM ENVIO - SINGLE SOURCE OF TRUTH
 * Busca pedidos com envio pendente da ML API + cache em ml_vendas_comenvio
 * 
 * ✅ Suporta chamadas de usuários E service_role (CRON background jobs)
 * ✅ Cache-first strategy com fallback para ML API
 * ✅ Padrão idêntico a get-devolucoes-direct (Combo 2.1)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const CACHE_TTL_MINUTES = 5;
const ORDERS_PER_PAGE = 50;
const MAX_PAGES = 10;
const ENRICHMENT_BATCH_SIZE = 10; // Processar 10 shipments por vez

// 🚚 Função de enriquecimento de shipping detalhado
async function enrichWithShippingDetails(
  orders: any[], 
  accessToken: string, 
  cid: string
): Promise<any[]> {
  const ordersWithShipping = orders.filter(o => o.shipping_id);
  
  if (ordersWithShipping.length === 0) {
    console.log(`[get-vendas-comenvio:${cid}] ℹ️ No orders with shipping to enrich`);
    return orders;
  }

  console.log(`[get-vendas-comenvio:${cid}] 🚚 Enriching ${ordersWithShipping.length} orders with shipping details...`);

  // Processar em batches para evitar rate limiting
  const enrichedMap = new Map<string, any>();
  
  for (let i = 0; i < ordersWithShipping.length; i += ENRICHMENT_BATCH_SIZE) {
    const batch = ordersWithShipping.slice(i, i + ENRICHMENT_BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (order) => {
        try {
          const shipmentId = order.shipping_id;
          const response = await fetch(
            `https://api.mercadolibre.com/shipments/${shipmentId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const shippingData = await response.json();
            return { orderId: order.order_id, shippingData };
          }
        } catch (error) {
          console.warn(`[get-vendas-comenvio:${cid}] ⚠️ Failed to enrich shipping ${order.shipping_id}`);
        }
        return { orderId: order.order_id, shippingData: null };
      })
    );

    batchResults.forEach(result => {
      if (result.shippingData) {
        enrichedMap.set(result.orderId, result.shippingData);
      }
    });
  }

  console.log(`[get-vendas-comenvio:${cid}] ✅ Enriched ${enrichedMap.size} shipments`);

  // Merge shipping data into orders
  return orders.map(order => {
    const shippingDetails = enrichedMap.get(order.order_id);
    if (!shippingDetails) return order;

    // Atualizar order_data com shipping completo
    const updatedOrderData = {
      ...order.order_data,
      shipping: shippingDetails
    };

    return {
      ...order,
      order_data: updatedOrderData,
      // Atualizar campos diretos também
      shipping_status: shippingDetails.status || order.shipping_status,
      logistic_type: shippingDetails.logistic_type || order.logistic_type,
      tracking_number: shippingDetails.tracking_number || order.tracking_number,
      carrier: shippingDetails.tracking_method || shippingDetails.carrier?.name || order.carrier,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const cid = crypto.randomUUID().slice(0, 8);

  try {
    console.log(`[get-vendas-comenvio:${cid}] 📦 Starting...`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validar Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[get-vendas-comenvio:${cid}] ❌ No authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Client (bypass RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Parse request body
    const body = await req.json();
    const {
      integration_account_id,
      integration_account_ids,
      date_from,
      date_to,
      shipping_status,
      force_refresh = false
    } = body;

    // Normalizar para array
    const accountIds = integration_account_ids
      ? (Array.isArray(integration_account_ids) ? integration_account_ids : [integration_account_ids])
      : (integration_account_id ? [integration_account_id] : []);

    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma conta fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-vendas-comenvio:${cid}] 📋 Contas: ${accountIds.length}, force_refresh: ${force_refresh}`);

    // 🔐 Detectar tipo de chamada (user ou service_role)
    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadBase64] = jwt.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const role = payload.role;
    const userId = payload.sub;

    let organization_id: string | null = null;

    if (role === 'service_role') {
      console.log(`[get-vendas-comenvio:${cid}] 🤖 Service role - CRON call`);
      
      const { data: account } = await supabaseAdmin
        .from('integration_accounts')
        .select('organization_id')
        .eq('id', accountIds[0])
        .single();
      
      organization_id = account?.organization_id || null;
    } else {
      // User call
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organizacao_id')
        .eq('id', userId)
        .single();

      organization_id = profile?.organizacao_id || null;
    }

    if (!organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 📦 ETAPA 1: Verificar cache (se não for force_refresh)
    if (!force_refresh) {
      console.log(`[get-vendas-comenvio:${cid}] 🔍 Checking cache...`);

      const cacheThreshold = new Date();
      cacheThreshold.setMinutes(cacheThreshold.getMinutes() - CACHE_TTL_MINUTES);

      let cacheQuery = supabaseAdmin
        .from('ml_vendas_comenvio')
        .select('*')
        .in('integration_account_id', accountIds)
        .gte('last_synced_at', cacheThreshold.toISOString())
        .order('date_created', { ascending: false });

      // Filtro de datas
      if (date_from) {
        cacheQuery = cacheQuery.gte('date_created', date_from);
      }
      if (date_to) {
        cacheQuery = cacheQuery.lte('date_created', date_to);
      }

      // Filtro de shipping_status
      if (shipping_status && shipping_status !== 'all') {
        if (Array.isArray(shipping_status)) {
          cacheQuery = cacheQuery.in('shipping_status', shipping_status);
        } else {
          cacheQuery = cacheQuery.eq('shipping_status', shipping_status);
        }
      }

      const { data: cachedOrders, error: cacheError } = await cacheQuery;

      if (!cacheError && cachedOrders && cachedOrders.length > 0) {
        console.log(`[get-vendas-comenvio:${cid}] ✅ Cache HIT - ${cachedOrders.length} orders`);

        return new Response(
          JSON.stringify({
            success: true,
            data: cachedOrders,
            total: cachedOrders.length,
            source: 'cache'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[get-vendas-comenvio:${cid}] ℹ️ Cache MISS - fetching from ML API`);
    }

    // 📡 ETAPA 2: Buscar dados frescos da ML API
    const allOrders: any[] = [];

    for (const accountId of accountIds) {
      try {
        console.log(`[get-vendas-comenvio:${cid}] 🔄 Processing account ${accountId.slice(0, 8)}...`);

        // Buscar dados da conta
        const { data: account, error: accountError } = await supabaseAdmin
          .from('integration_accounts')
          .select('account_identifier, name')
          .eq('id', accountId)
          .eq('is_active', true)
          .single();

        if (accountError || !account) {
          console.warn(`[get-vendas-comenvio:${cid}] ⚠️ Account not found: ${accountId}`);
          continue;
        }

        // Buscar token
        const { data: secretRow, error: secretError } = await supabaseAdmin
          .from('integration_secrets')
          .select('simple_tokens, use_simple')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .maybeSingle();

        if (secretError || !secretRow) {
          console.warn(`[get-vendas-comenvio:${cid}] ⚠️ Token not found: ${accountId}`);
          continue;
        }

        let accessToken = '';
        if (secretRow?.use_simple && secretRow?.simple_tokens) {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
          }
        }

        if (!accessToken) {
          console.warn(`[get-vendas-comenvio:${cid}] ⚠️ Token empty: ${accountId}`);
          continue;
        }

        console.log(`[get-vendas-comenvio:${cid}] ✅ Token obtained for ${account.name || account.account_identifier}`);

        // Calcular datas
        const dateFromISO = date_from 
          ? (date_from.includes('T') ? date_from : `${date_from}T00:00:00.000Z`)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const dateToISO = date_to
          ? (date_to.includes('T') ? date_to : `${date_to}T23:59:59.999Z`)
          : new Date().toISOString();

        // Buscar pedidos com paginação
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < MAX_PAGES) {
          const searchUrl = new URL('https://api.mercadolibre.com/orders/search');
          searchUrl.searchParams.set('seller', account.account_identifier);
          searchUrl.searchParams.set('order.date_created.from', dateFromISO);
          searchUrl.searchParams.set('order.date_created.to', dateToISO);
          searchUrl.searchParams.set('offset', offset.toString());
          searchUrl.searchParams.set('limit', ORDERS_PER_PAGE.toString());
          searchUrl.searchParams.set('sort', 'date_desc');

          console.log(`[get-vendas-comenvio:${cid}] 📡 Page ${pageCount + 1} (offset: ${offset})...`);

          const response = await fetch(searchUrl.toString(), {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[get-vendas-comenvio:${cid}] ❌ ML API error:`, errorText);
            break;
          }

          const data = await response.json();
          const orders = data.results || [];
          const paging = data.paging || { total: 0 };

          console.log(`[get-vendas-comenvio:${cid}] ✅ Page ${pageCount + 1}: ${orders.length} orders`);

          if (orders.length === 0) {
            hasMore = false;
          } else {
            // Mapear para formato da tabela
            const mappedOrders = orders.map((order: any) => ({
              order_id: String(order.id),
              integration_account_id: accountId,
              organization_id,
              
              status: order.status || 'unknown',
              shipping_status: order.shipping?.status || 'unknown',
              logistic_type: order.shipping?.logistic_type || null,
              
              date_created: order.date_created,
              date_closed: order.date_closed || null,
              
              total_amount: order.total_amount || 0,
              currency_id: order.currency_id || 'BRL',
              
              buyer_id: String(order.buyer?.id || ''),
              buyer_nickname: order.buyer?.nickname || null,
              buyer_first_name: order.buyer?.first_name || null,
              buyer_last_name: order.buyer?.last_name || null,
              
              shipping_id: order.shipping?.id ? String(order.shipping.id) : null,
              
              item_id: order.order_items?.[0]?.item?.id || null,
              item_title: order.order_items?.[0]?.item?.title || null,
              item_sku: order.order_items?.[0]?.item?.seller_sku || null,
              item_quantity: order.order_items?.[0]?.quantity || 0,
              
              order_data: order,
              
              account_name: account.name || account.account_identifier,
              order_status: order.status || 'unknown',
              payment_status: order.payments?.[0]?.status || 'unknown',
              shipping_deadline: order.shipping?.lead_time?.shipping_deadline || null,
              buyer_name: [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ') || null,
              shipment_id: order.shipping?.id ? String(order.shipping.id) : null,
              tracking_number: order.shipping?.tracking_number || null,
              carrier: order.shipping?.carrier_info?.name || null,
              items: order.order_items || [],
              items_count: order.order_items?.length || 0,
              items_quantity: (order.order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
              
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

            allOrders.push(...mappedOrders);
            offset += ORDERS_PER_PAGE;
            pageCount++;

            if (offset >= paging.total) {
              hasMore = false;
            }
          }
        }

        console.log(`[get-vendas-comenvio:${cid}] ✅ Account ${account.name}: ${allOrders.length} total orders`);

      } catch (accountError) {
        console.error(`[get-vendas-comenvio:${cid}] ❌ Account error:`, accountError);
      }
    }

    // 🚚 ETAPA 2.5: Enriquecer com dados detalhados de shipping
    // Precisamos do token de cada conta - vamos processar por conta
    let enrichedOrders = allOrders;
    
    // Obter tokens únicos por account_id
    const accountTokens = new Map<string, string>();
    for (const accountId of accountIds) {
      try {
        const { data: secretRow } = await supabaseAdmin
          .from('integration_secrets')
          .select('simple_tokens, use_simple')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .maybeSingle();
        
        if (secretRow?.use_simple && secretRow?.simple_tokens) {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accountTokens.set(accountId, tokensData.access_token || '');
          }
        }
      } catch (e) {
        console.warn(`[get-vendas-comenvio:${cid}] ⚠️ Failed to get token for enrichment: ${accountId}`);
      }
    }

    // Enriquecer pedidos por conta
    for (const [accountId, token] of accountTokens.entries()) {
      if (!token) continue;
      
      const ordersForAccount = enrichedOrders.filter(o => o.integration_account_id === accountId);
      if (ordersForAccount.length === 0) continue;
      
      const enriched = await enrichWithShippingDetails(ordersForAccount, token, cid);
      
      // Substituir no array
      enrichedOrders = enrichedOrders.map(order => {
        if (order.integration_account_id !== accountId) return order;
        const enrichedOrder = enriched.find(e => e.order_id === order.order_id);
        return enrichedOrder || order;
      });
    }

    // 💾 ETAPA 3: Salvar no cache (write-through) - com dados enriquecidos
    if (enrichedOrders.length > 0) {
      console.log(`[get-vendas-comenvio:${cid}] 💾 Saving ${enrichedOrders.length} enriched orders to cache...`);

      const { error: upsertError } = await supabaseAdmin
        .from('ml_vendas_comenvio')
        .upsert(enrichedOrders, {
          onConflict: 'order_id,integration_account_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`[get-vendas-comenvio:${cid}] ⚠️ Cache save error:`, upsertError);
      } else {
        console.log(`[get-vendas-comenvio:${cid}] ✅ Cache updated with enriched data`);
      }
    }

    // 📤 Aplicar filtros finais
    let filteredOrders = enrichedOrders;

    if (shipping_status && shipping_status !== 'all') {
      const statusArray = Array.isArray(shipping_status) ? shipping_status : [shipping_status];
      filteredOrders = filteredOrders.filter(o => statusArray.includes(o.shipping_status));
    }

    const duration = Date.now() - startTime;
    console.log(`[get-vendas-comenvio:${cid}] ✅ Completed in ${duration}ms - ${filteredOrders.length} orders`);

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredOrders,
        total: filteredOrders.length,
        source: 'api',
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[get-vendas-comenvio:${cid}] ❌ Fatal error:`, error);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
