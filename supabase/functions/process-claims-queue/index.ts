/**
 * 🔄 PROCESS CLAIMS QUEUE - CRON JOB
 * Processa fila de claims pendentes e popula ml_claims cache
 * Chamado pelo pg_cron a cada minuto
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueItem {
  id: string;
  claim_id: string; // ✅ STRING não number
  integration_account_id: string;
  claim_data: any; // ✅ JSONB
  status: string;
  tentativas: number;
  criado_em: string;
  atualizado_em: string | null;
  processado_em: string | null;
  erro_mensagem: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🔄 [Process Claims Queue] Starting queue processing...');

  try {
    // Inicializar Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 📋 BUSCAR CLAIMS PENDENTES NA FILA (máximo 50 por execução)
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from('fila_processamento_claims')
      .select('*')
      .eq('status', 'pending')
      .lt('tentativas', 3) // Máximo 3 tentativas
      .order('prioridade', { ascending: false }) // Alta prioridade primeiro
      .order('created_at', { ascending: true }) // Mais antigos primeiro
      .limit(50);

    if (queueError) {
      console.error('❌ Error fetching queue:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ Queue is empty - nothing to process');
      return new Response(JSON.stringify({
        success: true,
        message: 'Queue is empty',
        processed: 0,
        duration_ms: Date.now() - startTime
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Found ${queueItems.length} claims in queue to process`);

    // 🔄 PROCESSAR CADA CLAIM NA FILA
    let processedCount = 0;
    let failedCount = 0;

    for (const item of queueItems as QueueItem[]) {
      console.log(`\n🔍 Processing claim ${item.claim_id} (attempt ${item.tentativas + 1}/3)`);

      try {
        // ✅ Buscar organization_id do integration_account
        const { data: accountData, error: accountError } = await supabaseAdmin
          .from('integration_accounts')
          .select('organization_id')
          .eq('id', item.integration_account_id)
          .single();

        if (accountError || !accountData) {
          throw new Error(`Failed to fetch organization_id: ${accountError?.message}`);
        }

        const organizationId = accountData.organization_id;

        // Marcar como processing
        await supabaseAdmin
          .from('fila_processamento_claims')
          .update({
            status: 'processing',
            tentativas: item.tentativas + 1,
            atualizado_em: new Date().toISOString() // ✅ atualizado_em não updated_at
          })
          .eq('id', item.id);

        // 🌐 BUSCAR DADOS DO CLAIM DIRETAMENTE DE get-devolucoes-direct
        console.log(`📡 Calling get-devolucoes-direct for claim ${item.claim_id}...`);
        
        const { data: claimData, error: claimError } = await supabaseAdmin.functions.invoke(
          'get-devolucoes-direct',
          {
            body: {
              integration_account_id: item.integration_account_id,
              filter_claim_id: item.claim_id // ✅ Novo parâmetro para filtro
            }
          }
        );

        if (claimError || !claimData?.success) {
          throw new Error(claimError?.message || claimData?.error || 'Failed to fetch claim data');
        }

        const devolucoes = claimData.devolucoes || [];
        
        // Filtrar manualmente se get-devolucoes-direct retornou múltiplos
        const claimFound = devolucoes.find((d: any) => 
          d.claim_id === item.claim_id || 
          d.claim_id?.toString() === item.claim_id?.toString()
        );

        if (!claimFound) {
          throw new Error(`Claim ${item.claim_id} not found in response (got ${devolucoes.length} items)`);
        }

        console.log(`✅ Claim ${item.claim_id} fetched successfully with enriched data`);

        // 💾 SALVAR NO CACHE ml_claims (UPSERT) com organization_id correto
        const { error: cacheError } = await supabaseAdmin
          .from('ml_claims')
          .upsert({
            organization_id: organizationId, // ✅ organization_id buscado
            integration_account_id: item.integration_account_id,
            claim_id: item.claim_id,
            order_id: claimFound.order_id || '',
            return_id: claimFound.return_id?.toString() || null,
            status: claimFound.status_devolucao || claimFound.status || null,
            stage: claimFound.claim_stage || null,
            reason_id: claimFound.reason_id || null,
            date_created: claimFound.data_criacao || claimFound.date_created || null,
            date_closed: claimFound.data_fechamento_devolucao || claimFound.date_closed || null,
            last_updated: claimFound.ultima_atualizacao_real || claimFound.last_updated || null,
            total_amount: parseFloat(claimFound.valor_original_produto || 0),
            refund_amount: parseFloat(claimFound.valor_reembolso || 0),
            currency_id: claimFound.moeda_reembolso || 'BRL',
            buyer_id: null, // ✅ buyer_id number não string - deixar null por ora
            buyer_nickname: claimFound.comprador_nickname || null,
            claim_data: claimFound, // Dados completos ENRIQUECIDOS
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'claim_id,integration_account_id'
          });

        if (cacheError) {
          throw new Error(`Failed to save to ml_claims: ${cacheError.message}`);
        }

        console.log(`✅ Claim ${item.claim_id} cached in ml_claims with enriched data`);

        // Marcar como completed
        await supabaseAdmin
          .from('fila_processamento_claims')
          .update({
            status: 'completed',
            processado_em: new Date().toISOString(), // ✅ processado_em não processed_at
            atualizado_em: new Date().toISOString() // ✅ atualizado_em não updated_at
          })
          .eq('id', item.id);

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing claim ${item.claim_id}:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Se atingiu máximo de tentativas, marcar como failed
        if (item.tentativas + 1 >= 3) {
          await supabaseAdmin
            .from('fila_processamento_claims')
            .update({
              status: 'failed',
              erro_mensagem: errorMessage, // ✅ erro_mensagem não erro_detalhes
              atualizado_em: new Date().toISOString() // ✅ atualizado_em não updated_at
            })
            .eq('id', item.id);

          console.log(`⚠️ Claim ${item.claim_id} marked as failed after 3 attempts`);
        } else {
          // Voltar para pending para retry
          await supabaseAdmin
            .from('fila_processamento_claims')
            .update({
              status: 'pending',
              erro_mensagem: errorMessage, // ✅ erro_mensagem não erro_detalhes
              atualizado_em: new Date().toISOString() // ✅ atualizado_em não updated_at
            })
            .eq('id', item.id);

          console.log(`🔄 Claim ${item.claim_id} returned to queue for retry`);
        }

        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Queue processing completed: ${processedCount} processed, ${failedCount} failed in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Queue processed successfully',
      processed: processedCount,
      failed: failedCount,
      duration_ms: duration
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Process Claims Queue] Fatal error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
