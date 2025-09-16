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
}

export function useDevolucoesBusca() {
  const [loading, setLoading] = useState(false);

  // Obter token ML
  const obterTokenML = useCallback(async (accountId: string, accountName: string): Promise<string | null> => {
    try {
      console.log(`🔍 Obtendo token para ${accountName}...`);
      
      const { data, error } = await supabase.functions.invoke('get-ml-token', {
        body: { 
          integration_account_id: accountId,
          provider: 'mercadolivre'
        }
      });
      
      if (error || !data?.success || !data?.access_token) {
        console.warn(`⚠️ Token não disponível para ${accountName}`);
        return null;
      }

      console.log(`✅ Token obtido para ${accountName}`);
      return data.access_token;
    } catch (error) {
      console.error(`❌ Erro ao obter token para ${accountName}:`, error);
      return null;
    }
  }, []);

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
          // Obter token
          const token = await obterTokenML(accountId, account.name);
          if (!token) {
            toast.warning(`Token não disponível para ${account.name}`);
            continue;
          }

          // Chamar API ML via edge function
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
            body: {
              action: 'get_claims_and_returns',
              integration_account_id: accountId,
              seller_id: account.account_identifier,
              access_token: token,
              filters: {
                date_from: filtros.dataInicio,
                date_to: filtros.dataFim,
                status: filtros.statusClaim
              }
            }
          });

          if (apiError) {
            console.error(`❌ Erro API para ${account.name}:`, apiError);
            toast.error(`Erro na API para ${account.name}`);
            continue;
          }

          if (apiResponse?.success && apiResponse?.data) {
            const devolucoesDaAPI = apiResponse.data;
            
            // Processar dados
            const devolucoesProcesadas = devolucoesDaAPI.map((item: any, index: number) => ({
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
              dados_order: item.order_data || {},
              dados_claim: item.claim_details || {},
              dados_mensagens: item.claim_messages || {},
              dados_return: item.return_details_v2 || item.return_details_v1 || {},
              integration_account_id: accountId,
              account_name: account.name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

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
  }, [obterTokenML]);

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

  // Sincronizar devoluções (salvar no banco)
  const sincronizarDevolucoes = useCallback(async (mlAccounts: any[]) => {
    setLoading(true);
    
    try {
      console.log('🔄 Iniciando sincronização com banco...');
      let totalProcessadas = 0;

      for (const account of mlAccounts) {
        console.log(`🔍 Sincronizando conta: ${account.name}`);
        
        try {
          // Buscar orders com claims
          const { data: ordersWithClaims, error: ordersError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('has_claims', true)
            .limit(50);

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
                  claim_id: null,
                  data_criacao: order.date_created,
                  status_devolucao: 'with_claims',
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

      if (totalProcessadas > 0) {
        toast.success(`🎉 ${totalProcessadas} devoluções sincronizadas!`);
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

  return {
    loading,
    buscarDaAPI,
    buscarDoBanco,
    sincronizarDevolucoes
  };
}