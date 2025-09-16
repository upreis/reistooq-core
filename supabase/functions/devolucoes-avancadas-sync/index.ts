// 🚀 EDGE FUNCTION: SINCRONIZAÇÃO AVANÇADA DE DEVOLUÇÕES ML
// FASE 2: ENDPOINTS E INTEGRAÇÃO - 42 Novas Colunas
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`🔄 Ação solicitada: ${action}`, params);

    switch (action) {
      case 'enrich_existing_data':
        return await enrichExistingData(params);
      case 'sync_advanced_fields':
        return await syncAdvancedFields(params);
      case 'fetch_advanced_metrics':
        return await fetchAdvancedMetrics(params);
      case 'update_phase2_columns':
        return await updatePhase2Columns(params);
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 📊 FUNÇÃO: ENRIQUECER DADOS EXISTENTES COM AS 42 NOVAS COLUNAS
async function enrichExistingData(params: any) {
  const { integration_account_id, limit = 50 } = params;
  
  console.log(`🔍 Enriquecendo dados existentes para conta: ${integration_account_id}`);
  
  try {
    // 1. Buscar devoluções existentes que precisam de enriquecimento
    const { data: devolucoes, error: selectError } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .eq('integration_account_id', integration_account_id)
      .is('timeline_mensagens', null) // Buscar apenas registros não enriquecidos
      .limit(limit);

    if (selectError) {
      throw new Error(`Erro ao buscar devoluções: ${selectError.message}`);
    }

    if (!devolucoes || devolucoes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma devolução encontrada para enriquecimento',
          enriched_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let enrichedCount = 0;
    const updates = [];

    // 2. Processar cada devolução
    for (const devolucao of devolucoes) {
      try {
        const enrichedData = await processAdvancedEnrichment(devolucao);
        
        if (enrichedData) {
          updates.push({
            id: devolucao.id,
            ...enrichedData
          });
          enrichedCount++;
        }
      } catch (enrichError) {
        console.warn(`⚠️ Erro ao enriquecer devolução ${devolucao.id}:`, enrichError);
      }
    }

    // 3. Atualizar em batch
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) {
        throw new Error(`Erro ao atualizar devoluções: ${updateError.message}`);
      }
    }

    console.log(`✅ ${enrichedCount} devoluções enriquecidas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enriched_count: enrichedCount,
        processed_count: devolucoes.length,
        message: `${enrichedCount} devoluções enriquecidas com as 42 novas colunas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no enriquecimento:', error);
    throw error;
  }
}

// 🔄 FUNÇÃO: PROCESSAR ENRIQUECIMENTO AVANÇADO
async function processAdvancedEnrichment(devolucao: any) {
  const dados_claim = devolucao.dados_claim || {};
  const dados_order = devolucao.dados_order || {};
  const dados_mensagens = devolucao.dados_mensagens || {};
  const dados_return = devolucao.dados_return || {};

  // 📨 MENSAGENS E COMUNICAÇÃO (6 colunas)
  const timeline_mensagens = extractTimelineMensagens(dados_mensagens, dados_claim);
  const mensagens_info = extractMensagensInfo(dados_mensagens);
  
  // 📅 DATAS E PRAZOS (5 colunas)
  const datas_info = extractDatesInfo(dados_claim, dados_order, dados_return);
  
  // 📦 RASTREAMENTO E LOGÍSTICA (4 colunas)
  const tracking_info = extractTrackingInfo(dados_order, dados_return);
  
  // 💰 CUSTOS E FINANCEIRO (4 colunas)
  const financial_info = extractFinancialInfo(dados_claim, dados_order, dados_return);
  
  // 🏷️ CLASSIFICAÇÃO E RESOLUÇÃO (5 colunas)
  const classification_info = extractClassificationInfo(dados_claim, dados_order);
  
  // 📊 MÉTRICAS E KPIS (4 colunas)
  const metrics_info = extractMetricsInfo(dados_claim, dados_mensagens, timeline_mensagens);
  
  // 🚩 ESTADOS E FLAGS (3 colunas)
  const flags_info = extractFlagsInfo(dados_claim, dados_order, dados_return);

  // Calcular dias restantes automaticamente
  const dias_restantes = datas_info.data_vencimento_acao 
    ? Math.ceil((new Date(datas_info.data_vencimento_acao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    // 📨 MENSAGENS E COMUNICAÇÃO
    timeline_mensagens,
    ultima_mensagem_data: mensagens_info.ultima_mensagem_data,
    ultima_mensagem_remetente: mensagens_info.ultima_mensagem_remetente,
    mensagens_nao_lidas: mensagens_info.mensagens_nao_lidas,
    numero_interacoes: mensagens_info.numero_interacoes,
    anexos_count: mensagens_info.anexos_count,
    anexos_comprador: mensagens_info.anexos_comprador,
    anexos_vendedor: mensagens_info.anexos_vendedor,
    anexos_ml: mensagens_info.anexos_ml,
    
    // 📅 DATAS E PRAZOS
    data_inicio_mediacao: datas_info.data_inicio_mediacao,
    data_primeira_acao: datas_info.data_primeira_acao,
    data_estimada_troca: datas_info.data_estimada_troca,
    data_limite_troca: datas_info.data_limite_troca,
    data_vencimento_acao: datas_info.data_vencimento_acao,
    dias_restantes_acao: dias_restantes,
    prazo_revisao_dias: datas_info.prazo_revisao_dias,
    
    // 📦 RASTREAMENTO E LOGÍSTICA
    codigo_rastreamento: tracking_info.codigo_rastreamento,
    transportadora: tracking_info.transportadora,
    status_rastreamento: tracking_info.status_rastreamento,
    url_rastreamento: tracking_info.url_rastreamento,
    endereco_destino: tracking_info.endereco_destino,
    
    // 💰 CUSTOS E FINANCEIRO
    moeda_custo: financial_info.moeda_custo || 'BRL',
    custo_envio_devolucao: financial_info.custo_envio_devolucao,
    valor_compensacao: financial_info.valor_compensacao,
    valor_diferenca_troca: financial_info.valor_diferenca_troca,
    descricao_custos: financial_info.descricao_custos,
    responsavel_custo: financial_info.responsavel_custo,
    
    // 🏷️ CLASSIFICAÇÃO E RESOLUÇÃO
    tipo_claim: classification_info.tipo_claim,
    subtipo_claim: classification_info.subtipo_claim,
    motivo_categoria: classification_info.motivo_categoria,
    nivel_prioridade: classification_info.nivel_prioridade,
    tags_automaticas: classification_info.tags_automaticas,
    metodo_resolucao: classification_info.metodo_resolucao,
    resultado_final: classification_info.resultado_final,
    resultado_mediacao: classification_info.resultado_mediacao,
    status_moderacao: classification_info.status_moderacao,
    impacto_reputacao: classification_info.impacto_reputacao,
    
    // 📊 MÉTRICAS E KPIS
    tempo_resposta_medio: metrics_info.tempo_resposta_medio,
    tempo_total_resolucao: metrics_info.tempo_total_resolucao,
    total_evidencias: metrics_info.total_evidencias,
    taxa_satisfacao: metrics_info.taxa_satisfacao,
    satisfacao_comprador: metrics_info.satisfacao_comprador,
    seller_reputation: metrics_info.seller_reputation,
    buyer_reputation: metrics_info.buyer_reputation,
    
    // 🚩 ESTADOS E FLAGS
    escalado_para_ml: flags_info.escalado_para_ml,
    em_mediacao: flags_info.em_mediacao,
    acao_seller_necessaria: flags_info.acao_seller_necessaria,
    eh_troca: flags_info.eh_troca,
    
    // 📋 DADOS DETALHADOS
    detalhes_mediacao: classification_info.detalhes_mediacao,
    historico_status: metrics_info.historico_status,
    proxima_acao_requerida: classification_info.proxima_acao_requerida,
    produto_troca_id: tracking_info.produto_troca_id,
    status_produto_novo: tracking_info.status_produto_novo,
    mediador_ml: classification_info.mediador_ml,
    usuario_ultima_acao: metrics_info.usuario_ultima_acao,
    marketplace_origem: 'ML_BRASIL'
  };
}

// Helper functions para extrair informações específicas
function extractTimelineMensagens(dados_mensagens: any, dados_claim: any) {
  const timeline = [];
  
  if (dados_mensagens && Array.isArray(dados_mensagens)) {
    dados_mensagens.forEach((msg: any) => {
      timeline.push({
        id: msg.id || Date.now(),
        date: msg.date || msg.created_at,
        from: msg.from || 'unknown',
        text: msg.text || msg.message,
        type: msg.type || 'message',
        attachments: msg.attachments || []
      });
    });
  }
  
  // Adicionar eventos do claim se disponível
  if (dados_claim?.history) {
    dados_claim.history.forEach((event: any) => {
      timeline.push({
        id: event.id || Date.now(),
        date: event.date,
        from: 'system',
        text: event.description || event.action,
        type: 'event'
      });
    });
  }
  
  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function extractMensagensInfo(dados_mensagens: any) {
  const mensagens = Array.isArray(dados_mensagens) ? dados_mensagens : [];
  const ultimaMensagem = mensagens[mensagens.length - 1];
  
  return {
    ultima_mensagem_data: ultimaMensagem?.date || ultimaMensagem?.created_at,
    ultima_mensagem_remetente: ultimaMensagem?.from || 'unknown',
    mensagens_nao_lidas: mensagens.filter((msg: any) => !msg.read).length,
    numero_interacoes: mensagens.length,
    anexos_count: mensagens.reduce((acc: number, msg: any) => acc + (msg.attachments?.length || 0), 0),
    anexos_comprador: mensagens.filter((msg: any) => msg.from === 'buyer').reduce((acc: any[], msg: any) => [...acc, ...(msg.attachments || [])], []),
    anexos_vendedor: mensagens.filter((msg: any) => msg.from === 'seller').reduce((acc: any[], msg: any) => [...acc, ...(msg.attachments || [])], []),
    anexos_ml: mensagens.filter((msg: any) => msg.from === 'mercadolibre').reduce((acc: any[], msg: any) => [...acc, ...(msg.attachments || [])], [])
  };
}

function extractDatesInfo(dados_claim: any, dados_order: any, dados_return: any) {
  return {
    data_inicio_mediacao: dados_claim?.mediation_start_date || dados_claim?.created_date,
    data_primeira_acao: dados_claim?.first_action_date || dados_order?.date_created,
    data_estimada_troca: dados_return?.estimated_delivery_date,
    data_limite_troca: dados_return?.deadline_date || dados_claim?.deadline,
    data_vencimento_acao: dados_claim?.action_deadline || dados_claim?.expires_at,
    prazo_revisao_dias: dados_claim?.review_period_days || 7
  };
}

function extractTrackingInfo(dados_order: any, dados_return: any) {
  const shipping = dados_order?.shipping || {};
  return {
    codigo_rastreamento: shipping.tracking_number || dados_return?.tracking_number,
    transportadora: shipping.carrier || dados_return?.carrier,
    status_rastreamento: shipping.status || dados_return?.shipping_status,
    url_rastreamento: shipping.tracking_url || dados_return?.tracking_url,
    endereco_destino: shipping.receiver_address || dados_return?.return_address,
    produto_troca_id: dados_return?.exchange_item_id,
    status_produto_novo: dados_return?.new_item_status
  };
}

function extractFinancialInfo(dados_claim: any, dados_order: any, dados_return: any) {
  return {
    moeda_custo: dados_order?.currency_id || 'BRL',
    custo_envio_devolucao: dados_return?.shipping_cost || dados_claim?.shipping_cost,
    valor_compensacao: dados_claim?.compensation_amount || dados_return?.compensation,
    valor_diferenca_troca: dados_return?.price_difference,
    descricao_custos: {
      shipping: dados_return?.shipping_cost,
      handling: dados_return?.handling_cost,
      compensation: dados_claim?.compensation_amount,
      details: dados_claim?.cost_breakdown
    },
    responsavel_custo: dados_claim?.cost_responsibility || 'seller'
  };
}

function extractClassificationInfo(dados_claim: any, dados_order: any) {
  const priority = calculatePriority(dados_claim, dados_order);
  const tags = generateAutomaticTags(dados_claim, dados_order);
  
  return {
    tipo_claim: dados_claim?.type || dados_claim?.reason_code,
    subtipo_claim: dados_claim?.subtype || dados_claim?.sub_reason,
    motivo_categoria: dados_claim?.category || dados_claim?.reason_category,
    nivel_prioridade: priority,
    tags_automaticas: tags,
    metodo_resolucao: dados_claim?.resolution_method,
    resultado_final: dados_claim?.final_result || dados_claim?.status,
    resultado_mediacao: dados_claim?.mediation_result,
    status_moderacao: dados_claim?.moderation_status || 'pending',
    impacto_reputacao: calculateReputationImpact(dados_claim),
    detalhes_mediacao: dados_claim?.mediation_details,
    proxima_acao_requerida: dados_claim?.next_action_required,
    mediador_ml: dados_claim?.mediator_id
  };
}

function extractMetricsInfo(dados_claim: any, dados_mensagens: any, timeline: any[]) {
  const tempoResposta = calculateAverageResponseTime(timeline);
  const tempoTotal = calculateTotalResolutionTime(dados_claim);
  
  return {
    tempo_resposta_medio: tempoResposta,
    tempo_total_resolucao: tempoTotal,
    total_evidencias: (dados_claim?.evidences?.length || 0) + (Array.isArray(dados_mensagens) ? dados_mensagens.filter((m: any) => m.attachments?.length).length : 0),
    taxa_satisfacao: dados_claim?.satisfaction_rate,
    satisfacao_comprador: dados_claim?.buyer_satisfaction,
    seller_reputation: dados_claim?.seller_reputation_info,
    buyer_reputation: dados_claim?.buyer_reputation_info,
    historico_status: dados_claim?.status_history || [],
    usuario_ultima_acao: dados_claim?.last_action_user
  };
}

function extractFlagsInfo(dados_claim: any, dados_order: any, dados_return: any) {
  return {
    escalado_para_ml: dados_claim?.escalated_to_ml || false,
    em_mediacao: dados_claim?.in_mediation || dados_claim?.status === 'in_mediation',
    acao_seller_necessaria: dados_claim?.seller_action_required || false,
    eh_troca: dados_return?.is_exchange || dados_claim?.type === 'exchange'
  };
}

// Funções auxiliares para cálculos
function calculatePriority(dados_claim: any, dados_order: any): string {
  const orderValue = parseFloat(dados_order?.total_amount || 0);
  const claimType = dados_claim?.type;
  
  if (orderValue > 1000 || claimType === 'fraud') return 'critical';
  if (orderValue > 500 || claimType === 'not_received') return 'high';
  if (orderValue > 100 || claimType === 'damaged') return 'medium';
  return 'low';
}

function generateAutomaticTags(dados_claim: any, dados_order: any): string[] {
  const tags = [];
  
  if (dados_claim?.type) tags.push(`type:${dados_claim.type}`);
  if (dados_order?.shipping?.mode) tags.push(`shipping:${dados_order.shipping.mode}`);
  if (parseFloat(dados_order?.total_amount || 0) > 500) tags.push('high-value');
  if (dados_claim?.buyer_feedback?.rating < 3) tags.push('negative-feedback');
  if (dados_claim?.mediation_details) tags.push('mediated');
  
  return tags;
}

function calculateReputationImpact(dados_claim: any): string {
  const claimType = dados_claim?.type;
  const resolution = dados_claim?.resolution_method;
  
  if (claimType === 'fraud' || resolution === 'buyer_favor') return 'high';
  if (claimType === 'not_received' || resolution === 'partial_refund') return 'medium';
  return 'low';
}

function calculateAverageResponseTime(timeline: any[]): number {
  if (!timeline.length) return 0;
  
  const responses = timeline.filter((t: any) => t.from === 'seller');
  if (responses.length < 2) return 0;
  
  let totalTime = 0;
  for (let i = 1; i < responses.length; i++) {
    const timeDiff = new Date(responses[i].date).getTime() - new Date(responses[i-1].date).getTime();
    totalTime += timeDiff;
  }
  
  return Math.round(totalTime / (responses.length - 1) / (1000 * 60)); // em minutos
}

function calculateTotalResolutionTime(dados_claim: any): number {
  if (!dados_claim?.created_date || !dados_claim?.closed_date) return 0;
  
  const startTime = new Date(dados_claim.created_date).getTime();
  const endTime = new Date(dados_claim.closed_date).getTime();
  
  return Math.round((endTime - startTime) / (1000 * 60)); // em minutos
}

// 📊 FUNÇÃO: SINCRONIZAR CAMPOS AVANÇADOS
async function syncAdvancedFields(params: any) {
  const { integration_account_id } = params;
  
  console.log(`🔄 Sincronizando campos avançados para conta: ${integration_account_id}`);
  
  // Aqui implementaremos a lógica de sincronização avançada
  // Por enquanto, retornamos sucesso para manter o sistema funcionando
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Sincronização de campos avançados em desenvolvimento',
      account_id: integration_account_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 📈 FUNÇÃO: BUSCAR MÉTRICAS AVANÇADAS
async function fetchAdvancedMetrics(params: any) {
  const { integration_account_id, date_from, date_to } = params;
  
  console.log(`📈 Buscando métricas avançadas para conta: ${integration_account_id}`);
  
  try {
    const { data: metrics, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        *,
        tempo_resposta_medio,
        tempo_total_resolucao,
        taxa_satisfacao,
        nivel_prioridade,
        status_moderacao
      `)
      .eq('integration_account_id', integration_account_id)
      .gte('created_at', date_from || '2024-01-01')
      .lte('created_at', date_to || new Date().toISOString());

    if (error) {
      throw new Error(`Erro ao buscar métricas: ${error.message}`);
    }

    // Calcular métricas agregadas
    const aggregatedMetrics = calculateAggregatedMetrics(metrics || []);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics: aggregatedMetrics,
        raw_data: metrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    throw error;
  }
}

function calculateAggregatedMetrics(data: any[]) {
  if (!data.length) return {};

  const totalClaims = data.length;
  const avgResponseTime = data.reduce((acc, item) => acc + (item.tempo_resposta_medio || 0), 0) / totalClaims;
  const avgResolutionTime = data.reduce((acc, item) => acc + (item.tempo_total_resolucao || 0), 0) / totalClaims;
  const avgSatisfaction = data.filter(item => item.taxa_satisfacao).reduce((acc, item) => acc + item.taxa_satisfacao, 0) / data.filter(item => item.taxa_satisfacao).length;

  const priorityDistribution = data.reduce((acc, item) => {
    const priority = item.nivel_prioridade || 'unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = data.reduce((acc, item) => {
    const status = item.status_moderacao || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
    total_claims: totalClaims,
    avg_response_time_minutes: Math.round(avgResponseTime),
    avg_resolution_time_minutes: Math.round(avgResolutionTime),
    avg_satisfaction_rate: Math.round(avgSatisfaction * 100) / 100,
    priority_distribution: priorityDistribution,
    status_distribution: statusDistribution,
    high_priority_count: priorityDistribution.critical + priorityDistribution.high || 0,
    escalated_count: data.filter(item => item.escalado_para_ml).length,
    mediation_count: data.filter(item => item.em_mediacao).length
  };
}

// 🔄 FUNÇÃO: ATUALIZAR COLUNAS DA FASE 2
async function updatePhase2Columns(params: any) {
  const { updates, integration_account_id } = params;
  
  console.log(`🔄 Atualizando colunas da Fase 2 para conta: ${integration_account_id}`);
  
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Nenhuma atualização fornecida');
    }

    const { error } = await supabase
      .from('devolucoes_avancadas')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      throw new Error(`Erro ao atualizar: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated_count: updates.length,
        message: `${updates.length} registros atualizados com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na atualização:', error);
    throw error;
  }
}