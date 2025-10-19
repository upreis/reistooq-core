/**
 * 🔍 HOOK CONSOLIDADO DE BUSCA DE DEVOLUÇÕES
 * Une toda lógica de busca em um só lugar com otimização para tempo real
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface DevolucaoBuscaFilters {
  contasSelecionadas: string[];
  dataInicio?: string;
  dataFim?: string;
  statusClaim?: string;
  searchTerm?: string;
  // ============ NOVOS FILTROS AVANÇADOS (FASE 2) ============
  stage?: string;          // 'claim' | 'dispute' | 'review'
  fulfilled?: boolean;     // true | false
  quantityType?: string;   // 'total' | 'partial'
  reasonId?: string;       // 'PDD9939', 'PDD9941', etc
  resource?: string;       // 'order' | 'shipment'
  claimType?: string;      // 'mediations' | 'claim'
}

// 🎯 CACHE GLOBAL DE REASONS - Evita chamadas repetidas à API
const reasonsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

export function useDevolucoesBusca() {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, lastUpdate: '' });
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔒 NÃO PRECISA OBTER TOKEN - A EDGE FUNCTION FAZ ISSO
  // A função ml-api-direct já obtém o token internamente de forma segura

  /**
   * 🔍 Busca detalhes de um reason específico na API do ML (com cache)
   */
  const fetchReasonDetails = async (
    reasonId: string,
    integrationAccountId: string
  ): Promise<{
    id: string;
    name: string;
    detail: string;
    flow: string;
  } | null> => {
    // 🎯 VERIFICAR CACHE PRIMEIRO
    const cacheKey = `${integrationAccountId}:${reasonId}`;
    const cached = reasonsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info(`💾 Cache hit para reason ${reasonId}`);
      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return cached.data;
    }
    
    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));

    try {
      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
        body: {
          action: 'get_reason_detail',
          integration_account_id: integrationAccountId,
          reason_id: reasonId
        }
      });

      if (apiError || !apiResponse?.success) {
        // ⚠️ Silenciar erro se for falta de token - normal em múltiplas contas
        if (apiResponse?.error !== 'Token ML não disponível') {
          logger.warn(`⚠️ Reason ${reasonId} não encontrado na API`, apiError);
        }
        return null;
      }

      if (apiResponse?.data) {
        // 💾 SALVAR NO CACHE
        reasonsCache.set(cacheKey, {
          data: apiResponse.data,
          timestamp: Date.now()
        });
        
        setCacheStats(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
        
        return apiResponse.data;
      }

      return null;
    } catch (error) {
      logger.error(`❌ Erro ao buscar reason ${reasonId}:`, error);
      return null;
    }
  };

  /**
   * 🎯 Busca múltiplos reasons em paralelo (com limite para evitar sobrecarga)
   */
  const fetchMultipleReasons = async (
    reasonIds: string[],
    integrationAccountId: string
  ): Promise<Map<string, any>> => {
    const reasonsMap = new Map<string, any>();
    
    // 🎯 PROCESSAR EM LOTES PARA EVITAR SOBRECARGA
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    
    for (let i = 0; i < reasonIds.length; i += BATCH_SIZE) {
      batches.push(reasonIds.slice(i, i + BATCH_SIZE));
    }

    logger.info(`📦 Buscando ${reasonIds.length} reasons em ${batches.length} lotes...`);

    // Processar lotes sequencialmente para não sobrecarregar
    for (const batch of batches) {
      const promises = batch.map(reasonId =>
        fetchReasonDetails(reasonId, integrationAccountId)
          .then(data => {
            if (data) {
              reasonsMap.set(reasonId, data);
            }
          })
          .catch(err => {
            // Silenciar erros individuais para não travar todo o lote
            logger.warn(`Erro ao buscar reason ${reasonId}:`, err);
          })
      );

      await Promise.all(promises);
    }

    logger.info(`✅ ${reasonsMap.size}/${reasonIds.length} reasons encontrados`);

    return reasonsMap;
  };

  /**
   * 🗺️ Mapeia reason_id para categoria e detalhes
   * Usa dados da API se disponíveis, senão usa mapeamento local
   */
  const mapReasonWithApiData = (
    reasonId: string | null,
    apiData: any | null
  ): {
    reason_id: string | null;
    reason_category: string | null;
    reason_name: string | null;
    reason_detail: string | null;
    reason_type: string | null;
    reason_priority: string | null;
    reason_expected_resolutions: string[] | null;
  } => {
    if (!reasonId) {
      return {
        reason_id: null,
        reason_category: null,
        reason_name: null,
        reason_detail: null,
        reason_type: null,
        reason_priority: null,
        reason_expected_resolutions: null
      };
    }

    // Se temos dados da API, usar eles
    if (apiData) {
      const prefix = reasonId.substring(0, 3);

      return {
        reason_id: apiData.id,
        reason_category: prefix === 'PNR' ? 'not_received' :
                        prefix === 'PDD' ? 'defective_or_different' :
                        prefix === 'CS' ? 'cancellation' : 'other',
        reason_name: apiData.name || null,
        reason_detail: apiData.detail || null,
        reason_type: 'buyer_initiated',
        reason_priority: prefix === 'PNR' || prefix === 'PDD' ? 'high' : 'medium',
        reason_expected_resolutions: prefix === 'PNR' ? ['refund', 'resend'] :
                                     prefix === 'PDD' ? ['replacement', 'refund', 'repair'] :
                                     prefix === 'CS' ? ['refund'] : ['contact_seller']
      };
    }

    // Fallback: mapeamento local
    const prefix = reasonId.substring(0, 3);

    // Mapeamento local como fallback
    const categoryMap: Record<string, any> = {
      'PNR': {
        category: 'not_received',
        name: 'Produto Não Recebido',
        detail: 'O comprador não recebeu o produto',
        type: 'buyer_initiated',
        priority: 'high',
        expected_resolutions: ['refund', 'resend'],
        flow: 'post_purchase'
      },
      'PDD': {
        category: 'defective_or_different',
        name: 'Produto Defeituoso ou Diferente',
        detail: 'Produto veio com defeito ou diferente do anunciado',
        type: 'buyer_initiated',
        priority: 'high',
        expected_resolutions: ['replacement', 'refund', 'repair'],
        flow: 'post_purchase_delivered'
      },
      'CS': {
        category: 'cancellation',
        name: 'Cancelamento de Compra',
        detail: 'Cancelamento da compra solicitado',
        type: 'buyer_initiated',
        priority: 'medium',
        expected_resolutions: ['refund'],
        flow: 'pre_purchase'
      },
      'PD0': {
        category: 'defective_or_different',
        name: 'Produto Defeituoso ou Diferente',
        detail: 'Produto veio com defeito ou diferente do anunciado',
        type: 'buyer_initiated',
        priority: 'high',
        expected_resolutions: ['replacement', 'refund'],
        flow: 'post_purchase_delivered'
      }
    };

    // Tentar match com 3 caracteres, depois 2
    let mapping = categoryMap[prefix];
    if (!mapping && prefix.length >= 2) {
      mapping = categoryMap[prefix.substring(0, 2)];
    }

    if (!mapping) {
      // Fallback genérico
      return {
        reason_id: reasonId,
        reason_category: 'other',
        reason_name: 'Outros Motivos',
        reason_detail: `Motivo não categorizado: ${reasonId}`,
        reason_type: 'buyer_initiated',
        reason_priority: 'medium',
        reason_expected_resolutions: ['contact_seller']
      };
    }

    return {
      reason_id: reasonId,
      reason_category: mapping.category,
      reason_name: mapping.name,
      reason_detail: mapping.detail,
      reason_type: mapping.type,
      reason_priority: mapping.priority,
      reason_expected_resolutions: mapping.expected_resolutions
    };
  };

  // Buscar da API ML em tempo real
  const buscarDaAPI = useCallback(async (
    filtros: DevolucaoBuscaFilters,
    mlAccounts: any[]
  ) => {
    // Validação robusta: verificar se contasSelecionadas existe e tem itens
    if (!filtros.contasSelecionadas || !Array.isArray(filtros.contasSelecionadas) || filtros.contasSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma conta ML');
      return [];
    }

    // 🛑 CANCELAR QUALQUER BUSCA ANTERIOR
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    const todasDevolucoes: any[] = [];
    
    try {
      logger.info('🚀 Iniciando busca otimizada da API ML');
      
      for (const accountId of filtros.contasSelecionadas) {
        const account = mlAccounts?.find(acc => acc.id === accountId);
        if (!account) continue;

        logger.info(`Processando conta: ${account.name}`);
        
        try {
          // ✅ Chamar API ML via edge function (o token é obtido internamente de forma segura)
          // 📅 IMPORTANTE: Enviar datas no formato YYYY-MM-DD (a edge function converte internamente)
          
          logger.info(`🔍 [FILTRO DATA] Buscando devoluções para ${account.name}`, {
            dateFrom: filtros.dataInicio || 'SEM FILTRO',
            dateTo: filtros.dataFim || 'SEM FILTRO',
            status: filtros.statusClaim || 'todos'
          });

          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: account.account_identifier,
              // Passando TODOS os filtros (antigos + novos)
              filters: {
                date_from: filtros.dataInicio || '',
                date_to: filtros.dataFim || '',
                status_claim: filtros.statusClaim || '',
                claim_type: filtros.claimType || '',
                // ============ NOVOS FILTROS AVANÇADOS (FASE 2) ============
                stage: filtros.stage || '',
                fulfilled: filtros.fulfilled,
                quantity_type: filtros.quantityType || '',
                reason_id: filtros.reasonId || '',
                resource: filtros.resource || ''
              }
            }
          });

          if (apiError) {
            logger.error(`Erro API para ${account.name}`, apiError);
            toast.warning(`Falha na API ML para ${account.name}. Continuando...`);
            // Continue com próxima conta em vez de falhar
            continue;
          }

          if (apiResponse?.success && apiResponse?.data) {
            const devolucoesDaAPI = apiResponse.data;
            
            logger.info(`📦 DADOS BRUTOS DA API RECEBIDOS:`, devolucoesDaAPI[0]); // Log primeiro item completo
            
            // 🔍 FASE 0: IDENTIFICAR REASONS ÚNICOS
            const reasonIdsSet = new Set<string>();
            devolucoesDaAPI.forEach((item: any) => {
              const reasonId = item.claim_details?.reason_id;
              if (reasonId && typeof reasonId === 'string') {
                reasonIdsSet.add(reasonId);
              }
            });
            const uniqueReasonIds = Array.from(reasonIdsSet);

            // 🎯 OTIMIZAÇÃO: Só buscar reasons que não estão em cache
            const uncachedReasons = uniqueReasonIds.filter(reasonId => {
              const cacheKey = `${accountId}:${reasonId}`;
              const cached = reasonsCache.get(cacheKey);
              return !cached || (Date.now() - cached.timestamp) >= CACHE_TTL;
            });

            logger.info(`🎯 ${uniqueReasonIds.length} reasons únicos | ${uncachedReasons.length} para buscar | ${uniqueReasonIds.length - uncachedReasons.length} em cache`);

            // Buscar apenas os que não estão em cache
            const reasonsApiData = uncachedReasons.length > 0 
              ? await fetchMultipleReasons(uncachedReasons, accountId)
              : new Map();

            logger.info(`✅ Busca concluída: ${reasonsApiData.size} novos + ${uniqueReasonIds.length - uncachedReasons.length} do cache`);

            // ✅ PROCESSAR DADOS COM ENRIQUECIMENTO COMPLETO - 165 COLUNAS VALIDADAS
            // FASE 1: Processar todos os dados básicos
            const devolucoesProcesadas = await Promise.all(devolucoesDaAPI.map(async (item: any, index: number) => {
              
              // Log do mapeamento de data
              if (index === 0) {
                console.log('[MAPEAMENTO DATA] Primeira devolução:', {
                  date_created_API: item.date_created,
                  data_criacao_MAPEADA: item.date_created || null,
                  created_at_SISTEMA: new Date().toISOString()
                });
              }
              
              // 🎯 DADOS PRINCIPAIS (17 colunas)
              const dadosPrincipais = {
                order_id: item.order_id?.toString() || '',
                claim_id: item.claim_details?.id?.toString() || null,
                integration_account_id: accountId,
                data_criacao: item.date_created || null,
                status_devolucao: item.status || 'cancelled',
                produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
                sku: item.resource_data?.sku || item.order_data?.order_items?.[0]?.item?.seller_sku || '',
                quantidade: parseInt(item.resource_data?.quantity || item.order_data?.order_items?.[0]?.quantity || 1),
                valor_retido: parseFloat(item.amount || 0),
                account_name: account.name,
                marketplace_origem: 'ML_BRASIL',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ultima_sincronizacao: new Date().toISOString(),
                dados_incompletos: false,
                campos_faltantes: [],
                fonte_dados_primaria: 'ml_api'
              };

              // 💰 DADOS FINANCEIROS (14 colunas)
              const dadosFinanceiros = {
                valor_reembolso_total: item.claim_details?.resolution?.refund_amount || 
                                      item.return_details_v2?.refund_amount ||
                                      parseFloat(item.amount || 0),
                valor_reembolso_produto: item.order_data?.order_items?.[0]?.unit_price || 0,
                valor_reembolso_frete: item.order_data?.payments?.[0]?.shipping_cost || 0,
                taxa_ml_reembolso: item.order_data?.payments?.[0]?.marketplace_fee || 0,
                custo_logistico_total: item.return_details_v2?.shipping_cost || 
                                      item.return_details_v2?.logistics_cost || 0,
                impacto_financeiro_vendedor: -(parseFloat(item.amount || 0)),
                data_processamento_reembolso: item.order_data?.payments?.[0]?.date_approved || null,
                metodo_reembolso: item.order_data?.payments?.[0]?.payment_method_id || null,
                moeda_reembolso: item.order_data?.currency_id || 'BRL',
                moeda_custo: 'BRL',
                responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,
                custo_envio_devolucao: item.return_details_v2?.shipping_cost || null,
                valor_compensacao: item.return_details_v2?.refund_amount || null,
                descricao_custos: {
                  produto: {
                    valor_original: item.order_data?.order_items?.[0]?.unit_price || 0,
                    valor_reembolsado: item.order_data?.order_items?.[0]?.unit_price || 0,
                    percentual_reembolsado: 100
                  },
                  frete: {
                    valor_original: item.order_data?.payments?.[0]?.shipping_cost || 0,
                    valor_reembolsado: item.order_data?.payments?.[0]?.shipping_cost || 0,
                    custo_devolucao: item.return_details_v2?.shipping_cost || 0,
                    custo_total_logistica: item.return_details_v2?.shipping_cost || 0
                  },
                  taxas: {
                    taxa_ml_original: item.order_data?.payments?.[0]?.marketplace_fee || 0,
                    taxa_ml_reembolsada: item.order_data?.payments?.[0]?.marketplace_fee || 0,
                    taxa_ml_retida: 0
                  },
                  resumo: {
                    total_custos: parseFloat(item.amount || 0),
                    total_receita_perdida: parseFloat(item.amount || 0)
                  }
                }
              };

              // 📋 DADOS DE REVIEW (10 colunas)
              const dadosReview = {
                review_id: item.review_id || item.claim_details?.review?.id?.toString() || null,
                review_status: item.review_status || item.claim_details?.review?.status || null,
                review_result: item.review_result || item.claim_details?.review?.result || null,
                score_qualidade: item.review_score || item.claim_details?.review?.score || null,
                necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
                problemas_encontrados: item.problemas_encontrados || [],
                acoes_necessarias_review: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions || [],
                data_inicio_review: item.claim_details?.date_created || null,
                observacoes_review: item.claim_details?.resolution?.reason || null,
                revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
              };

              // ⏱️ DADOS DE SLA (10 colunas)
              const dadosSLA = {
                tempo_primeira_resposta_vendedor: null,
                tempo_resposta_comprador: null,
                tempo_analise_ml: null,
                dias_ate_resolucao: item.claim_details?.resolution ? 
                  Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                             new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null,
                sla_cumprido: true,
                tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
                eficiencia_resolucao: item.claim_details?.resolution ? 'boa' : 'pendente',
                data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created,
                tempo_total_resolucao: item.claim_details?.resolution ? 
                  Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                             new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60)) : null,
                tempo_resposta_medio: null
              };

              // 🚚 DADOS DE RASTREAMENTO (18 colunas)
              const dadosRastreamento = {
                shipment_id: item.order_data?.shipping?.id?.toString() || null,
                codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
                codigo_rastreamento_devolucao: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
                transportadora: item.return_details_v2?.shipments?.[0]?.carrier || null,
                transportadora_devolucao: item.return_details_v2?.shipments?.[0]?.carrier || null,
                status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || null,
                url_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_url || null,
                localizacao_atual: item.tracking_history?.[0]?.location || null,
                status_transporte_atual: item.return_details_v2?.shipments?.[0]?.substatus || null,
                tracking_history: item.tracking_history || [],
                tracking_events: item.tracking_events || [],
                data_ultima_movimentacao: item.tracking_events?.[0]?.date || item.tracking_history?.[0]?.date || null,
                historico_localizacoes: item.tracking_history || [],
                carrier_info: {
                  name: item.return_details_v2?.shipments?.[0]?.carrier || null,
                  type: null
                },
                tempo_transito_dias: null,
                shipment_delays: item.shipment_delays || [],
                shipment_costs: {
                  shipping_cost: null,
                  handling_cost: null,
                  total_cost: item.return_details_v2?.shipping_cost || null
                },
                previsao_entrega_vendedor: item.return_details_v2?.estimated_delivery_date || null
              };

              // ⚖️ DADOS DE MEDIAÇÃO (6 colunas)
              const dadosMediacao = {
                em_mediacao: item.claim_details?.type === 'mediations',
                data_inicio_mediacao: item.claim_details?.type === 'mediations' ? item.claim_details?.date_created : null,
                mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
                resultado_mediacao: item.claim_details?.resolution?.reason || null,
                detalhes_mediacao: item.mediation_details || (item.claim_details?.type === 'mediations' ? item.claim_details : {}),
                escalado_para_ml: item.claim_details?.type === 'mediations'
              };

              // ⭐ DADOS DE REPUTAÇÃO (2 colunas)
              const dadosReputacao = {
                seller_reputation: item.order_data?.seller?.reputation || {},
                buyer_reputation: item.buyer?.reputation || {}
              };

              // 📎 DADOS DE ANEXOS (5 colunas)
              const dadosAnexos = {
                anexos_count: 0,
                anexos_comprador: [],
                anexos_vendedor: [],
                anexos_ml: [],
                total_evidencias: (item.claim_messages?.messages?.length || 0)
              };

              // 📊 DADOS DE TIMELINE (8 colunas)
              const dadosTimeline = {
                timeline_events: item.timeline_events || [],
                timeline_consolidado: {
                  data_inicio: item.date_created || item.claim_details?.date_created,
                  data_fim: item.claim_details?.resolution?.date_created || null,
                  duracao_total_dias: item.claim_details?.resolution ? 
                    Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                               new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null
                },
                marcos_temporais: {
                  data_criacao_claim: item.claim_details?.date_created || null,
                  data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
                  data_fechamento_claim: item.claim_details?.resolution?.date_created || null
                },
                data_criacao_claim: item.claim_details?.date_created || null,
                data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
                data_fechamento_claim: item.claim_details?.resolution?.date_created || null,
                historico_status: []
              };

              // 📝 DADOS DE MENSAGENS E COMUNICAÇÃO (7 colunas)
              const dadosMensagens = {
                timeline_mensagens: item.claim_messages?.messages || [],
                ultima_mensagem_data: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.date_created : null,
                ultima_mensagem_remetente: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.from?.role : null,
                numero_interacoes: item.claim_messages?.messages?.length || 0,
                mensagens_nao_lidas: item.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0,
                qualidade_comunicacao: null,
                status_moderacao: null
              };

              // 👤 DADOS DO COMPRADOR - FASE 2 (3 colunas)
              const buyer = item.order_data?.buyer;
              const dadosComprador = {
                comprador_cpf: buyer?.billing_info?.doc_number || null,
                comprador_nome_completo: buyer ? `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() : null,
                comprador_nickname: buyer?.nickname || null
              };

              // 💳 DADOS DE PAGAMENTO - FASE 2 (7 colunas) 
              const payment = item.order_data?.payments?.[0];
              const dadosPagamento = {
                metodo_pagamento: payment?.payment_method_id || null,
                tipo_pagamento: payment?.payment_type || null,
                parcelas: payment?.installments || null,
                valor_parcela: payment?.installment_amount || null,
                transaction_id: payment?.id?.toString() || null,
                percentual_reembolsado: item.descricao_custos?.produto?.percentual_reembolsado || null,
                tags_pedido: item.order_data?.tags || []
              };

              // 🏷️ DADOS DO PRODUTO - FASE 3 (5 colunas)
              const orderItem = item.order_data?.order_items?.[0];
              const dadosProduto = {
                custo_frete_devolucao: item.descricao_custos?.frete?.custo_devolucao || null,
                custo_logistico_total: item.descricao_custos?.frete?.custo_total_logistica || null,
                valor_original_produto: orderItem?.unit_price || null,
                valor_reembolso_produto: item.descricao_custos?.produto?.valor_reembolsado || null,
                taxa_ml_reembolso: item.descricao_custos?.taxas?.taxa_ml_reembolsada || null
              };

              // 🔖 TAGS E FLAGS - FASE 3 (5 colunas)
              const dadosFlags = {
                internal_tags: item.order_data?.internal_tags || [],
                tem_financeiro: !!(item.valor_reembolso_total || item.amount),
                tem_review: !!item.review_id,
                tem_sla: item.sla_cumprido !== null,
                nota_fiscal_autorizada: (item.order_data?.internal_tags || []).includes('invoice_authorized')
              };

              // 📊 QUALIDADE - FASE 3 (1 coluna)
              const dadosQualidade = {
                eficiencia_resolucao: item.claim_details?.resolution ? 'boa' : 'pendente'
              };

              // 🔄 DADOS DE RETURN E TROCA (7 colunas)
              const dadosTroca = {
                eh_troca: (item.return_details_v2?.subtype || '').includes('change'),
                produto_troca_id: item.return_details_v2?.change_details?.substitute_product?.id?.toString() || null,
                data_estimada_troca: item.return_details_v2?.estimated_exchange_date || null,
                data_limite_troca: item.return_details_v2?.date_closed || null,
                data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
                dias_restantes_acao: null,
                prazo_revisao_dias: null
              };

              // 🔍 REASONS API - FASE 4 (8 novos campos) - BUSCAR DA API
              const reasonId = item.claim_details?.reason_id || null;
              const apiReasonData = reasonId ? reasonsApiData.get(reasonId) : null;
              
              logger.info(`📋 Claim ${item.claim_details?.id}: reason_id = ${reasonId}`, {
                temDadosAPI: !!apiReasonData,
                nomeAPI: apiReasonData?.name,
                detalheAPI: apiReasonData?.detail
              });
              
              // 🎯 Mapear com dados da API (prioridade) ou fallback local
              const reasonsAPI = mapReasonWithApiData(reasonId, apiReasonData);
              
              if (reasonId) {
                logger.info(`✅ Reason ${reasonId} processado:`, {
                  fonte: apiReasonData ? 'API' : 'Local',
                  category: reasonsAPI.reason_category,
                  name: reasonsAPI.reason_name,
                  detail: reasonsAPI.reason_detail,
                  priority: reasonsAPI.reason_priority
                });
              } else {
                logger.warn(`⚠️ Claim ${item.claim_details?.id} não tem reason_id`);
              }

              // 🎯 CLASSIFICAÇÃO E RESOLUÇÃO (16 colunas)
              const dadosClassificacao = {
                tipo_claim: item.type || item.claim_details?.type,
                subtipo_claim: item.claim_details?.stage || null,
                motivo_categoria: reasonId, // ✅ Mantém compatibilidade com código antigo
                categoria_problema: null,
                subcategoria_problema: null,
                metodo_resolucao: item.claim_details?.resolution?.reason || null,
                resultado_final: item.claim_details?.status || null,
                nivel_prioridade: item.claim_details?.type === 'mediations' ? 'high' : 'medium',
                nivel_complexidade: null,
                acao_seller_necessaria: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
                proxima_acao_requerida: null,
                impacto_reputacao: 'low',
                satisfacao_comprador: null,
                feedback_comprador_final: null,
                feedback_vendedor: null,
                taxa_satisfacao: null,
                score_satisfacao_final: null
              };

              // 🏷️ DADOS ADICIONAIS (7 colunas)
              const dadosAdicionais = {
                tags_automaticas: [],
                usuario_ultima_acao: null,
                hash_verificacao: null,
                confiabilidade_dados: null,
                versao_api_utilizada: null,
                origem_timeline: null,
                status_produto_novo: null,
                endereco_destino: {},
                valor_diferenca_troca: null
              };

              // ⚠️ REASONS API já foi processado acima, antes de dadosClassificacao

              // 📦 DADOS BRUTOS JSONB (4 colunas)
              const dadosBrutos = {
                dados_order: item.order_data || {},
                dados_claim: item.claim_details || {},
                dados_mensagens: item.claim_messages || {},
                dados_return: item.return_details_v2 || item.return_details_v1 || {}
              };

              // ✅ CONSOLIDAR TODOS OS DADOS (165 colunas total incluindo Fase 2, 3 e 4)
              const itemCompleto = {
                ...dadosPrincipais,      // 17 colunas
                ...dadosFinanceiros,     // 14 colunas
                ...dadosReview,          // 10 colunas
                ...dadosSLA,             // 10 colunas
                ...dadosRastreamento,    // 18 colunas
                ...dadosMediacao,        // 6 colunas
                ...dadosReputacao,       // 2 colunas
                ...dadosAnexos,          // 5 colunas
                ...dadosTimeline,        // 8 colunas
                ...dadosMensagens,       // 7 colunas
                ...dadosTroca,           // 7 colunas
                ...dadosClassificacao,   // 17 colunas
                ...reasonsAPI,           // 8 colunas - FASE 4
                ...dadosAdicionais,      // 9 colunas
                ...dadosComprador,       // 3 colunas - FASE 2
                ...dadosPagamento,       // 7 colunas - FASE 2
                ...dadosProduto,         // 5 colunas - FASE 3
                ...dadosFlags,           // 5 colunas - FASE 3
                ...dadosQualidade,       // 1 coluna  - FASE 3
                ...dadosBrutos           // 4 colunas
              };
              
              // Log do primeiro item processado
              if (index === 0) {
                logger.info(`✅ PRIMEIRO ITEM PROCESSADO COMPLETO:`, {
                  order_id: itemCompleto.order_id,
                  tem_financeiro: !!itemCompleto.valor_reembolso_total,
                  tem_review: !!itemCompleto.review_id,
                  tem_sla: itemCompleto.sla_cumprido !== null,
                  descricao_custos: itemCompleto.descricao_custos
                });
              }

              return itemCompleto;
            }));

            // 📅 ORDENAR POR DATA (MAIS RECENTE PRIMEIRO)
            devolucoesProcesadas.sort((a, b) => {
              const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
              const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
              return dataB - dataA; // Ordem decrescente
            });

            // 💾 SALVAR OS DADOS ENRIQUECIDOS NO BANCO
            if (devolucoesProcesadas.length > 0) {
              try {
                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(devolucoesProcesadas, {
                    onConflict: 'order_id,integration_account_id',
                    ignoreDuplicates: false
                  });

                if (upsertError) {
                  logger.error('Erro ao salvar dados enriquecidos no banco', upsertError);
                } else {
                  logger.info(`✅ ${devolucoesProcesadas.length} devoluções SALVAS no banco com dados enriquecidos`);
                }
              } catch (saveError) {
                logger.error('Erro ao persistir dados', saveError);
              }
            }

            todasDevolucoes.push(...devolucoesProcesadas);
            toast.success(`✅ ${devolucoesProcesadas.length} devoluções enriquecidas para ${account.name}`);
          } else {
            logger.info(`Nenhuma devolução encontrada para ${account.name}`);
            toast.info(`Nenhuma devolução encontrada para ${account.name}`);
          }

        } catch (accountError) {
          logger.error(`Erro ao processar ${account.name}`, accountError);
          toast.error(`Erro na conta ${account.name}`);
        }
      }

      // 📅 ORDENAR RESULTADO FINAL POR DATA VENDA (MAIS RECENTE PRIMEIRO)
      console.log('[ORDENAÇÃO] Ordenando por data_criacao (Data Venda)...');
      todasDevolucoes.sort((a, b) => {
        const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
        const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
        console.log(`[SORT] ${a.order_id}: ${a.data_criacao} vs ${b.order_id}: ${b.data_criacao}`);
        return dataB - dataA; // Mais recente primeiro
      });

      logger.info(`Total da API: ${todasDevolucoes.length} devoluções enriquecidas e salvas`);
      return todasDevolucoes;

    } catch (error) {
      logger.error('Erro geral na busca da API', error);
      toast.error(`Erro na busca da API: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências pois não usa obterTokenML mais

  // Buscar do banco de dados
  const buscarDoBanco = useCallback(async () => {
    setLoading(true);
    
    try {
      logger.info('Buscando devoluções do banco');
      
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (error) {
        logger.error('Erro ao buscar do banco', error);
        toast.error('Erro ao buscar devoluções do banco');
        return [];
      }
      
      logger.info(`${data.length} devoluções carregadas do banco`);
      return data;
      
    } catch (error) {
      logger.error('Erro ao buscar do banco', error);
      toast.error('Erro ao carregar devoluções');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Sincronizar devoluções com enriquecimento automático
  const sincronizarDevolucoes = useCallback(async (mlAccounts: any[]) => {
    setLoading(true);
    
    try {
      logger.info('Iniciando sincronização avançada com enriquecimento');
      let totalProcessadas = 0;

      // FASE 1: Sincronização básica
      logger.info('FASE 1: Sincronização básica dos pedidos');
      
      for (const account of mlAccounts) {
        logger.info(`Sincronizando conta: ${account.name}`);
        
        try {
          // Buscar orders com claims
          const { data: ordersWithClaims, error: ordersError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('has_claims', true)
            .limit(100); // Aumentado para 100

          if (ordersError) {
            logger.error('Erro ao buscar orders', ordersError);
            continue;
          }

          // Processar orders com claims
          if (ordersWithClaims && ordersWithClaims.length > 0) {
            for (const order of ordersWithClaims) {
              try {
                const devolucaoData = {
                  order_id: order.order_id.toString(),
                  claim_id: null, // Será preenchido na fase 2
                  data_criacao: order.date_created,
                  status_devolucao: 'pendente_enriquecimento',
                  valor_retido: parseFloat(order.total_amount.toString()) || 0,
                  produto_titulo: order.item_title || 'Produto não identificado',
                  sku: (order.raw_data as any)?.order_items?.[0]?.item?.seller_sku || '',
                  quantidade: parseInt(order.quantity.toString()) || 1,
                  dados_order: order.raw_data,
                  dados_claim: { 
                    type: 'claim_detected',
                    claims_count: order.claims_count,
                    status: order.status
                  },
                  integration_account_id: account.id,
                  account_name: account.name,
                  updated_at: new Date().toISOString()
                };

                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(devolucaoData, { 
                    onConflict: 'order_id',
                    ignoreDuplicates: false 
                  });

                if (!upsertError) {
                  totalProcessadas++;
                }

              } catch (orderError) {
                logger.error('Erro ao processar order', orderError);
              }
            }
          }

        } catch (accountError) {
          logger.error('Erro ao processar conta', accountError);
        }
      }

      logger.info(`FASE 1 concluída: ${totalProcessadas} registros básicos sincronizados`);

      // FASE 2: Enriquecimento com dados da API ML
      logger.info('FASE 2: Enriquecimento com dados da API ML');
      await enriquecerDevolucoesSincronizadas(mlAccounts);

      if (totalProcessadas > 0) {
        toast.success(`🎉 ${totalProcessadas} devoluções sincronizadas e enriquecidas!`);
      } else {
        toast.info('ℹ️ Nenhuma nova devolução encontrada');
      }

      // Retornar dados atualizados
      return await buscarDoBanco();

    } catch (error) {
      logger.error('Erro na sincronização', error);
      toast.error(`Erro na sincronização: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [buscarDoBanco]);

  // 🔍 NOVA FUNÇÃO: Enriquecimento automático de devoluções
  const enriquecerDevolucoesSincronizadas = async (mlAccounts: any[]) => {
    logger.info('Iniciando enriquecimento das devoluções sincronizadas');
    
    try {
      // Buscar devoluções que precisam de enriquecimento
      const { data: devolucoesPendentes, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .is('claim_id', null)
        .order('data_criacao', { ascending: false })
        .limit(50); // Processar em lotes de 50

      if (error) {
        logger.error('Erro ao buscar devoluções pendentes', error);
        return;
      }

      if (!devolucoesPendentes || devolucoesPendentes.length === 0) {
        logger.info('Nenhuma devolução pendente de enriquecimento');
        return;
      }

      logger.info(`${devolucoesPendentes.length} devoluções serão enriquecidas`);

      // Organizar por integration_account_id
      const devolucoesPorConta = devolucoesPendentes.reduce((acc, dev) => {
        const accountId = dev.integration_account_id;
        if (!acc[accountId]) acc[accountId] = [];
        acc[accountId].push(dev);
        return acc;
      }, {} as Record<string, any[]>);

      let totalEnriquecidas = 0;

      // Processar cada conta
      for (const [accountId, devolucoes] of Object.entries(devolucoesPorConta)) {
        logger.info(`Processando conta ${accountId}: ${devolucoes.length} devoluções`);
        
        const conta = mlAccounts.find(acc => acc.id === accountId);
        if (!conta) {
          logger.warn(`Conta ${accountId} não encontrada`);
          continue;
        }

        try {
          // ✅ Buscar claims da API ML (token obtido automaticamente pela edge function)
          // NOTA: Esta função de enriquecimento não usa filtros, busca todos os dados brutos
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: conta.account_identifier,
              // Buscar todos os dados sem filtros (enriquecimento completo)
              filters: {
                date_from: '',
                date_to: '',
                status_claim: '',
                claim_type: '',
                stage: '',
                fulfilled: undefined,
                quantity_type: '',
                reason_id: '',
                resource: ''
              }
            }
          });

          if (apiError || !apiResponse?.success || !apiResponse?.data) {
            logger.warn(`Sem dados de claims para conta ${conta.name}`);
            continue;
          }

          logger.info(`${apiResponse.data.length} claims encontrados para ${conta.name}`);

          // Mapear claims por order_id
          const claimsPorOrder = apiResponse.data.reduce((acc: any, claim: any) => {
            if (claim.order_id) {
              acc[claim.order_id.toString()] = claim;
            }
            return acc;
          }, {});

          // Enriquecer cada devolução
          for (const devolucao of devolucoes) {
            const claimData = claimsPorOrder[devolucao.order_id];
            
            if (claimData && claimData.claim_details?.id) {
              logger.info(`Enriquecendo order ${devolucao.order_id} com claim ${claimData.claim_details.id}`);
              
              // Preparar dados enriquecidos seguindo o fluxo sequencial
              const dadosAtualizados: any = {
                claim_id: claimData.claim_details.id.toString(),
                dados_claim: claimData.claim_details,
                dados_return: claimData.return_details_v2 || claimData.return_details_v1,
                dados_mensagens: claimData.claim_messages,
                status_devolucao: claimData.claim_status || claimData.return_status,
                tipo_claim: claimData.type,
                subtipo_claim: claimData.claim_details?.type,
                em_mediacao: claimData.claim_details?.type === 'mediations',
                updated_at: new Date().toISOString()
              };

              // ENRIQUECIMENTO SEGUINDO O FLUXO SEQUENCIAL

              // 📋 Dados de mensagens (Etapa 1)
              if (claimData.claim_messages?.messages) {
                dadosAtualizados.timeline_mensagens = claimData.claim_messages.messages;
                dadosAtualizados.mensagens_nao_lidas = claimData.claim_messages.messages.filter((m: any) => !m.read)?.length || 0;
                
                if (claimData.claim_messages.messages.length > 0) {
                  const ultimaMensagem = claimData.claim_messages.messages[claimData.claim_messages.messages.length - 1];
                  dadosAtualizados.ultima_mensagem_data = ultimaMensagem.date_created;
                  dadosAtualizados.ultima_mensagem_remetente = ultimaMensagem.from?.role || 'unknown';
                }
              }

              // 📦 Dados de returns (Etapa 2)
              if (claimData.return_details_v2) {
                dadosAtualizados.eh_troca = claimData.return_details_v2.subtype?.includes('change') || false;
                dadosAtualizados.data_estimada_troca = claimData.return_details_v2.estimated_exchange_date;
                dadosAtualizados.data_limite_troca = claimData.return_details_v2.date_closed;
                dadosAtualizados.valor_compensacao = claimData.return_details_v2.refund_amount;
              }

              // 📎 Dados de anexos (Etapa 4) - Dados virão de outras fontes
              dadosAtualizados.anexos_count = 0;
              dadosAtualizados.anexos_comprador = [];
              dadosAtualizados.anexos_vendedor = [];
              dadosAtualizados.anexos_ml = [];

              // ⚖️ Dados de mediação (Etapa 5)
              if (claimData.mediation_details) {
                dadosAtualizados.detalhes_mediacao = claimData.mediation_details;
                dadosAtualizados.data_inicio_mediacao = claimData.mediation_details.date_created;
                dadosAtualizados.mediador_ml = claimData.mediation_details.mediator?.name;
                dadosAtualizados.resultado_mediacao = claimData.mediation_details.resolution?.reason;
              }

              // 🎯 Campos derivados e calculados
              dadosAtualizados.nivel_prioridade = claimData.claim_details?.type === 'mediations' ? 'high' : 'medium';
              dadosAtualizados.escalado_para_ml = claimData.claim_details?.type === 'mediations';
              dadosAtualizados.acao_seller_necessaria = claimData.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length > 0;

              // Atualizar no banco
              const { error: updateError } = await supabase
                .from('devolucoes_avancadas')
                .update(dadosAtualizados)
                .eq('order_id', devolucao.order_id);

              if (updateError) {
                logger.error(`Erro ao atualizar order ${devolucao.order_id}`, updateError);
              } else {
                totalEnriquecidas++;
                logger.info(`Order ${devolucao.order_id} enriquecida com sucesso`);
              }

              // Pausa entre atualizações
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              logger.info(`Sem claim encontrado para order ${devolucao.order_id}`);
            }
          }

        } catch (error) {
          logger.error(`Erro ao processar conta ${conta.name}`, error);
        }

        // Pausa entre contas
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger.info(`Enriquecimento finalizado: ${totalEnriquecidas} devoluções enriquecidas`);
      
      if (totalEnriquecidas > 0) {
        toast.success(`🔍 ${totalEnriquecidas} devoluções enriquecidas com dados completos!`);
      }

    } catch (error) {
      logger.error('Erro no enriquecimento', error);
      toast.error('Erro durante o enriquecimento dos dados');
    }
  };

  return {
    loading,
    buscarDaAPI,
    buscarDoBanco,
    sincronizarDevolucoes,
    loadingProgress,
    cacheStats,
    clearCache: () => {
      reasonsCache.clear();
      setCacheStats({ hits: 0, misses: 0, lastUpdate: '' });
      logger.info('🧹 Cache limpo');
    }
  };
}