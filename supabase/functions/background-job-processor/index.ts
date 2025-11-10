/**
 * 🔄 BACKGROUND JOB PROCESSOR - FASE 6
 * Edge function para processar jobs em background usando EdgeRuntime.waitUntil()
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos
interface BackgroundJob {
  id: string;
  job_type: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action } = await req.json();

    if (action === 'process_next') {
      // Buscar próximo job pendente
      const { data: jobs, error: fetchError } = await supabase
        .rpc('get_next_background_job');

      if (fetchError) {
        console.error('❌ Erro ao buscar job:', fetchError);
        throw fetchError;
      }

      if (!jobs || jobs.length === 0) {
        return new Response(
          JSON.stringify({ message: 'Nenhum job pendente', processed: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const job: BackgroundJob = jobs[0];
      console.log(`🔄 Processando job ${job.id} - Tipo: ${job.job_type}`);

      // 🎯 BACKGROUND PROCESSING: Processar job de forma assíncrona
      // EdgeRuntime.waitUntil garante que o job continue rodando após retornar response
      EdgeRuntime.waitUntil(
        processJobInBackground(job, supabase)
      );

      // Retornar resposta imediata (job continua processando em background)
      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          jobType: job.job_type,
          message: 'Job iniciado em background',
          processed: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'process_all') {
      // Processar múltiplos jobs (útil para cron)
      const processed: string[] = [];
      let hasMore = true;

      while (hasMore && processed.length < 10) { // Limite de 10 jobs por chamada
        const { data: jobs, error: fetchError } = await supabase
          .rpc('get_next_background_job');

        if (fetchError || !jobs || jobs.length === 0) {
          hasMore = false;
          break;
        }

        const job: BackgroundJob = jobs[0];
        processed.push(job.id);

        // Processar em background
        EdgeRuntime.waitUntil(
          processJobInBackground(job, supabase)
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          processedCount: processed.length,
          jobIds: processed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro no processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Processa um job específico em background
 */
async function processJobInBackground(job: BackgroundJob, supabase: any) {
  const startTime = Date.now();
  console.log(`🚀 [Background] Iniciando job ${job.id} - ${job.job_type}`);

  try {
    // Executar job baseado no tipo
    switch (job.job_type) {
      case 'enrich_devolucao':
        await enrichDevolucao(job, supabase);
        break;
      case 'enrich_order':
        await enrichOrder(job, supabase);
        break;
      case 'refresh_metrics':
        await refreshMetrics(supabase);
        break;
      case 'cleanup_old_data':
        await cleanupOldData(supabase);
        break;
      default:
        throw new Error(`Tipo de job desconhecido: ${job.job_type}`);
    }

    // Marcar como completo
    await supabase.rpc('complete_background_job', {
      p_job_id: job.id,
      p_success: true,
      p_error_message: null,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [Background] Job ${job.id} completo em ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Background] Job ${job.id} falhou após ${duration}ms:`, error);

    // Marcar como falho
    await supabase.rpc('complete_background_job', {
      p_job_id: job.id,
      p_success: false,
      p_error_message: error.message,
    });
  }
}

/**
 * Enriquece dados de uma devolução
 */
async function enrichDevolucao(job: BackgroundJob, supabase: any) {
  console.log(`📦 Enriquecendo devolução ${job.resource_id}`);
  
  // Aqui você chamaria a API do ML para enriquecer os dados
  // Por enquanto, apenas simulação
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`✓ Devolução ${job.resource_id} enriquecida`);
}

/**
 * Enriquece dados de um pedido
 */
async function enrichOrder(job: BackgroundJob, supabase: any) {
  console.log(`📋 Enriquecendo pedido ${job.resource_id}`);
  
  // Simulação de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`✓ Pedido ${job.resource_id} enriquecido`);
}

/**
 * Atualiza cache de métricas
 */
async function refreshMetrics(supabase: any) {
  console.log('📊 Atualizando cache de métricas...');
  
  const { error } = await supabase.rpc('refresh_devolucoes_metrics');
  
  if (error) throw error;
  
  console.log('✓ Cache de métricas atualizado');
}

/**
 * Limpa dados antigos
 */
async function cleanupOldData(supabase: any) {
  console.log('🧹 Limpando dados antigos...');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Limpar jobs completados antigos
  const { error } = await supabase
    .from('background_jobs')
    .delete()
    .eq('status', 'completed')
    .lt('completed_at', sevenDaysAgo.toISOString());

  if (error) throw error;
  
  console.log('✓ Limpeza concluída');
}

// Shutdown handler
addEventListener('beforeunload', (ev: any) => {
  console.log('⚠️ Function shutdown:', ev.detail?.reason);
  // Aqui você poderia salvar estado de jobs em progresso
});
