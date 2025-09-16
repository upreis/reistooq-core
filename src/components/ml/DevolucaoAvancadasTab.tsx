import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { translateCancelReason } from '@/lib/translations';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import { useDevolucoesDemostracao } from '@/features/devolucoes/hooks/useDevolucoesDemostracao';
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
  ChevronRight
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
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Hook principal consolidado
  const {
    devolucoes,
    devolucoesFiltradas,
    stats,
    loading,
    currentPage,
    totalPages,
    filters,
    advancedFilters,
    updateFilters,
    updateAdvancedFilters,
    clearFilters,
    buscarComFiltros,
    sincronizarDevolucoes,
    setCurrentPage,
    hasPersistedData
  } = useDevolucoes(mlAccounts);

  // Tempo real para demonstração
  useDevolucoesDemostracao(
    advancedFilters.buscarEmTempoReal,
    (payload) => {
      // Atualização automática será implementada se necessário
      console.log('📡 Atualização tempo real:', payload);
    }
  );

  const exportarCSV = useCallback(() => {
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
      'N/A',
      'N/A',
      dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString() : '',
      'N/A',
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
  }, [devolucoesFiltradas]);

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
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.pendentes}</p>
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
                <p className="text-2xl font-bold">{stats.concluidas}</p>
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
                <p className="text-2xl font-bold">{stats.canceladas}</p>
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
            onClick={sincronizarDevolucoes}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar BD
          </Button>

          <Button 
            type="button"
            onClick={buscarComFiltros}
            disabled={loading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {advancedFilters.buscarEmTempoReal ? 'Buscar API ML' : 'Atualizar BD'}
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

      {/* FILTROS AVANÇADOS */}
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
                checked={advancedFilters.buscarEmTempoReal}
                onChange={(e) => updateAdvancedFilters({
                  buscarEmTempoReal: e.target.checked
                })}
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
                      checked={advancedFilters.contasSelecionadas.includes(account.id)}
                      onChange={(e) => {
                        const currentAccounts = advancedFilters.contasSelecionadas;
                        const newAccounts = e.target.checked
                          ? [...currentAccounts, account.id]
                          : currentAccounts.filter(id => id !== account.id);
                        
                        updateAdvancedFilters({
                          contasSelecionadas: newAccounts
                        });
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
                  value={advancedFilters.dataInicio || ''}
                  onChange={(e) => updateAdvancedFilters({
                    dataInicio: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Fim</label>
                <Input
                  type="date"
                  value={advancedFilters.dataFim || ''}
                  onChange={(e) => updateAdvancedFilters({
                    dataFim: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Status do claim */}
            <div>
              <label className="block text-sm font-medium mb-2">Status do Claim</label>
              <Select 
                value={advancedFilters.statusClaim || ''} 
                onValueChange={(value) => updateAdvancedFilters({
                  statusClaim: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="with_claims">Com Claims</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FILTROS BÁSICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros Básicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Produto, SKU, Order ID, Comprador..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="with_claims">Com Claims</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => updateFilters({ dataInicio: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => updateFilters({ dataFim: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>Devoluções Encontradas ({devolucoesFiltradas.length})</CardTitle>
          {hasPersistedData && (
            <CardDescription>
              🔄 Dados restaurados do cache. Use os botões de sincronização para atualizar.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : devolucoes.length === 0 ? (
            <div className="text-center p-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma devolução encontrada</p>
              <p className="text-sm text-gray-400 mt-2">
                Use os filtros avançados para buscar da API ML ou sincronize com o banco de dados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {devolucoes.map((devolucao, index) => (
                <Card key={`${devolucao.order_id}-${index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{devolucao.produto_titulo}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            devolucao.status_devolucao === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : devolucao.status_devolucao === 'cancelled'
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {devolucao.status_devolucao}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Order ID:</span>
                            <p className="font-medium">{devolucao.order_id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">SKU:</span>
                            <p className="font-medium">{devolucao.sku || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor:</span>
                            <p className="font-medium">R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Comprador:</span>
                            <p className="font-medium">{devolucao.comprador_nickname || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <p>Criado em: {new Date(devolucao.data_criacao).toLocaleString()}</p>
                          <p>Conta: {devolucao.account_name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevolucao(devolucao);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Devolução - Order {selectedDevolucao?.order_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevolucao && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Produto</Label>
                      <p className="font-medium">{selectedDevolucao.produto_titulo}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="font-medium">{selectedDevolucao.status_devolucao}</p>
                    </div>
                    <div>
                      <Label>SKU</Label>
                      <p className="font-medium">{selectedDevolucao.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Quantidade</Label>
                      <p className="font-medium">{selectedDevolucao.quantidade}</p>
                    </div>
                    <div>
                      <Label>Valor Retido</Label>
                      <p className="font-medium">R$ {selectedDevolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <Label>Comprador</Label>
                      <p className="font-medium">{selectedDevolucao.comprador_nickname}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados do pedido */}
              {selectedDevolucao.dados_order && Object.keys(selectedDevolucao.dados_order).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-60">
                      {JSON.stringify(selectedDevolucao.dados_order, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Dados do claim */}
              {selectedDevolucao.dados_claim && Object.keys(selectedDevolucao.dados_claim).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados do Claim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-60">
                      {JSON.stringify(selectedDevolucao.dados_claim, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevolucaoAvancadasTab;