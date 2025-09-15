import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2 
} from 'lucide-react';

interface DevolucaoAvancada {
  id: string;
  integration_account_id: string;
  organization_id: string;
  claim_id: string;
  order_id: string;
  order_number?: string;
  buyer_id?: string;
  buyer_nickname?: string;
  buyer_email?: string;
  item_id?: string;
  item_title?: string;
  sku?: string;
  variation_id?: string;
  quantity?: number;
  unit_price?: number;
  claim_type: string;
  claim_status: string;
  claim_stage?: string;
  resolution?: string;
  reason_code?: string;
  reason_description?: string;
  amount_claimed?: number;
  amount_refunded?: number;
  currency?: string;
  date_created: string;
  date_closed?: string;
  date_last_update?: string;
  last_message?: string;
  seller_response?: string;
  processed_status?: string;
  internal_notes?: string;
  processed_by?: string;
  processed_at?: string;
  raw_data?: any;
  tags?: string[];
  priority?: string;
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
  const [filtros, setFiltros] = useState<Filtros>({
    searchTerm: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  // Atualizar dados quando recebemos devoluções existentes
  useEffect(() => {
    if (existingDevolucoes) {
      setDevolucoes(existingDevolucoes);
    }
  }, [existingDevolucoes]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, devolucoes]);

  // Função principal para sincronizar devoluções usando o mesmo sistema dos pedidos
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
          // 1. Testar se unified-orders funciona
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

          // 3. Processar orders com claims
          if (ordersWithClaims && ordersWithClaims.length > 0) {
            for (const order of ordersWithClaims) {
              try {
                const rawData = order.raw_data || {};
                
                const devolucaoData = {
                  order_id: order.order_id.toString(), // Garantir que é string
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
                  integration_account_id: account.id
                };

                // Tentar inserir primeiro, depois atualizar se já existir
                const { error: insertError } = await supabase
                  .from('devolucoes_avancadas')
                  .insert(devolucaoData);

                if (insertError) {
                  // Se já existe, atualizar
                  if (insertError.code === '23505') { // Unique constraint violation
                    const { error: updateError } = await supabase
                      .from('devolucoes_avancadas')
                      .update({
                        ...devolucaoData,
                        ultima_atualizacao: new Date().toISOString()
                      })
                      .eq('order_id', order.order_id);

                    if (updateError) {
                      console.error(`❌ Erro ao atualizar ${order.order_id}:`, updateError);
                    } else {
                      totalProcessadas++;
                      console.log(`🔄 Atualizada: ${order.order_id}`);
                    }
                  } else {
                    console.error(`❌ Erro ao inserir ${order.order_id}:`, insertError);
                    
                    if (insertError.code === '42P01') {
                      toast.error('Tabela devolucoes_avancadas não existe - Execute o SQL primeiro!');
                      return;
                    }
                  }
                } else {
                  totalProcessadas++;
                  console.log(`💾 ✅ Inserida: ${order.order_id}`);
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
                  integration_account_id: account.id
                };

                // Mesmo método: inserir primeiro, depois atualizar
                const { error: insertError } = await supabase
                  .from('devolucoes_avancadas')
                  .insert(devolucaoData);

                if (insertError) {
                  if (insertError.code === '23505') { // Já existe
                    const { error: updateError } = await supabase
                      .from('devolucoes_avancadas')
                      .update({
                        ...devolucaoData,
                        ultima_atualizacao: new Date().toISOString()
                      })
                      .eq('order_id', order.order_id);

                    if (!updateError) {
                      totalProcessadas++;
                      console.log(`🔄 Cancelamento atualizado: ${order.order_id}`);
                    }
                  } else {
                    console.error(`❌ Erro ao inserir cancelamento:`, insertError);
                  }
                } else {
                  totalProcessadas++;
                  console.log(`💾 ✅ Cancelamento inserido: ${order.order_id}`);
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

      // Recarregar dados
      console.log(`🔄 Recarregando dados da tabela...`);
      await refetch();
      
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

  // Aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...devolucoes];

    if (filtros.searchTerm) {
      const term = filtros.searchTerm.toLowerCase();
      filtered = filtered.filter(dev => 
        dev.order_id?.toLowerCase().includes(term) ||
        dev.item_title?.toLowerCase().includes(term) ||
        dev.sku?.toLowerCase().includes(term) ||
        dev.claim_id?.toLowerCase().includes(term) ||
        dev.buyer_nickname?.toLowerCase().includes(term)
      );
    }

    if (filtros.status) {
      filtered = filtered.filter(dev => dev.claim_status === filtros.status);
    }

    if (filtros.dataInicio) {
      filtered = filtered.filter(dev => {
        const devDate = new Date(dev.date_created || 0);
        return devDate >= new Date(filtros.dataInicio);
      });
    }

    if (filtros.dataFim) {
      filtered = filtered.filter(dev => {
        const devDate = new Date(dev.date_created || 0);
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
      dev.item_title || '',
      dev.quantity || '',
      dev.amount_claimed || '',
      dev.claim_status || '',
      dev.claim_stage || '',
      dev.claim_type || '',
      dev.date_created ? new Date(dev.date_created).toLocaleDateString() : '',
      dev.date_closed ? new Date(dev.date_closed).toLocaleDateString() : '',
      dev.date_last_update ? new Date(dev.date_last_update).toLocaleDateString() : ''
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
                  {devolucoesFiltradas.filter(d => d.claim_status === 'opened' || d.claim_status === 'pending').length}
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
                  {devolucoesFiltradas.filter(d => d.claim_status === 'closed' || d.claim_status === 'completed').length}
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
                  {devolucoesFiltradas.filter(d => d.claim_status === 'cancelled' || d.claim_status === 'rejected').length}
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
            onClick={(e) => {
              e.preventDefault(); // Prevenir reload
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
            {loading ? 'Sincronizando...' : 'Sincronizar Devoluções'}
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
                  <th className="text-left p-2">Qtd</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {devolucoesFiltradas.map((devolucao, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <span className="font-mono text-sm">{devolucao.order_id}</span>
                    </td>
                    <td className="p-2">
                      <div className="max-w-xs truncate" title={devolucao.item_title}>
                        {devolucao.item_title || 'N/A'}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-mono text-sm">{devolucao.sku || 'N/A'}</span>
                    </td>
                    <td className="p-2">{devolucao.quantity || 0}</td>
                    <td className="p-2">
                      {devolucao.amount_claimed ? `R$ ${Number(devolucao.amount_claimed).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        devolucao.claim_status === 'closed' || devolucao.claim_status === 'completed' ? 'bg-green-100 text-green-800' :
                        devolucao.claim_status === 'opened' || devolucao.claim_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        devolucao.claim_status === 'cancelled' || devolucao.claim_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {devolucao.claim_status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      {devolucao.date_created ? 
                        new Date(devolucao.date_created).toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Implementar visualização de detalhes
                          console.log('Detalhes:', devolucao);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};

export default DevolucaoAvancadasTab;