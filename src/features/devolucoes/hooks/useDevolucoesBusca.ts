/**
 * 🔍 HOOK CONSOLIDADO DE BUSCA DE DEVOLUÇÕES
 * Une toda lógica de busca em um só lugar com otimização para tempo real
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { reasonsCacheService } from '../utils/DevolucaoCacheService';
import { fetchClaimsAndReturns, fetchReasonDetail, fetchAllClaims } from '../utils/MLApiClient';
import { mapReasonWithApiData } from '../utils/DevolucaoReasonsMapper';
import { sortByDataCriacao } from '../utils/DevolucaoSortUtils';
import {
  mapDadosPrincipais,
  mapDadosFinanceiros,
  mapDadosReview,
  mapDadosSLA,
  mapDadosRastreamento,
  mapDadosMediacao,
  mapDadosReputacao,
  mapDadosAnexos,
  mapDadosTimeline,
  mapDadosMensagens,
  mapDadosComprador,
  mapDadosPagamento,
  mapDadosProduto,
  mapDadosFlags,
  mapDadosQualidade,
  mapDadosTroca,
  mapDadosClassificacao,
  mapDadosAdicionais,
  mapDadosBrutos
} from '../utils/DevolucaoDataMapper';

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
    const cacheKey = `${integrationAccountId}:${reasonId}`;
    const cached = reasonsCacheService.get(cacheKey);
    
    if (cached) {
      reasonsCacheService.updateStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      setCacheStats(reasonsCacheService.getStats());
      return cached;
    }
    
    reasonsCacheService.updateStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    setCacheStats(reasonsCacheService.getStats());

    try {
      const data = await fetchReasonDetail(integrationAccountId, reasonId);
      
      if (data) {
        reasonsCacheService.set(cacheKey, data);
        setCacheStats(reasonsCacheService.getStats());
      }

      return data;
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

  // mapReasonWithApiData agora vem de DevolucaoReasonsMapper.ts

  // Buscar da API ML em tempo real
  const buscarDaAPI = useCallback(async (
    filtros: DevolucaoBuscaFilters,
    mlAccounts: any[]
  ) => {
    // 🛡️ VALIDAÇÃO + FALLBACK AUTOMÁTICO
    const contasParaBuscar = filtros.contasSelecionadas?.length 
      ? filtros.contasSelecionadas 
      : mlAccounts.map(acc => acc.id);
    
    if (!contasParaBuscar || contasParaBuscar.length === 0) {
      toast.error('Nenhuma conta ML disponível');
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
      
      for (const accountId of contasParaBuscar) {
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
              return !reasonsCacheService.has(cacheKey);
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
              
              // ✅ USAR FUNÇÕES UTILITÁRIAS DE MAPEAMENTO (reduz duplicação)
              const dadosPrincipais = mapDadosPrincipais(item, accountId, account.name);
              const dadosFinanceiros = mapDadosFinanceiros(item);
              const dadosReview = mapDadosReview(item);
              const dadosSLA = mapDadosSLA(item);
              const dadosRastreamento = mapDadosRastreamento(item);
              const dadosMediacao = mapDadosMediacao(item);
              const dadosReputacao = mapDadosReputacao(item);
              const dadosAnexos = mapDadosAnexos(item);
              const dadosTimeline = mapDadosTimeline(item);
              const dadosMensagens = mapDadosMensagens(item);
              const dadosComprador = mapDadosComprador(item);
              const dadosPagamento = mapDadosPagamento(item);
              const dadosProduto = mapDadosProduto(item);
              const dadosFlags = mapDadosFlags(item);
              const dadosQualidade = mapDadosQualidade(item);
              const dadosTroca = mapDadosTroca(item);

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

              // 🎯 CLASSIFICAÇÃO E RESOLUÇÃO - USAR UTILITÁRIO
              const dadosClassificacao = mapDadosClassificacao(item, reasonId);
              const dadosAdicionais = mapDadosAdicionais(item);
              const dadosBrutos = mapDadosBrutos(item);

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

            // 📅 ORDENAR POR DATA - USAR UTILITÁRIO
            sortByDataCriacao(devolucoesProcesadas);

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

      // 📅 ORDENAR RESULTADO FINAL - USAR UTILITÁRIO
      sortByDataCriacao(todasDevolucoes);

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
          // Buscar orders com claims - SEM LIMITE para trazer todas
          const { data: ordersWithClaims, error: ordersError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('has_claims', true)
            .limit(1000); // Aumentado para 1000 (limite máximo do Supabase)

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
      reasonsCacheService.clear();
      setCacheStats(reasonsCacheService.getStats());
    }
  };
}