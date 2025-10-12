/**
 * 🔍 HOOK CONSOLIDADO DE BUSCA DE DEVOLUÇÕES
 * Une toda lógica de busca em um só lugar com otimização para tempo real
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.log('🔍 Iniciando busca da API ML em tempo real...');
      
      for (const accountId of filtros.contasSelecionadas) {
        const account = mlAccounts?.find(acc => acc.id === accountId);
        if (!account) continue;

        console.log(`🔍 Processando conta: ${account.name}`);
        
        try {
          // ✅ Chamar API ML via edge function (o token é obtido internamente de forma segura)
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: account.account_identifier,
              // NÃO passamos access_token - a edge function obtém automaticamente
              filters: {
                date_from: filtros.dataInicio,
                date_to: filtros.dataFim,
                status: filtros.statusClaim
              }
            }
          });

          if (apiError) {
            console.error(`❌ Erro API para ${account.name}:`, apiError);
            toast.warning(`Falha na API ML para ${account.name}. Continuando...`);
            // Continue com próxima conta em vez de falhar
            continue;
          }

          if (apiResponse?.success && apiResponse?.data) {
            const devolucoesDaAPI = apiResponse.data;
            
            // Processar dados com ENRIQUECIMENTO COMPLETO
            const devolucoesProcesadas = devolucoesDaAPI.map((item: any, index: number) => {
              // Dados base
              const dadosBase = {
                id: `api_${item.order_id}_${accountId}_${index}`,
                order_id: item.order_id.toString(),
                claim_id: item.claim_details?.id || null,
                data_criacao: item.date_created,
                status_devolucao: item.status || 'cancelled',
                valor_retido: parseFloat(item.amount || 0),
                produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
                sku: item.resource_data?.sku || '',
                quantidade: item.resource_data?.quantity || 1,
                comprador_nickname: item.buyer?.nickname || 'Desconhecido',
                integration_account_id: accountId,
                account_name: account.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // DADOS ENRIQUECIDOS EXTRAÍDOS DA API
              const dadosEnriquecidos = {
                // Dados estruturados principais
                dados_order: item.order_data || {},
                dados_claim: item.claim_details || {},
                dados_mensagens: item.claim_messages || {},
                dados_return: item.return_details_v2 || item.return_details_v1 || {},

                // MENSAGENS E COMUNICAÇÃO (extraído de dados_mensagens)
                timeline_mensagens: item.claim_messages?.messages || [],
                ultima_mensagem_data: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.date_created : null,
                ultima_mensagem_remetente: item.claim_messages?.messages?.length > 0 ? 
                  item.claim_messages.messages[item.claim_messages.messages.length - 1]?.from?.role : null,
                numero_interacoes: item.claim_messages?.messages?.length || 0,
                mensagens_nao_lidas: item.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0,

                // DADOS DE RETURN E TROCA (extraído de dados_return)
                eh_troca: (item.return_details_v2?.subtype || '').includes('change'),
                data_estimada_troca: item.return_details_v2?.estimated_exchange_date || null,
                data_limite_troca: item.return_details_v2?.date_closed || null,
                valor_diferenca_troca: item.return_details_v2?.price_difference || null,
                codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
                transportadora: item.return_details_v2?.shipments?.[0]?.carrier || null,
                status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || null,
                url_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_url || null,

                // ANEXOS E EVIDÊNCIAS (extraído de dados_claim/anexos)
                anexos_count: item.claim_attachments?.length || 0,
                anexos_comprador: item.claim_attachments?.filter((a: any) => a.source === 'buyer') || [],
                anexos_vendedor: item.claim_attachments?.filter((a: any) => a.source === 'seller') || [],
                anexos_ml: item.claim_attachments?.filter((a: any) => a.source === 'meli') || [],
                total_evidencias: (item.claim_attachments?.length || 0) + (item.claim_messages?.messages?.length || 0),

                // CUSTOS E FINANCEIRO
                custo_envio_devolucao: item.return_details_v2?.shipping_cost || null,
                valor_compensacao: item.return_details_v2?.refund_amount || null,
                moeda_custo: 'BRL',
                responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,

                // CLASSIFICAÇÃO E RESOLUÇÃO
                tipo_claim: item.type || item.claim_details?.type,
                subtipo_claim: item.claim_details?.stage || null,
                motivo_categoria: item.claim_details?.reason_id || null,
                em_mediacao: item.claim_details?.type === 'mediations',
                metodo_resolucao: item.claim_details?.resolution?.reason || null,
                resultado_final: item.claim_details?.status || null,
                nivel_prioridade: item.claim_details?.type === 'mediations' ? 'high' : 'medium',

                // MÉTRICAS E PRAZOS
                data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
                dias_restantes_acao: null, // Calculado via trigger
                acao_seller_necessaria: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
                escalado_para_ml: item.claim_details?.type === 'mediations',
                
                // CONTROLE DE QUALIDADE
                dados_completos: true,
                marketplace_origem: 'ML_BRASIL'
              };

              return { ...dadosBase, ...dadosEnriquecidos };
            });

            todasDevolucoes.push(...devolucoesProcesadas);
            toast.success(`✅ ${devolucoesProcesadas.length} devoluções da API para ${account.name}`);
          } else {
            console.log(`ℹ️ Nenhuma devolução encontrada para ${account.name}`);
            toast.info(`Nenhuma devolução encontrada para ${account.name}`);
          }

        } catch (accountError) {
          console.error(`❌ Erro ao processar ${account.name}:`, accountError);
          toast.error(`Erro na conta ${account.name}`);
        }
      }

      console.log(`🎉 Total da API: ${todasDevolucoes.length} devoluções`);
      return todasDevolucoes;

    } catch (error) {
      console.error('❌ Erro geral na busca da API:', error);
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
      console.log('🔍 Buscando devoluções do banco...');
      
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar do banco:', error);
        toast.error('Erro ao buscar devoluções do banco');
        return [];
      }
      
      console.log(`✅ ${data.length} devoluções carregadas do banco`);
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar do banco:', error);
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
      console.log('🔄 Iniciando sincronização avançada com enriquecimento...');
      let totalProcessadas = 0;

      // FASE 1: Sincronização básica
      console.log('📊 FASE 1: Sincronização básica dos pedidos...');
      
      for (const account of mlAccounts) {
        console.log(`🔍 Sincronizando conta: ${account.name}`);
        
        try {
          // Buscar orders com claims
          const { data: ordersWithClaims, error: ordersError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('has_claims', true)
            .limit(100); // Aumentado para 100

          if (ordersError) {
            console.error(`❌ Erro ao buscar orders:`, ordersError);
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
                console.error(`❌ Erro ao processar order:`, orderError);
              }
            }
          }

        } catch (accountError) {
          console.error(`❌ Erro ao processar conta:`, accountError);
        }
      }

      console.log(`✅ FASE 1 concluída: ${totalProcessadas} registros básicos sincronizados`);

      // FASE 2: Enriquecimento com dados da API ML
      console.log('🔍 FASE 2: Enriquecimento com dados da API ML...');
      await enriquecerDevolucoesSincronizadas(mlAccounts);

      if (totalProcessadas > 0) {
        toast.success(`🎉 ${totalProcessadas} devoluções sincronizadas e enriquecidas!`);
      } else {
        toast.info('ℹ️ Nenhuma nova devolução encontrada');
      }

      // Retornar dados atualizados
      return await buscarDoBanco();

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [buscarDoBanco]);

  // 🔍 NOVA FUNÇÃO: Enriquecimento automático de devoluções
  const enriquecerDevolucoesSincronizadas = async (mlAccounts: any[]) => {
    console.log(`🔍 Iniciando enriquecimento das devoluções sincronizadas...`);
    
    try {
      // Buscar devoluções que precisam de enriquecimento
      const { data: devolucoesPendentes, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .or('claim_id.is.null,dados_completos.eq.false')
        .order('created_at', { ascending: false })
        .limit(50); // Processar em lotes de 50

      if (error) {
        console.error('Erro ao buscar devoluções pendentes:', error);
        return;
      }

      if (!devolucoesPendentes || devolucoesPendentes.length === 0) {
        console.log(`ℹ️ Nenhuma devolução pendente de enriquecimento`);
        return;
      }

      console.log(`🔄 ${devolucoesPendentes.length} devoluções serão enriquecidas`);

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
        console.log(`🏢 Processando conta ${accountId}: ${devolucoes.length} devoluções`);
        
        const conta = mlAccounts.find(acc => acc.id === accountId);
        if (!conta) {
          console.warn(`⚠️ Conta ${accountId} não encontrada`);
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
            console.warn(`⚠️ Sem dados de claims para conta ${conta.name}`);
            continue;
          }

          console.log(`📋 ${apiResponse.data.length} claims encontrados para ${conta.name}`);

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
              console.log(`🔍 Enriquecendo order ${devolucao.order_id} com claim ${claimData.claim_details.id}`);
              
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
                console.error(`❌ Erro ao atualizar order ${devolucao.order_id}:`, updateError);
              } else {
                totalEnriquecidas++;
                console.log(`✅ Order ${devolucao.order_id} enriquecida com sucesso`);
              }

              // Pausa entre atualizações
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.log(`ℹ️ Sem claim encontrado para order ${devolucao.order_id}`);
            }
          }

        } catch (error) {
          console.error(`❌ Erro ao processar conta ${conta.name}:`, error);
        }

        // Pausa entre contas
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`🎉 Enriquecimento finalizado: ${totalEnriquecidas} devoluções enriquecidas`);
      
      if (totalEnriquecidas > 0) {
        toast.success(`🔍 ${totalEnriquecidas} devoluções enriquecidas com dados completos!`);
      }

    } catch (error) {
      console.error('❌ Erro no enriquecimento:', error);
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