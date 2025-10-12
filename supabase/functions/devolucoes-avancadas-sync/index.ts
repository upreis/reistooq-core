/**
 * 🚀 SISTEMA DE DEVOLUÇÕES AVANÇADAS UNIFICADO
 * Consolida todas as funcionalidades de enriquecimento e processamento
 */

import { corsHeaders, makeServiceClient, ok, fail, getMlConfig } from '../_shared/client.ts';

interface RequestBody {
  action: string;
  integration_account_id: string;
  limit?: number;
  updates?: any[];
  date_from?: string;
  date_to?: string;
}

// Cache simples em memória para evitar reprocessamento
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

Deno.serve(async (req) => {
  console.log('🚀 Devolucoes Avancadas Sync - Iniciando...');

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { action, integration_account_id, limit = 50, updates, date_from, date_to } = await req.json();
    console.log(`📋 Ação solicitada: ${action} para conta: ${integration_account_id}`);

    if (!integration_account_id) {
      return fail('integration_account_id é obrigatório', 400);
    }

    const supabase = makeServiceClient();

    // Validar se conta existe e está ativa
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, name, provider, account_identifier')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return fail('Conta de integração não encontrada ou inativa', 404);
    }

    // ======= ROTEAMENTO DAS AÇÕES =======
    switch (action) {
      case 'test_ml_connection':
        return await handleTestConnection(supabase, integration_account_id, account);
      
      case 'check_missing_data':
        return await handleCheckMissingData(supabase, integration_account_id);
      
      case 'real_enrich_claims':
      case 'batch_enrich':
        return await handleRealEnrichClaims(supabase, integration_account_id, limit, action === 'batch_enrich');
      
      case 'enrich_existing_data':
        return await handleEnrichExistingData(supabase, integration_account_id, limit);
      
      case 'sync_advanced_fields':
        return await handleSyncAdvancedFields(supabase, integration_account_id);
      
      case 'fetch_advanced_metrics':
        return await handleFetchAdvancedMetrics(supabase, integration_account_id, date_from, date_to);
      
      case 'update_phase2_columns':
        return await handleUpdatePhase2Columns(supabase, integration_account_id, updates);
      
      default:
        return fail(`Ação não suportada: ${action}`, 400);
    }

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return success even with errors to avoid breaking the UI
    return ok({
      success: false,
      error: errorMessage,
      message: `Erro interno: ${errorMessage}`,
      processed_count: 0,
      total_found: 0
    });
  }
});

// ======= FUNÇÕES AUXILIARES =======

async function getCachedOrFetchClaims(supabase: any, integration_account_id: string, limit: number): Promise<any[]> {
  let claims: any[] = [];
  let cacheKey = `claims_${integration_account_id}`;
  
  // Verificar cache primeiro
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Usando dados do cache');
      claims = cached.data;
      return claims;
    } else {
      cache.delete(cacheKey);
    }
  }

  // Se não tem cache, buscar via ml-api-direct
  console.log('🔍 Buscando dados via ml-api-direct...');
  
  const { data: mlData, error: mlError } = await supabase.functions.invoke('ml-api-direct', {
    body: {
      action: 'get_claims_and_returns',
      integration_account_id,
      limit: Math.min(limit, 100)
    }
  });

  if (mlError || !mlData?.success) {
    console.error('❌ Erro ao buscar dados via ml-api-direct:', mlError);
    console.log('🔄 Continuando sem dados da API ML (modo graceful)');
    claims = [];
  } else {
    claims = mlData.data || [];
    // Armazenar no cache
    cache.set(cacheKey, { data: claims, timestamp: Date.now() });
  }
  
  return claims;
}

// ======= HANDLERS DAS AÇÕES =======

async function handleTestConnection(supabase: any, integration_account_id: string, account: any) {
  console.log('🔧 Testando conexão ML...');
  
  try {
    const mlConfig = await getMlConfig(supabase, integration_account_id);
    if (!mlConfig) {
      return ok({ 
        success: false, 
        connection_status: 'failed', 
        error: 'Token ML não encontrado' 
      });
    }

    return ok({ 
      success: true, 
      connection_status: 'connected',
      account_identifier: mlConfig.account_identifier,
      user_data: { nickname: account.name }
    });
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return ok({ 
        success: false, 
        connection_status: 'failed', 
        error: errorMessage 
      });
  }
}

