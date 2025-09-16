import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { translateCancelReason } from '@/lib/translations';
import { usePersistentMLOrdersState } from '@/hooks/usePersistentMLOrdersState';
import { MetricCard } from '@/components/shared/MetricCard';
import { FilterSection } from '@/components/shared/FilterSection';
import { DevolucaoCard } from '@/components/shared/DevolucaoCard';
import { VirtualTable } from '@/components/shared/VirtualTable';
import { 
  RefreshCw, 
  Download, 
  Filter, 
  Eye, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Loader2,
  FileText,
  CheckSquare,
  Search,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Users,
  Grid,
  Table2,
  Calendar
} from 'lucide-react';

interface DevolucaoAvancada {
  id: string;
  integration_account_id: string;
  claim_id?: string;
  order_id: string;
  data_criacao: string;
  status_devolucao?: string;
  claim_status?: string;
  valor_retido?: number;
  produto_titulo?: string;
  sku?: string;
  quantidade?: number;
  comprador_nickname?: string;
  account_name?: string;
  dados_order?: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_return?: any;
  created_at: string;
  updated_at: string;
}

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  organization_id: string;
  is_active: boolean;
}

interface Filtros {
  searchTerm: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

interface DevolucaoAvancadasTabProps {
  mlAccounts: MLAccount[];
  refetch: () => Promise<void>;
  existingDevolucoes: DevolucaoAvancada[];
}

const DevolucaoAvancadasTab: React.FC<DevolucaoAvancadasTabProps> = ({
  mlAccounts,
  refetch,
  existingDevolucoes
}) => {
  const [loading, setLoading] = useState(false);
  const [devolucoes, setDevolucoes] = useState<DevolucaoAvancada[]>([]);
  const [devolucoesFiltradas, setDevolucoesFiltradas] = useState<DevolucaoAvancada[]>([]);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    searchTerm: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // VIEW MODE
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // HOOK DE PERSISTÊNCIA
  const persistentState = usePersistentMLOrdersState();

  // NOVOS ESTADOS PARA FILTROS AVANÇADOS
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    contasSelecionadas: [] as string[],
    dataInicio: '',
    dataFim: '',
    statusClaim: '',
    buscarEmTempoReal: false
  });

  // TEMPO REAL: Configurar listener para atualizações automáticas
  useEffect(() => {
    console.log('🔄 Configurando listener tempo real para devolucoes_avancadas');
    
    const channel = supabase
      .channel('devolucoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'devolucoes_avancadas'
        },
        (payload) => {
          console.log('📡 Atualização tempo real:', payload);
          
          if (payload.eventType === 'INSERT') {
            const novaDevolucao = payload.new as DevolucaoAvancada;
            setDevolucoes(prev => [novaDevolucao, ...prev]);
            toast.success(`✅ Nova devolução detectada: ${novaDevolucao.produto_titulo || 'Produto'}`);
          } else if (payload.eventType === 'UPDATE') {
            const devolucaoAtualizada = payload.new as DevolucaoAvancada;
            setDevolucoes(prev => prev.map(d => 
              d.id === devolucaoAtualizada.id ? devolucaoAtualizada : d
            ));
            toast.info(`🔄 Devolução atualizada: ${devolucaoAtualizada.produto_titulo || 'Produto'}`);
          } else if (payload.eventType === 'DELETE') {
            const devolucaoRemovida = payload.old as DevolucaoAvancada;
            setDevolucoes(prev => prev.filter(d => d.id !== devolucaoRemovida.id));
            toast.info(`🗑️ Devolução removida`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Removendo listener tempo real');
      supabase.removeChannel(channel);
    };
  }, []);

  // Carregar dados iniciais (BUSCAR DIRETO DA API)
  useEffect(() => {
    if (!persistentState.isStateLoaded) return;

    const carregarDevolucoes = async () => {
      console.log('🚀 Carregando devoluções da API do Mercado Livre...');
      
      // Verificar se existe estado persistido válido
      if (persistentState.hasValidPersistedState()) {
        console.log('🔄 Restaurando dados persistidos...');
        const state = persistentState.persistedState!;
        setDevolucoes(state.devolucoes);
        setFiltros(state.filters || filtros);
        setCurrentPage(state.currentPage || 1);
        
        // Aplicar contas selecionadas se existir
        if (state.integrationAccountId) {
          setFiltrosAvancados(prev => ({
            ...prev,
            contasSelecionadas: [state.integrationAccountId!]
          }));
        }
        
        toast.success(`🔄 ${state.devolucoes.length} devoluções restauradas`);
        return;
      }
      
      // Buscar direto da API por padrão
      if (mlAccounts && mlAccounts.length > 0) {
        const contasAtivas = mlAccounts.filter(acc => acc.is_active);
        
        if (contasAtivas.length > 0) {
          // Configurar contas selecionadas automaticamente
          setFiltrosAvancados(prev => ({
            ...prev,
            contasSelecionadas: contasAtivas.map(acc => acc.id),
            buscarEmTempoReal: true // Habilitar busca em tempo real por padrão
          }));

          try {
            const devolucoesDaAPI = await buscarDevolucoesDaAPI({
              contasSelecionadas: contasAtivas.map(acc => acc.id),
            });
            
            console.log('📊 Dados recebidos da API:', devolucoesDaAPI);
            
            if (devolucoesDaAPI.length > 0) {
              setDevolucoes(devolucoesDaAPI);
              // Salvar dados no estado persistido
              persistentState.saveOrdersData(devolucoesDaAPI, devolucoesDaAPI.length, 1);
              setCurrentPage(1);
              toast.success(`🎉 ${devolucoesDaAPI.length} devoluções carregadas da API`);
            } else {
              toast.info('ℹ️ Nenhuma devolução encontrada na API');
            }
          } catch (error) {
            console.error('❌ Erro ao carregar da API:', error);
            toast.error('Erro ao carregar devoluções da API');
          }
        } else {
          toast.info('ℹ️ Nenhuma conta ML ativa encontrada');
        }
      }
    };

    // Aguardar as contas ML carregarem
    if (mlAccounts && mlAccounts.length > 0) {
      carregarDevolucoes();
    }
  }, [mlAccounts, persistentState.isStateLoaded]); // Dependência das contas ML

  // Função para aplicar filtros otimizada com useCallback
  const aplicarFiltros = useCallback(() => {
    console.log('🔄 Aplicando filtros:', filtros);
    console.log('📊 Dados base para filtrar:', devolucoes.length);
    
    let resultados = [...devolucoes]; // Criar cópia para evitar mutação

    if (filtros.searchTerm && filtros.searchTerm.trim()) {
      const searchTerm = filtros.searchTerm.toLowerCase();
      resultados = resultados.filter(dev => 
        dev.produto_titulo?.toLowerCase().includes(searchTerm) ||
        dev.order_id?.toString().includes(searchTerm) ||
        dev.sku?.toLowerCase().includes(searchTerm) ||
        dev.comprador_nickname?.toLowerCase().includes(searchTerm)
      );
      console.log('🔍 Após filtro de busca:', resultados.length);
    }

    if (filtros.status && filtros.status.trim()) {
      resultados = resultados.filter(dev => dev.status_devolucao === filtros.status);
      console.log('📋 Após filtro de status:', resultados.length);
    }

    if (filtros.dataInicio && filtros.dataInicio.trim()) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) >= new Date(filtros.dataInicio)
      );
      console.log('📅 Após filtro data início:', resultados.length);
    }

    if (filtros.dataFim && filtros.dataFim.trim()) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) <= new Date(filtros.dataFim)
      );
      console.log('📅 Após filtro data fim:', resultados.length);
    }

    console.log('✅ Resultado final dos filtros:', resultados.length);
    setDevolucoesFiltradas(resultados);
    
    // Salvar filtros aplicados
    persistentState.saveAppliedFilters(filtros);
  }, [filtros, devolucoes, persistentState]);

  useEffect(() => {
    console.log('🔍 Aplicando filtros - dados originais:', devolucoes.length);
    aplicarFiltros();
    console.log('🔍 Dados após filtros:', devolucoesFiltradas.length);
  }, [aplicarFiltros]);

  // Debug para verificar quando os dados mudam
  useEffect(() => {
    console.log('📊 Estado devolucoes mudou:', {
      total: devolucoes.length,
      filtradas: devolucoesFiltradas.length,
      amostras: devolucoes.slice(0, 3).map(d => ({
        orderId: d.order_id,
        status: d.status_devolucao,
        produto: d.produto_titulo
      }))
    });
  }, [devolucoes, devolucoesFiltradas]);

  // Função auxiliar para obter token ML REAL
  const obterTokenML = async (accountId: string, accountName: string): Promise<string | null> => {
    try {
      console.log(`🔍 Buscando token REAL para ${accountName}...`);
      
      // Criar edge function específica para obter token real para chamadas internas
      const { data, error } = await supabase.functions.invoke('get-ml-token', {
        body: { 
          integration_account_id: accountId,
          provider: 'mercadolivre'
        }
      });
      
      if (error) {
        console.error(`❌ Erro ao obter token para ${accountName}:`, error);
        toast.error(`Erro ao obter token para ${accountName}: ${error.message}`);
        return null;
      }
      
      if (!data?.success || !data?.access_token) {
        console.warn(`⚠️ Token não disponível para ${accountName}`);
        toast.warning(`Token não configurado para ${accountName}. Configure nas integrações.`);
        return null;
      }

      console.log(`✅ Token REAL obtido com sucesso para ${accountName}`);
      return data.access_token;
      
    } catch (error) {
      console.error(`❌ Erro ao obter token para ${accountName}:`, error);
      toast.error(`Erro ao acessar token para ${accountName}`);
      return null;
    }
  };

  // BUSCA DIRETA DA API DO MERCADO LIVRE (SEM BANCO DE DADOS)
  const buscarDevolucoesDaAPI = async (filtros: {
    contasSelecionadas: string[];
    dataInicio?: string;
    dataFim?: string;
    statusClaim?: string;
  }) => {
    if (!filtros.contasSelecionadas.length) {
      // Se nenhuma conta selecionada, usar todas as ativas
      const contasAtivas = mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [];
      if (!contasAtivas.length) {
        toast.error('Nenhuma conta ML ativa encontrada');
        return [];
      }
      filtros.contasSelecionadas = contasAtivas;
    }

    setLoading(true);
    const todasDevolucoes: DevolucaoAvancada[] = [];
    
    try {
      console.log('🔍 Buscando devoluções DIRETAMENTE da API do Mercado Livre...');
      
      for (const accountId of filtros.contasSelecionadas) {
        const account = mlAccounts?.find(acc => acc.id === accountId);
        if (!account) continue;

        console.log(`🔍 Conta: ${account.name} (${account.account_identifier})`);
        
        try {
          // Obter token da conta
          const token = await obterTokenML(accountId, account.name);
          if (!token) {
            toast.error(`Token não disponível para ${account.name}`);
            continue;
          }

          // ============ BUSCAR DEVOLUÇÕES VIA API MERCADO LIVRE ============
          console.log(`📞 Fazendo requisição DIRETA para API do Mercado Livre...`);
          
          // Usar edge function que faz a requisição para a API ML e retorna os dados diretamente
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
            console.error(`❌ Erro na requisição da API para ${account.name}:`, apiError);
            toast.error(`Erro na API para ${account.name}: ${apiError.message}`);
            continue;
          }

          console.log(`📋 Resposta da API ML para ${account.name}:`, apiResponse);

          if (apiResponse?.success && apiResponse?.data) {
            const devolucoesDaAPI = apiResponse.data;
            
            // Processar dados vindos diretamente da API com enriquecimento completo
            const devolucoesProcesadas = devolucoesDaAPI.map((item: any, index: number) => ({
              id: `api_${item.order_id}_${accountId}_${index}`, // ID único para API
              order_id: item.order_id.toString(),
              claim_id: item.claim_details?.id || null,
              data_criacao: item.date_created,
              status_devolucao: item.status || 'cancelled', // Definir como cancelado por padrão
              valor_retido: parseFloat(item.amount || 0),
              produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
              sku: item.resource_data?.sku || '',
              quantidade: item.resource_data?.quantity || 1,
              comprador_nickname: item.buyer?.nickname || 'Desconhecido',
              // DADOS ENRIQUECIDOS: mapear corretamente da resposta da API
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
            toast.success(`✅ ${devolucoesProcesadas.length} devoluções encontradas via API para ${account.name}`);
            
          } else if (apiResponse?.success && (!apiResponse?.data || apiResponse?.data?.length === 0)) {
            console.log(`ℹ️ Nenhuma devolução encontrada na API para ${account.name}`);
            toast.info(`ℹ️ Nenhuma devolução encontrada na API para ${account.name}`);
          } else {
            console.log(`❌ Resposta inválida da API para ${account.name}:`, apiResponse);
            toast.error(`Resposta inválida da API para ${account.name}`);
          }

        } catch (accountError) {
          console.error(`❌ Erro ao processar conta ${account.name}:`, accountError);
          toast.error(`Erro na conta ${account.name}: ${accountError.message}`);
        }
      }

      console.log(`🎉 Total de devoluções encontradas na API: ${todasDevolucoes.length}`);
      
      if (todasDevolucoes.length > 0) {
        // Salvar no estado persistido
        persistentState.saveOrdersData(todasDevolucoes, todasDevolucoes.length, 1);
        setCurrentPage(1);
        toast.success(`✅ API: ${todasDevolucoes.length} devoluções encontradas em tempo real`);
      } else {
        toast.info('ℹ️ Nenhuma devolução encontrada na API no período selecionado');
      }
      
      return todasDevolucoes;

    } catch (error) {
      console.error('❌ Erro geral na busca da API:', error);
      toast.error(`Erro na busca da API: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função principal para sincronizar devoluções usando o banco de dados
  const sincronizarDevolucoes = async () => {
    if (!mlAccounts || mlAccounts.length === 0) {
      toast.error('Nenhuma conta ML encontrada');
      return;
    }

    setLoading(true);
    
    try {
      let totalProcessadas = 0;

      for (const account of mlAccounts) {
        console.log(`🔍 Processando conta: ${account.name}`);
        
        try {
          // 1. Testar unified-orders
          const { data: unifiedData, error: unifiedError } = await supabase.functions.invoke('unified-orders', {
            body: { 
              integration_account_id: account.id,
              limit: 1
            }
          });

          if (unifiedError) {
            console.warn(`⚠️ Erro na unified-orders para ${account.name}:`, unifiedError);
            continue;
          }

          console.log(`✅ unified-orders funcionou para ${account.name}`);

          // 2. Buscar orders com claims
          console.log(`📋 Buscando orders com claims da tabela ml_orders_completas...`);
          
          const { data: ordersWithClaims, error: ordersError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('has_claims', true)
            .limit(50);

          if (ordersError) {
            console.error(`❌ Erro ao buscar orders com claims:`, ordersError);
            continue;
          }

          console.log(`📦 Encontradas ${ordersWithClaims?.length || 0} orders com claims`);

          // 3. Processar orders com claims usando UPSERT correto
          if (ordersWithClaims && ordersWithClaims.length > 0) {
            for (const order of ordersWithClaims) {
              try {
                const rawData = order.raw_data || {};
                
                const devolucaoData = {
                  order_id: order.order_id.toString(),
                  claim_id: null,
                  data_criacao: order.date_created,
                  status_devolucao: 'with_claims',
                  valor_retido: parseFloat(order.total_amount.toString()) || 0,
                  produto_titulo: order.item_title || 'Produto não identificado',
                  sku: (rawData as any)?.order_items?.[0]?.item?.seller_sku || '',
                  quantidade: parseInt(order.quantity.toString()) || 1,
                  dados_order: rawData,
                  dados_claim: { 
                    type: 'claim_detected',
                    claims_count: order.claims_count,
                    status: order.status,
                    detected_at: new Date().toISOString()
                  },
                  integration_account_id: account.id,
                  updated_at: new Date().toISOString()
                };

                // USAR UPSERT CORRETO
                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(devolucaoData, { 
                    onConflict: 'order_id',
                    ignoreDuplicates: false 
                  });

                if (upsertError) {
                  console.error(`❌ Erro upsert ${order.order_id}:`, upsertError);
                } else {
                  totalProcessadas++;
                  console.log(`💾 ✅ Upsert: ${order.order_id}`);
                }

              } catch (orderError) {
                console.error(`❌ Erro ao processar order ${order.order_id}:`, orderError);
              }
            }
          }

          // 4. Buscar orders canceladas
          const { data: cancelledOrders, error: cancelledError } = await supabase
            .from('ml_orders_completas')
            .select('*')
            .eq('status', 'cancelled')
            .limit(50);

          if (!cancelledError && cancelledOrders && cancelledOrders.length > 0) {
            console.log(`🚫 Encontradas ${cancelledOrders.length} orders canceladas`);
            
            for (const order of cancelledOrders) {
              try {
                const rawData = order.raw_data || {};
                
                const devolucaoData = {
                  order_id: order.order_id.toString(),
                  claim_id: null,
                  data_criacao: order.date_created,
                  status_devolucao: 'cancelled',
                  valor_retido: parseFloat(order.total_amount.toString()) || 0,
                  produto_titulo: order.item_title || 'Produto não identificado',
                  sku: (rawData as any)?.order_items?.[0]?.item?.seller_sku || '',
                  quantidade: parseInt(order.quantity.toString()) || 1,
                  dados_order: rawData,
                  dados_claim: { 
                    type: 'cancellation',
                    reason: (rawData as any)?.cancel_detail || 'Pedido cancelado',
                    cancelled_at: (rawData as any)?.date_closed || order.date_created
                  },
                  integration_account_id: account.id,
                  updated_at: new Date().toISOString()
                };

                // USAR UPSERT CORRETO
                const { error: upsertError } = await supabase
                  .from('devolucoes_avancadas')
                  .upsert(devolucaoData, { 
                    onConflict: 'order_id',
                    ignoreDuplicates: false 
                  });

                if (upsertError) {
                  console.error(`❌ Erro upsert cancelamento:`, upsertError);
                } else {
                  totalProcessadas++;
                  console.log(`💾 ✅ Cancelamento upsert: ${order.order_id}`);
                }

              } catch (orderError) {
                console.error(`❌ Erro ao processar order cancelada:`, orderError);
              }
            }
          }

          console.log(`✅ Conta ${account.name} processada com sucesso!`);

        } catch (accountError) {
          console.error(`❌ Erro ao processar conta ${account.name}:`, accountError);
          toast.error(`Erro na conta ${account.name}`);
        }
      }

      // Recarregar dados após sincronização
      const { data: novasDevolucoes, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && novasDevolucoes) {
        setDevolucoes(novasDevolucoes as DevolucaoAvancada[]);
      }
      
      if (totalProcessadas > 0) {
        toast.success(`🎉 ${totalProcessadas} devoluções/cancelamentos processados!`);
        console.log(`🎉 Sincronização concluída: ${totalProcessadas} registros`);
      } else {
        toast.warning('⚠️ Nenhuma devolução nova encontrada');
        console.log(`ℹ️ Nenhuma devolução nova foi processada`);
      }

    } catch (error) {
      console.error('❌ Erro geral na sincronização:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para buscar em tempo real (legacy - manter compatibilidade)
  const buscarEmTempoReal = async () => {
    const contasSelecionadas = mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [];
    
    try {
      const devolucoesDaAPI = await buscarDevolucoesDaAPI({
        contasSelecionadas,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        statusClaim: filtros.status
      });
      
      if (devolucoesDaAPI.length > 0) {
        setDevolucoes(devolucoesDaAPI);
        toast.success(`🎉 ${devolucoesDaAPI.length} devoluções encontradas em tempo real!`);
      } else {
        toast.info('ℹ️ Nenhuma devolução encontrada com os filtros aplicados');
      }
    } catch (error) {
      console.error('❌ Erro na busca em tempo real:', error);
      toast.error('Erro ao buscar devoluções em tempo real');
    }
  };

  // FUNÇÃO PARA BUSCAR COM FILTROS
  const buscarComFiltros = async () => {
    if (filtrosAvancados.buscarEmTempoReal) {
      // Buscar da API ML em tempo real
      try {
        const devolucoesDaAPI = await buscarDevolucoesDaAPI({
          contasSelecionadas: filtrosAvancados.contasSelecionadas,
          dataInicio: filtrosAvancados.dataInicio,
          dataFim: filtrosAvancados.dataFim,
          statusClaim: filtrosAvancados.statusClaim
        });
        
        console.log('📊 Dados da API ML (buscarComFiltros):', devolucoesDaAPI);
        setDevolucoes(devolucoesDaAPI);
        
        // Limpar filtros básicos para mostrar todos os dados da API
        setFiltros({
          searchTerm: '',
          status: '',
          dataInicio: '',
          dataFim: ''
        });
        
        toast.success(`✅ ${devolucoesDaAPI.length} devoluções encontradas na API ML`);
      } catch (error) {
        console.error('❌ Erro na busca da API:', error);
        toast.error('Erro ao buscar da API ML');
      }
    } else {
      // Buscar do banco local (comportamento atual)
      const { data: novasDevolucoes, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && novasDevolucoes) {
        setDevolucoes(novasDevolucoes as DevolucaoAvancada[]);
        toast.success('✅ Dados atualizados do banco local');
      } else {
        toast.error('Erro ao atualizar dados do banco');
      }
    }
  };


  const exportarCSV = () => {
    if (!devolucoesFiltradas.length) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'ID Claim',
      'ID Pedido',
      'SKU',
      'Produto',
      'Quantidade',
      'Valor Reclamado',
      'Status Claim',
      'Estágio',
      'Tipo',
      'Data Criação',
      'Data Fechamento',
      'Última Atualização'
    ];

    const csvData = devolucoesFiltradas.map(dev => [
      dev.claim_id || '',
      dev.order_id || '',
      dev.sku || '',
      dev.produto_titulo || '',
      dev.quantidade || '',
      dev.valor_retido || '',
      dev.status_devolucao || '',
      'N/A', // claim_stage não existe na nossa interface
      'N/A', // claim_type não existe na nossa interface
      dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString() : '',
      'N/A', // date_closed não existe na nossa interface
      dev.updated_at ? new Date(dev.updated_at).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Devoluções Avançadas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de devoluções e cancelamentos do Mercado Livre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={exportarCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button 
            onClick={buscarComFiltros}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar da API
          </Button>
        </div>
      </div>

      {/* MÉTRICAS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total"
          value={devolucoesFiltradas.length}
          icon={Package}
          variant="default"
        />
        <MetricCard
          title="Pendentes"
          value={devolucoesFiltradas.filter(d => d.status_devolucao === 'with_claims').length}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Concluídas"
          value={devolucoesFiltradas.filter(d => d.status_devolucao === 'completed').length}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Canceladas"
          value={devolucoesFiltradas.filter(d => d.status_devolucao === 'cancelled').length}
          icon={XCircle}
          variant="error"
        />
        <MetricCard
          title="Valor Total"
          value={`R$ ${devolucoesFiltradas.reduce((acc, d) => acc + (d.valor_retido || 0), 0).toFixed(2)}`}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* FILTROS AVANÇADOS */}
      <FilterSection
        title="Filtros Avançados - API Mercado Livre"
        basicFilters={[
          {
            id: 'contas',
            label: 'Contas ML',
            type: 'multi-select',
            value: filtrosAvancados.contasSelecionadas,
            onChange: (value) => setFiltrosAvancados(prev => ({ ...prev, contasSelecionadas: value })),
            options: mlAccounts?.map(acc => ({ value: acc.id, label: acc.name })) || [],
            icon: Users
          },
          {
            id: 'busca-tempo-real',
            label: 'Buscar em Tempo Real',
            type: 'select',
            value: filtrosAvancados.buscarEmTempoReal ? 'true' : 'false',
            onChange: (value) => setFiltrosAvancados(prev => ({ ...prev, buscarEmTempoReal: value === 'true' })),
            options: [
              { value: 'false', label: 'Banco de Dados (Rápido)' },
              { value: 'true', label: 'API ML (Atual, mais lento)' }
            ]
          }
        ]}
        advancedFilters={[
          {
            id: 'data-inicio-api',
            label: 'Data Início',
            type: 'date',
            value: filtrosAvancados.dataInicio,
            onChange: (value) => setFiltrosAvancados(prev => ({ ...prev, dataInicio: value }))
          },
          {
            id: 'data-fim-api',
            label: 'Data Fim',
            type: 'date',
            value: filtrosAvancados.dataFim,
            onChange: (value) => setFiltrosAvancados(prev => ({ ...prev, dataFim: value }))
          },
          {
            id: 'status-claim',
            label: 'Status',
            type: 'select',
            value: filtrosAvancados.statusClaim,
            onChange: (value) => setFiltrosAvancados(prev => ({ ...prev, statusClaim: value })),
            options: [
              { value: '', label: 'Todos' },
              { value: 'opened', label: 'Aberto' },
              { value: 'closed', label: 'Fechado' },
              { value: 'cancelled', label: 'Cancelado' },
              { value: 'in_process', label: 'Em Processo' }
            ]
          }
        ]}
        onSearch={buscarComFiltros}
        searchLabel={filtrosAvancados.buscarEmTempoReal ? 'Buscar na API ML' : 'Buscar no Banco'}
        defaultExpanded={true}
      />

      {/* FILTROS BÁSICOS */}
      <FilterSection
        title="Filtros de Busca Local"
        basicFilters={[
          {
            id: 'search',
            label: 'Buscar',
            type: 'text',
            placeholder: 'Order ID, SKU, Produto...',
            value: filtros.searchTerm,
            onChange: (value) => setFiltros(prev => ({ ...prev, searchTerm: value })),
            icon: Search
          },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            placeholder: 'Todos os status',
            value: filtros.status,
            onChange: (value) => setFiltros(prev => ({ ...prev, status: value })),
            options: [
              { value: '', label: 'Todos' },
              { value: 'cancelled', label: 'Canceladas' },
              { value: 'with_claims', label: 'Com Claims' },
              { value: 'completed', label: 'Concluídas' }
            ]
          },
          {
            id: 'data-inicio',
            label: 'Data Início',
            type: 'date',
            value: filtros.dataInicio,
            onChange: (value) => setFiltros(prev => ({ ...prev, dataInicio: value }))
          },
          {
            id: 'data-fim',
            label: 'Data Fim',
            type: 'date',
            value: filtros.dataFim,
            onChange: (value) => setFiltros(prev => ({ ...prev, dataFim: value }))
          }
        ]}
        onClear={() => {
          setFiltros({
            searchTerm: '',
            status: '',
            dataInicio: '',
            dataFim: ''
          });
          setCurrentPage(1);
          persistentState.clearPersistedState();
        }}
      />

      {/* CONTROLES DE VISUALIZAÇÃO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-2"
          >
            <Table2 className="h-4 w-4" />
            Tabela
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {devolucoesFiltradas.length} de {devolucoes.length} resultados
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : devolucoesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma devolução encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {devolucoes.length > 0 
                ? "Verifique os filtros aplicados - há dados disponíveis mas podem estar filtrados"
                : "Não há dados carregados. Use os filtros avançados para buscar da API"
              }
            </p>
            {devolucoes.length === 0 && (
              <Button onClick={buscarComFiltros} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Buscar Devoluções
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devolucoesFiltradas
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((devolucao) => {
                const orderData = devolucao.dados_order || {};
                const buyerNickname = orderData?.buyer?.nickname || devolucao.comprador_nickname || 'N/A';
                
                return (
                  <DevolucaoCard
                    key={devolucao.id}
                    devolucao={{
                      ...devolucao,
                      comprador_nickname: buyerNickname
                    }}
                    onClick={() => {
                      setSelectedDevolucao(devolucao);
                      setShowDetails(true);
                    }}
                  />
                );
              })}
          </div>
          
          {/* Paginação para cards */}
          {devolucoesFiltradas.length > itemsPerPage && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, devolucoesFiltradas.length)} a {Math.min(currentPage * itemsPerPage, devolucoesFiltradas.length)} de {devolucoesFiltradas.length} resultados
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    persistentState.saveOrdersData(devolucoes, devolucoes.length, newPage);
                  }}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  <span className="text-sm">Página</span>
                  <span className="font-medium text-sm">{currentPage}</span>
                  <span className="text-sm">de</span>
                  <span className="font-medium text-sm">{Math.ceil(devolucoesFiltradas.length / itemsPerPage)}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    persistentState.saveOrdersData(devolucoes, devolucoes.length, newPage);
                  }}
                  disabled={currentPage >= Math.ceil(devolucoesFiltradas.length / itemsPerPage)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <VirtualTable
          title="Devoluções do Mercado Livre"
          data={devolucoesFiltradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          columns={[
            { key: 'order_id', label: 'Order ID', width: '120px', render: (value) => <span className="font-mono text-sm">{value}</span> },
            { key: 'produto_titulo', label: 'Produto', render: (value) => <div className="max-w-xs truncate" title={value}>{value || 'N/A'}</div> },
            { key: 'sku', label: 'SKU', width: '100px', render: (value) => <span className="font-mono text-sm">{value || 'N/A'}</span> },
            { key: 'comprador_nickname', label: 'Comprador', width: '120px', render: (value, row) => {
              const orderData = row.dados_order || {};
              const buyerNickname = orderData?.buyer?.nickname || value || 'N/A';
              return <span className="text-sm">{buyerNickname}</span>;
            }},
            { key: 'quantidade', label: 'Qtd', width: '60px' },
            { key: 'valor_retido', label: 'Valor', width: '100px', render: (value) => `R$ ${Number(value || 0).toFixed(2)}` },
            { key: 'status_devolucao', label: 'Status', width: '120px', render: (value) => {
              const variant = value === 'cancelled' ? 'destructive' : value === 'with_claims' ? 'warning' : 'default';
              return (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'cancelled' ? 'bg-red-100 text-red-800' :
                  value === 'with_claims' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {value || 'N/A'}
                </span>
              );
            }},
            { key: 'data_criacao', label: 'Data Criação', width: '120px', render: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : 'N/A' }
          ]}
          loading={loading}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={devolucoesFiltradas.length}
          onPageChange={(page) => {
            setCurrentPage(page);
            persistentState.saveOrdersData(devolucoes, devolucoes.length, page);
          }}
          onRowClick={(row) => {
            setSelectedDevolucao(row);
            setShowDetails(true);
          }}
          emptyMessage="Nenhuma devolução encontrada"
        />
      )}

      {/* Modal de Detalhes */}
      {selectedDevolucao && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Devolução/Cancelamento - {selectedDevolucao.order_id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                      <p className="font-mono">{selectedDevolucao.order_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="font-semibold">{selectedDevolucao.status_devolucao}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor Retido</label>
                      <p className="font-semibold text-lg">R$ {Number(selectedDevolucao.valor_retido || 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Produto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Título</label>
                      <p className="font-semibold">{selectedDevolucao.produto_titulo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="font-mono">{selectedDevolucao.sku}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                      <p>{selectedDevolucao.quantidade}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dados do Pedido (JSON) */}
              {selectedDevolucao.dados_order && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Completos do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                      <pre className="text-xs">{JSON.stringify(selectedDevolucao.dados_order, null, 2)}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dados da Claim (JSON) */}
              {selectedDevolucao.dados_claim && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dados da Reclamação/Cancelamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                      <pre className="text-xs">{JSON.stringify(selectedDevolucao.dados_claim, null, 2)}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DevolucaoAvancadasTab;