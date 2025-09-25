import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Iniciando cálculo de métricas para devoluções...')

    // Buscar todas as devoluções que precisam de métricas calculadas
    const { data: devolucoes, error: fetchError } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .is('tempo_primeira_resposta_vendedor', null)
      .limit(50)

    if (fetchError) {
      console.error('❌ Erro ao buscar devoluções:', fetchError)
      throw fetchError
    }

    console.log(`📊 Processando ${devolucoes?.length || 0} devoluções para calcular métricas...`)

    const updates = []

    for (const devolucao of devolucoes || []) {
      const metrics = calculateMetrics(devolucao)
      
      if (Object.keys(metrics).length > 0) {
        updates.push({
          id: devolucao.id,
          ...metrics
        })
      }
    }

    // Fazer bulk update
    if (updates.length > 0) {
      console.log(`💾 Atualizando ${updates.length} devoluções com métricas calculadas...`)
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(update)
          .eq('id', update.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar devolução ${update.id}:`, updateError)
        }
      }
    }

    console.log(`✅ Processamento concluído: ${updates.length} devoluções atualizadas`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: devolucoes?.length || 0,
        updated: updates.length,
        message: 'Métricas calculadas e atualizadas com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function calculateMetrics(devolucao: any) {
  const metrics: any = {}

  try {
    // 1. CÁLCULOS TEMPORAIS
    const dataCreation = devolucao.data_criacao ? new Date(devolucao.data_criacao) : null
    const dataUpdate = devolucao.updated_at ? new Date(devolucao.updated_at) : null
    const ultimaMensagem = devolucao.ultima_mensagem_data ? new Date(devolucao.ultima_mensagem_data) : null

    // Tempo primeira resposta (simular baseado em dados existentes)
    if (dataCreation && ultimaMensagem) {
      const diffMinutes = Math.floor((ultimaMensagem.getTime() - dataCreation.getTime()) / (1000 * 60))
      if (diffMinutes > 0 && diffMinutes < 10080) { // máximo 7 dias
        metrics.tempo_primeira_resposta_vendedor = diffMinutes
      }
    }

    // Tempo total de resolução
    if (dataCreation && dataUpdate) {
      const diffHours = Math.floor((dataUpdate.getTime() - dataCreation.getTime()) / (1000 * 60 * 60))
      if (diffHours > 0) {
        metrics.tempo_total_resolucao = diffHours
        metrics.dias_ate_resolucao = Math.ceil(diffHours / 24)
      }
    }

    // SLA (considerar SLA cumprido se resolvido em menos de 72h)
    if (metrics.tempo_total_resolucao) {
      metrics.sla_cumprido = metrics.tempo_total_resolucao <= 72
    }

    // Eficiência de resolução
    if (metrics.tempo_total_resolucao) {
      if (metrics.tempo_total_resolucao <= 24) {
        metrics.eficiencia_resolucao = 'excelente'
      } else if (metrics.tempo_total_resolucao <= 48) {
        metrics.eficiencia_resolucao = 'boa'
      } else if (metrics.tempo_total_resolucao <= 72) {
        metrics.eficiencia_resolucao = 'regular'
      } else {
        metrics.eficiencia_resolucao = 'ruim'
      }
    }

    // 2. CÁLCULOS FINANCEIROS
    const dadosOrder = devolucao.dados_order
    const dadosPayment = dadosOrder?.payments?.[0]

    if (dadosPayment) {
      // Valor total reembolsado
      if (dadosPayment.transaction_amount_refunded) {
        metrics.valor_reembolso_total = dadosPayment.transaction_amount_refunded
      }

      // Valor reembolso produto (mesma coisa que total na maioria dos casos)
      if (dadosPayment.transaction_amount) {
        metrics.valor_reembolso_produto = dadosPayment.transaction_amount
      }

      // Valor reembolso frete
      if (dadosPayment.shipping_cost) {
        metrics.valor_reembolso_frete = dadosPayment.shipping_cost
      }

      // Taxa ML
      if (dadosPayment.marketplace_fee) {
        metrics.taxa_ml_reembolso = dadosPayment.marketplace_fee
      }

      // Data de processamento do reembolso
      if (dadosPayment.date_last_modified) {
        metrics.data_processamento_reembolso = dadosPayment.date_last_modified
      }
    }

    // Custo logístico total (estimativa baseada em shipping_cost)
    if (dadosOrder?.shipping_cost) {
      metrics.custo_logistico_total = dadosOrder.shipping_cost
    }

    // Impacto financeiro vendedor (soma de taxa ML + custos)
    if (metrics.taxa_ml_reembolso || metrics.custo_logistico_total) {
      metrics.impacto_financeiro_vendedor = 
        (metrics.taxa_ml_reembolso || 0) + (metrics.custo_logistico_total || 0)
    }

    // 3. SCORE DE QUALIDADE
    let qualityScore = 100

    // Reduzir score baseado em tempo de resolução
    if (metrics.tempo_total_resolucao) {
      if (metrics.tempo_total_resolucao > 72) qualityScore -= 30
      else if (metrics.tempo_total_resolucao > 48) qualityScore -= 20
      else if (metrics.tempo_total_resolucao > 24) qualityScore -= 10
    }

    // Reduzir score se tem muitas mensagens não lidas
    if (devolucao.mensagens_nao_lidas > 5) qualityScore -= 20
    else if (devolucao.mensagens_nao_lidas > 2) qualityScore -= 10

    // Reduzir score se está escalado para ML
    if (devolucao.escalado_para_ml) qualityScore -= 15

    // Reduzir score se requer ação do seller
    if (devolucao.acao_seller_necessaria) qualityScore -= 10

    metrics.score_qualidade = Math.max(0, qualityScore)

    console.log(`📊 Métricas calculadas para devolução ${devolucao.order_id}:`, 
      Object.keys(metrics).length, 'campos')

  } catch (error) {
    console.error(`❌ Erro ao calcular métricas para devolução ${devolucao.id}:`, error)
  }

  return metrics
}