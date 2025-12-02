/**
 * 🤖 ML CLAIMS AUTO SYNC - Background Job
 * Sincroniza claims/devoluções do Mercado Livre automaticamente em background
 * 
 * ✅ CORREÇÃO EGRESS (Dez 2024):
 * - Frequência reduzida: CRON executa a cada 1 HORA (não 10 min)
 * - Reduz egress de ~4.5GB/dia para ~0.75GB/dia (6x menos)
 * 
 * COMBO 2 - FASE B para /devolucoesdevenda
 * 
 * ✅ SIMPLIFICAÇÃO FASE 1: 
 * - Removida tabela redundante ml_claims_sync_status
 * - Status de sync agora está direto em integration_accounts
 * - 40% menos complexidade, zero funcionalidade perdida
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const SYNC_INTERVAL_MINUTES = 60; // ✅ CORREÇÃO EGRESS: Buscar claims da última 1 HORA (não 10min)
const MAX_ACCOUNTS_PER_RUN = 20; // Limitar para não estourar tempo

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('🤖 [AUTO-SYNC CLAIMS] Starting background sync...');

    // Service client para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar extensões necessárias (pg_cron, pg_net)
    try {
      const { data: extensions, error: extError } = await supabaseAdmin
        .from('pg_extension')
        .select('extname')
        .in('extname', ['pg_cron', 'pg_net']);

      if (extError) {
        console.warn('⚠️ Could not verify extensions:', extError.message);
      } else if (extensions && extensions.length < 2) {
        console.error('❌ Required extensions (pg_cron, pg_net) not enabled');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Required Postgres extensions (pg_cron, pg_net) not enabled' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      } else {
        console.log('✅ Extensions verified: pg_cron, pg_net');
      }
    } catch (extCheckError) {
      console.warn('⚠️ Extension check failed:', extCheckError);
    }

    // ETAPA 1: Buscar todas as contas ativas do Mercado Livre com dados de sync
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('integration_accounts')
      .select('id, organization_id, account_identifier, is_active, last_claims_sync_at, last_sync_status')
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
      total_claims_fetched: 0,
      total_claims_cached: 0,
      errors: [] as any[]
    };

    // ETAPA 2: Processar cada conta
    for (const account of accounts) {
      const accountStartTime = Date.now();
      
      try {
        console.log(`\n🔄 [${account.account_identifier}] Starting claims sync...`);

        // 2.1: Última sync já está na própria conta
        const lastSyncAt = account.last_claims_sync_at;

        // Calcular período de busca
        let dateFrom: string;
        const dateTo = new Date().toISOString();

        if (lastSyncAt) {
          // Sync incremental: buscar desde última sync
          dateFrom = lastSyncAt;
          console.log(`📅 Incremental sync from ${dateFrom}`);
        } else {
          // Primeira sync: buscar últimos 60 dias
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          dateFrom = sixtyDaysAgo.toISOString();
          console.log(`📅 Initial sync - last 60 days from ${dateFrom}`);
        }

        // 2.2: Buscar claims via get-devolucoes-direct (UNIFIED)
        console.log(`📡 Calling get-devolucoes-direct for ${account.account_identifier}...`);
        
        const { data: claimsResponse, error: claimsError } = await supabaseAdmin.functions.invoke(
          'get-devolucoes-direct',
          {
            body: {
              integration_account_ids: [account.id],
              date_from: dateFrom,
              date_to: dateTo,
              force_refresh: true // Force refresh para garantir dados atualizados
            }
          }
        );

        if (claimsError) {
          throw new Error(`Claims fetch failed: ${claimsError.message}`);
        }

        const claims = claimsResponse?.data || [];
        const claimsFetched = claims.length;
        
        console.log(`✅ Fetched ${claimsFetched} claims for ${account.account_identifier}`);

        // 2.3: Atualizar integration_accounts com status da sync
        const syncDuration = Date.now() - accountStartTime;
        
        const { error: statusError } = await supabaseAdmin
          .from('integration_accounts')
          .update({
            last_claims_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
            claims_fetched: claimsFetched,
            claims_cached: claimsFetched, // get-devolucoes-direct já cacheia
            sync_duration_ms: syncDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        if (statusError) {
          console.error('⚠️ Error updating account sync status:', statusError);
        }

        // Atualizar resultados
        results.accounts_synced++;
        results.total_claims_fetched += claimsFetched;
        results.total_claims_cached += claimsFetched;

        console.log(`✅ [${account.account_identifier}] Sync completed in ${syncDuration}ms`);

      } catch (accountError) {
        console.error(`❌ [${account.account_identifier}] Sync failed:`, accountError);
        
        // Registrar erro na integration_accounts
        await supabaseAdmin
          .from('integration_accounts')
          .update({
            last_sync_status: 'error',
            last_sync_error: accountError instanceof Error ? accountError.message : String(accountError),
            sync_duration_ms: Date.now() - accountStartTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        results.accounts_failed++;
        results.errors.push({
          account_id: account.id,
          account_identifier: account.account_identifier,
          error: accountError instanceof Error ? accountError.message : String(accountError)
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ [AUTO-SYNC CLAIMS] Completed in ${totalDuration}ms`);
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
    console.error('❌ [AUTO-SYNC CLAIMS] Fatal error:', error);
    
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
