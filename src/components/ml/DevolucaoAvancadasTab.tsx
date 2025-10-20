import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import { DevolucaoDetailsModal } from '@/components/ml/devolucao/DevolucaoDetailsModal';
import { DevolucaoPagination } from '@/components/ml/devolucao/DevolucaoPagination';
import { DevolucaoTable } from '@/components/ml/devolucao/DevolucaoTable';
import { DevolucaoStatsLoading, DevolucaoLoadingState } from '@/components/ml/devolucao/DevolucaoLoadingState';
import { NoFiltersAppliedState, NoResultsFoundState, LoadingProgressIndicator } from '@/components/ml/devolucao/DevolucaoEmptyStates';
import { RestoreDataDialog } from '@/components/ml/devolucao/RestoreDataDialog';
import { DevolucaoTableSkeleton, DevolucaoStatsSkeleton } from '@/components/ml/devolucao/DevolucaoSkeletonLoader';
import { CacheIndicator, LoadingStateIndicator } from '@/components/ml/devolucao/CacheIndicator';
import { DevolucaoFiltersUnified } from './devolucao/DevolucaoFiltersUnified';
import { DevolucaoFiltersSection } from './devolucao/DevolucaoFiltersSection';
import { SyncControls } from './devolucao/SyncControls';
import { SyncMetrics } from './devolucao/SyncMetrics';
import { FiltrosRapidos } from './devolucao/FiltrosRapidos';
import { ErrorFallback, MinimalErrorFallback } from '@/components/error/ErrorFallback';

// ✨ Tipos
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

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
  FileDown,
  Calendar,
  MessageCircle,
  Truck,
  Calculator,
  Zap,
  Settings
} from 'lucide-react';


interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  organization_id: string;
  is_active: boolean;
}

interface DevolucaoAvancadasTabProps {
  mlAccounts: MLAccount[];
  selectedAccountId?: string;
  selectedAccountIds?: string[];
  refetch: () => Promise<void>;
  existingDevolucoes: DevolucaoAvancada[];
}

