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

  // Tempo real para demonstração - corrigir dependências
  useDevolucoesDemostracao(
    advancedFilters.buscarEmTempoReal,
    useCallback((payload) => {
      // Atualização automática será implementada se necessário
      console.log('📡 Atualização tempo real:', payload);
    }, [])
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {performanceSettings.enableLazyLoading && `${stats.visible} visíveis`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold dark:text-white">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Canceladas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.canceladas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">API ML</p>
                <p className="text-2xl font-bold dark:text-white">{stats.totalLoaded}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dados em tempo real</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button"
            onClick={buscarComFiltros}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Buscar da API ML
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
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

          {/* Auto Refresh Toggle */}
          <Button
            variant={advancedFilters.autoRefreshEnabled ? "default" : "outline"}
            onClick={() => updateAdvancedFilters({ autoRefreshEnabled: !advancedFilters.autoRefreshEnabled })}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${advancedFilters.autoRefreshEnabled ? 'animate-spin' : ''}`} />
            Auto Refresh
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

      {/* FILTROS E FERRAMENTAS DE ANÁLISE */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtros e Ferramentas de Análise</span>
            </div>
          </div>
          
          {/* Linha de filtros horizontais */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Campo de busca */}
            <div className="flex items-center relative min-w-[250px]">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por Order ID, comprador..."
                value={advancedFilters.searchTerm || ''}
                onChange={(e) => updateAdvancedFilters({
                  searchTerm: e.target.value
                })}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 focus:border-slate-500"
              />
            </div>

            {/* Status */}
            <Select 
              value={advancedFilters.statusClaim || ''} 
              onValueChange={(value) => updateAdvancedFilters({
                statusClaim: value
              })}
            >
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            {/* Contas ML - Seleção múltipla */}
            <div className="relative">
              <Select 
                value={advancedFilters.contasSelecionadas.length === 0 ? "nenhuma" : 
                       advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "todas" : "multiplas"}
                onValueChange={() => {}} // Controlado via menu customizado
              >
                <SelectTrigger className="min-w-[200px] bg-slate-800 border-slate-600 text-white">
                  <SelectValue>
                    {advancedFilters.contasSelecionadas.length === 0 ? "Nenhuma conta" :
                     advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "Todas as contas" :
                     `${advancedFilters.contasSelecionadas.length} conta${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''} selecionada${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 min-w-[300px] z-50">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded">
                      <input
                        type="checkbox"
                        id="todas-contas"
                        checked={advancedFilters.contasSelecionadas.length === mlAccounts?.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateAdvancedFilters({
                              contasSelecionadas: mlAccounts?.map(acc => acc.id) || []
                            });
                          } else {
                            updateAdvancedFilters({
                              contasSelecionadas: []
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor="todas-contas" className="text-sm text-white font-medium cursor-pointer">
                        Todas as contas
                      </label>
                    </div>
                    <div className="h-px bg-slate-600 my-2"></div>
                    {mlAccounts?.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded">
                        <input
                          type="checkbox"
                          id={`conta-${account.id}`}
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
                          className="rounded"
                        />
                        <label htmlFor={`conta-${account.id}`} className="text-sm text-white cursor-pointer">
                          {account.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <Input
              type="date"
              value={advancedFilters.dataInicio || ''}
              onChange={(e) => updateAdvancedFilters({
                dataInicio: e.target.value
              })}
              className="w-[140px] bg-slate-800 border-slate-600 text-white [&::-webkit-calendar-picker-indicator]:invert"
            />

            {/* Data Fim */}
            <Input
              type="date"
              value={advancedFilters.dataFim || ''}
              onChange={(e) => updateAdvancedFilters({
                dataFim: e.target.value
              })}
              className="w-[140px] bg-slate-800 border-slate-600 text-white [&::-webkit-calendar-picker-indicator]:invert"
            />

            {/* Botão Atualizar */}
            <Button 
              onClick={buscarComFiltros}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>

            {/* Botão Análise API */}
            <Button 
              variant="outline"
              onClick={toggleAnalytics}
              className="border-slate-600 text-white hover:bg-slate-700 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Análise API
            </Button>
          </div>

          {/* Auto-refresh personalizado - compacto */}
          <div className="mt-4 p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white">🔄 Auto-refresh:</label>
              <Input
                type="number"
                min="1"
                max="1440"
                value={advancedFilters.autoRefreshEnabled ? Math.floor(advancedFilters.autoRefreshInterval / 60) : ""}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  const seconds = minutes * 60;
                  updateAdvancedFilters({
                    autoRefreshEnabled: minutes > 0,
                    autoRefreshInterval: seconds > 0 ? seconds : 3600
                  });
                }}
                placeholder="Minutos"
                className="w-20 bg-slate-700 border-slate-600 text-white text-sm"
              />
              <span className="text-sm text-gray-400">min</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAdvancedFilters({ autoRefreshEnabled: false })}
                disabled={!advancedFilters.autoRefreshEnabled}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Desativar
              </Button>
              {advancedFilters.autoRefreshEnabled && autoRefresh && (
                <div className="text-xs text-gray-400">
                  Próxima: {autoRefresh.timeUntilRefresh || 0}s
                  {autoRefresh.isRefreshing && " (atualizando...)"}
                </div>
              )}
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
                <Loader2 className="h-8 w-8 animate-spin dark:text-white" />
              </div>
            ) : devolucoes.length === 0 ? (
              <div className="text-center p-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma devolução encontrada</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Use os filtros para buscar da API ML
                </p>
              </div>
            ) : showTableView ? (
              /* Visualização em Tabela Detalhada */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="text-left p-2 font-medium dark:text-white">Order ID</th>
                      <th className="text-left p-2 font-medium dark:text-white">Produto</th>
                      <th className="text-left p-2 font-medium dark:text-white">SKU</th>
                      <th className="text-left p-2 font-medium dark:text-white">Comprador</th>
                      <th className="text-left p-2 font-medium dark:text-white">Qtd</th>
                      <th className="text-left p-2 font-medium dark:text-white">Valor Retido</th>
                      <th className="text-left p-2 font-medium dark:text-white">Status</th>
                      <th className="text-left p-2 font-medium dark:text-white">📋 Claim</th>
                      <th className="text-left p-2 font-medium dark:text-white">📦 Return</th>
                      <th className="text-left p-2 font-medium dark:text-white">⚖️ Mediação</th>
                      <th className="text-left p-2 font-medium dark:text-white">📎 Anexos</th>
                      <th className="text-left p-2 font-medium dark:text-white">Data Criação</th>
                      <th className="text-left p-2 font-medium dark:text-white">Data Última Atualização</th>
                      <th className="text-left p-2 font-medium dark:text-white">Tipo</th>
                      <th className="text-left p-2 font-medium dark:text-white">Motivo Cancelamento</th>
                      <th className="text-left p-2 font-medium dark:text-white">Ações</th>
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
                        <tr key={`${devolucao.order_id}-${index}`} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:border-gray-700">
                          <td className="p-2 font-medium text-blue-600 dark:text-blue-400">{devolucao.order_id}</td>
                          <td className="p-2 max-w-xs">
                            <div className="truncate dark:text-white" title={devolucao.produto_titulo}>
                              {devolucao.produto_titulo}
                            </div>
                          </td>
                          <td className="p-2 dark:text-white">{devolucao.sku || 'N/A'}</td>
                          <td className="p-2 dark:text-white">{devolucao.comprador_nickname || 'N/A'}</td>
                          <td className="p-2 text-center dark:text-white">{devolucao.quantidade || 1}</td>
                          <td className="p-2 text-green-600 dark:text-green-400 font-medium">
                            R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              devolucao.status_devolucao === 'completed' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : devolucao.status_devolucao === 'cancelled'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {devolucao.status_devolucao}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {temClaimData ? (
                              <span className="text-blue-600 dark:text-blue-400">📋</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temReturnData ? (
                              <span className="text-orange-600 dark:text-orange-400">📦</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temMediationData ? (
                              <span className="text-purple-600 dark:text-purple-400">⚖️</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {temAttachmentsData ? (
                              <span className="text-green-600 dark:text-green-400">📎</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">-</span>
                            )}
                          </td>
                          <td className="p-2 text-sm dark:text-white">
                            {new Date(devolucao.data_criacao).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-sm dark:text-white">
                            {new Date(devolucao.updated_at).toLocaleDateString()}
                          </td>
                          <td className="p-2 dark:text-white">{claimData.type || 'N/A'}</td>
                          <td className="p-2 max-w-xs">
                            <div className="truncate text-sm dark:text-white" title={String(getMotivoCancelamento(devolucao))}>
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
                              className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
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
                          <h3 className="font-semibold text-lg dark:text-white">{devolucao.produto_titulo}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            devolucao.status_devolucao === 'completed' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : devolucao.status_devolucao === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          }`}>
                            {devolucao.status_devolucao}
                          </span>
                        </div>
                        
                        {/* Grid com ícones - todas as colunas importantes */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Order ID</span>
                              <p className="font-medium dark:text-white">{devolucao.order_id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Claim ID</span>
                              <p className="font-medium dark:text-white">{devolucao.claim_id || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">SKU</span>
                              <p className="font-medium dark:text-white">{devolucao.sku || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Valor</span>
                              <p className="font-medium dark:text-white">R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Quantidade</span>
                              <p className="font-medium dark:text-white">{devolucao.quantidade || 1}</p>
                            </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                             <XCircle className="h-4 w-4 text-red-600" />
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 block">Motivo</span>
                                <p className="font-medium dark:text-white truncate" title={String(getMotivoCancelamento(devolucao))}>
                                  {String(getMotivoCancelamento(devolucao))}
                                </p>
                              </div>
                            </div>
                           
                           <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Comprador</span>
                              <p className="font-medium dark:text-white truncate">{devolucao.comprador_nickname || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block">Descrição</span>
                              <p className="font-medium dark:text-white text-sm truncate" title={String(getTextoMotivoDetalhado(devolucao))}>
                                {String(getTextoMotivoDetalhado(devolucao))}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Informações adicionais com ícones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Criado em:</span>
                              <p className="font-medium dark:text-white">{new Date(devolucao.data_criacao).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <Wrench className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Conta:</span>
                              <p className="font-medium dark:text-white truncate">{devolucao.account_name || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Atualizado:</span>
                              <p className="font-medium dark:text-white">{new Date(devolucao.updated_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badges com ícones */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {devolucao.dados_claim && Object.keys(devolucao.dados_claim).length > 0 && (
                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
                              <FileText className="h-3 w-3" />
                              Com Claim
                            </span>
                          )}
                          {devolucao.dados_return && Object.keys(devolucao.dados_return).length > 0 && (
                            <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs">
                              <Package className="h-3 w-3" />
                              Com Return
                            </span>
                          )}
                          {devolucao.dados_mensagens && Object.keys(devolucao.dados_mensagens).length > 0 && (
                            <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs">
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
                        className="ml-4 flex items-center gap-2 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
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
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
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
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Order ID</Label>
                        <p className="font-medium text-lg dark:text-white">{selectedDevolucao.order_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Claim ID</Label>
                        <p className="font-medium dark:text-white">{selectedDevolucao.claim_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Status</Label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedDevolucao.status_devolucao === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : selectedDevolucao.status_devolucao === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {selectedDevolucao.status_devolucao}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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