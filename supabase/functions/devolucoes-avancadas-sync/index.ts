/**
 * 🚀 FASE 4: IMPLEMENTAÇÃO DE SERVIÇOS - EDGE FUNCTION PRINCIPAL
 * Processa e enriquece dados das devoluções avançadas com as 42 novas colunas
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface RequestBody {
  action: 'enrich_existing_data' | 'sync_advanced_fields' | 'fetch_advanced_metrics' | 'update_phase2_columns';
  integration_account_id: string;
  limit?: number;
  updates?: any[];
  date_from?: string;
  date_to?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Ação solicitada:', req.method);
    
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const body: RequestBody = await req.json();
    console.log(`🔄 Ação solicitada: ${body.action}`, {
      integration_account_id: body.integration_account_id,
      limit: body.limit
    });

    const supabase = makeServiceClient();
    
    // Validar conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, organization_id, name, provider')
      .eq('id', body.integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ Conta de integração não encontrada:', accountError);
      return fail('Conta de integração não encontrada ou inativa');
    }

    console.log(`✅ Conta validada: ${account.name} (${account.provider})`);

    switch (body.action) {
      case 'enrich_existing_data':
        return await enrichExistingData(supabase, body);
      
      case 'sync_advanced_fields':
        return await syncAdvancedFields(supabase, body);
      
      case 'fetch_advanced_metrics':
        return await fetchAdvancedMetrics(supabase, body);
      
      case 'update_phase2_columns':
        return await updatePhase2Columns(supabase, body);
      
      default:
        return fail('Ação não reconhecida');
    }

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return fail(`Erro interno: ${error.message}`, 500);
  }
});

/**
 * 📊 ENRIQUECER DADOS EXISTENTES
 * Processa devoluções básicas e adiciona dados das 42 novas colunas
 */
async function enrichExistingData(supabase: any, body: RequestBody) {
  try {
    console.log(`🔍 Enriquecendo dados existentes para conta: ${body.integration_account_id}`);
    
    const limit = body.limit || 50;

    // Buscar devoluções básicas que precisam de enriquecimento
    const { data: devolucoes, error: devError } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id, 
        order_id, 
        claim_id, 
        status_devolucao,
        timeline_mensagens,
        nivel_prioridade,
        anexos_count,
        integration_account_id
      `)
      .eq('integration_account_id', body.integration_account_id)
      .or('timeline_mensagens.is.null,nivel_prioridade.is.null,anexos_count.is.null')
      .limit(limit);

    if (devError) {
      console.error('❌ Erro ao buscar devoluções:', devError);
      return fail(`Erro ao buscar devoluções: ${devError.message}`);
    }

    if (!devolucoes || devolucoes.length === 0) {
      console.log('ℹ️ Nenhuma devolução encontrada para enriquecimento');
      return ok({
        success: true,
        message: 'Nenhuma devolução encontrada para enriquecimento',
        enriched_count: 0,
        processed_count: 0
      });
    }

    console.log(`📦 Processando ${devolucoes.length} devoluções...`);

    let enrichedCount = 0;

    // Processar cada devolução
    for (const dev of devolucoes) {
      try {
        // Simular enriquecimento dos dados (aqui seria chamada real para ML API)
        const enrichedData = await simulateEnrichment(dev);
        
        // Atualizar com dados enriquecidos
        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(enrichedData)
          .eq('id', dev.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar devolução ${dev.id}:`, updateError);
          continue;
        }

        enrichedCount++;
        console.log(`✅ Devolução ${dev.id} enriquecida`);

      } catch (error) {
        console.error(`❌ Erro ao processar devolução ${dev.id}:`, error);
        continue;
      }
    }

    const result = {
      success: true,
      message: `${enrichedCount} devoluções enriquecidas com sucesso`,
      enriched_count: enrichedCount,
      processed_count: devolucoes.length
    };

    console.log('✅ Enriquecimento concluído:', result);
    return ok(result);

  } catch (error) {
    console.error('❌ Erro no enriquecimento:', error);
    return fail(`Erro no enriquecimento: ${error.message}`, 500);
  }
}

/**
 * 🔄 SINCRONIZAR CAMPOS AVANÇADOS
 * Atualiza campos específicos com dados mais recentes
 */