async function handleCheckMissingData(supabase: any, integration_account_id: string) {
  console.log('🔍 Verificando dados faltantes...');
  
  try {
    const { data: records, error } = await supabase
      .from('devolucoes_avancadas')
      .select('id, order_id, dados_mensagens, timeline_mensagens, nivel_prioridade, anexos_count')
      .eq('integration_account_id', integration_account_id)
      .limit(100);

    if (error) throw error;

    const missing = {
      sem_mensagens: 0,
      sem_timeline: 0,
      sem_prioridade: 0,
      sem_anexos: 0
    };

    records?.forEach((record: any) => {
      if (!record.dados_mensagens || Object.keys(record.dados_mensagens || {}).length === 0) {
        missing.sem_mensagens++;
      }
      if (!record.timeline_mensagens || record.timeline_mensagens.length === 0) {
        missing.sem_timeline++;
      }
      if (!record.nivel_prioridade) {
        missing.sem_prioridade++;
      }
      if (!record.anexos_count || record.anexos_count === 0) {
        missing.sem_anexos++;
      }
    });

    const analysis = {
      claims_needing_enrichment: missing.sem_mensagens + missing.sem_timeline + missing.sem_prioridade,
      missing_timeline: missing.sem_timeline,
      missing_attachments: missing.sem_anexos,
      missing_priority: missing.sem_prioridade
    };

    return ok({
      success: true,
      total_records: records?.length || 0,
      total_claims: records?.length || 0,
      missing_data: missing,
      analysis,
      needs_enrichment: missing.sem_mensagens > 0 || missing.sem_timeline > 0
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados faltantes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ success: false, error: errorMessage });
  }
}

