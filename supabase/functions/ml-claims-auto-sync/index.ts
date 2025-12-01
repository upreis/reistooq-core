/**
 * 🤖 ML CLAIMS AUTO SYNC - Background Job
 * Sincroniza claims/devoluções do Mercado Livre automaticamente em background
 * Chamada via pg_cron a cada 10 minutos
 * 
 * COMBO 2 - FASE B para /devolucoesdevenda
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações
const SYNC_INTERVAL_MINUTES = 10; // Buscar claims dos últimos 10 minutos
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
      total_claims_fetched: 0,
      total_claims_cached: 0,
      errors: [] as any[]
    };

    // ETAPA 2: Processar cada conta
    for (const account of accounts) {
      const accountStartTime = Date.now();
      
      try {
        console.log(`\n🔄 [${account.account_identifier}] Starting claims sync...`);

        // 2.1: Verificar última sync desta conta
        const { data: syncStatus } = await supabaseAdmin
          .from('ml_claims_sync_status')
          .select('last_sync_at')
          .eq('organization_id', account.organization_id)
          .eq('integration_account_id', account.id)
          .single();

        // Calcular período de busca
        let dateFrom: string;
        const dateTo = new Date().toISOString();

        if (syncStatus?.last_sync_at) {
          // Sync incremental: buscar desde última sync
          dateFrom = syncStatus.last_sync_at;
          console.log(`📅 Incremental sync from ${dateFrom}`);
        } else {
          // Primeira sync: buscar últimos 60 dias
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          dateFrom = sixtyDaysAgo.toISOString();
          console.log(`📅 Initial sync - last 60 days from ${dateFrom}`);
        }

        // 2.2: Buscar claims via unified-ml-claims
        console.log(`📡 Calling unified-ml-claims for ${account.account_identifier}...`);
        
        const { data: claimsResponse, error: claimsError } = await supabaseAdmin.functions.invoke(
          'unified-ml-claims',
          {
            body: {
              integration_account_ids: [account.id],
              date_from: dateFrom,
              date_to: dateTo,
              force_refresh: false // Usar cache se disponível
            }
          }
        );

        if (claimsError) {
          throw new Error(`Claims fetch failed: ${claimsError.message}`);
        }

        const claims = claimsResponse?.claims || [];
        const claimsFetched = claims.length;
        
        console.log(`✅ Fetched ${claimsFetched} claims for ${account.account_identifier}`);

        // 2.3: Atualizar ml_claims_sync_status
        const syncDuration = Date.now() - accountStartTime;
        
        const { error: statusError } = await supabaseAdmin
          .from('ml_claims_sync_status')
          .upsert({
            organization_id: account.organization_id,
            integration_account_id: account.id,
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
            claims_fetched: claimsFetched,
            claims_cached: claimsFetched, // unified-ml-claims já cacheia
            sync_duration_ms: syncDuration
          }, {
            onConflict: 'organization_id,integration_account_id'
          });

        if (statusError) {
          console.error('⚠️ Error updating sync status:', statusError);
        }

        // ✅ FASE 3: Limpeza automática de cache expirado após sync de cada conta
        console.log(`🗑️ Cleaning expired cache for organization ${account.organization_id}...`);
        const { data: deletedCache, error: cleanupError } = await supabaseAdmin
          .from('ml_claims_cache')
          .delete()
          .eq('organization_id', account.organization_id)
          .lt('ttl_expires_at', new Date().toISOString())
          .select('claim_id');
        
        if (cleanupError) {
          console.error('⚠️ Failed to clean expired cache:', cleanupError);
        } else if (deletedCache && deletedCache.length > 0) {
          console.log(`✅ Cleaned ${deletedCache.length} expired cache entries`);
        }

        // Atualizar resultados
        results.accounts_synced++;
        results.total_claims_fetched += claimsFetched;
        results.total_claims_cached += claimsFetched;

        console.log(`✅ [${account.account_identifier}] Sync completed in ${syncDuration}ms`);

      } catch (accountError) {
        console.error(`❌ [${account.account_identifier}] Sync failed:`, accountError);
        
        // Registrar erro no ml_claims_sync_status
        await supabaseAdmin
          .from('ml_claims_sync_status')
          .upsert({
            organization_id: account.organization_id,
            integration_account_id: account.id,
            last_sync_status: 'error',
            last_sync_error: accountError instanceof Error ? accountError.message : String(accountError),
            sync_duration_ms: Date.now() - accountStartTime
          }, {
            onConflict: 'organization_id,integration_account_id'
          });

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