async function syncAdvancedFields(supabase: any, body: RequestBody) {
  try {
    console.log(`🔄 Sincronizando campos avançados para: ${body.integration_account_id}`);

    // Buscar devoluções para sincronização
    const { data: devolucoes, error } = await supabase
      .from('devolucoes_avancadas')
      .select('id, order_id, claim_id, status_devolucao')
      .eq('integration_account_id', body.integration_account_id)
      .limit(25);

    if (error) {
      return fail(`Erro ao buscar devoluções: ${error.message}`);
    }

    let syncedCount = 0;

    for (const dev of devolucoes || []) {
      // Simular sincronização com ML API
      const syncData = await simulateSync(dev);
      
      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update(syncData)
        .eq('id', dev.id);

      if (!updateError) {
        syncedCount++;
      }
    }

    return ok({
      success: true,
      message: `${syncedCount} registros sincronizados`,
      synced_count: syncedCount
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return fail(`Erro na sincronização: ${error.message}`, 500);
  }
}

/**
 * 📈 BUSCAR MÉTRICAS AVANÇADAS
 * Calcula estatísticas das 42 novas colunas
 */
async function fetchAdvancedMetrics(supabase: any, body: RequestBody) {
  try {
    console.log(`📈 Buscando métricas avançadas para: ${body.integration_account_id}`);

    let query = supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        nivel_prioridade,
        status_devolucao,
        tempo_resposta_medio,
        tempo_total_resolucao,
        taxa_satisfacao,
        escalado_para_ml,
        em_mediacao,
        anexos_count,
        mensagens_nao_lidas,
        data_criacao
      `)
      .eq('integration_account_id', body.integration_account_id);

    // Filtros de data se fornecidos
    if (body.date_from) {
      query = query.gte('data_criacao', body.date_from);
    }
    if (body.date_to) {
      query = query.lte('data_criacao', body.date_to);
    }

    const { data: devolucoes, error } = await query;

    if (error) {
      return fail(`Erro ao buscar dados: ${error.message}`);
    }

    // Calcular métricas
    const metrics = calculateAdvancedMetrics(devolucoes || []);

    console.log('📊 Métricas calculadas:', metrics);

    return ok({
      success: true,
      metrics,
      raw_data: devolucoes
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    return fail(`Erro ao buscar métricas: ${error.message}`, 500);
  }
}

/**
 * 🔄 ATUALIZAR COLUNAS ESPECÍFICAS
 * Atualiza registros específicos com novos dados
 */
async function updatePhase2Columns(supabase: any, body: RequestBody) {
  try {
    console.log(`🔄 Atualizando colunas específicas...`);

    if (!body.updates || !Array.isArray(body.updates)) {
      return fail('Updates não fornecidos ou inválidos');
    }

    let updatedCount = 0;

    for (const update of body.updates) {
      if (!update.id) continue;

      const { error } = await supabase
        .from('devolucoes_avancadas')
        .update(update.data)
        .eq('id', update.id)
        .eq('integration_account_id', body.integration_account_id);

      if (!error) {
        updatedCount++;
      }
    }

    return ok({
      success: true,
      message: `${updatedCount} registros atualizados`,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('❌ Erro na atualização:', error);
    return fail(`Erro na atualização: ${error.message}`, 500);
  }
}

/**
 * 🎭 SIMULAR ENRIQUECIMENTO DE DADOS
 * Em produção, aqui seria feita chamada real para ML API
 */
async function simulateEnrichment(devolucao: any) {
  // Dados simulados para demonstração
  const mockTimeline = [
    {
      timestamp: new Date().toISOString(),
      remetente: 'buyer',
      tipo: 'mensagem',
      conteudo: 'Produto chegou com defeito',
      anexos: []
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      remetente: 'seller',
      tipo: 'resposta',
      conteudo: 'Iremos analisar o caso',
      anexos: []
    }
  ];

  return {
    timeline_mensagens: mockTimeline,
    ultima_mensagem_data: new Date().toISOString(),
    ultima_mensagem_remetente: 'buyer',
    mensagens_nao_lidas: 1,
    anexos_count: 0,
    status_moderacao: 'pending',
    nivel_prioridade: 'medium',
    tags_automaticas: ['produto_defeituoso', 'resposta_pendente'],
    tempo_resposta_medio: 120,
    tempo_total_resolucao: 0,
    total_evidencias: 0,
    escalado_para_ml: false,
    em_mediacao: false,
    acao_seller_necessaria: true,
    impacto_reputacao: 'low',
    marketplace_origem: 'ML_BRASIL',
    updated_at: new Date().toISOString()
  };
}

/**
 * 🔄 SIMULAR SINCRONIZAÇÃO
 */
async function simulateSync(devolucao: any) {
  return {
    status_moderacao: 'approved',
    tempo_resposta_medio: Math.floor(Math.random() * 300) + 60,
    updated_at: new Date().toISOString()
  };
}

/**
 * 📊 CALCULAR MÉTRICAS AVANÇADAS
 */
function calculateAdvancedMetrics(devolucoes: any[]) {
  const total = devolucoes.length;
  
  const priorityCount = devolucoes.reduce((acc, dev) => {
    const priority = dev.nivel_prioridade || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const statusCount = devolucoes.reduce((acc, dev) => {
    const status = dev.status_devolucao || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const avgResponseTime = devolucoes
    .filter(dev => dev.tempo_resposta_medio)
    .reduce((sum, dev) => sum + (dev.tempo_resposta_medio || 0), 0) / total || 0;

  const avgResolutionTime = devolucoes
    .filter(dev => dev.tempo_total_resolucao)
    .reduce((sum, dev) => sum + (dev.tempo_total_resolucao || 0), 0) / total || 0;

  const avgSatisfaction = devolucoes
    .filter(dev => dev.taxa_satisfacao)
    .reduce((sum, dev) => sum + (dev.taxa_satisfacao || 0), 0) / total || 0;

  const escalatedCount = devolucoes.filter(dev => dev.escalado_para_ml).length;
  const mediationCount = devolucoes.filter(dev => dev.em_mediacao).length;
  const highPriorityCount = devolucoes.filter(dev => dev.nivel_prioridade === 'high' || dev.nivel_prioridade === 'critical').length;

  return {
    total_claims: total,
    avg_response_time_minutes: Math.round(avgResponseTime),
    avg_resolution_time_minutes: Math.round(avgResolutionTime),
    avg_satisfaction_rate: Math.round(avgSatisfaction * 100) / 100,
    priority_distribution: priorityCount,
    status_distribution: statusCount,
    high_priority_count: highPriorityCount,
    escalated_count: escalatedCount,
    mediation_count: mediationCount
  };
}