/**
 * 📦 ML VENDAS COM ENVIO - SYNC
 * Sincroniza pedidos com envio pendente do Mercado Livre
 * Chamada via pg_cron a cada 1 hora ou manualmente
 * 
 * Busca pedidos com status: ready_to_ship, pending, handling
 * Salva na tabela ml_vendas_comenvio
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const DIAS_BUSCA = 30; // Buscar pedidos dos últimos 30 dias
const MAX_ACCOUNTS_PER_RUN = 20;
const ML_API_BASE = 'https://api.mercadolibre.com';
const ORDERS_PER_PAGE = 50;
const MAX_PAGES = 20; // Máximo 1000 pedidos por conta

// Status de shipping que indicam "com envio pendente"
const SHIPPING_STATUS_FILTER = ['ready_to_ship', 'pending', 'handling'];

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  date_closed: string | null;
  buyer: {
    id: number;
    nickname: string;
    first_name?: string;
    last_name?: string;
  };
  total_amount: number;
  currency_id: string;
  order_items: Array<{
    item: {
      id: string;
      title: string;
      seller_sku?: string;
      variation_id?: number;
      variation_attributes?: Array<{ name: string; value_name: string }>;
    };
    quantity: number;
    unit_price: number;
  }>;
  shipping?: {
    id: number;
    status: string;
    substatus?: string;
    logistic_type?: string;
    receiver_address?: {
      address_line?: string;
      city?: { name: string };
      state?: { name: string };
      zip_code?: string;
      country?: { name: string };
    };
    date_first_printed?: string;
    lead_time?: {
      shipping_deadline?: string;
    };
    tracking_number?: string;
    carrier_info?: { name?: string };
  };
  payments?: Array<{
    status: string;
    transaction_amount: number;
  }>;
  tags?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('📦 [VENDAS-COMENVIO-SYNC] Starting sync...');

    // Parsear body para filtros opcionais
    let requestBody: any = {};
    try {
      if (req.body) {
        requestBody = await req.json();
      }
    } catch {
      // Body vazio é OK
    }

    const forceRefresh = requestBody.force_refresh === true;
    const specificAccountIds = requestBody.account_ids as string[] | undefined;

    // Service client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ETAPA 1: Buscar contas ML ativas
    let accountsQuery = supabaseAdmin
      .from('integration_accounts')
      .select('id, organization_id, name, account_identifier, is_active')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (specificAccountIds && specificAccountIds.length > 0) {
      accountsQuery = accountsQuery.in('id', specificAccountIds);
    } else {
      accountsQuery = accountsQuery.limit(MAX_ACCOUNTS_PER_RUN);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      throw accountsError;
    }

    console.log(`📋 Found ${accounts?.length || 0} ML accounts to sync`);

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active ML accounts to sync',
          accounts_processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resultados
    const results = {
      total_accounts: accounts.length,
      accounts_synced: 0,
      accounts_failed: 0,
      total_orders_fetched: 0,
      total_orders_saved: 0,
      errors: [] as any[]
    };

    // Calcular período
    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setDate(dateFrom.getDate() - DIAS_BUSCA);
    const dateFromISO = dateFrom.toISOString();
    const dateToISO = now.toISOString();

    console.log(`📅 Period: ${dateFromISO} to ${dateToISO}`);

    // ETAPA 2: Processar cada conta
    for (const account of accounts) {
      const accountStartTime = Date.now();
      
      try {
        console.log(`\n🔄 [${account.name || account.account_identifier}] Starting...`);

        // 2.1: Buscar token de acesso
        const { data: secretData, error: secretError } = await supabaseAdmin.functions.invoke(
          'integrations-get-secret',
          {
            body: { 
              integration_account_id: account.id,
              secret_name: 'access_token'
            }
          }
        );

        if (secretError || !secretData?.secret) {
          throw new Error(`Token not found for account ${account.account_identifier}`);
        }

        const accessToken = secretData.secret;

        // 2.2: Buscar pedidos do ML com paginação
        let allOrders: MLOrder[] = [];
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < MAX_PAGES) {
          // Buscar pedidos com shipping status específicos
          const searchUrl = new URL(`${ML_API_BASE}/orders/search`);
          searchUrl.searchParams.set('seller', account.account_identifier);
          searchUrl.searchParams.set('order.date_created.from', dateFromISO);
          searchUrl.searchParams.set('order.date_created.to', dateToISO);
          searchUrl.searchParams.set('offset', offset.toString());
          searchUrl.searchParams.set('limit', ORDERS_PER_PAGE.toString());
          searchUrl.searchParams.set('sort', 'date_desc');
          // Filtrar por status de shipping
          searchUrl.searchParams.set('shipping.status', SHIPPING_STATUS_FILTER.join(','));

          console.log(`📡 Fetching page ${pageCount + 1} (offset: ${offset})...`);

          const ordersResponse = await fetch(searchUrl.toString(), {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!ordersResponse.ok) {
            const errorText = await ordersResponse.text();
            console.error(`❌ ML API error:`, errorText);
            
            // Se token expirado, tentar refresh
            if (ordersResponse.status === 401) {
              console.log('🔄 Token expired, attempting refresh...');
              await supabaseAdmin.functions.invoke('mercadolivre-token-refresh', {
                body: { integration_account_id: account.id }
              });
              throw new Error('Token refreshed, retry needed');
            }
            
            throw new Error(`ML API error: ${ordersResponse.status}`);
          }

          const ordersData = await ordersResponse.json();
          const orders = ordersData.results || [];
          const total = ordersData.paging?.total || 0;

          allOrders = allOrders.concat(orders);
          offset += ORDERS_PER_PAGE;
          pageCount++;
          hasMore = offset < total && orders.length === ORDERS_PER_PAGE;

          console.log(`✅ Got ${orders.length} orders (total: ${total}, fetched: ${allOrders.length})`);
        }

        console.log(`📦 Total orders fetched: ${allOrders.length}`);
        results.total_orders_fetched += allOrders.length;

        // 2.3: Mapear e salvar pedidos
        if (allOrders.length > 0) {
          const mappedOrders = allOrders.map(order => mapOrderToCache(order, account));
          
          // Upsert em batch
          const { error: upsertError } = await supabaseAdmin
            .from('ml_vendas_comenvio')
            .upsert(mappedOrders, {
              onConflict: 'order_id,integration_account_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('❌ Error upserting orders:', upsertError);
            throw upsertError;
          }

          results.total_orders_saved += mappedOrders.length;
          console.log(`💾 Saved ${mappedOrders.length} orders to ml_vendas_comenvio`);
        }

        // 2.4: Limpar pedidos antigos que não estão mais com envio pendente
        // (pedidos já enviados ou cancelados)
        const { error: cleanupError } = await supabaseAdmin
          .from('ml_vendas_comenvio')
          .delete()
          .eq('integration_account_id', account.id)
          .not('shipping_status', 'in', `(${SHIPPING_STATUS_FILTER.join(',')})`)
          .lt('date_created', dateFromISO);

        if (cleanupError) {
          console.warn('⚠️ Cleanup error:', cleanupError);
        }

        results.accounts_synced++;
        const duration = Date.now() - accountStartTime;
        console.log(`✅ [${account.name}] Completed in ${duration}ms`);

      } catch (accountError) {
        console.error(`❌ [${account.name}] Failed:`, accountError);
        
        results.accounts_failed++;
        results.errors.push({
          account_id: account.id,
          account_name: account.name,
          error: accountError instanceof Error ? accountError.message : String(accountError)
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ [VENDAS-COMENVIO-SYNC] Completed in ${totalDuration}ms`);
    console.log(`📊 Results:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        total_duration_ms: totalDuration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [VENDAS-COMENVIO-SYNC] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Mapeia pedido do ML para estrutura da tabela ml_vendas_comenvio
 */