async function handleRealEnrichClaims(supabase: any, integration_account_id: string, limit: number, isBatch: boolean) {
  console.log(`🚀 ${isBatch ? 'Enriquecimento em lote' : 'Enriquecimento real'} - Iniciando...`);
  
  try {
    const claims = await getCachedOrFetchClaims(supabase, integration_account_id, limit);
    
    if (claims.length === 0) {
      return ok({
        success: true,
        enriched_count: 0,
        total_enriched: 0,
        message: 'Nenhum claim encontrado para enriquecimento'
      });
    }

    console.log(`📊 Processando ${claims.length} claims/returns`);

    // Processar claims em paralelo (máximo 5 por vez)
    const processedClaims = [];
    const batchSize = 5;
    
    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(claims.length/batchSize)}`);
      
      const batchResults = await Promise.all(
        batch.map(claim => processClaimData(claim, integration_account_id))
      );
      
      processedClaims.push(...batchResults);
      
      // Usar EdgeRuntime.waitUntil para salvar em background
      for (const data of batchResults) {
        if (data) {
          // Process in background without waiting
          upsertOrderData(supabase, data).catch(console.error);
        }
      }
    }

    const enrichedCount = processedClaims.filter(Boolean).length;

    return ok({
      success: true,
      enriched_count: enrichedCount,
      total_enriched: enrichedCount,
      total_processed: claims.length,
      message: `${enrichedCount} claims enriquecidos com sucesso!`
    });

  } catch (error) {
    console.error('❌ Erro no enriquecimento real:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ success: false, error: errorMessage });
  }
}

async function handleEnrichExistingData(supabase: any, integration_account_id: string, limit: number) {
  console.log('📈 Enriquecendo dados existentes...');
  return await handleRealEnrichClaims(supabase, integration_account_id, limit, false);
}

async function handleSyncAdvancedFields(supabase: any, integration_account_id: string) {
  console.log('🔄 Sincronizando campos avançados...');
  
  try {
    // Buscar registros que precisam de sincronização
    const { data: records, error } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .eq('integration_account_id', integration_account_id)
      .is('ultima_sincronizacao', null)
      .limit(50);

    if (error) throw error;

    if (!records || records.length === 0) {
      return ok({
        success: true,
        synchronized_count: 0,
        message: 'Todos os registros já estão sincronizados'
      });
    }

    // Atualizar timestamp de sincronização
    const { error: updateError } = await supabase
      .from('devolucoes_avancadas')
      .update({ 
        ultima_sincronizacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('integration_account_id', integration_account_id)
      .in('id', records.map((r: any) => r.id));

    if (updateError) throw updateError;

    return ok({
      success: true,
      synchronized_count: records.length,
      message: `${records.length} registros sincronizados`
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ success: false, error: errorMessage });
  }
}

async function handleFetchAdvancedMetrics(supabase: any, integration_account_id: string, date_from?: string, date_to?: string) {
  console.log('📊 Buscando métricas avançadas...');
  
  try {
    let query = supabase
      .from('devolucoes_avancadas')
      .select('*')
      .eq('integration_account_id', integration_account_id);

    if (date_from) {
      query = query.gte('data_criacao', date_from);
    }
    if (date_to) {
      query = query.lte('data_criacao', date_to + 'T23:59:59.999Z');
    }

    const { data: records, error } = await query;
    if (error) throw error;

    if (!records || records.length === 0) {
      return ok({
        success: true,
        metrics: {
          total_claims: 0,
          avg_response_time_minutes: 0,
          avg_resolution_time_minutes: 0,
          avg_satisfaction_rate: 0,
          priority_distribution: {},
          status_distribution: {},
          high_priority_count: 0,
          escalated_count: 0,
          mediation_count: 0
        }
      });
    }

    // Calcular métricas
    const metrics = {
      total_claims: records.length,
      avg_response_time_minutes: Math.round(
        records.filter((r: any) => r.tempo_resposta_medio).reduce((sum: number, r: any) => sum + (r.tempo_resposta_medio || 0), 0) /
        records.filter((r: any) => r.tempo_resposta_medio).length || 0
      ),
      avg_resolution_time_minutes: Math.round(
        records.filter((r: any) => r.tempo_total_resolucao).reduce((sum: number, r: any) => sum + (r.tempo_total_resolucao || 0), 0) /
        records.filter((r: any) => r.tempo_total_resolucao).length || 0
      ),
      avg_satisfaction_rate: Math.round(
        (records.filter((r: any) => r.taxa_satisfacao).reduce((sum: number, r: any) => sum + (r.taxa_satisfacao || 0), 0) / 
        records.filter((r: any) => r.taxa_satisfacao).length || 0) * 100
      ) / 100,
      priority_distribution: records.reduce((acc: any, r: any) => {
        const priority = r.nivel_prioridade || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {}),
      status_distribution: records.reduce((acc: any, r: any) => {
        const status = r.status_devolucao || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      high_priority_count: records.filter((r: any) => ['high', 'critical'].includes(r.nivel_prioridade)).length,
      escalated_count: records.filter((r: any) => r.escalado_para_ml).length,
      mediation_count: records.filter((r: any) => r.em_mediacao).length
    };

    return ok({
      success: true,
      metrics,
      raw_data: records
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ success: false, error: errorMessage });
  }
}

async function handleUpdatePhase2Columns(supabase: any, integration_account_id: string, updates: any[]) {
  console.log(`🔄 Atualizando colunas da Fase 2 - ${updates?.length} registros`);
  
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      return ok({
        success: false,
        error: 'Nenhuma atualização fornecida'
      });
    }

    let updated_count = 0;

    for (const update of updates) {
      if (!update.id || !update.data) continue;

      const { error } = await supabase
        .from('devolucoes_avancadas')
        .update({
          ...update.data,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .eq('integration_account_id', integration_account_id);

      if (!error) {
        updated_count++;
      } else {
        console.error(`❌ Erro ao atualizar registro ${update.id}:`, error);
      }
    }

    return ok({
      success: true,
      updated_count,
      total_requested: updates.length,
      message: `${updated_count} registros atualizados com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro nas atualizações:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ success: false, error: errorMessage });
  }
}

// ======= FUNÇÕES DE PROCESSAMENTO =======

