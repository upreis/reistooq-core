/**
 * 🔍 HOOK CONSOLIDADO DE BUSCA DE DEVOLUÇÕES
 * Une toda lógica de busca em um só lugar com otimização para tempo real
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { structuredLogger } from '@/utils/structuredLogger';
import { reasonsCacheService } from '../utils/DevolucaoCacheService';
import { fetchClaimsAndReturns, fetchReasonDetail, fetchAllClaims } from '../utils/MLApiClient';
import { sortByDataCriacao } from '../utils/DevolucaoSortUtils';
import { mapDevolucaoCompleta } from '../utils/mappers';
import { validateMLAccounts } from '../utils/AccountValidator';

// ===================================
// 🛡️ WHITELIST DE CAMPOS VÁLIDOS DO DB
// ===================================
const VALID_DB_FIELDS = new Set([
  // IDs e Refs
  'id', 'order_id', 'claim_id', 'integration_account_id', 'account_name',
  'shipment_id', 'shipment_id_devolucao', 'review_id', 'transaction_id',
  
  // Dados Básicos
  'marketplace_origem', 'data_criacao', 'created_at', 'updated_at',
  'produto_titulo', 'sku', 'quantidade', 'valor_original_produto',
  
  // Status
  'status_devolucao', 'status_dinheiro', 'subtipo_devolucao', 
  'status_envio_devolucao', 'status_rastreamento', 'status_rastreamento_devolucao',
  'status_rastreamento_pedido', 'status_transporte_atual', 'status_moderacao',
  
  // Claim
  'tipo_claim', 'subtipo_claim', 'claim_stage', 'claim_quantity_type', 'claim_fulfilled',
  'data_criacao_claim', 'data_fechamento_claim',
  
  // Return
  'data_criacao_devolucao', 'data_fechamento_devolucao', 'data_atualizacao_devolucao',
  'data_inicio_return', 'return_intermediate_check', 'return_resource_type',
  
  // Reasons
  'reason_id', 'reason_name', 'reason_detail', 'reason_type', 'reason_category',
  'reason_priority', 'reason_expected_resolutions', 'reason_rules_engine',
  'motivo_categoria', 'categoria_problema',
  
  // Financeiro
  'metodo_pagamento', 'tipo_pagamento', 'parcelas', 'valor_parcela',
  'metodo_reembolso', 'moeda_reembolso', 'moeda_custo', 'responsavel_custo',
  'reembolso_quando', 'valor_retido',
  
  // Rastreamento
  'codigo_rastreamento', 'codigo_rastreamento_devolucao', 'transportadora',
  'transportadora_devolucao', 'tipo_envio_devolucao', 'destino_devolucao',
  'endereco_destino_devolucao', 'localizacao_atual', 'data_ultima_movimentacao',
  'data_ultimo_status', 'descricao_ultimo_status', 'url_rastreamento',
  'timeline_rastreamento',
  
  // Comprador
  'comprador_cpf', 'comprador_nome_completo', 'comprador_nickname',
  
  // Mediação
  'em_mediacao', 'resultado_mediacao', 'metodo_resolucao', 'resultado_final',
  
  // Troca
  'eh_troca', 'produto_troca_id',
  
  // Review
  'review_status', 'review_result', 'observacoes_review', 'revisor_responsavel',
  'satisfacao_comprador',
  
  // Flags
  'internal_tags', 'tags_pedido', 'tags_automaticas', 'tem_financeiro', 
  'tem_review', 'tem_sla', 'nota_fiscal_autorizada',
  
  // Prioridade e Ações
  'nivel_prioridade', 'proxima_acao_requerida', 'acao_seller_necessaria',
  'impacto_reputacao',
  
  // Dados Adicionais
  'usuario_ultima_acao', 'hash_verificacao', 'versao_api_utilizada',
  'origem_timeline', 'status_produto_novo', 'endereco_destino',
  'ultima_sincronizacao', 'fonte_dados_primaria',
  
  // Mensagens
  'numero_interacoes', 'ultima_mensagem_data', 'ultima_mensagem_remetente',
  
  // JSON Data
  'dados_order', 'dados_claim', 'dados_mensagens', 'dados_return',
  'dados_reasons', 'dados_costs', 'dados_reviews', 'anexos_ml',
  'timeline_mensagens', 'timeline_events', 'timeline_consolidado',
  'tracking_history', 'tracking_events', 'historico_status',
  'marcos_temporais', 'shipment_costs', 'carrier_info'
]);

/**
 * 🛡️ FILTRAR APENAS CAMPOS VÁLIDOS
 * Remove qualquer campo que não existe no schema do DB
 */
