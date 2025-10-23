import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import { DevolucaoDetailsModal } from '@/components/ml/devolucao/DevolucaoDetailsModal';
import { DevolucaoPagination } from '@/components/ml/devolucao/DevolucaoPagination';
import { DevolucaoTable } from '@/components/ml/devolucao/DevolucaoTable';
import { DevolucaoStatsLoading } from '@/components/ml/devolucao/DevolucaoLoadingState';
import { NoFiltersAppliedState, NoResultsFoundState, LoadingProgressIndicator } from '@/components/ml/devolucao/DevolucaoEmptyStates';
import { DevolucaoStatsCards } from '@/components/ml/devolucao/DevolucaoStatsCards';
import { DevolucaoFiltersUnified } from './devolucao/DevolucaoFiltersUnified';
import { DevolucaoFiltersSection } from './devolucao/DevolucaoFiltersSection';
import { FiltrosRapidos } from './devolucao/FiltrosRapidos';
import { ErrorFallback, MinimalErrorFallback } from '@/components/error/ErrorFallback';
import { exportarDevolucoes } from '@/features/devolucoes/utils/DevolucaoExportService';


// ✨ Tipos
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

import { 
  Download, 
  Filter, 
  Package, 
  XCircle,
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
    cancelarBusca,
    setCurrentPage,
    setItemsPerPage,
    toggleAnalytics,
    clearError,
    autoRefresh,
    loadingProgress,
    cacheStats,
    clearCache
  } = useDevolucoes(mlAccounts, selectedAccountId, selectedAccountIds);

  // 🛡️ Validação: Verificar se há contas (sem early return para não quebrar hooks)
  const hasAccounts = selectedAccountIds && selectedAccountIds.length > 0;

  // Funções simplificadas - delegam para o hook
  const handleAplicarEBuscar = React.useCallback(async () => {
    try {
      await applyFilters();
      toast.success('Filtros aplicados e salvos com sucesso');
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast.error('Erro ao aplicar filtros');
    }
  }, [applyFilters]);

  const handleCancelSearch = React.useCallback(() => {
    // Cancela a busca em andamento
    cancelarBusca();
  }, [cancelarBusca]);

  const handleCancelChanges = React.useCallback(() => {
    cancelDraftFilters();
  }, [cancelDraftFilters]);

  const handleClearAllFilters = React.useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleFilterChange = React.useCallback((key: string, value: any) => {
    updateDraftFilters(key, value);
  }, [updateDraftFilters]);

  // Handler para FiltrosRapidos - MEMOIZADO NO TOPO
  const handleFiltrosRapidos = React.useCallback((filtros: any) => {
    // ✅ periodoDias (sempre usa item.date_created)
    if (filtros.periodoDias !== undefined) {
      handleFilterChange('periodoDias', filtros.periodoDias);
    }
    if (filtros.statusClaim) {
      handleFilterChange('statusClaim', filtros.statusClaim);
    }
    // Aplicar automaticamente
    setTimeout(() => handleAplicarEBuscar(), 100);
  }, [handleFilterChange, handleAplicarEBuscar]);

  // Handler para visualizar detalhes - MEMOIZADO NO TOPO
  const handleViewDetails = React.useCallback((dev: DevolucaoAvancada) => {
    setSelectedDevolucao(dev);
    setShowDetails(true);
  }, []);

  // Filtros atuais (considerando draft ou aplicados) - MEMOIZADO
  const currentFilters = React.useMemo(() => 
    draftFilters || advancedFilters,
    [draftFilters, advancedFilters]
  );

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (currentFilters.searchTerm) count++;
    if (currentFilters.statusClaim) count++;
    if (currentFilters.periodoDias && currentFilters.periodoDias > 0) count++;
    if (currentFilters.contasSelecionadas?.length > 0) count++;
    return count;
  }, [currentFilters]);


  // Handler para exportação - delegado ao serviço
  const handleExportarCSV = React.useCallback(() => {
    exportarDevolucoes(devolucoesFiltradas);
  }, [devolucoesFiltradas]);

  // Determinar qual estado mostrar - MEMOIZADO
  const hasFiltersApplied = React.useMemo(() => Boolean(
    (advancedFilters.periodoDias && advancedFilters.periodoDias > 0) ||
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
    <>
      {/* ⚠️ Se não há contas, mostrar apenas aviso */}
      {!hasAccounts ? (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="text-center">
            <p className="font-medium text-yellow-800">Selecione pelo menos uma conta para visualizar as devoluções</p>
          </div>
        </Card>
      ) : (
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
          <DevolucaoStatsCards 
            stats={stats} 
            performanceSettings={performanceSettings} 
          />
        )}
      </ErrorBoundary>


      {/* Filtros Rápidos */}
      <FiltrosRapidos 
        onAplicarFiltro={handleFiltrosRapidos}
      />

      {/* Controles de ação */}
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
          onClick={handleExportarCSV}
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
            onCancelSearch={handleCancelSearch}
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
              onViewDetails={handleViewDetails}
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
      )}
    </>
  );
};

export default DevolucaoAvancadasTab;