/**
 * 🔄 SYNC-DEVOLUCOES - FASE 2
 * Edge Function para sincronização em background de devoluções do Mercado Livre
 * 
 * Funcionalidades:
 * - Sincronização automática de claims/returns do ML
 * - Processamento em background com throttling
 * - Atualização de status em devolucoes_sync_status
 * - Paginação inteligente
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 Cliente Supabase Admin
function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

// 📊 Logger
const logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️  ${msg}`, data || ''),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string, data?: any) => console.warn(`⚠️  ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`❌ ${msg}`, error || ''),
  section: (title: string) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(60)}\n`);
  }
};

// 🔄 Sincronizar devoluções do Mercado Livre
async function syncDevolucoes(
  integrationAccountId: string,
  supabase: any,
  batchSize: number = 100
) {
  const startTime = Date.now(); // ✅ Rastrear tempo de início
  logger.section('INICIANDO SINCRONIZAÇÃO');
  
  let syncId: string | null = null;
  
  try {
    // 1. Obter seller_id da conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('seller_id, organization_id')
      .eq('id', integrationAccountId)
      .single();

    if (accountError || !account) {
      throw new Error(`Conta de integração não encontrada: ${accountError?.message}`);
    }

    logger.info(`Seller ID: ${account.seller_id}`);

    // 2. Iniciar registro de sync - ✅ CORRIGIDO: usar assinatura correta
    const { data: syncIdData, error: syncError } = await supabase.rpc('start_devolucoes_sync', {
      p_integration_account_id: integrationAccountId
    });

    if (syncError) {
      throw new Error(`Erro ao iniciar sync: ${syncError.message}`);
    }

    syncId = syncIdData;
    logger.success(`Sync iniciado: ${syncId}`);

    // 3. Chamar ml-api-direct para buscar dados
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    let offset = 0;
    let hasMore = true;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    // 4. Processar em lotes
    while (hasMore) {
      logger.info(`📦 Processando lote: offset=${offset}, limit=${batchSize}`);

      // Chamar ml-api-direct
      const apiResponse = await fetch(`${SUPABASE_URL}/functions/v1/ml-api-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'get_claims_and_returns',
          integration_account_id: integrationAccountId,
          seller_id: account.seller_id,
          limit: batchSize,
          offset: offset,
          filters: {
            periodoDias: 90 // Últimos 90 dias
          }
        })
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Erro ao buscar dados da API ML: ${errorText}`);
      }

      const apiData = await apiResponse.json();
      
      if (!apiData.success) {
        throw new Error(`API ML retornou erro: ${apiData.error}`);
      }

      const { claims, total, hasMore: apiHasMore } = apiData;
      
      totalProcessed += claims.length;
      // ml-api-direct retorna info de criados/atualizados
      if (apiData.created) totalCreated += apiData.created;
      if (apiData.updated) totalUpdated += apiData.updated;
      
      hasMore = apiHasMore;
      offset += batchSize;

      logger.success(`✅ Lote processado: ${claims.length} claims (Total: ${totalProcessed}/${total})`);

      // Atualizar progresso
      await supabase
        .from('devolucoes_sync_status')
        .update({
          records_processed: totalProcessed,
          records_total: total,
          updated_at: new Date().toISOString()
        })
        .eq('id', syncId);

      // 🔥 Throttling: 500ms entre lotes para evitar rate limit
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 5. Completar sync com sucesso - ✅ CORRIGIDO: incluir duration_ms
    const durationMs = Date.now() - startTime;
    await supabase.rpc('complete_devolucoes_sync', {
      p_sync_id: syncId,
      p_total_processed: totalProcessed,
      p_total_created: totalCreated,
      p_total_updated: totalUpdated,
      p_duration_ms: durationMs
    });

    logger.section('SINCRONIZAÇÃO CONCLUÍDA');
    logger.success(`Total processado: ${totalProcessed} devoluções`);
    logger.success(`Criados: ${totalCreated} | Atualizados: ${totalUpdated}`);
    logger.success(`Tempo: ${durationMs}ms`);

    return {
      success: true,
      syncId,
      totalProcessed,
      totalCreated,
      totalUpdated,
      durationMs
    };

  } catch (error) {
    // Marcar sync como falhado - ✅ CORRIGIDO: incluir duration_ms
    const durationMs = Date.now() - startTime;
    if (syncId) {
      await supabase.rpc('fail_devolucoes_sync', {
        p_sync_id: syncId,
        p_error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        p_duration_ms: durationMs
      });
    }

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, batch_size } = await req.json();

    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_account_id é obrigatório' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const supabase = makeServiceClient();

    // Executar sincronização
    const result = await syncDevolucoes(
      integration_account_id,
      supabase,
      batch_size || 100
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    logger.error('Erro na sincronização', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
