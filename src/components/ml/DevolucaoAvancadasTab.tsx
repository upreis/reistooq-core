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
import { useDevolucaoAnalytics } from '@/features/devolucoes/hooks/useDevolucaoAnalytics';
import { useDevolucaoExportacao } from '@/features/devolucoes/hooks/useDevolucaoExportacao';
import DevolucaoAnalyticsDashboard from '@/features/devolucoes/components/DevolucaoAnalyticsDashboard';
import DevolucaoExportDialog from '@/features/devolucoes/components/DevolucaoExportDialog';
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
  BarChart3,
  TrendingUp,
  FileDown
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
  const [showTableView, setShowTableView] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Hook principal consolidado com otimizações
  const {
    devolucoes,
    devolucoesFiltradas,
    stats,
    loading,
    currentPage,
    totalPages,
    showAnalytics,
    filters,
    advancedFilters,
    performanceSettings,
    updateFilters,
    updateAdvancedFilters,
    clearFilters,
    buscarComFiltros,
    sincronizarDevolucoes,
    setCurrentPage,
    toggleAnalytics,
    hasPersistedData,
    autoRefresh,
    lazyLoading
  } = useDevolucoes(mlAccounts);

  // Analytics e exportação
  const analytics = useDevolucaoAnalytics(devolucoesFiltradas);
  const exportacao = useDevolucaoExportacao();

  // Função para extrair motivo do cancelamento completo (garantindo string)
  const getMotivoCancelamento = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Buscar primeiro a descrição completa do motivo
      if (devolucao.dados_claim) {
        const claim = devolucao.dados_claim;
        
        // Buscar descrição detalhada primeiro
        if (claim.reason?.description && typeof claim.reason.description === 'string') {
          return claim.reason.description;
        }
        if (claim.resolution?.description && typeof claim.resolution.description === 'string') {
          return claim.resolution.description;
        }
        if (claim.cancel_detail?.description && typeof claim.cancel_detail.description === 'string') {
          return claim.cancel_detail.description;
        }
        if (claim.cancellation_description && typeof claim.cancellation_description === 'string') {
          return claim.cancellation_description;
        }
        if (claim.reason_description && typeof claim.reason_description === 'string') {
          return claim.reason_description;
        }
        if (claim.description && typeof claim.description === 'string') {
          return claim.description;
        }
        
        // Se não tiver descrição, usar o código/motivo simples
        if (claim.reason && typeof claim.reason === 'string') return claim.reason;
        if (claim.cancel_reason && typeof claim.cancel_reason === 'string') return claim.cancel_reason;
        if (claim.cancellation_reason && typeof claim.cancellation_reason === 'string') return claim.cancellation_reason;
        if (claim.resolution?.reason && typeof claim.resolution.reason === 'string') return claim.resolution.reason;
      }
      
      if (devolucao.dados_order) {
        const order = devolucao.dados_order;
        
        // Buscar descrição detalhada primeiro
        if (order.cancel_detail?.description && typeof order.cancel_detail.description === 'string') {
          return order.cancel_detail.description;
        }
        if (order.cancellation_description && typeof order.cancellation_description === 'string') {
          return order.cancellation_description;
        }
        if (order.cancel_description && typeof order.cancel_description === 'string') {
          return order.cancel_description;
        }
        
        // Se não tiver descrição, usar o código simples
        if (order.cancel_reason && typeof order.cancel_reason === 'string') return order.cancel_reason;
        if (order.cancellation_reason && typeof order.cancellation_reason === 'string') return order.cancellation_reason;
      }
      
      if (devolucao.dados_return) {
        const returnData = devolucao.dados_return;
        
        // Buscar descrição detalhada primeiro
        if (returnData.reason_description && typeof returnData.reason_description === 'string') {
          return returnData.reason_description;
        }
        if (returnData.description && typeof returnData.description === 'string') {
          return returnData.description;
        }
        
        // Se não tiver descrição, usar o código simples
        if (returnData.reason && typeof returnData.reason === 'string') return returnData.reason;
        if (returnData.cancel_reason && typeof returnData.cancel_reason === 'string') return returnData.cancel_reason;
        if (returnData.cancellation_reason && typeof returnData.cancellation_reason === 'string') return returnData.cancellation_reason;
      }

      // Se não tiver motivo específico mas estiver cancelado
      if (devolucao.status_devolucao === 'cancelled') {
        return 'Cancelado - motivo não especificado';
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Erro ao extrair motivo:', error);
      return 'N/A';
    }
  }, []);

  // Função para extrair texto detalhado do motivo (garantindo string)
  const getTextoMotivoDetalhado = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Buscar texto mais detalhado nos dados JSON
      if (devolucao.dados_claim) {
        const claim = devolucao.dados_claim;
        if (claim.reason_description && typeof claim.reason_description === 'string') return claim.reason_description;
        if (claim.resolution?.description && typeof claim.resolution.description === 'string') return claim.resolution.description;
        if (claim.resolution?.comments && typeof claim.resolution.comments === 'string') return claim.resolution.comments;
        if (claim.reason_detail && typeof claim.reason_detail === 'string') return claim.reason_detail;
        if (claim.description && typeof claim.description === 'string') return claim.description;
        if (claim.comments && typeof claim.comments === 'string') return claim.comments;
        if (claim.explanation && typeof claim.explanation === 'string') return claim.explanation;
      }
      
      if (devolucao.dados_return) {
        const returnData = devolucao.dados_return;
        if (returnData.reason_description && typeof returnData.reason_description === 'string') return returnData.reason_description;
        if (returnData.description && typeof returnData.description === 'string') return returnData.description;
        if (returnData.comments && typeof returnData.comments === 'string') return returnData.comments;
        if (returnData.explanation && typeof returnData.explanation === 'string') return returnData.explanation;
        if (returnData.details && typeof returnData.details === 'string') return returnData.details;
      }

      if (devolucao.dados_order) {
        const order = devolucao.dados_order;
        if (order.cancel_description && typeof order.cancel_description === 'string') return order.cancel_description;
        if (order.cancellation_description && typeof order.cancellation_description === 'string') return order.cancellation_description;
        if (order.cancel_detail && typeof order.cancel_detail === 'string') return order.cancel_detail;
        if (order.comments && typeof order.comments === 'string') return order.comments;
      }

      // Buscar em mensagens se disponível
      if (devolucao.dados_mensagens && Array.isArray(devolucao.dados_mensagens) && devolucao.dados_mensagens.length > 0) {
        const ultimaMensagem = devolucao.dados_mensagens[devolucao.dados_mensagens.length - 1];
        if (ultimaMensagem?.text && typeof ultimaMensagem.text === 'string') return ultimaMensagem.text;
        if (ultimaMensagem?.message && typeof ultimaMensagem.message === 'string') return ultimaMensagem.message;
      }
      
      return 'Sem detalhes disponíveis';
    } catch (error) {
      console.error('Erro ao extrair texto detalhado:', error);
      return 'Sem detalhes disponíveis';
    }
  }, []);

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
      {/* Header com estatísticas melhoradas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">
                  {performanceSettings.enableLazyLoading && `${stats.visible} visíveis`}
                </p>
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
                {advancedFilters.autoRefreshEnabled && autoRefresh.timeUntilRefresh && (
                  <p className="text-xs text-gray-500">Refresh: {autoRefresh.timeUntilRefresh}s</p>
                )}
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${
                advancedFilters.buscarEmTempoReal ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Wrench className={`h-4 w-4 ${
                  advancedFilters.buscarEmTempoReal ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {advancedFilters.buscarEmTempoReal ? 'API ML' : 'Banco'}
                </p>
                <p className="text-2xl font-bold">{stats.totalLoaded}</p>
                {autoRefresh.lastRefresh && (
                  <p className="text-xs text-gray-500">
                    {autoRefresh.lastRefresh.toLocaleTimeString()}
                  </p>
                )}
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
          
          {/* Auto-refresh manual */}
          {advancedFilters.autoRefreshEnabled && (
            <Button 
              type="button"
              onClick={autoRefresh.manualRefresh}
              disabled={autoRefresh.isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {autoRefresh.isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              Refresh Manual
              {autoRefresh.timeUntilRefresh && (
                <span className="text-xs">({autoRefresh.timeUntilRefresh}s)</span>
              )}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Botão para alternar entre visualizações */}
          <Button 
            variant="outline"
            onClick={() => setShowTableView(!showTableView)}
            className="flex items-center gap-2"
          >
            {showTableView ? (
              <>
                <Package className="h-4 w-4" />
                Cards
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Tabela
              </>
            )}
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

            {/* Auto-refresh configuration */}
            {advancedFilters.buscarEmTempoReal && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-refresh"
                    checked={advancedFilters.autoRefreshEnabled}
                    onChange={(e) => updateAdvancedFilters({
                      autoRefreshEnabled: e.target.checked
                    })}
                  />
                  <label htmlFor="auto-refresh" className="text-sm font-medium">
                    🔄 Auto-refresh automático
                  </label>
                </div>

                {advancedFilters.autoRefreshEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Intervalo (segundos)</label>
                      <Input
                        type="number"
                        min="10"
                        max="300"
                        value={advancedFilters.autoRefreshInterval}
                        onChange={(e) => updateAdvancedFilters({
                          autoRefreshInterval: parseInt(e.target.value) || 30
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      {autoRefresh.isRefreshing && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Atualizando...
                        </div>
                      )}
                      {autoRefresh.timeUntilRefresh && !autoRefresh.isRefreshing && (
                        <div className="text-xs text-gray-600">
                          Próximo em: {autoRefresh.timeUntilRefresh}s
                        </div>
                      )}
                      {autoRefresh.lastRefresh && (
                        <div className="text-xs text-gray-500">
                          Último: {autoRefresh.lastRefresh.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Campo de busca unificado */}
            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <Input
                placeholder="Produto, SKU, Order ID, Comprador..."
                value={advancedFilters.searchTerm || ''}
                onChange={(e) => updateAdvancedFilters({
                  searchTerm: e.target.value
                })}
              />
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
              <label className="block text-sm font-medium mb-2">Status</label>
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

        {/* Lista de devoluções - Cards ou Tabela */}
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
            ) : showTableView ? (
              /* Visualização em Tabela Detalhada */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-medium">Order ID</th>
                      <th className="text-left p-2 font-medium">Produto</th>
                      <th className="text-left p-2 font-medium">SKU</th>
                      <th className="text-left p-2 font-medium">Comprador</th>
                      <th className="text-left p-2 font-medium">Qtd</th>
                      <th className="text-left p-2 font-medium">Valor Retido</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">📋 Claim</th>
                      <th className="text-left p-2 font-medium">📦 Return</th>
                      <th className="text-left p-2 font-medium">⚖️ Mediação</th>
                      <th className="text-left p-2 font-medium">📎 Anexos</th>
                      <th className="text-left p-2 font-medium">Data Criação</th>
                      <th className="text-left p-2 font-medium">Data Última Atualização</th>
                      <th className="text-left p-2 font-medium">Tipo</th>
                      <th className="text-left p-2 font-medium">Motivo Cancelamento</th>
                      <th className="text-left p-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devolucoes.map((devolucao, index) => {
                      const claimData = devolucao.dados_claim || {};
                      const orderData = devolucao.dados_order || {};
                      const returnData = devolucao.dados_return || {};
                      const mensagensData = devolucao.dados_mensagens || {};

                      // Verificações para cada coluna
                      const temClaimData = !!(
                        claimData && Object.keys(claimData).length > 0 ||
                        orderData?.mediations && orderData.mediations.length > 0
                      );

                      const temReturnData = !!(
                        returnData && Object.keys(returnData).length > 0 ||
                        orderData?.order_request?.return ||
                        orderData?.tags?.includes('return') ||
                        orderData?.tags?.includes('refund')
                      );

                      const temMediationData = !!(
                        orderData?.mediations && orderData.mediations.length > 0 ||
                        claimData?.mediation_details ||
                        claimData?.reason?.code === 'buyer_cancel_express'
                      );

                      const temAttachmentsData = !!(
                        claimData?.attachments ||
                        claimData?.claim_attachments ||
                        mensagensData && Object.keys(mensagensData).length > 0
                      );

                      return (
                        <tr key={`${devolucao.order_id}-${index}`} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium text-blue-600">{devolucao.order_id}</td>
                          <td className="p-2 max-w-xs">
                            <div className="truncate" title={devolucao.produto_titulo}>
                              {devolucao.produto_titulo}
                            </div>
                          </td>
                          <td className="p-2">{devolucao.sku || 'N/A'}</td>
                          <td className="p-2">{devolucao.comprador_nickname || 'N/A'}</td>
                          <td className="p-2 text-center">{devolucao.quantidade || 1}</td>
                          <td className="p-2 text-green-600 font-medium">
                            R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              devolucao.status_devolucao === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : devolucao.status_devolucao === 'cancelled'
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {devolucao.status_devolucao}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {temClaimData ? (
                              <span className="text-blue-600">📋</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temReturnData ? (
                              <span className="text-orange-600">📦</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temMediationData ? (
                              <span className="text-purple-600">⚖️</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temAttachmentsData ? (
                              <span className="text-green-600">📎</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2 text-sm">
                            {new Date(devolucao.data_criacao).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-sm">
                            {new Date(devolucao.updated_at).toLocaleDateString()}
                          </td>
                          <td className="p-2">{claimData.type || 'N/A'}</td>
                          <td className="p-2 max-w-xs">
                            <div className="truncate text-sm" title={String(getMotivoCancelamento(devolucao))}>
                              {String(getMotivoCancelamento(devolucao))}
                            </div>
                          </td>
                          <td className="p-2">
                            <Button
                              variant="outline"
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
              </div>
            ) : (
            <div className="space-y-4">
              {devolucoes.map((devolucao, index) => (
                <Card key={`${devolucao.order_id}-${index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{devolucao.produto_titulo}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            devolucao.status_devolucao === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : devolucao.status_devolucao === 'cancelled'
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {devolucao.status_devolucao}
                          </span>
                        </div>
                        
                        {/* Grid com ícones - todas as colunas importantes */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="text-gray-500 block">Order ID</span>
                              <p className="font-medium">{devolucao.order_id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <div>
                              <span className="text-gray-500 block">Claim ID</span>
                              <p className="font-medium">{devolucao.claim_id || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-gray-500 block">SKU</span>
                              <p className="font-medium">{devolucao.sku || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-gray-500 block">Valor</span>
                              <p className="font-medium">R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                            <div>
                              <span className="text-gray-500 block">Quantidade</span>
                              <p className="font-medium">{devolucao.quantidade || 1}</p>
                            </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                             <XCircle className="h-4 w-4 text-red-600" />
                              <div>
                                <span className="text-gray-500 block">Motivo</span>
                                <p className="font-medium truncate" title={String(getMotivoCancelamento(devolucao))}>
                                  {String(getMotivoCancelamento(devolucao))}
                                </p>
                              </div>
                            </div>
                           
                           <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <div>
                              <span className="text-gray-500 block">Comprador</span>
                              <p className="font-medium truncate">{devolucao.comprador_nickname || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="text-gray-500 block">Descrição</span>
                              <p className="font-medium text-sm truncate" title={String(getTextoMotivoDetalhado(devolucao))}>
                                {String(getTextoMotivoDetalhado(devolucao))}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Informações adicionais com ícones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <div>
                              <span className="text-gray-500">Criado em:</span>
                              <p className="font-medium">{new Date(devolucao.data_criacao).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <Wrench className="h-3 w-3 text-gray-500" />
                            <div>
                              <span className="text-gray-500">Conta:</span>
                              <p className="font-medium truncate">{devolucao.account_name || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <div>
                              <span className="text-gray-500">Atualizado:</span>
                              <p className="font-medium">{new Date(devolucao.updated_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badges com ícones */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {devolucao.dados_claim && Object.keys(devolucao.dados_claim).length > 0 && (
                            <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              <FileText className="h-3 w-3" />
                              Com Claim
                            </span>
                          )}
                          {devolucao.dados_return && Object.keys(devolucao.dados_return).length > 0 && (
                            <span className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              <Package className="h-3 w-3" />
                              Com Return
                            </span>
                          )}
                          {devolucao.dados_mensagens && Object.keys(devolucao.dados_mensagens).length > 0 && (
                            <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              <Wrench className="h-3 w-3" />
                              Com Mensagens
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevolucao(devolucao);
                          setShowDetails(true);
                        }}
                        className="ml-4 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
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
              {/* Informações básicas com ícones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Order ID</Label>
                        <p className="font-medium text-lg">{selectedDevolucao.order_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Claim ID</Label>
                        <p className="font-medium">{selectedDevolucao.claim_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Status</Label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedDevolucao.status_devolucao === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : selectedDevolucao.status_devolucao === 'cancelled'
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedDevolucao.status_devolucao}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="text-sm text-gray-500">SKU</Label>
                        <p className="font-medium">{selectedDevolucao.sku || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-5 w-5 text-indigo-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Quantidade</Label>
                        <p className="font-medium">{selectedDevolucao.quantidade}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Valor Retido</Label>
                        <p className="font-medium text-lg text-green-600">R$ {selectedDevolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Comprador</Label>
                        <p className="font-medium">{selectedDevolucao.comprador_nickname}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm text-gray-500">Data Criação</Label>
                        <p className="font-medium">{new Date(selectedDevolucao.data_criacao).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <Label className="text-sm text-gray-500">Motivo do Cancelamento</Label>
                        <p className="font-medium">{String(getMotivoCancelamento(selectedDevolucao))}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <Label className="text-sm text-gray-500">Descrição Detalhada do Motivo</Label>
                        <p className="font-medium text-sm leading-relaxed">
                          {String(getTextoMotivoDetalhado(selectedDevolucao))}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <Label className="text-sm text-gray-500">Descrição Detalhada do Motivo</Label>
                        <p className="font-medium text-sm leading-relaxed">
                          {getTextoMotivoDetalhado(selectedDevolucao)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-blue-500" />
                      <div>
                        <Label className="text-sm text-gray-500">Conta ML</Label>
                        <p className="font-medium">{selectedDevolucao.account_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Produto com ícone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{selectedDevolucao.produto_titulo}</h3>
                      <p className="text-gray-600">SKU: {selectedDevolucao.sku || 'N/A'}</p>
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