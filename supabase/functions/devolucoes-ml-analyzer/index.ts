/**
 * 🧠 FASE 4: ANALISADOR INTELIGENTE DE DEVOLUÇÕES ML
 * Processa dados avançados do Mercado Livre e aplica inteligência artificial
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface AnalysisRequest {
  integration_account_id: string;
  order_id?: string;
  claim_id?: string;
  analysis_type: 'priority_classification' | 'sentiment_analysis' | 'trend_detection' | 'risk_assessment';
  data_source?: 'claims' | 'orders' | 'messages';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const body: AnalysisRequest = await req.json();
    console.log('🧠 Iniciando análise inteligente:', body.analysis_type);

    const supabase = makeServiceClient();
    
    // Validar conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, organization_id, name')
      .eq('id', body.integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return fail('Conta de integração não encontrada');
    }

    switch (body.analysis_type) {
      case 'priority_classification':
        return await classifyPriority(supabase, body);
      
      case 'sentiment_analysis':
        return await analyzeSentiment(supabase, body);
      
      case 'trend_detection':
        return await detectTrends(supabase, body);
      
      case 'risk_assessment':
        return await assessRisk(supabase, body);
      
      default:
        return fail('Tipo de análise não reconhecido');
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    return fail(`Erro na análise: ${error.message}`, 500);
  }
});

/**
 * 🎯 CLASSIFICAÇÃO AUTOMÁTICA DE PRIORIDADE
 * Analisa dados e define prioridade baseada em critérios inteligentes
 */
