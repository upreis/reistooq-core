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
  Wrench
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
    const carregarDevolucoes = async () => {
      console.log('🚀 Carregando devoluções da API do Mercado Livre...');
      
      // Buscar direto da API por padrão
      if (mlAccounts && mlAccounts.length > 0) {
        const contasAtivas = mlAccounts.filter(acc => acc.is_active);
        
        if (contasAtivas.length > 0) {
          try {
            const devolucoesDaAPI = await buscarDevolucoesDaAPI({
              contasSelecionadas: contasAtivas.map(acc => acc.id),
            });
            
            if (devolucoesDaAPI.length > 0) {
              setDevolucoes(devolucoesDaAPI);
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
    if (mlAccounts) {
      carregarDevolucoes();
    }
  }, [mlAccounts]); // Dependência das contas ML

  // Função para aplicar filtros otimizada com useCallback
  const aplicarFiltros = useCallback(() => {
    let resultados = devolucoes;

    if (filtros.searchTerm) {
      resultados = resultados.filter(dev => 
        dev.produto_titulo?.toLowerCase().includes(filtros.searchTerm.toLowerCase()) ||
        dev.order_id?.toString().includes(filtros.searchTerm) ||
        dev.sku?.toLowerCase().includes(filtros.searchTerm.toLowerCase()) ||
        dev.comprador_nickname?.toLowerCase().includes(filtros.searchTerm.toLowerCase())
      );
    }

    if (filtros.status) {
      resultados = resultados.filter(dev => dev.status_devolucao === filtros.status);
    }

    if (filtros.dataInicio) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) >= new Date(filtros.dataInicio)
      );
    }

    if (filtros.dataFim) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) <= new Date(filtros.dataFim)
      );
    }

    setDevolucoesFiltradas(resultados);
  }, [filtros, devolucoes]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

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
            
            // Processar dados vindos diretamente da API
            const devolucoesProcesadas = devolucoesDaAPI.map((item: any) => ({
              id: `api_${item.order_id}_${Date.now()}`, // ID temporário para API
              order_id: item.order_id,
              claim_id: item.claim_id || null,
              data_criacao: item.date_created,
              status_devolucao: item.status || 'unknown',
              valor_retido: item.amount || 0,
              produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
              sku: item.resource_data?.sku || '',
              quantidade: item.resource_data?.quantity || 1,
              comprador_nickname: item.buyer?.nickname || 'Desconhecido',
              dados_order: item.order_data || {},
              dados_claim: item.claim_data || {},
              dados_mensagens: item.messages || null,
              dados_return: item.return_data || null,
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
        setDevolucoes(devolucoesDaAPI);
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
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{devolucoesFiltradas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">
                  {devolucoesFiltradas.filter(d => d.status_devolucao === 'with_claims').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">
                  {devolucoesFiltradas.filter(d => d.status_devolucao === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold">
                  {devolucoesFiltradas.filter(d => d.status_devolucao === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de ação */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sincronizarDevolucoes();
            }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar Devoluções (BD)
          </Button>

          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              buscarComFiltros();
            }}
            disabled={loading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {filtrosAvancados.buscarEmTempoReal ? 'Buscar API ML' : 'Atualizar BD'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={exportarCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* COMPONENTE DE FILTROS AVANÇADOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados - Busca em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Toggle para busca em tempo real */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tempo-real"
                checked={filtrosAvancados.buscarEmTempoReal}
                onChange={(e) => setFiltrosAvancados(prev => ({
                  ...prev,
                  buscarEmTempoReal: e.target.checked
                }))}
              />
              <label htmlFor="tempo-real" className="text-sm font-medium">
                🔴 Buscar em tempo real da API ML (mais lento, dados atuais)
              </label>
            </div>

            {/* Seleção de contas */}
            <div>
              <label className="block text-sm font-medium mb-2">Contas ML</label>
              <div className="grid grid-cols-2 gap-2">
                {mlAccounts?.map((account) => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={account.id}
                      checked={filtrosAvancados.contasSelecionadas.includes(account.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFiltrosAvancados(prev => ({
                            ...prev,
                            contasSelecionadas: [...prev.contasSelecionadas, account.id]
                          }));
                        } else {
                          setFiltrosAvancados(prev => ({
                            ...prev,
                            contasSelecionadas: prev.contasSelecionadas.filter(id => id !== account.id)
                          }));
                        }
                      }}
                    />
                    <label htmlFor={account.id} className="text-sm">
                      {account.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros de data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data Início</label>
                <Input
                  type="date"
                  value={filtrosAvancados.dataInicio}
                  onChange={(e) => setFiltrosAvancados(prev => ({
                    ...prev,
                    dataInicio: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Fim</label>
                <Input
                  type="date"
                  value={filtrosAvancados.dataFim}
                  onChange={(e) => setFiltrosAvancados(prev => ({
                    ...prev,
                    dataFim: e.target.value
                  }))}
                />
              </div>
            </div>

            {/* Status do claim */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filtrosAvancados.statusClaim} onValueChange={(value) => 
                setFiltrosAvancados(prev => ({ ...prev, statusClaim: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="opened">Aberto</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="in_process">Em Processo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão de busca */}
            <Button 
              onClick={buscarComFiltros}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {filtrosAvancados.buscarEmTempoReal ? 'Buscar na API ML' : 'Buscar no Banco'}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Tabela de devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>Devoluções do Mercado Livre</CardTitle>
          <CardDescription>
            {devolucoesFiltradas.length} devoluções encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Comprador</th>
                  <th className="text-left p-2">Qtd</th>
                  <th className="text-left p-2">Valor Retido</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data Criação</th>
                  <th className="text-left p-2">Data Última Atualização</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Motivo Cancelamento</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {devolucoesFiltradas.map((devolucao, index) => {
                  // Mapear campos da tabela real para campos esperados pela interface
                  const orderData = devolucao.dados_order || {};
                  const claimData = devolucao.dados_claim || {};
                  const buyerNickname = orderData?.buyer?.nickname || 'N/A';
                  const cancelReason = claimData?.reason?.description || orderData?.cancel_detail?.description || 'N/A';
                  
                  return (
                    <tr key={devolucao.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className="font-mono text-sm">{devolucao.order_id}</span>
                      </td>
                      <td className="p-2">
                        <div className="max-w-xs truncate" title={devolucao.produto_titulo}>
                          {devolucao.produto_titulo || 'N/A'}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-mono text-sm">{devolucao.sku || 'N/A'}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">{buyerNickname}</span>
                      </td>
                      <td className="p-2">{devolucao.quantidade || 0}</td>
                      <td className="p-2">
                        R$ {Number(devolucao.valor_retido || 0).toFixed(2)}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          devolucao.status_devolucao === 'cancelled' ? 'bg-red-100 text-red-800' :
                          devolucao.status_devolucao === 'with_claims' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {devolucao.status_devolucao || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">
                        {devolucao.data_criacao ? 
                          new Date(devolucao.data_criacao).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </td>
                      <td className="p-2">
                        {devolucao.updated_at ? 
                          new Date(devolucao.updated_at).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </td>
                      <td className="p-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {claimData.type || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="max-w-xs truncate text-xs" title={translateCancelReason(cancelReason)}>
                          {translateCancelReason(cancelReason)}
                        </div>
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDevolucao(devolucao);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {devolucoesFiltradas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma devolução encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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