function mapOrderToCache(order: MLOrder, account: any): any {
  const shipping = order.shipping || {};
  const buyer = order.buyer || {};
  const payments = order.payments || [];
  
  // Extrair itens
  const items = (order.order_items || []).map(item => ({
    id: item.item?.id || '',
    title: item.item?.title || '',
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    sku: item.item?.seller_sku || null,
    variation_id: item.item?.variation_id?.toString() || null,
    variation_attributes: (item.item?.variation_attributes || []).map(attr => ({
      name: attr.name,
      value: attr.value_name
    }))
  }));

  // Calcular totais de itens
  const itemsCount = items.length;
  const itemsQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Status de pagamento
  const paymentStatus = payments.length > 0 ? payments[0].status : 'unknown';

  // Endereço de destino
  const receiverAddress = shipping.receiver_address || {};

  return {
    order_id: order.id.toString(),
    integration_account_id: account.id,
    organization_id: account.organization_id,
    account_name: account.name || account.account_identifier,
    
    // Status
    order_status: order.status,
    shipping_status: shipping.status || 'unknown',
    payment_status: paymentStatus,
    
    // Datas
    date_created: order.date_created,
    date_closed: order.date_closed,
    shipping_deadline: shipping.lead_time?.shipping_deadline || null,
    
    // Comprador
    buyer_id: buyer.id,
    buyer_nickname: buyer.nickname,
    buyer_name: [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || null,
    
    // Valores
    total_amount: order.total_amount || 0,
    currency_id: order.currency_id || 'BRL',
    
    // Envio
    shipment_id: shipping.id?.toString() || null,
    logistic_type: shipping.logistic_type || null,
    tracking_number: shipping.tracking_number || null,
    carrier: shipping.carrier_info?.name || null,
    
    // Itens
    items: items,
    items_count: itemsCount,
    items_quantity: itemsQuantity,
    
    // Dados completos
    order_data: order,
    
    // Metadados
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
