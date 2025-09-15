import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  FileText
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

  // Buscar devoluções existentes ao carregar o componente
  useEffect(() => {
    const carregarDevolucoes = async () => {
      try {
        const { data: devolucoes, error } = await supabase
          .from('devolucoes_avancadas')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao carregar devoluções:', error);
          toast.error('Erro ao carregar devoluções');
        } else {
          console.log(`✅ Carregadas ${devolucoes?.length || 0} devoluções existentes`);
          setDevolucoes(devolucoes as DevolucaoAvancada[] || []);
        }
      } catch (error) {
        console.error('Erro ao buscar devoluções:', error);
      }
    };

    carregarDevolucoes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, devolucoes]);

  // NOVA FUNÇÃO - BUSCA EM TEMPO REAL DA API ML
  const buscarDevolucoesDaAPI = async (filtros: {
    contasSelecionadas: string[];
    dataInicio?: string;
    dataFim?: string;
    status?: string;
  }) => {
    if (!filtros.contasSelecionadas.length) {
      toast.error('Selecione pelo menos uma conta ML');
      return [];
    }

    setLoading(true);
    const todasDevolucoes: DevolucaoAvancada[] = [];
    
    try {
      for (const accountId of filtros.contasSelecionadas) {
        const account = mlAccounts?.find(acc => acc.id === accountId);
        if (!account) continue;

        console.log(`🔍 Buscando devoluções em tempo real para: ${account.name}`);
        
        try {
          // 1. Buscar access token
          const { data: tokenData, error: tokenError } = await supabase.functions.invoke('integrations-get-secret', {
            body: { 
              integration_account_id: accountId,
              provider: 'mercadolivre'
            }
          });

          if (tokenError || !tokenData?.value) {
            console.warn(`⚠️ Token não encontrado para ${account.name}`);
            continue;
          }

          const accessToken = tokenData.value;

          // 2. Buscar seller_id
          const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!userResponse.ok) {
            console.error(`❌ Token inválido para ${account.name}`);
            continue;
          }

          const userData = await userResponse.json();
          const sellerId = userData.id;

          console.log(`👤 Seller ID: ${sellerId} (${userData.nickname})`);

          // 3. BUSCAR CLAIMS EM TEMPO REAL
          const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=50`;
          
          const claimsResponse = await fetch(claimsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          let claims = [];
          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json();
            claims = claimsData.results || [];
            console.log(`📋 Claims encontradas: ${claims.length}`);
          }

          // 4. BUSCAR ORDERS CANCELADAS EM TEMPO REAL
          let ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled&limit=50`;
          
          // Aplicar filtro de data se fornecido
          if (filtros.dataInicio) {
            ordersUrl += `&order.date_created.from=${filtros.dataInicio}`;
          }
          if (filtros.dataFim) {
            ordersUrl += `&order.date_created.to=${filtros.dataFim}`;
          }

          const ordersResponse = await fetch(ordersUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            const cancelledOrders = ordersData.results || [];
            console.log(`🚫 Orders canceladas: ${cancelledOrders.length}`);

            // Adicionar orders canceladas como claims
            for (const order of cancelledOrders) {
              claims.push({
                id: `cancelled_${order.id}`,
                resource_id: order.id,
                type: 'cancellation',
                status: 'closed',
                reason: order.cancel_detail || 'Pedido cancelado',
                date_created: order.date_created,
                order_data: order
              });
            }
          }

          // 5. PROCESSAR CADA CLAIM EM TEMPO REAL
          for (const claim of claims) {
            try {
              // Buscar dados completos da order
              const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${claim.resource_id}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!orderResponse.ok) continue;

              const orderData = await orderResponse.json();

              // Aplicar filtros
              const dataOrder = new Date(claim.date_created);
              if (filtros.dataInicio && dataOrder < new Date(filtros.dataInicio)) continue;
              if (filtros.dataFim && dataOrder > new Date(filtros.dataFim)) continue;
              if (filtros.status && claim.status !== filtros.status) continue;

              // Buscar mensagens se houver mediação
              let mensagens = null;
              if (claim.mediations && claim.mediations.length > 0) {
                try {
                  const packId = claim.mediations[0].id;
                  const messagesResponse = await fetch(`https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (messagesResponse.ok) {
                    mensagens = await messagesResponse.json();
                  }
                } catch (msgError) {
                  console.warn('⚠️ Erro ao buscar mensagens:', msgError);
                }
              }

              // Buscar detalhes de devolução
              let returnDetails = null;
              if (claim.id && !claim.id.startsWith('cancelled_')) {
                try {
                  const returnResponse = await fetch(`https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (returnResponse.ok) {
                    returnDetails = await returnResponse.json();
                  }
                } catch (returnError) {
                  console.warn('⚠️ Erro ao buscar detalhes de devolução:', returnError);
                }
              }

              // Criar objeto de devolução em tempo real
              const devolucao: DevolucaoAvancada = {
                id: `${claim.id}_${orderData.id}`,
                order_id: orderData.id.toString(),
                claim_id: claim.id.startsWith('cancelled_') ? null : claim.id,
                data_criacao: claim.date_created,
                claim_status: claim.status || 'unknown',
                valor_retido: orderData.total_amount || 0,
                produto_titulo: orderData.order_items?.[0]?.item?.title || 'Produto não identificado',
                sku: orderData.order_items?.[0]?.item?.seller_sku || '',
                quantidade: orderData.order_items?.[0]?.quantity || 1,
                comprador_nickname: orderData.buyer?.nickname || 'Desconhecido',
                dados_order: orderData,
                dados_claim: claim,
                dados_mensagens: mensagens,
                dados_return: returnDetails,
                integration_account_id: accountId,
                account_name: account.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              todasDevolucoes.push(devolucao);
              console.log(`✅ Devolução processada: ${orderData.id}`);

            } catch (claimError) {
              console.error(`❌ Erro ao processar claim:`, claimError);
            }

            // Pausa para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }

        } catch (accountError) {
          console.error(`❌ Erro na conta ${account.name}:`, accountError);
        }
      }

      console.log(`🎉 Total de devoluções encontradas: ${todasDevolucoes.length}`);
      return todasDevolucoes;

    } catch (error) {
      console.error('❌ Erro geral na busca:', error);
      throw error;
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

  // Nova função para buscar em tempo real
  const buscarEmTempoReal = async () => {
    const contasSelecionadas = mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [];
    
    try {
      const devolucoesDaAPI = await buscarDevolucoesDaAPI({
        contasSelecionadas,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        status: filtros.status
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

  // Aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...devolucoes];

    if (filtros.searchTerm) {
      const term = filtros.searchTerm.toLowerCase();
      filtered = filtered.filter(dev => 
        dev.order_id?.toLowerCase().includes(term) ||
        dev.produto_titulo?.toLowerCase().includes(term) ||
        dev.sku?.toLowerCase().includes(term) ||
        dev.claim_id?.toLowerCase().includes(term)
      );
    }

    if (filtros.status) {
      filtered = filtered.filter(dev => dev.status_devolucao === filtros.status);
    }

    if (filtros.dataInicio) {
      filtered = filtered.filter(dev => {
        const devDate = new Date(dev.data_criacao || 0);
        return devDate >= new Date(filtros.dataInicio);
      });
    }

    if (filtros.dataFim) {
      filtered = filtered.filter(dev => {
        const devDate = new Date(dev.data_criacao || 0);
        return devDate <= new Date(filtros.dataFim);
      });
    }

    setDevolucoesFiltradas(filtered);
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
              buscarEmTempoReal();
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
            Buscar Tempo Real (API)
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Order ID, SKU, Produto..."
                value={filtros.searchTerm}
                onChange={(e) => setFiltros(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filtros.status}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFiltros({ searchTerm: '', status: '', dataInicio: '', dataFim: '' })}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
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
                        <div className="max-w-xs truncate text-xs" title={cancelReason}>
                          {cancelReason}
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