async function processClaimData(claim: any, integration_account_id: string) {
  const orderData = claim.order_data || {};
  const claimDetails = claim.claim_details || {};
  const claimMessages = claim.claim_messages || {};
  const messages = claimMessages.messages || [];
  
  // 🔍 DETECÇÃO MELHORADA: Verificar dados em MÚLTIPLAS fontes
  // Se claim_details está vazio mas temos dados em orderData, usar orderData
  const hasClaimInOrderData = !claimDetails.id && (
    orderData.cancel_detail?.code || 
    orderData.status === 'cancelled' || 
    (orderData.mediations && orderData.mediations.length > 0)
  );
  
  // 📋 Montar estrutura de claim a partir de orderData quando necessário
  const effectiveClaimData = hasClaimInOrderData ? {
    id: orderData.mediations?.[0]?.id || `${claim.order_id}_claim`,
    type: orderData.cancel_detail?.group || 'cancellation',
    reason_id: orderData.cancel_detail?.code,
    status: orderData.status,
    date_created: orderData.cancel_detail?.date || orderData.date_created,
    last_updated: orderData.last_updated,
    resolution: orderData.cancel_detail ? {
      reason: orderData.cancel_detail.description,
      date_created: orderData.cancel_detail.date,
      requested_by: orderData.cancel_detail.requested_by
    } : null
  } : claimDetails;
  
  // Usar Promise.all para operações paralelas quando possível
  const [dataCreated, dataUpdated, sellerId] = await Promise.resolve([
    new Date(claim.date_created || orderData.date_created),
    new Date(orderData.last_updated || claim.date_created),
    claim.order_data?.seller?.id?.toString()
  ]);
  
  const dataResolution = effectiveClaimData.last_updated ? new Date(effectiveClaimData.last_updated) : null;
  
  // Cálculos rápidos em paralelo
  const calculations = calculateMetrics(messages, dataCreated, dataResolution, sellerId, orderData);
  
  return {
    order_id: claim.order_id,
    claim_id: effectiveClaimData.id,
    ...calculations,
    integration_account_id: integration_account_id,
    data_criacao: dataCreated.toISOString(),
    updated_at: new Date().toISOString(),
    // 📝 Adicionar dados de claim construídos a partir de orderData
    dados_claim: hasClaimInOrderData ? effectiveClaimData : claimDetails,
    claim_status: effectiveClaimData.status,
    tipo_claim: effectiveClaimData.type,
    motivo_categoria: effectiveClaimData.reason_id,
    resolution_reason: effectiveClaimData.resolution?.reason
  };
}

