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
    // 1. Obter account_identifier (ML user_id) da conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('account_identifier, organization_id')
      .eq('id', integrationAccountId)
      .single();

    if (accountError || !account) {
      throw new Error(`Conta de integração não encontrada: ${accountError?.message}`);
    }

    logger.info(`ML User ID: ${account.account_identifier}`);

    // 2. Criar registro de sync inicial
    // 2. UPSERT registro de sync (insere se não existe, atualiza se existe)
    const { data: syncRecord, error: syncInsertError } = await supabase
      .from('devolucoes_sync_status')
      .upsert({
        integration_account_id: integrationAccountId,
        last_sync_status: 'in_progress',
        last_sync_at: new Date().toISOString(),
        items_synced: 0,
        items_total: 0,
        items_failed: 0,
        sync_type: 'full'
      }, {
        onConflict: 'integration_account_id,sync_type', // Chave única da constraint
        ignoreDuplicates: false // Atualizar se já existir
      })
      .select()
      .single();

    if (syncInsertError || !syncRecord) {
      throw new Error(`Erro ao criar registro de sync: ${syncInsertError?.message}`);
    }

    syncId = syncRecord.id;
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
          seller_id: account.account_identifier,
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

      // 🔥 CORRIGIDO: Estrutura correta da resposta ml-api-direct
      const claims = apiData.data || []; // ✅ apiData.data contém os claims
      const total = apiData.pagination?.total || 0;
      const hasMoreFromApi = apiData.pagination ? 
        (apiData.pagination.offset + apiData.pagination.limit < apiData.pagination.total) : false;
      
      // 🔥 TRANSFORMAR NOMES DOS CAMPOS: claim_details → dados_claim, order_data → dados_order
      // ✅ ADICIONAR integration_account_id que não vem de ml-api-direct
      const transformedClaims = claims.map((claim: any) => {
        // Criar objeto transformado
        const transformed: any = {
          ...claim,
          // ✅ CRÍTICO: Adicionar integration_account_id (não vem de ml-api-direct!)
          integration_account_id: integrationAccountId,
          // ✅ Transformar nomes dos campos JSONB para match com tabela devolucoes_avancadas
          dados_claim: claim.claim_details || null,
          dados_order: claim.order_data || null,
        };
        
        // ✅ DELETAR campos antigos ao invés de undefined (Supabase não aceita undefined)
        delete transformed.claim_details;
        delete transformed.order_data;
        
        return transformed;
      });
      
      // 🔥 UPSERT DOS DADOS EM devolucoes_avancadas
      if (transformedClaims && transformedClaims.length > 0) {
        logger.info(`💾 Salvando ${transformedClaims.length} claims em devolucoes_avancadas...`);
        
        const { error: upsertError } = await supabase
          .from('devolucoes_avancadas')
          .upsert(transformedClaims, {
            // ✅ CRÍTICO: onConflict aceita COLUNAS separadas por vírgula
            // Corresponde à constraint UNIQUE (order_id, integration_account_id)
            onConflict: 'order_id,integration_account_id',
            ignoreDuplicates: false
          });
        
        if (upsertError) {
          logger.error(`❌ Erro ao salvar claims: ${upsertError.message}`, upsertError);
          throw upsertError;
        }
        
        totalCreated += transformedClaims.length;
        logger.success(`✅ ${transformedClaims.length} claims salvos com sucesso em devolucoes_avancadas`);
      }
      
      totalProcessed += claims.length;
      hasMore = hasMoreFromApi;
      offset += batchSize;

      logger.success(`✅ Lote processado: ${claims.length} claims (Total: ${totalProcessed}/${total})`);

      // Atualizar progresso
      await supabase
        .from('devolucoes_sync_status')
        .update({
          items_synced: totalProcessed,
          items_total: total,
          updated_at: new Date().toISOString()
        })
        .eq('id', syncId);

      // 🔥 Throttling: 500ms entre lotes para evitar rate limit
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 5. Completar sync com sucesso
    const durationMs = Date.now() - startTime;
    await supabase
      .from('devolucoes_sync_status')
      .update({
        last_sync_status: 'success', // ✅ CORRIGIDO: usar valor permitido pelo constraint
        items_synced: totalProcessed,
        items_total: totalProcessed,
        items_failed: 0,
        duration_ms: durationMs,
        updated_at: new Date().toISOString()
      })
      .eq('id', syncId);

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
    // Marcar sync como falhado
    const durationMs = Date.now() - startTime;
    if (syncId) {
      await supabase
        .from('devolucoes_sync_status')
        .update({
          last_sync_status: 'error', // ✅ CORRIGIDO: usar valor permitido pelo constraint
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          duration_ms: durationMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', syncId);
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