const DevolucaoAvancadasTab: React.FC<DevolucaoAvancadasTabProps> = ({
  mlAccounts,
  selectedAccountId,
  selectedAccountIds,
  refetch,
  existingDevolucoes
}) => {
  const [selectedDevolucao, setSelectedDevolucao] = React.useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showColumnManager, setShowColumnManager] = React.useState(false);

  // Hook principal consolidado - ESTADO UNIFICADO
  const {
    devolucoes,
    devolucoesFiltradas,
    devolucoesPaginadas,
    stats,
    loading,
    isRefreshing,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    showAnalytics,
    advancedFilters,
    draftFilters,
    isApplyingFilters,
    hasPendingChanges,
    performanceSettings,
    updateDraftFilters,
    applyFilters,
    cancelDraftFilters,
    clearFilters,
    buscarComFiltros,
    setCurrentPage,
    setItemsPerPage,
    toggleAnalytics,
    clearError,
    autoRefresh,
    loadingProgress,
    cacheStats,
    clearCache
  } = useDevolucoes(mlAccounts, selectedAccountId, selectedAccountIds);

  // Filtros salvos são carregados automaticamente no hook, mas NÃO executam busca
  // O usuário deve clicar em "Buscar" ou "Aplicar" para executar a busca

  // Funções simplificadas - delegam para o hook
  const handleAplicarEBuscar = useCallback(async () => {
    try {
      await applyFilters();
      toast.success('Filtros aplicados e salvos com sucesso');
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast.error('Erro ao aplicar filtros');
    }
  }, [applyFilters]);

  const handleCancelChanges = useCallback(() => {
    cancelDraftFilters();
  }, [cancelDraftFilters]);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    updateDraftFilters(key, value);
  }, [updateDraftFilters]);

  // Filtros atuais (considerando draft ou aplicados) - MEMOIZADO
  const currentFilters = React.useMemo(() => 
    draftFilters || advancedFilters,
    [draftFilters, advancedFilters]
  );

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (currentFilters.searchTerm) count++;
    if (currentFilters.statusClaim) count++;
    if (currentFilters.dataInicio) count++;
    if (currentFilters.dataFim) count++;
    if (currentFilters.contasSelecionadas?.length > 0) count++;
    return count;
  }, [currentFilters]);


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
      'Data da Venda',
      'Data Fechamento',
      'Última Atualização',
      'Número Mensagens',
      'Mensagens Não Lidas',
      'Dias Restantes Ação',
      'Código Rastreamento',
      'Transportadora',
      'Anexos Count',
      'Em Mediação',
      'Nível Prioridade',
      'Método Resolução'
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
      dev.tipo_claim || 'N/A',
      dev.data_criacao ? (() => { try { return new Date(dev.data_criacao).toLocaleDateString(); } catch { return dev.data_criacao; } })() : '',
      'N/A',
      dev.updated_at ? (() => { try { return new Date(dev.updated_at).toLocaleDateString(); } catch { return dev.updated_at; } })() : '',
      dev.numero_interacoes || 0,
      dev.mensagens_nao_lidas || 0,
      dev.dias_restantes_acao || '',
      dev.codigo_rastreamento || '',
      dev.transportadora || '',
      dev.anexos_count || 0,
      dev.em_mediacao ? 'Sim' : 'Não',
      dev.nivel_prioridade || '',
      dev.metodo_resolucao || ''
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

  // Determinar qual estado mostrar - MEMOIZADO
  const hasFiltersApplied = React.useMemo(() => Boolean(
    advancedFilters.dataInicio || 
    advancedFilters.dataFim || 
    advancedFilters.searchTerm ||
    advancedFilters.statusClaim ||
    advancedFilters.tipoClaim
  ), [advancedFilters]);

  const shouldShowNoFiltersState = React.useMemo(() => 
    !loading && devolucoes.length === 0 && !hasFiltersApplied,
    [loading, devolucoes.length, hasFiltersApplied]
  );

  const shouldShowNoResultsState = React.useMemo(() => 
    !loading && devolucoes.length === 0 && hasFiltersApplied,
    [loading, devolucoes.length, hasFiltersApplied]
  );

  const shouldShowData = React.useMemo(() => 
    !loading && devolucoes.length > 0,
    [loading, devolucoes.length]
  );

  // Dados para o diálogo de restauração removidos (não usado mais)

  return (
    <div className="space-y-6">
      {/* Header com estatísticas melhoradas */}
      <ErrorBoundary
        FallbackComponent={(props) => (
          <MinimalErrorFallback {...props} />
        )}
        onReset={() => window.location.reload()}
      >
        {loading && <DevolucaoStatsLoading />}
        
        {!loading && (
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
        )}
      </ErrorBoundary>

      {/* Controles de Sincronização */}
      <ErrorBoundary
        FallbackComponent={(props) => (
          <MinimalErrorFallback {...props} />
        )}
        onReset={() => window.location.reload()}
      >
        <SyncControls />
      </ErrorBoundary>

      {/* Métricas de Sincronização */}
      <ErrorBoundary
        FallbackComponent={(props) => (
          <MinimalErrorFallback {...props} />
        )}
        onReset={() => window.location.reload()}
      >
        <SyncMetrics />
      </ErrorBoundary>

      {/* Filtros Rápidos */}
      <FiltrosRapidos 
        onAplicarFiltro={React.useCallback((filtros) => {
          handleFilterChange('dataInicio', filtros.dataInicio);
          handleFilterChange('dataFim', filtros.dataFim);
          if (filtros.statusClaim) {
            handleFilterChange('statusClaim', filtros.statusClaim);
          }
          // Aplicar automaticamente
          setTimeout(() => handleAplicarEBuscar(), 100);
        }, [handleFilterChange, handleAplicarEBuscar])}
      />

      {/* Controles de ação - Simplificado */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowColumnManager(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Colunas (29)
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

      {/* ✨ SISTEMA DE FILTROS UNIFICADO - IGUAL AO /PEDIDOS */}
      <ErrorBoundary
        FallbackComponent={(props) => (
          <ErrorFallback {...props} componentName="Filtros" />
        )}
        onReset={() => {
          handleClearAllFilters();
        }}
      >
        <DevolucaoFiltersSection
          activeFiltersCount={activeFiltersCount}
          hasPendingChanges={hasPendingChanges}
        >
          <DevolucaoFiltersUnified
            filters={currentFilters}
            appliedFilters={advancedFilters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleAplicarEBuscar}
            onCancelChanges={handleCancelChanges}
            onClearFilters={handleClearAllFilters}
            hasPendingChanges={hasPendingChanges}
            needsManualApplication={hasPendingChanges}
            isApplying={isApplyingFilters}
            activeFiltersCount={activeFiltersCount}
            contasML={mlAccounts}
          />
        </DevolucaoFiltersSection>
      </ErrorBoundary>

      {/* ERRO */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-destructive">Erro ao buscar devoluções</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearError}
                className="mt-3"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Estados de carregamento e vazios */}
      {loading && <LoadingProgressIndicator message="Buscando devoluções na API do Mercado Livre..." />}
      
      {shouldShowNoFiltersState && (
        <NoFiltersAppliedState onAction={buscarComFiltros} />
      )}
      
      {shouldShowNoResultsState && (
        <NoResultsFoundState onClearFilters={clearFilters} />
      )}

      {/* Lista de devoluções - Cards ou Tabela */}
      {shouldShowData && (
        <ErrorBoundary
          FallbackComponent={(props) => (
            <ErrorFallback {...props} componentName="Tabela de Devoluções" />
          )}
          onReset={() => {
            setCurrentPage(1);
          }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Devoluções Encontradas</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Package className="h-4 w-4" />
                    {devolucoesFiltradas.length} resultado{devolucoesFiltradas.length !== 1 ? 's' : ''} encontrado{devolucoesFiltradas.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {hasFiltersApplied && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
            <DevolucaoTable
              devolucoes={devolucoesPaginadas}
              onViewDetails={React.useCallback((dev) => {
                setSelectedDevolucao(dev);
                setShowDetails(true);
              }, [])}
            />
              
              {devolucoesPaginadas.length === 0 && devolucoesFiltradas.length > 0 && (
                <div className="text-center p-6 text-muted-foreground">
                  <p className="text-sm">
                    Nenhum resultado na página atual. Navegue para outras páginas ou ajuste os filtros.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      )}

      {/* Paginação */}
      {shouldShowData && (
        <DevolucaoPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={devolucoesFiltradas.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Modal de detalhes - componente modular */}
      <DevolucaoDetailsModal 
        open={showDetails}
        onOpenChange={setShowDetails}
        devolucao={selectedDevolucao}
      />
      
      {/* Modal de gerenciamento de colunas */}
      <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Colunas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Em breve: sistema completo de gerenciamento de colunas similar ao /pedidos
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-muted-foreground">Colunas disponíveis:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>✅ Order ID</div>
                <div>✅ Claim ID</div>
                <div>✅ SKU</div>
                <div>✅ Produto</div>
                <div>✅ Status</div>
                <div>✅ Valor Retido</div>
                <div>... e mais 23 colunas</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevolucaoAvancadasTab;