/**
 * 🔍 HOOK CONSOLIDADO DE BUSCA DE DEVOLUÇÕES
 * Une toda lógica de busca em um só lugar com otimização para tempo real
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface DevolucaoBuscaFilters {
  contasSelecionadas: string[];
  dataInicio?: string;
  dataFim?: string;
  statusClaim?: string;
  searchTerm?: string; // Adicionado campo de busca
}

export function useDevolucoesBusca() {
  const [loading, setLoading] = useState(false);

  // 🔒 NÃO PRECISA OBTER TOKEN - A EDGE FUNCTION FAZ ISSO
  // A função ml-api-direct já obtém o token internamente de forma segura

  // Buscar da API ML em tempo real
  const buscarDaAPI = useCallback(async (
    filtros: DevolucaoBuscaFilters,
    mlAccounts: any[]
  ) => {
    if (!filtros.contasSelecionadas.length) {
      toast.error('Selecione pelo menos uma conta ML');
      return [];
    }

    setLoading(true);
    const todasDevolucoes: any[] = [];
    
    try {
      logger.info('Iniciando busca da API ML em tempo real');
      
      for (const accountId of filtros.contasSelecionadas) {
        const account = mlAccounts?.find(acc => acc.id === accountId);
        if (!account) continue;

        logger.info(`Processando conta: ${account.name}`);
        
        try {
          // ✅ Chamar API ML via edge function (o token é obtido internamente de forma segura)
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: account.account_identifier,
              // NÃO passamos access_token - a edge function obtém automaticamente
              filters: {
                date_from: filtros.dataInicio || '',
                date_to: filtros.dataFim || '',
                status: filtros.statusClaim || ''
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
            
            // Processar dados com ENRIQUECIMENTO COMPLETO
            const devolucoesProcesadas = devolucoesDaAPI.map((item: any, index: number) => {
              // Dados base
              const dadosBase = {
                order_id: item.order_id.toString(),
                claim_id: item.claim_details?.id || null,
                data_criacao: item.date_created,
                status_devolucao: item.status || 'cancelled',
                valor_retido: parseFloat(item.amount || 0),
                produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
                sku: item.resource_data?.sku || '',
                quantidade: item.resource_data?.quantity || 1,
                integration_account_id: accountId,
                account_name: account.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // 💰 DADOS FINANCEIROS DETALHADOS (FASE 4)
              const dadosFinanceiros = {
                // Reembolsos
                valor_reembolso_total: item.claim_details?.resolution?.refund_amount || 
                                      item.return_details_v2?.refund_amount ||
                                      parseFloat(item.amount || 0),
                valor_reembolso_produto: item.order_data?.order_items?.[0]?.unit_price || 0,
                valor_reembolso_frete: item.order_data?.payments?.[0]?.shipping_cost || 0,
                
                // Taxas ML
                taxa_ml_reembolso: item.order_data?.payments?.[0]?.marketplace_fee || 0,
                
                // Custos logísticos
                custo_logistico_total: item.return_details_v2?.shipping_cost || 
                                      item.return_details_v2?.logistics_cost || 0,
                
                // Impacto financeiro
                impacto_financeiro_vendedor: -(parseFloat(item.amount || 0)),
                
                // Detalhes de reembolso
                data_processamento_reembolso: item.order_data?.payments?.[0]?.date_approved || null,
                metodo_reembolso: item.order_data?.payments?.[0]?.payment_method_id || null,
                moeda_reembolso: item.order_data?.currency_id || 'BRL',
                
                // Breakdown detalhado
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

              // 📋 DADOS DE REVIEW (FASE 2)
              const dadosReview = {
                review_id: item.review_id || item.claim_details?.review?.id || null,
                review_status: item.review_status || item.claim_details?.review?.status || null,
                review_result: item.review_result || item.claim_details?.review?.result || null,
                score_qualidade: item.review_score || item.claim_details?.review?.score || null,
                necessita_acao_manual: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length > 0,
                problemas_encontrados: item.problemas_encontrados || [],
                acoes_necessarias_review: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions || [],
                data_inicio_review: item.claim_details?.date_created || null,
                observacoes_review: item.claim_details?.resolution?.reason || null,
                revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id || null
              };

              // ⏱️ DADOS DE SLA (FASE 3)
              const dadosSLA = {
                tempo_primeira_resposta_vendedor: null, // Calculado posteriormente
                tempo_resposta_comprador: null,
                tempo_analise_ml: null,
                dias_ate_resolucao: item.claim_details?.resolution ? 
                  Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                             new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null,
                sla_cumprido: true, // Calcular baseado nos tempos
                tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
                eficiencia_resolucao: item.claim_details?.resolution ? 'boa' : 'pendente',
                data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created,
                tempo_total_resolucao: item.claim_details?.resolution ? 
                  Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                             new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60)) : null
              };

              // 🚚 DADOS DE RASTREAMENTO COMPLETOS (TRACKING)
              const dadosRastreamento = {
                shipment_id: item.shipment_history?.id || item.order_data?.shipping?.id || null,
                codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
                codigo_rastreamento_devolucao: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
                transportadora: item.return_details_v2?.shipments?.[0]?.carrier || item.shipment_history?.tracking_method || null,
                transportadora_devolucao: item.return_details_v2?.shipments?.[0]?.carrier || null,
                status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || item.shipment_history?.status || null,
                url_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_url || null,
                localizacao_atual: item.tracking_history?.[0]?.location || null,
                status_transporte_atual: item.return_details_v2?.shipments?.[0]?.substatus || null,
                tracking_history: item.tracking_history || [],
                tracking_events: item.tracking_events || [],
                shipment_history: item.shipment_history || {},
                data_ultima_movimentacao: item.tracking_events?.[0]?.date || item.tracking_history?.[0]?.date || null,
                historico_localizacoes: item.tracking_history || [],
                carrier_info: {
                  name: item.return_details_v2?.shipments?.[0]?.carrier || null,
                  type: item.shipment_history?.mode || null
                },
                tempo_transito_dias: item.shipment_history?.transit_time || null,
                shipment_delays: item.shipment_delays || [],
                shipment_costs: {
                  shipping_cost: item.shipment_history?.cost || null,
                  handling_cost: null,
                  total_cost: item.return_details_v2?.shipping_cost || null
                },
                previsao_entrega_vendedor: item.return_details_v2?.estimated_delivery_date || null
              };

              // ⚖️ DADOS DE MEDIAÇÃO COMPLETOS (MEDIATION)
              const dadosMediacao = {
                em_mediacao: item.claim_details?.type === 'mediations',
                data_inicio_mediacao: item.claim_details?.type === 'mediations' ? item.claim_details?.date_created : null,
                mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id || null,
                resultado_mediacao: item.claim_details?.resolution?.reason || null,
                detalhes_mediacao: item.mediation_details || (item.claim_details?.type === 'mediations' ? item.claim_details : {}),
                escalado_para_ml: item.claim_details?.type === 'mediations'
              };

              // ⭐ DADOS DE REPUTAÇÃO (REPUTATION)
              const dadosReputacao = {
                seller_reputation: item.order_data?.seller?.reputation || {},
                buyer_reputation: item.buyer?.reputation || {}
              };

              // 📎 DADOS DE ANEXOS (ATTACHMENTS)
              const dadosAnexos = {
                anexos_count: item.claim_attachments?.length || 0,
                anexos_comprador: item.claim_attachments?.filter((a: any) => a.source === 'buyer') || [],
                anexos_vendedor: item.claim_attachments?.filter((a: any) => a.source === 'seller') || [],
                anexos_ml: item.claim_attachments?.filter((a: any) => a.source === 'meli') || [],
                claim_attachments: item.claim_attachments || [],
                total_evidencias: (item.claim_attachments?.length || 0) + (item.claim_messages?.messages?.length || 0)
              };

              // 📊 DADOS DE TIMELINE CONSOLIDADO
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
                  data_finalizacao_timeline: item.claim_details?.resolution?.date_created || null
                },
                eventos_sistema: item.timeline_events || [],
                data_criacao_claim: item.claim_details?.date_created || null,
                data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
                data_finalizacao_timeline: item.claim_details?.resolution?.date_created || null
              };

              // DADOS ENRIQUECIDOS CONSOLIDADOS
              const dadosEnriquecidos = {
                // Dados estruturados principais
                dados_order: item.order_data || {},
                dados_claim: item.claim_details || {},
                dados_mensagens: item.claim_messages || {},
                dados_return: item.return_details_v2 || item.return_details_v1 || {},

                // ⭐ FASE 4 - FINANCEIRO
                ...dadosFinanceiros,

                // ⭐ FASE 2 - REVIEWS
                ...dadosReview,

                // ⭐ FASE 3 - SLA
                ...dadosSLA,

                // ⭐ RASTREAMENTO (TRACKING)
                ...dadosRastreamento,

                // ⭐ MEDIAÇÃO (MEDIATION)
                ...dadosMediacao,

                // ⭐ REPUTAÇÃO (REPUTATION)  
                ...dadosReputacao,

                // ⭐ ANEXOS (ATTACHMENTS)
                ...dadosAnexos,

                // ⭐ TIMELINE
                ...dadosTimeline,

                // MENSAGENS E COMUNICAÇÃO
                timeline_mensagens: item.claim_messages?.messages || [],
                ultima_mensagem_data: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.date_created : null,
                ultima_mensagem_remetente: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.from?.role : null,
                numero_interacoes: item.claim_messages?.messages?.length || 0,
                mensagens_nao_lidas: item.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0,

                // DADOS DE RETURN E TROCA
                eh_troca: (item.return_details_v2?.subtype || '').includes('change'),
                produto_troca_id: item.return_details_v2?.change_details?.substitute_product?.id || null,
                produto_troca_titulo: item.return_details_v2?.change_details?.substitute_product?.title || null,
                data_estimada_troca: item.return_details_v2?.estimated_exchange_date || null,
                data_limite_troca: item.return_details_v2?.date_closed || null,
                valor_diferenca_troca: item.return_details_v2?.price_difference || null,

                // CUSTOS E FINANCEIRO BÁSICO
                custo_envio_devolucao: item.return_details_v2?.shipping_cost || null,
                valor_compensacao: item.return_details_v2?.refund_amount || null,
                moeda_custo: 'BRL',
                responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,

                // CLASSIFICAÇÃO E RESOLUÇÃO
                tipo_claim: item.type || item.claim_details?.type,
                subtipo_claim: item.claim_details?.stage || null,
                motivo_categoria: item.claim_details?.reason_id || null,
                metodo_resolucao: item.claim_details?.resolution?.reason || null,
                resultado_final: item.claim_details?.status || null,
                nivel_prioridade: item.claim_details?.type === 'mediations' ? 'high' : 'medium',

                // MÉTRICAS E PRAZOS
                data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
                dias_restantes_acao: null, // Calculado via trigger
                acao_seller_necessaria: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
                
                // CONTROLE DE QUALIDADE
                dados_completos: true,
                marketplace_origem: 'ML_BRASIL'
              };

              const itemCompleto = { ...dadosBase, ...dadosEnriquecidos };
              
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
        .order('created_at', { ascending: false });
      
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
                  dados_completos: false, // Será marcado como true após enriquecimento
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
        .or('claim_id.is.null,dados_completos.eq.false')
        .order('created_at', { ascending: false })
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
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: conta.account_identifier,
              // NÃO passamos access_token - a edge function obtém automaticamente
              filters: { date_from: '', date_to: '', status: '' }
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
                dados_completos: true,
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

              // 📎 Dados de anexos (Etapa 4)
              if (claimData.claim_attachments) {
                dadosAtualizados.anexos_count = claimData.claim_attachments.length || 0;
                dadosAtualizados.anexos_comprador = claimData.claim_attachments.filter((a: any) => a.source === 'buyer') || [];
                dadosAtualizados.anexos_vendedor = claimData.claim_attachments.filter((a: any) => a.source === 'seller') || [];
                dadosAtualizados.anexos_ml = claimData.claim_attachments.filter((a: any) => a.source === 'meli') || [];
              }

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
    sincronizarDevolucoes
  };
}