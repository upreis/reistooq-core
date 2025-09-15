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
  id: number;
  claim_id: string;
  return_id: string;
  order_id: string;
  id_carrinho?: string;
  id_item?: string;
  sku?: string;
  produto_titulo?: string;
  quantidade?: number;
  valor_retido?: number;
  status_devolucao?: string;
  cronograma_status?: string;
  cronograma_tipo?: string;
  destino_tipo?: string;
  destino_endereco?: any;
  data_criacao?: string;
  data_fechamento?: string;
  ultima_atualizacao?: string;
  status_envio?: string;
  codigo_rastreamento?: string;
  status_dinheiro?: string;
  reembolso_quando?: string;
  dados_claim?: any;
  dados_return?: any;
  dados_order?: any;
  dados_mensagens?: any;
  dados_acoes?: any;
  integration_account_id?: string;
  organization_id?: string;
  processado_em?: string;
  created_at?: string;
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

  // Função principal para sincronizar devoluções
  const sincronizarDevolucoes = async () => {
    if (!mlAccounts || mlAccounts.length === 0) {
      toast.error('Nenhuma conta ML encontrada');
      return;
    }

    setLoading(true);
    console.log('🚀 Iniciando sincronização de devoluções...');
    
    try {
      let processedAccounts = 0;

      for (const account of mlAccounts) {
        console.log(`🔍 Processando conta: ${account.name}`);
        
        try {
          // Usar edge function ml-devolucoes-sync que já tem acesso interno aos tokens
          console.log(`🔄 Sincronizando devoluções para ${account.name}...`);
          
          const { data: syncData, error: syncError } = await supabase.functions.invoke('ml-devolucoes-sync', {
            body: {
              integration_account_id: account.id,
              date_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 dias
              date_to: new Date().toISOString()
            }
          });

          if (syncError) {
            console.error(`❌ Erro ao sincronizar devoluções para ${account.name}:`, syncError);
            toast.error(`Erro ao sincronizar devoluções para ${account.name}: ${syncError.message}`);
            continue;
          }

          if (!syncData || syncData.error) {
            console.error(`❌ Erro na resposta da sincronização para ${account.name}:`, syncData?.error);
            toast.error(`Erro na sincronização de ${account.name}: ${syncData?.error || 'Resposta inválida'}`);
            continue;
          }

          const processedCount = syncData.processed_returns || 0;
          const totalCount = syncData.total_found || 0;
          
          console.log(`✅ Sincronização concluída para ${account.name}: ${processedCount}/${totalCount} devoluções processadas`);
          toast.success(`${account.name}: ${processedCount} devoluções sincronizadas de ${totalCount} encontradas`);
          
          processedAccounts++;
        } catch (syncError) {
          console.error(`❌ Erro na sincronização para ${account.name}:`, syncError);
          toast.error(`Erro na sincronização de ${account.name}: ${syncError.message}`);
        }
      }

      // Mostrar resultados finais
      if (processedAccounts > 0) {
        toast.success(`✅ Sincronização concluída para ${processedAccounts} conta(s)`);
        console.log(`🎉 Sincronização finalizada - ${processedAccounts} contas processadas`);
        
        // Recarregar dados
        await refetch();
      } else {
        toast.error('Nenhuma conta foi processada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro geral na sincronização:', error);
      toast.error('Erro na sincronização de devoluções');
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
        dev.produto_titulo?.toLowerCase().includes(term) ||
        dev.sku?.toLowerCase().includes(term) ||
        dev.claim_id?.toLowerCase().includes(term) ||
        dev.return_id?.toLowerCase().includes(term)
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
      'ID Return', 
      'ID Pedido',
      'SKU',
      'Produto',
      'Quantidade',
      'Valor Retido',
      'Status Devolução',
      'Status Cronograma',
      'Tipo Cronograma',
      'Data Criação',
      'Data Fechamento',
      'Última Atualização'
    ];

    const csvData = devolucoesFiltradas.map(dev => [
      dev.claim_id || '',
      dev.return_id || '',
      dev.order_id || '',
      dev.sku || '',
      dev.produto_titulo || '',
      dev.quantidade || '',
      dev.valor_retido || '',
      dev.status_devolucao || '',
      dev.cronograma_status || '',
      dev.cronograma_tipo || '',
      dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString() : '',
      dev.data_fechamento ? new Date(dev.data_fechamento).toLocaleDateString() : '',
      dev.ultima_atualizacao ? new Date(dev.ultima_atualizacao).toLocaleDateString() : ''
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
                  {devolucoesFiltradas.filter(d => d.status_devolucao === 'pending').length}
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
            onClick={sincronizarDevolucoes} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar Devoluções
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
                      <div className="max-w-xs truncate" title={devolucao.produto_titulo}>
                        {devolucao.produto_titulo || 'N/A'}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-mono text-sm">{devolucao.sku || 'N/A'}</span>
                    </td>
                    <td className="p-2">{devolucao.quantidade || 0}</td>
                    <td className="p-2">
                      {devolucao.valor_retido ? `R$ ${Number(devolucao.valor_retido).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        devolucao.status_devolucao === 'completed' ? 'bg-green-100 text-green-800' :
                        devolucao.status_devolucao === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        devolucao.status_devolucao === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {devolucao.status_devolucao || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      {devolucao.data_criacao ? 
                        new Date(devolucao.data_criacao).toLocaleDateString() : 
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