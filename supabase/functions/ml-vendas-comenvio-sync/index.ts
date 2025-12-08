/**
 * 📦 ML VENDAS COM ENVIO - SYNC
 * Sincroniza pedidos com envio pendente do Mercado Livre
 * Chamada via pg_cron a cada 1 hora ou manualmente
 * 
 * ✅ CORREÇÃO: Busca token de integration_secrets (mesmo padrão de get-devolucoes-direct)
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

/**
 * Busca access_token de integration_secrets
 * (mesmo padrão de get-devolucoes-direct)
 */
async function getAccessToken(supabaseAdmin: any, accountId: string): Promise<string | null> {
  try {
    const { data: secretRow, error: secretError } = await supabaseAdmin
      .from('integration_secrets')
      .select('simple_tokens, use_simple')
      .eq('integration_account_id', accountId)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretError || !secretRow) {
      console.error(`❌ Token não encontrado para conta ${accountId}`);
      return null;
    }

    let accessToken = '';
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          accessToken = tokensData.access_token || '';
        }
      } catch (err) {
        console.error(`❌ Erro ao descriptografar token: ${err}`);
        return null;
      }
    }

    if (!accessToken) {
      console.error('❌ Token ML indisponível');
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Erro ao buscar token:', error);
    return null;
  }
}

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

        // 2.1: Buscar token de acesso de integration_secrets
        const accessToken = await getAccessToken(supabaseAdmin, account.id);

        if (!accessToken) {
          throw new Error(`Token not found for account ${account.account_identifier}`);
        }

        console.log(`✅ Token obtido para ${account.name || account.account_identifier}`);

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
            
            // Se token expirado, pular esta conta
            if (ordersResponse.status === 401) {
              console.log('⚠️ Token expired, skipping account');
              throw new Error('Token expired');
            }
            
            throw new Error(`ML API error: ${ordersResponse.status}`);
          }

          const ordersData = await ordersResponse.json();
          const orders = ordersData.results || [];
          const paging = ordersData.paging || { total: 0 };

          console.log(`✅ Page ${pageCount + 1}: ${orders.length} orders (total: ${paging.total})`);

          if (orders.length === 0) {
            hasMore = false;
          } else {
            allOrders.push(...orders);
            offset += ORDERS_PER_PAGE;
            pageCount++;

            // Verificar se ainda há mais páginas
            if (offset >= paging.total) {
              hasMore = false;
            }
          }
        }

        console.log(`📊 Total orders fetched: ${allOrders.length}`);

        if (allOrders.length === 0) {
          console.log(`ℹ️ No orders with pending shipping for ${account.name || account.account_identifier}`);
          results.accounts_synced++;
          continue;
        }

        // ETAPA 3: Salvar na tabela ml_vendas_comenvio
        const ordersToSave = allOrders.map((order: MLOrder) => {
          const items = order.order_items || [];
          const firstItem = items[0]?.item || {};
          const shipping = order.shipping || {};
          const buyer = order.buyer || {};

          return {
            order_id: String(order.id),
            integration_account_id: account.id,
            organization_id: account.organization_id,
            
            // Status
            status: order.status || 'unknown',
            shipping_status: shipping.status || 'unknown',
            logistic_type: shipping.logistic_type || null,
            
            // Datas
            date_created: order.date_created || new Date().toISOString(),
            date_closed: order.date_closed || null,
            
            // Valores
            total_amount: order.total_amount || 0,
            currency_id: order.currency_id || 'BRL',
            
            // Comprador
            buyer_id: String(buyer.id || ''),
            buyer_nickname: buyer.nickname || null,
            buyer_first_name: buyer.first_name || null,
            buyer_last_name: buyer.last_name || null,
            
            // Envio
            shipping_id: shipping.id ? String(shipping.id) : null,
            
            // Primeiro item (campos principais)
            item_id: firstItem.id || null,
            item_title: firstItem.title || null,
            item_sku: firstItem.seller_sku || null,
            item_quantity: items[0]?.quantity || 0,
            
            // Dados completos
            order_data: order,
            
            // Colunas novas
            account_name: account.name || account.account_identifier || null,
            order_status: order.status || 'unknown',
            payment_status: order.payments?.[0]?.status || 'unknown',
            shipping_deadline: shipping.lead_time?.shipping_deadline || null,
            buyer_name: [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || null,
            shipment_id: shipping.id ? String(shipping.id) : null,
            tracking_number: shipping.tracking_number || null,
            carrier: shipping.carrier_info?.name || null,
            items: items,
            items_count: items.length,
            items_quantity: items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
            
            // Metadados
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        console.log(`💾 Saving ${ordersToSave.length} orders to ml_vendas_comenvio...`);

        // Upsert para evitar duplicatas
        const { data: savedOrders, error: saveError } = await supabaseAdmin
          .from('ml_vendas_comenvio')
          .upsert(ordersToSave, {
            onConflict: 'order_id,integration_account_id',
            ignoreDuplicates: false
          })
          .select('id');

        if (saveError) {
          console.error('❌ Error saving orders:', saveError);
          throw saveError;
        }

        const savedCount = savedOrders?.length || ordersToSave.length;
        console.log(`✅ Saved ${savedCount} orders for ${account.name || account.account_identifier}`);

        // Atualizar resultados
        results.accounts_synced++;
        results.total_orders_fetched += allOrders.length;
        results.total_orders_saved += savedCount;

        const duration = Date.now() - accountStartTime;
        console.log(`✅ [${account.name || account.account_identifier}] Completed in ${duration}ms`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [${account.name || account.account_identifier}] Failed:`, error);
        
        results.accounts_failed++;
        results.errors.push({
          account_id: account.id,
          account_name: account.name || account.account_identifier,
          error: errorMessage
        });
      }
    }

    // ETAPA 4: Limpar pedidos antigos ou já entregues
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Remover pedidos muito antigos
      const { error: cleanupError } = await supabaseAdmin
        .from('ml_vendas_comenvio')
        .delete()
        .lt('date_created', sixtyDaysAgo.toISOString());

      if (cleanupError) {
        console.warn('⚠️ Error cleaning old orders:', cleanupError);
      } else {
        console.log('🧹 Cleaned up old orders (>60 days)');
      }

      // Remover pedidos já entregues/cancelados
      const { error: deliveredError } = await supabaseAdmin
        .from('ml_vendas_comenvio')
        .delete()
        .in('shipping_status', ['delivered', 'cancelled', 'not_delivered']);

      if (deliveredError) {
        console.warn('⚠️ Error cleaning delivered orders:', deliveredError);
      } else {
        console.log('🧹 Cleaned up delivered/cancelled orders');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup failed:', cleanupError);
    }

    // Resultado final
    const totalDuration = Date.now() - startTime;
    
    console.log('\n📊 Final Results:', results);
    console.log(`⏱️ Total duration: ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        duration_ms: totalDuration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [VENDAS-COMENVIO-SYNC] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