async function classifyPriority(supabase: any, body: AnalysisRequest) {
  try {
    console.log('🎯 Classificando prioridades...');

    // Buscar devoluções sem prioridade definida
    const { data: devolucoes, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        order_id,
        claim_id,
        status_devolucao,
        valor_retido,
        timeline_mensagens,
        anexos_count,
        mensagens_nao_lidas,
        data_criacao,
        nivel_prioridade
      `)
      .eq('integration_account_id', body.integration_account_id)
      .or('nivel_prioridade.is.null,nivel_prioridade.eq.medium')
      .limit(100);

    if (error) {
      return fail(`Erro ao buscar devoluções: ${error.message}`);
    }

    let classifiedCount = 0;

    for (const dev of devolucoes || []) {
      const priority = calculatePriority(dev);
      const tags = generateAutomaticTags(dev);

      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update({
          nivel_prioridade: priority,
          tags_automaticas: tags,
          impacto_reputacao: calculateReputationImpact(dev),
          updated_at: new Date().toISOString()
        })
        .eq('id', dev.id);

      if (!updateError) {
        classifiedCount++;
      }
    }

    return ok({
      success: true,
      message: `${classifiedCount} devoluções classificadas automaticamente`,
      classified_count: classifiedCount,
      analysis_type: 'priority_classification'
    });

  } catch (error) {
    console.error('❌ Erro na classificação:', error);
    return fail(`Erro na classificação: ${error.message}`, 500);
  }
}

/**
 * 😊 ANÁLISE DE SENTIMENTO DAS MENSAGENS
 * Analisa o tom das comunicações para identificar satisfação/insatisfação
 */
async function analyzeSentiment(supabase: any, body: AnalysisRequest) {
  try {
    console.log('😊 Analisando sentimentos...');

    const { data: devolucoes, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        timeline_mensagens,
        satisfacao_comprador,
        taxa_satisfacao
      `)
      .eq('integration_account_id', body.integration_account_id)
      .not('timeline_mensagens', 'is', null)
      .limit(50);

    if (error) {
      return fail(`Erro ao buscar mensagens: ${error.message}`);
    }

    let analyzedCount = 0;

    for (const dev of devolucoes || []) {
      const sentimentData = analyzeSentimentFromMessages(dev.timeline_mensagens);

      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update({
          satisfacao_comprador: sentimentData.overall_sentiment,
          taxa_satisfacao: sentimentData.satisfaction_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', dev.id);

      if (!updateError) {
        analyzedCount++;
      }
    }

    return ok({
      success: true,
      message: `${analyzedCount} análises de sentimento realizadas`,
      analyzed_count: analyzedCount,
      analysis_type: 'sentiment_analysis'
    });

  } catch (error) {
    console.error('❌ Erro na análise de sentimento:', error);
    return fail(`Erro na análise de sentimento: ${error.message}`, 500);
  }
}

/**
 * 📈 DETECÇÃO DE TENDÊNCIAS
 * Identifica padrões e tendências nos dados de devolução
 */
async function detectTrends(supabase: any, body: AnalysisRequest) {
  try {
    console.log('📈 Detectando tendências...');

    // Buscar dados dos últimos 30 dias para análise
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: devolucoes, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        data_criacao,
        status_devolucao,
        nivel_prioridade,
        tags_automaticas,
        tempo_resposta_medio,
        escalado_para_ml,
        valor_retido
      `)
      .eq('integration_account_id', body.integration_account_id)
      .gte('data_criacao', thirtyDaysAgo.toISOString())
      .order('data_criacao', { ascending: true });

    if (error) {
      return fail(`Erro ao buscar dados: ${error.message}`);
    }

    const trends = detectDataTrends(devolucoes || []);

    return ok({
      success: true,
      trends,
      analysis_period: '30_days',
      total_analyzed: devolucoes?.length || 0,
      analysis_type: 'trend_detection'
    });

  } catch (error) {
    console.error('❌ Erro na detecção de tendências:', error);
    return fail(`Erro na detecção de tendências: ${error.message}`, 500);
  }
}

/**
 * ⚠️ AVALIAÇÃO DE RISCO
 * Identifica devoluções com alto risco de escalação ou impacto
 */
async function assessRisk(supabase: any, body: AnalysisRequest) {
  try {
    console.log('⚠️ Avaliando riscos...');

    const { data: devolucoes, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        order_id,
        status_devolucao,
        valor_retido,
        tempo_resposta_medio,
        mensagens_nao_lidas,
        anexos_count,
        escalado_para_ml,
        em_mediacao,
        data_criacao,
        proxima_acao_requerida
      `)
      .eq('integration_account_id', body.integration_account_id)
      .in('status_devolucao', ['opened', 'in_process', 'waiting_seller'])
      .limit(100);

    if (error) {
      return fail(`Erro ao buscar devoluções: ${error.message}`);
    }

    let assessedCount = 0;

    for (const dev of devolucoes || []) {
      const riskData = calculateRiskScore(dev);

      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update({
          impacto_reputacao: riskData.reputation_impact,
          nivel_prioridade: riskData.suggested_priority,
          proxima_acao_requerida: riskData.next_action,
          acao_seller_necessaria: riskData.seller_action_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', dev.id);

      if (!updateError) {
        assessedCount++;
      }
    }

    return ok({
      success: true,
      message: `${assessedCount} avaliações de risco realizadas`,
      assessed_count: assessedCount,
      analysis_type: 'risk_assessment'
    });

  } catch (error) {
    console.error('❌ Erro na avaliação de risco:', error);
    return fail(`Erro na avaliação de risco: ${error.message}`, 500);
  }
}

/**
 * 🎯 CALCULAR PRIORIDADE BASEADA EM CRITÉRIOS
 */
function calculatePriority(devolucao: any): string {
  let score = 0;

  // Valor retido (peso alto)
  if (devolucao.valor_retido > 500) score += 3;
  else if (devolucao.valor_retido > 200) score += 2;
  else if (devolucao.valor_retido > 50) score += 1;

  // Mensagens não lidas (urgência)
  if (devolucao.mensagens_nao_lidas > 2) score += 2;
  else if (devolucao.mensagens_nao_lidas > 0) score += 1;

  // Anexos (evidências)
  if (devolucao.anexos_count > 3) score += 2;
  else if (devolucao.anexos_count > 0) score += 1;

  // Tempo desde criação
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(devolucao.data_criacao).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation > 7) score += 3;
  else if (daysSinceCreation > 3) score += 2;
  else if (daysSinceCreation > 1) score += 1;

  // Status críticos
  if (['dispute', 'waiting_seller'].includes(devolucao.status_devolucao)) {
    score += 3;
  }

  // Classificar prioridade
  if (score >= 8) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * 🏷️ GERAR TAGS AUTOMÁTICAS
 */
function generateAutomaticTags(devolucao: any): string[] {
  const tags: string[] = [];

  if (devolucao.valor_retido > 300) tags.push('alto_valor');
  if (devolucao.mensagens_nao_lidas > 1) tags.push('resposta_pendente');
  if (devolucao.anexos_count > 0) tags.push('com_evidencias');
  
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(devolucao.data_criacao).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceCreation > 5) tags.push('caso_antigo');
  if (daysSinceCreation < 1) tags.push('caso_novo');

  return tags;
}

/**
 * 🎭 CALCULAR IMPACTO NA REPUTAÇÃO
 */
function calculateReputationImpact(devolucao: any): string {
  if (devolucao.valor_retido > 500 || devolucao.mensagens_nao_lidas > 3) {
    return 'high';
  }
  if (devolucao.valor_retido > 100 || devolucao.mensagens_nao_lidas > 1) {
    return 'medium';
  }
  return 'low';
}

/**
 * 😊 ANALISAR SENTIMENTO DAS MENSAGENS
 */
function analyzeSentimentFromMessages(timeline: any[]): any {
  if (!timeline || timeline.length === 0) {
    return { overall_sentiment: 'neutral', satisfaction_score: 0.5 };
  }

  // Palavras-chave para análise básica
  const positiveKeywords = ['obrigado', 'satisfeito', 'bom', 'ótimo', 'perfeito', 'resolvido'];
  const negativeKeywords = ['ruim', 'péssimo', 'insatisfeito', 'problema', 'defeito', 'reclamação'];

  let positiveScore = 0;
  let negativeScore = 0;

  timeline.forEach(msg => {
    if (msg.conteudo) {
      const content = msg.conteudo.toLowerCase();
      
      positiveKeywords.forEach(word => {
        if (content.includes(word)) positiveScore++;
      });
      
      negativeKeywords.forEach(word => {
        if (content.includes(word)) negativeScore++;
      });
    }
  });

  const totalScore = positiveScore + negativeScore;
  const satisfactionScore = totalScore > 0 ? positiveScore / totalScore : 0.5;

  let sentiment = 'neutral';
  if (satisfactionScore > 0.6) sentiment = 'positive';
  else if (satisfactionScore < 0.4) sentiment = 'negative';

  return { overall_sentiment: sentiment, satisfaction_score: satisfactionScore };
}

/**
 * 📈 DETECTAR TENDÊNCIAS NOS DADOS
 */
function detectDataTrends(devolucoes: any[]): any {
  const weeklyData = groupByWeek(devolucoes);
  const priorityTrends = analyzePriorityTrends(devolucoes);
  const responseTrends = analyzeResponseTrends(devolucoes);

  return {
    weekly_volume: weeklyData,
    priority_trends: priorityTrends,
    response_time_trends: responseTrends,
    escalation_rate: calculateEscalationRate(devolucoes),
    insights: generateInsights(weeklyData, priorityTrends)
  };
}

function groupByWeek(devolucoes: any[]): any {
  const weeks: Record<string, number> = {};
  
  devolucoes.forEach(dev => {
    const date = new Date(dev.data_criacao);
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });

  return weeks;
}

function analyzePriorityTrends(devolucoes: any[]): any {
  const priorities = ['low', 'medium', 'high', 'critical'];
  const trends: Record<string, number> = {};

  priorities.forEach(priority => {
    trends[priority] = devolucoes.filter(dev => dev.nivel_prioridade === priority).length;
  });

  return trends;
}

function analyzeResponseTrends(devolucoes: any[]): any {
  const validTimes = devolucoes.filter(dev => dev.tempo_resposta_medio > 0);
  
  if (validTimes.length === 0) return { average: 0, trend: 'stable' };

  const average = validTimes.reduce((sum, dev) => sum + dev.tempo_resposta_medio, 0) / validTimes.length;
  
  return { average: Math.round(average), trend: 'stable' };
}

function calculateEscalationRate(devolucoes: any[]): number {
  const total = devolucoes.length;
  const escalated = devolucoes.filter(dev => dev.escalado_para_ml).length;
  
  return total > 0 ? Math.round((escalated / total) * 100) : 0;
}

function generateInsights(weeklyData: any, priorityTrends: any): string[] {
  const insights: string[] = [];

  const weeklyValues = Object.values(weeklyData) as number[];
  if (weeklyValues.length > 1) {
    const trend = weeklyValues[weeklyValues.length - 1] > weeklyValues[0] ? 'crescente' : 'decrescente';
    insights.push(`Volume de devoluções está em tendência ${trend}`);
  }

  const highPriority = priorityTrends.high + priorityTrends.critical;
  if (highPriority > 0) {
    insights.push(`${highPriority} casos de alta prioridade requerem atenção imediata`);
  }

  return insights;
}

/**
 * ⚠️ CALCULAR SCORE DE RISCO
 */
function calculateRiskScore(devolucao: any): any {
  let riskScore = 0;

  // Fatores de risco
  if (devolucao.valor_retido > 1000) riskScore += 4;
  else if (devolucao.valor_retido > 500) riskScore += 3;
  else if (devolucao.valor_retido > 200) riskScore += 2;

  if (devolucao.mensagens_nao_lidas > 2) riskScore += 3;
  if (devolucao.tempo_resposta_medio > 240) riskScore += 2; // > 4 horas

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(devolucao.data_criacao).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation > 7) riskScore += 3;
  if (devolucao.escalado_para_ml) riskScore += 2;
  if (devolucao.em_mediacao) riskScore += 4;

  // Determinar ações baseadas no risco
  let reputationImpact = 'low';
  let suggestedPriority = 'medium';
  let nextAction = 'monitorar';
  let sellerActionRequired = false;

  if (riskScore >= 10) {
    reputationImpact = 'critical';
    suggestedPriority = 'critical';
    nextAction = 'ação_imediata_necessária';
    sellerActionRequired = true;
  } else if (riskScore >= 7) {
    reputationImpact = 'high';
    suggestedPriority = 'high';
    nextAction = 'responder_urgente';
    sellerActionRequired = true;
  } else if (riskScore >= 4) {
    reputationImpact = 'medium';
    nextAction = 'acompanhar_próximo';
    sellerActionRequired = true;
  }

  return {
    risk_score: riskScore,
    reputation_impact: reputationImpact,
    suggested_priority: suggestedPriority,
    next_action: nextAction,
    seller_action_required: sellerActionRequired
  };
}