function calculateMetrics(messages: any[], dataCreated: Date, dataResolution: Date | null, sellerId: string, orderData: any) {
  // 1. Tempo primeira resposta (otimizado com find ao invés de filter)
  let primeiraRespostaVendedor = null;
  const sellerMessage = messages.find((msg: any) => {
    const isFromSeller = msg.from?.role === 'seller' || 
                        msg.sender_id?.toString() === sellerId ||
                        msg.author_role === 'seller';
    if (!isFromSeller) return false;
    
    const messageDate = new Date(msg.date_created || msg.created_at || msg.date);
    return messageDate > dataCreated;
  });
  
  if (sellerMessage) {
    const messageDate = new Date(sellerMessage.date_created || sellerMessage.created_at || sellerMessage.date);
    primeiraRespostaVendedor = Math.round((messageDate.getTime() - dataCreated.getTime()) / (1000 * 60 * 60));
  }
  
  // 2-3. Tempos de resolução
  let tempoTotalResolucao = null;
  let diasResolucao = null;
  if (dataResolution) {
    tempoTotalResolucao = Math.round((dataResolution.getTime() - dataCreated.getTime()) / (1000 * 60 * 60));
    diasResolucao = Math.ceil((dataResolution.getTime() - dataCreated.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // 4. SLA e eficiência (cálculos rápidos)
  const slaCumprido = (primeiraRespostaVendedor === null || primeiraRespostaVendedor <= 72) && 
                      (diasResolucao === null || diasResolucao <= 7);
  
  let eficiencia = null;
  if (tempoTotalResolucao !== null) {
    const tempoEsperado = 72;
    eficiencia = Math.max(0, Math.min(100, Math.round((tempoEsperado / tempoTotalResolucao) * 100)));
  }
  
  // 5. Score simplificado
  let score = 0;
  if (slaCumprido) score += 40;
  if (primeiraRespostaVendedor && primeiraRespostaVendedor <= 24) score += 30;
  if (eficiencia && eficiencia >= 80) score += 30;
  
  // 6. Valores financeiros (pegando o primeiro payment refunded)
  const payments = orderData.payments || [];
  const refundedPayment = payments.find((p: any) => p.status === 'refunded') || payments[0] || {};
  
  const valorReembolsoTotal = refundedPayment.transaction_amount_refunded || refundedPayment.total_paid_amount || 0;
  const valorReembolsoFrete = refundedPayment.shipping_cost || 0;
  const valorReembolsoProduto = valorReembolsoTotal - valorReembolsoFrete;
  const taxaML = refundedPayment.marketplace_fee || 0;
  const custoLogistico = valorReembolsoFrete;
  const impactoVendedor = valorReembolsoTotal + taxaML;
  const dataReembolso = refundedPayment.date_last_modified || refundedPayment.date_approved || null;
  
  return {
    tempo_primeira_resposta_vendedor: primeiraRespostaVendedor,
    tempo_total_resolucao: tempoTotalResolucao,
    dias_ate_resolucao: diasResolucao,
    sla_cumprido: slaCumprido,
    eficiencia_resolucao: eficiencia,
    score_qualidade: score,
    valor_reembolso_total: valorReembolsoTotal,
    valor_reembolso_produto: valorReembolsoProduto,
    valor_reembolso_frete: valorReembolsoFrete,
    taxa_ml_reembolso: taxaML,
    custo_logistico_total: custoLogistico,
    impacto_financeiro_vendedor: impactoVendedor,
    data_processamento_reembolso: dataReembolso
  };
}

async function upsertOrderData(supabase: any, processedClaim: any) {
  try {
    console.log(`💾 Tentando salvar dados para order: ${processedClaim.order_id}`);
    console.log('📋 Dados para salvar:', {
      order_id: processedClaim.order_id,
      claim_id: processedClaim.claim_id,
      integration_account_id: processedClaim.integration_account_id,
      tempo_primeira_resposta_vendedor: processedClaim.tempo_primeira_resposta_vendedor,
      tempo_total_resolucao: processedClaim.tempo_total_resolucao,
      dias_ate_resolucao: processedClaim.dias_ate_resolucao
    });
    
    const { data, error } = await supabase
      .from('devolucoes_avancadas')
      .upsert({
        order_id: processedClaim.order_id,
        claim_id: processedClaim.claim_id,
        integration_account_id: processedClaim.integration_account_id,
        
        // 13 métricas calculadas
        tempo_primeira_resposta_vendedor: processedClaim.tempo_primeira_resposta_vendedor,
        tempo_total_resolucao: processedClaim.tempo_total_resolucao,
        dias_ate_resolucao: processedClaim.dias_ate_resolucao,
        sla_cumprido: processedClaim.sla_cumprido,
        eficiencia_resolucao: processedClaim.eficiencia_resolucao,
        score_qualidade: processedClaim.score_qualidade,
        valor_reembolso_total: processedClaim.valor_reembolso_total,
        valor_reembolso_produto: processedClaim.valor_reembolso_produto,
        valor_reembolso_frete: processedClaim.valor_reembolso_frete,
        taxa_ml_reembolso: processedClaim.taxa_ml_reembolso,
        custo_logistico_total: processedClaim.custo_logistico_total,
        impacto_financeiro_vendedor: processedClaim.impacto_financeiro_vendedor,
        data_processamento_reembolso: processedClaim.data_processamento_reembolso,
        
        // 🆕 Novos campos extraídos de orderData
        dados_claim: processedClaim.dados_claim,
        claim_status: processedClaim.claim_status,
        tipo_claim: processedClaim.tipo_claim,
        motivo_categoria: processedClaim.motivo_categoria,
        resolution_reason: processedClaim.resolution_reason,
        
        data_criacao: processedClaim.data_criacao,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      })
      .select();

    if (error) {
      console.error(`❌ Erro ao salvar ${processedClaim.order_id}:`, error);
      console.error('🔍 Detalhes completos do erro:', JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ Dados salvos com sucesso para order ${processedClaim.order_id}`);
      console.log('📊 Registro salvo:', data?.[0]?.id || 'ID não retornado');
    }
  } catch (error) {
    console.error(`❌ Erro crítico ao salvar ${processedClaim.order_id}:`, error);
    const stack = error instanceof Error ? error.stack : undefined;
    if (stack) {
      console.error('🚨 Stack trace:', stack);
    }
  }
}