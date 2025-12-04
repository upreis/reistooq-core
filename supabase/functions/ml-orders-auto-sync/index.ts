/**
 * 🤖 ML ORDERS AUTO SYNC - Background Job
 * Sincroniza pedidos do Mercado Livre automaticamente em background
 * 
 * COMBO 2.1 - Para /vendas-canceladas
 * 
 * ✅ CONFIGURAÇÃO:
 * - CRON executa a cada 1 HORA
 * - Chama unified-ml-orders que faz paginação e autenticação
 * - Salva em ml_orders para frontend consumir instantaneamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const MAX_ACCOUNTS_PER_RUN = 20;
const DAYS_TO_SYNC = 60;

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
      .select('id, organization_id, account_identifier, is_active')
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

    // ETAPA 2: Processar cada conta via unified-ml-orders
    for (const account of accounts) {
      const accountStartTime = Date.now();
      
      try {
        const accountName = account.account_identifier;
        console.log(`\n🔄 [${accountName}] Starting orders sync via unified-ml-orders...`);

        // Chamar unified-ml-orders passando organization_id diretamente (sem JWT)
        const { data: ordersResponse, error: ordersError } = await supabaseAdmin.functions.invoke(
          'unified-ml-orders',
          {
            body: {
              organization_id: account.organization_id, // Passar org_id diretamente
              integration_account_ids: [account.id],
              date_from: dateFromISO,
              date_to: dateTo,
              force_refresh: true // Forçar refresh para garantir dados atualizados
            }
          }
        );

        if (ordersError) {
          throw new Error(`unified-ml-orders failed: ${ordersError.message}`);
        }

        const orders = ordersResponse?.orders || [];
        const ordersFetched = orders.length;
        
        console.log(`✅ [${accountName}] Fetched ${ordersFetched} orders`);
        results.total_orders_fetched += ordersFetched;
        results.total_orders_saved += ordersFetched; // unified-ml-orders já salva em ml_orders

        // Atualizar status da conta
        const syncDuration = Date.now() - accountStartTime;
        await supabaseAdmin
          .from('integration_accounts')
          .update({
            last_orders_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
            orders_fetched: ordersFetched,
            sync_duration_ms: syncDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        results.accounts_synced++;
        console.log(`✅ [${accountName}] Sync completed in ${syncDuration}ms`);

      } catch (accountError) {
        const accountName = account.account_identifier;
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