const filtrarCamposValidos = (obj: any): any => {
  const filtered: any = {};
  
  Object.keys(obj).forEach(key => {
    if (VALID_DB_FIELDS.has(key)) {
      filtered[key] = obj[key];
    }
  });
  
  return filtered;
};

export interface DevolucaoBuscaFilters {
  contasSelecionadas: string[];
  dataInicio?: string;
  dataFim?: string;
  searchTerm?: string;
  // ============ NOVOS FILTROS AVANÇADOS (FASE 2) ============
  stage?: string;          // 'claim' | 'dispute' | 'review'
  fulfilled?: boolean;     // true | false
  quantityType?: string;   // 'total' | 'partial'
  reasonId?: string;       // 'PDD9939', 'PDD9941', etc
  resource?: string;       // 'order' | 'shipment'
  claimType?: string;      // 'mediations' | 'claim'
  // ============ FILTRO POR PERÍODO ============
  periodoDias?: number;    // 7, 15, 30, 60, 90 dias (sempre usa item.date_created)
}

export function useDevolucoesBusca() {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, lastUpdate: '' });
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ 1.3 - CORREÇÃO: Cleanup do AbortController no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

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
    const startTime = performance.now();
    
    // ✅ 2.4 - USAR VALIDAÇÃO CENTRALIZADA
    const validation = validateMLAccounts(mlAccounts, filtros.contasSelecionadas);
    
    if (!validation.valid) {
      logger.error(validation.error, {
        context: 'useDevolucoesBusca.buscarDaAPI',
        mlAccounts: mlAccounts?.length || 0,
        filtros
      });
      structuredLogger.error('Validação de contas falhou', {
        mlAccountsCount: mlAccounts?.length || 0,
        filtros,
        error: validation.error
      });
      toast.error(validation.error || 'Erro ao validar contas');
      return [];
    }
    
    const contasParaBuscar = validation.accountIds;
    
    // ✅ 3.3 - Log estruturado do início da busca
    structuredLogger.info('Iniciando busca de devoluções', {
      accountIds: contasParaBuscar,
      accountsCount: contasParaBuscar.length,
      filters: filtros,
      mode: 'full'
    });

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
          // 📅 Passar período para edge function (sempre usa item.date_created)
          
          logger.info(`🔍 Buscando devoluções para ${account.name}`, {
            periodoDias: filtros.periodoDias || 0
          });

          // 🚀 AUTO-PAGINAÇÃO COMPLETA - Buscar tudo automaticamente
          let allClaims: any[] = [];
          let offset = 0;
          const limit = 100; // Buscar 100 por vez
          let hasMore = true;
          let tentativas = 0;
          const MAX_TENTATIVAS = 50; // Limite de segurança (5000 claims)

          toast.info(`🔄 Buscando todas as devoluções de ${account.name}...`);

          while (hasMore && tentativas < MAX_TENTATIVAS) {
            tentativas++;
            
            try {
          logger.info(`📄 Buscando lote ${tentativas}: offset=${offset}, limit=${limit}`);

              // 🚨 LOG DE DIAGNÓSTICO
              console.error('🚨 [TESTE] CHAMANDO EDGE FUNCTION:', {
                accountId,
                sellerId: account.account_identifier, 
                filtros,
                url: 'ml-api-direct'
              });

              let apiResponse;
              try {
                apiResponse = await fetchClaimsAndReturns(
                  accountId,
                  account.account_identifier,
                  filtros,
                  limit,
                  offset,
                  abortControllerRef.current?.signal
                );

                console.error('🚨 [TESTE] RESPOSTA DA EDGE FUNCTION:', {
                  success: apiResponse?.success,
                  temDados: !!apiResponse?.data,
                  quantidadeDados: apiResponse?.data?.length,
                  pagination: apiResponse?.pagination,
                  apiResponse
                });
              } catch (err: any) {
                // Verificar se foi cancelado
                if (err.name === 'AbortError' || abortControllerRef.current === null) {
                  logger.info('Busca cancelada pelo usuário');
                  return [];
                }
                console.error('🚨 [TESTE] ERRO AO CHAMAR EDGE FUNCTION:', err);
                toast.error(`Erro ao buscar devoluções: ${err.message}`);
                break;
              }

              if (!apiResponse?.success || !apiResponse?.data) {
                console.error('🚨 [TESTE] RESPOSTA INVÁLIDA DA EDGE FUNCTION');
                logger.info(`Fim da busca para ${account.name}`);
                break;
              }

              const batchData = apiResponse.data;
              const pagination = apiResponse.pagination;
              
              // Se recebeu dados vazios, parar
              if (batchData.length === 0) {
                logger.info(`Lote vazio - finalizando busca`);
                break;
              }
              
              allClaims = [...allClaims, ...batchData];
              const totalClaims = pagination?.total || allClaims.length;
              
              logger.info(`✅ Lote ${tentativas}: ${batchData.length} claims | Total: ${allClaims.length}/${totalClaims}`);

              // Atualizar progresso
              setLoadingProgress({
                current: allClaims.length,
                total: totalClaims,
                message: `${allClaims.length}/${totalClaims} devoluções carregadas de ${account.name}...`
              });

              // ✅ LÓGICA MELHORADA: Continuar enquanto houver dados
              hasMore = pagination?.hasMore || false;
              
              // Só parar se realmente não há mais dados OU atingiu limite de segurança
              if (!hasMore) {
                logger.info(`🏁 API ML indica que não há mais dados`);
                break;
              }
              
              if (allClaims.length >= 5000) {
                logger.warn(`⚠️ Limite de segurança atingido: ${allClaims.length} claims`);
                toast.warning('Limite de 5000 devoluções atingido. Use filtros para refinar a busca.');
                break;
              }

              offset += limit;
              
              // Delay para não sobrecarregar
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              logger.error(`Erro no lote ${tentativas}:`, error);
              // Continuar com o que já foi buscado
              break;
            }
          }

          logger.info(`🎉 Total de claims carregados para ${account.name}: ${allClaims.length}`);

          if (allClaims.length === 0) {
            logger.info(`Nenhuma devolução encontrada para ${account.name}`);
            continue;
          }

          // ✅ PROCESSAR OS CLAIMS COLETADOS
          logger.info(`📦 Processando ${allClaims.length} claims de ${account.name}...`);
            const devolucoesDaAPI = allClaims;
            
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

            // ✅ 2.2 - USAR MAPEADOR CONSOLIDADO (18 → 7 mapeadores)
            const devolucoesProcesadas = await Promise.all(devolucoesDaAPI.map(async (item: any, index: number) => {
              
              // Log do mapeamento de data
              if (index === 0) {
                console.log('[MAPEAMENTO DATA] Primeira devolução:', {
                  date_created_API: item.date_created,
                  data_criacao_MAPEADA: item.date_created || null,
                  created_at_SISTEMA: new Date().toISOString()
                });
              }
              
              // 🔍 REASONS API - FASE 4 (8 novos campos) - BUSCAR DA API
              const reasonId = item.claim_details?.reason_id || null;
              const apiReasonData = reasonId ? reasonsApiData.get(reasonId) : null;
              
              logger.info(`📋 Claim ${item.claim_details?.id}: reason_id = ${reasonId}`, {
                temDadosAPI: !!apiReasonData,
                nomeAPI: apiReasonData?.name,
                detalheAPI: apiReasonData?.detail
              });
              
              // ✅ USAR MAPEADOR CONSOLIDADO (reduz de 18 para 7 mapeadores)
              const itemCompleto = {
                ...mapDevolucaoCompleta(item, accountId, account.name, reasonId),
                
                // ✅ ADICIONAR DADOS DE REASONS DA API (FASE 4) - com validação
                reason_id: reasonId,
                reason_category: reasonId?.startsWith('PNR') ? 'not_received' :
                                reasonId?.startsWith('PDD') ? 'defective_or_different' :
                                reasonId?.startsWith('CS') ? 'cancellation' : 'other',
                reason_name: apiReasonData?.name || null,
                reason_detail: apiReasonData?.detail || null,
                reason_type: 'buyer_initiated',
                reason_priority: (reasonId?.startsWith('PNR') || reasonId?.startsWith('PDD')) ? 'high' : 'medium',
                reason_expected_resolutions: apiReasonData?.expected_resolutions || null,
                reason_flow: apiReasonData?.flow || null,
                reason_settings: apiReasonData?.settings ? JSON.stringify(apiReasonData.settings) : null
                // ❌ REMOVIDO: reason_position (não existe no schema)
              };
              
              // Log do primeiro item processado
              if (index === 0) {
                logger.info(`✅ PRIMEIRO ITEM PROCESSADO COMPLETO:`, {
                  order_id: itemCompleto.order_id,
                  tem_financeiro: !!itemCompleto.valor_reembolso_total,
                  tem_review: !!itemCompleto.review_id,
                  tem_sla: itemCompleto.sla_cumprido !== null,
                  shipping_costs: itemCompleto.shipping_costs
                });
              }

              return itemCompleto;
            }));

            // 📅 ORDENAR POR DATA - USAR UTILITÁRIO
            sortByDataCriacao(devolucoesProcesadas);

            // 💾 SALVAR OS DADOS ENRIQUECIDOS NO BANCO
            if (devolucoesProcesadas.length > 0) {
              try {
                // 🛡️ FILTRAR APENAS CAMPOS VÁLIDOS antes de fazer upsert
                const devolucoesFiltradas = devolucoesProcesadas.map(dev => 
                  filtrarCamposValidos(dev)
                );
                
                logger.info(`🛡️ Campos filtrados: ${Object.keys(devolucoesProcesadas[0] || {}).length} → ${Object.keys(devolucoesFiltradas[0] || {}).length}`);
                
                // 🧹 DEDUPLICAÇÃO CRÍTICA: Usar constraint MAIS RESTRITIVA
                // ✅ Tabela tem 2 constraints: UNIQUE(order_id) E UNIQUE(order_id, integration_account_id)
                // ✅ Usamos apenas order_id (mais restritiva) para evitar conflitos
                const uniqueRecords = devolucoesFiltradas.reduce<Map<string, any>>((acc, record) => {
                  const key = record.order_id; // ✅ Apenas order_id (constraint mais restritiva)
                  
                  if (!acc.has(key)) {
                    acc.set(key, record);
                  } else {
                    logger.warn(`⚠️ Duplicata removida: order_id=${record.order_id}`);
                  }
                  
                  return acc;
                }, new Map());
                
                const deduplicatedRecords = Array.from(uniqueRecords.values());
                
                if (deduplicatedRecords.length < devolucoesFiltradas.length) {
                  logger.warn(`⚠️ Removidas ${devolucoesFiltradas.length - deduplicatedRecords.length} duplicatas antes do upsert`);
                }
                
                logger.info(`✅ Tentando salvar ${deduplicatedRecords.length} registros únicos...`);
                
                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(deduplicatedRecords, {
                    onConflict: 'claim_id', // ✅ FASE 1-4: Usar claim_id como chave única
                    ignoreDuplicates: false
                  });

                if (upsertError) {
                  logger.error('❌ Erro ao salvar dados no banco:', upsertError);
                  console.error('[REISTOQ ERROR] Upsert failed:', {
                    error: upsertError,
                    message: upsertError.message,
                    details: upsertError.details,
                    hint: upsertError.hint
                  });
                } else {
                  logger.info(`✅ ${deduplicatedRecords.length} devoluções SALVAS no banco com dados validados`);
                }
              } catch (saveError) {
                logger.error('Erro ao persistir dados', saveError);
              }
            }

            todasDevolucoes.push(...devolucoesProcesadas);
            
            // ✅ 3.3 - Log estruturado de sucesso por conta
            structuredLogger.info('Devoluções processadas para conta', {
              accountId,
              accountName: account.name,
              count: devolucoesProcesadas.length,
              reasonsCached: uniqueReasonIds.length - uncachedReasons.length,
              reasonsFetched: reasonsApiData.size
            });
            
            toast.success(`✅ ${devolucoesProcesadas.length} devoluções enriquecidas para ${account.name}`);

        } catch (accountError) {
          // ✅ 1.5 - CORREÇÃO: Logs estruturados para erros de conta
          logger.error(`Erro ao processar ${account.name}`, {
            context: 'useDevolucoesBusca.buscarDaAPI',
            accountId: account.id,
            accountName: account.name,
            error: accountError instanceof Error ? accountError.message : accountError,
            stack: accountError instanceof Error ? accountError.stack : undefined
          });
          structuredLogger.error('Erro ao processar conta', {
            accountId: account.id,
            accountName: account.name,
            error: accountError instanceof Error ? accountError.message : 'Erro desconhecido',
            stack: accountError instanceof Error ? accountError.stack : undefined
          });
          toast.error(`Erro na conta ${account.name}`);
        }
      }

      // 📅 ORDENAR RESULTADO FINAL - USAR UTILITÁRIO
      sortByDataCriacao(todasDevolucoes);

      const duration = performance.now() - startTime;
      
      // ✅ 3.3 - Log estruturado de sucesso final
      structuredLogger.info('Busca da API concluída com sucesso', {
        total: todasDevolucoes.length,
        accountsQueried: contasParaBuscar.length,
        duration: `${duration.toFixed(2)}ms`,
        avgPerAccount: `${(duration / contasParaBuscar.length).toFixed(2)}ms`
      });

      logger.info(`Total da API: ${todasDevolucoes.length} devoluções enriquecidas e salvas`);
      return todasDevolucoes;

    } catch (error: any) {
      // Verificar se foi cancelado
      if (error.name === 'AbortError' || abortControllerRef.current === null) {
        logger.info('Busca cancelada pelo usuário');
        toast.info('Busca cancelada');
        return [];
      }
      
      // ✅ 1.5 - CORREÇÃO: Logs estruturados para erros gerais
      const duration = performance.now() - startTime;
      
      logger.error('Erro geral na busca da API', {
        context: 'useDevolucoesBusca.buscarDaAPI',
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        filtros
      });
      
      structuredLogger.error('Erro geral na busca da API', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        filtros,
        duration: `${duration.toFixed(2)}ms`
      });
      toast.error(`Erro na busca da API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências pois não usa obterTokenML mais

  // Buscar do banco de dados COM BUSCA PROGRESSIVA
  const buscarDoBanco = useCallback(async (
    contasSelecionadas?: string[], 
    filtros?: DevolucaoBuscaFilters,
    onProgress?: (dados: any[], current: number, total: number) => void
  ) => {
    setLoading(true);
    
    try {
      logger.info('[useDevolucoesBusca] 📦 Buscando do banco com paginação...', {
        contasFiltro: contasSelecionadas?.length || 0,
        periodoDias: filtros?.periodoDias
      });
      
      // Primeiro, contar total de registros
      let countQuery = supabase
        .from('devolucoes_avancadas')
        .select('*', { count: 'exact', head: true });
      
      if (contasSelecionadas && contasSelecionadas.length > 0) {
        countQuery = countQuery.in('integration_account_id', contasSelecionadas);
      }
      
      // ✅ APLICAR FILTRO DE DATA APENAS SE periodoDias > 0
      if (filtros?.periodoDias && filtros.periodoDias > 0) {
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setDate(hoje.getDate() - filtros.periodoDias);
        const dateFrom = dataInicio.toISOString();
        // ✅ SEMPRE USA data_criacao (item.date_created) - coluna "Data Criação" na página
        countQuery = countQuery.gte('data_criacao', dateFrom);
        logger.info(`[useDevolucoesBusca] 📅 Filtro de data aplicado: últimos ${filtros.periodoDias} dias`);
      } else {
        logger.info(`[useDevolucoesBusca] ✅ SEM filtro de data - buscando TUDO`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error('[useDevolucoesBusca] ❌ Erro ao contar registros', countError);
        toast.error('Erro ao contar devoluções');
        return [];
      }
      
      const totalRegistros = Math.min(count || 0, 1000); // Limite de 1000
      logger.info(`[useDevolucoesBusca] 📊 Total de registros: ${totalRegistros}`);
      
      if (totalRegistros === 0) {
        toast.info('Nenhuma devolução encontrada no período selecionado');
        return [];
      }
      
      // Buscar em chunks de 100
      const CHUNK_SIZE = 100;
      const allData: any[] = [];
      let offset = 0;
      
      while (offset < totalRegistros) {
        let query = supabase
          .from('devolucoes_avancadas')
          .select('*');
        
        if (contasSelecionadas && contasSelecionadas.length > 0) {
          query = query.in('integration_account_id', contasSelecionadas);
        }
        
        // ✅ APLICAR FILTRO DE DATA APENAS SE periodoDias > 0
        if (filtros?.periodoDias && filtros.periodoDias > 0) {
          const hoje = new Date();
          const dataInicio = new Date();
          dataInicio.setDate(hoje.getDate() - filtros.periodoDias);
          const dateFrom = dataInicio.toISOString();
          // ✅ SEMPRE USA data_criacao (item.date_created) - coluna "Data Criação" na página
          query = query.gte('data_criacao', dateFrom);
        }
        
        const { data, error } = await query
          .order('data_criacao', { ascending: false })
          .range(offset, offset + CHUNK_SIZE - 1);
        
        if (error) {
          logger.error('[useDevolucoesBusca] ❌ Erro ao buscar chunk', {
            offset,
            error: error.message
          });
          break;
        }
        
        if (!data || data.length === 0) break;
        
        allData.push(...data);
        offset += data.length;
        
        // Notificar progresso
        if (onProgress) {
          onProgress(allData, offset, totalRegistros);
        }
        
        logger.debug(`[useDevolucoesBusca] 📥 Chunk carregado: ${offset}/${totalRegistros}`);
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      logger.info(`[useDevolucoesBusca] ✅ ${allData.length} devoluções carregadas do banco`);
      return allData;
      
    } catch (error) {
      logger.error('[useDevolucoesBusca] ❌ Erro inesperado ao buscar do banco', {
        context: 'useDevolucoesBusca.buscarDoBanco',
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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

                // 🛡️ FILTRAR APENAS CAMPOS VÁLIDOS antes de fazer upsert
                const devolucaoFiltrada = filtrarCamposValidos(devolucaoData);

                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(devolucaoFiltrada, { 
                    onConflict: 'claim_id', // ✅ FASE 1-4: Usar claim_id como chave única
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

  // 🛑 Cancelar busca em andamento
  const cancelarBusca = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0, message: 'Busca cancelada' });
      logger.info('[useDevolucoesBusca] Busca cancelada pelo usuário');
    }
  };

  return {
    loading,
    buscarDaAPI,
    buscarDoBanco,
    sincronizarDevolucoes,
    cancelarBusca,
    loadingProgress,
    cacheStats,
    clearCache: () => {
      reasonsCacheService.clear();
      setCacheStats(reasonsCacheService.getStats());
    }
  };
}