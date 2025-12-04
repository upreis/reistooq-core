/**
 * 🤖 ML ORDERS AUTO SYNC - Background Job
 * Sincroniza pedidos do Mercado Livre automaticamente em background
 * 
 * COMBO 2.1 - Para /vendas-canceladas
 * 
 * ✅ CONFIGURAÇÃO:
 * - CRON executa a cada 1 HORA (conservador para evitar egress excessivo)
 * - Sincroniza TODOS os pedidos dos últimos 60 dias com PAGINAÇÃO COMPLETA
 * - Salva em ml_orders para frontend consumir instantaneamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const MAX_ACCOUNTS_PER_RUN = 20;
const DAYS_TO_SYNC = 60; // Sincronizar últimos 60 dias
const ML_API_LIMIT = 50; // ML retorna máx 50 por request
const MAX_PAGES_PER_ACCOUNT = 100; // Máx 5000 pedidos por conta (100 * 50)

/**
 * Extrai campos estruturados do order_data para ml_orders
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('🤖 [AUTO-SYNC ORDERS] Starting background sync...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ETAPA 1: Buscar todas as contas ativas do Mercado Livre
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('integration_accounts')
      .select('id, organization_id, account_identifier, account_name, is_active, access_token, refresh_token, user_id')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .limit(MAX_ACCOUNTS_PER_RUN);

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      throw accountsError;
    }

    console.log(`📋 Found ${accounts?.length || 0} active ML accounts`);

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

    // Resultados da sync
    const results = {
      total_accounts: accounts.length,
      accounts_synced: 0,
      accounts_failed: 0,
      total_orders_fetched: 0,
      total_orders_saved: 0,
      errors: [] as any[]
    };

    // Calcular período de busca (últimos 60 dias)
    const dateTo = new Date().toISOString();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - DAYS_TO_SYNC);
    const dateFromISO = dateFrom.toISOString();

    console.log(`📅 Sync period: ${dateFromISO} to ${dateTo}`);

    // ETAPA 2: Processar cada conta COM PAGINAÇÃO COMPLETA
    for (const account of accounts) {
      const accountStartTime = Date.now();
      let accountOrders: any[] = [];
      let currentAccessToken = account.access_token;
      
      try {
        const accountName = account.account_name || account.account_identifier;
        console.log(`\n🔄 [${accountName}] Starting orders sync...`);

        if (!currentAccessToken) {
          throw new Error('No access token available');
        }

        if (!account.user_id) {
          throw new Error('No ML user_id available');
        }

        // Buscar TODOS os pedidos com paginação
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < MAX_PAGES_PER_ACCOUNT) {
          pageCount++;
          console.log(`📡 [${accountName}] Fetching page ${pageCount} (offset=${offset})...`);

          // Chamar API do ML diretamente com paginação
          const mlUrl = `https://api.mercadolibre.com/orders/search?seller=${account.user_id}&order.date_created.from=${encodeURIComponent(dateFromISO)}&order.date_created.to=${encodeURIComponent(dateTo)}&limit=${ML_API_LIMIT}&offset=${offset}&sort=date_desc`;
          
          let mlResponse = await fetch(mlUrl, {
            headers: {
              'Authorization': `Bearer ${currentAccessToken}`,
              'Content-Type': 'application/json'
            }
          });

          // Se token expirado, tentar refresh
          if (mlResponse.status === 401) {
            console.log(`🔄 [${accountName}] Token expired, attempting refresh...`);
            
            const { error: refreshError } = await supabaseAdmin.functions.invoke('mercadolibre-token-refresh', {
              body: { integration_account_id: account.id }
            });

            if (refreshError) {
              throw new Error(`Token refresh failed: ${refreshError.message}`);
            }

            // Buscar token atualizado
            const { data: refreshedAccount } = await supabaseAdmin
              .from('integration_accounts')
              .select('access_token')
              .eq('id', account.id)
              .single();

            if (!refreshedAccount?.access_token) {
              throw new Error('Failed to get refreshed token');
            }

            currentAccessToken = refreshedAccount.access_token;
            
            // Retry com novo token
            mlResponse = await fetch(mlUrl, {
              headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
                'Content-Type': 'application/json'
              }
            });
          }

          if (!mlResponse.ok) {
            const errorText = await mlResponse.text();
            throw new Error(`ML API error: ${mlResponse.status} - ${errorText}`);
          }

          const mlData = await mlResponse.json();
          const pageOrders = mlData.results || [];
          accountOrders.push(...pageOrders);

          console.log(`✅ [${accountName}] Page ${pageCount}: ${pageOrders.length} orders (total: ${accountOrders.length})`);

          // Verificar se há mais páginas
          const total = mlData.paging?.total || 0;
          offset += ML_API_LIMIT;
          hasMore = offset < total && pageOrders.length === ML_API_LIMIT;

          // Pequeno delay entre requests para não sobrecarregar API
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`📦 [${accountName}] Total orders fetched: ${accountOrders.length}`);
        results.total_orders_fetched += accountOrders.length;

        // ETAPA 3: Salvar no banco de dados (upsert em batches)
        if (accountOrders.length > 0) {
          const batchSize = 100;
          let savedCount = 0;

          for (let i = 0; i < accountOrders.length; i += batchSize) {
            const batch = accountOrders.slice(i, i + batchSize);
            const entries = batch.map(order => 
              extractOrderFields(order, account.id, account.organization_id)
            );

            const { error: upsertError } = await supabaseAdmin
              .from('ml_orders')
              .upsert(entries, {
                onConflict: 'organization_id,integration_account_id,ml_order_id',
                ignoreDuplicates: false
              });

            if (upsertError) {
              console.error(`❌ [${accountName}] Batch upsert error:`, upsertError);
            } else {
              savedCount += batch.length;
            }
          }

          console.log(`💾 [${accountName}] Saved ${savedCount} orders to ml_orders`);
          results.total_orders_saved += savedCount;
        }

        // Atualizar status da conta (usando integration_accounts como source of truth)
        const syncDuration = Date.now() - accountStartTime;
        await supabaseAdmin
          .from('integration_accounts')
          .update({
            last_orders_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
            orders_fetched: accountOrders.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        results.accounts_synced++;
        console.log(`✅ [${accountName}] Sync completed in ${syncDuration}ms`);

      } catch (accountError) {
        const accountName = account.account_name || account.account_identifier;
        console.error(`❌ [${accountName}] Sync failed:`, accountError);
        
        await supabaseAdmin
          .from('integration_accounts')
          .update({
            last_sync_status: 'error',
            last_sync_error: accountError instanceof Error ? accountError.message : String(accountError),
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        results.accounts_failed++;
        results.errors.push({
          account_id: account.id,
          account_name: accountName,
          error: accountError instanceof Error ? accountError.message : String(accountError)
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ [AUTO-SYNC ORDERS] Completed in ${totalDuration}ms`);
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
    console.error('❌ [AUTO-SYNC ORDERS] Fatal error:', error);
    
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
