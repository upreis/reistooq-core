import React from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoricoAnalyticsDashboard } from './HistoricoAnalyticsDashboard';
import { HistoricoSearchFilters } from './HistoricoSearchFilters';
import { HistoricoDataTable } from './HistoricoDataTable';
import { HistoricoBulkActions } from './HistoricoBulkActions';
import { HistoricoFileManager } from './HistoricoFileManager';
import { useHistoricoServerPagination } from '../hooks/useHistoricoServerPagination';
import { useHistoricoFilters } from '../hooks/useHistoricoFilters';
import { useHistoricoRealtime } from '../hooks/useHistoricoRealtime';
import { HistoricoAdvancedAnalytics } from './HistoricoAdvancedAnalytics';
import { History, TrendingUp, Filter, Download, Wifi, WifiOff, AlertCircle } from 'lucide-react';

export const HistoricoPageLayout: React.FC = () => {
  // Hooks para filtros e paginação
  const filtersHook = useHistoricoFilters({
    persistKey: 'historico-vendas-filters',
    debounceMs: 300
  });

  const paginationHook = useHistoricoServerPagination({
    initialFilters: filtersHook.filters,
    initialLimit: 20,
    enableRealtime: false
  });

  // Real-time updates
  const realtimeHook = useHistoricoRealtime({
    enabled: true,
    debounceMs: 1000,
    batchUpdates: true,
    onUpdate: () => {
      // Refresh data when real-time updates are received
      paginationHook.refetch();
    }
  });

  // Sincronizar filtros
  React.useEffect(() => {
    const { isActive, sortBy, sortOrder, ...cleanFilters } = filtersHook.filters;
    paginationHook.updateFilters(cleanFilters);
  }, [filtersHook.filters]);

  const handleBulkAction = React.useCallback(async (action: string, selectedIds: string[]) => {
    try {
      console.log('🔄 Executando ação em lote:', action, selectedIds);
      // Implementar lógica de bulk actions
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      paginationHook.refetch();
    } catch (error) {
      console.error('❌ Erro na ação em lote:', error);
    }
  }, [paginationHook]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Histórico de Vendas", href: "/historico" }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header fixo */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
                  <p className="text-sm text-muted-foreground">
                    Análise completa das vendas e métricas de performance
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Real-time status indicator */}
                <div className="flex items-center gap-2">
                  {realtimeHook.isConnected ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Wifi className="h-4 w-4" />
                      <span className="text-xs">Online</span>
                    </div>
                  ) : realtimeHook.isConnecting ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span className="text-xs">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                  {realtimeHook.updateCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {realtimeHook.updateCount} atualizações
                    </span>
                  )}
                </div>

                <div className="text-right text-sm">
                  <div className="font-medium">
                    {paginationHook.summary?.totalVendas.toLocaleString() || 0} vendas
                  </div>
                  <div className="text-muted-foreground">
                    R$ {(paginationHook.summary?.valorTotalVendas || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 container py-6 space-y-6">
          {/* Dashboard de Analytics */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Analytics</h2>
            </div>
            
            {paginationHook.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <HistoricoAnalyticsDashboard 
                summary={paginationHook.summary}
                dateRange={{
                  start: filtersHook.filters.dataInicio,
                  end: filtersHook.filters.dataFim
                }}
              />
            )}
          </Card>

          {/* Filtros Avançados */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Filtros</h2>
              {filtersHook.hasActiveFilters && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {filtersHook.activeFilters.length} ativo{filtersHook.activeFilters.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <HistoricoSearchFilters
              filters={filtersHook.filters}
              onFiltersChange={filtersHook.updateFilters}
              onClearFilters={filtersHook.clearFilters}
              onDatePreset={filtersHook.applyDatePreset}
              searchTerm={filtersHook.searchTerm}
              onSearchChange={filtersHook.setSearchTerm}
              isSearching={filtersHook.isSearching}
              activeFilters={filtersHook.activeFilters}
            />
          </Card>

          {/* File Management */}
          <HistoricoFileManager
            onImportComplete={() => {
              paginationHook.refetch();
            }}
            onExportComplete={(success) => {
              if (success) {
                console.log('Export completed successfully');
              }
            }}
          />

          {/* Ações em Lote */}
          <HistoricoBulkActions
            selectedCount={0} // Implementar seleção
            onBulkAction={handleBulkAction}
            isLoading={paginationHook.isLoadingMore}
            totalItems={paginationHook.summary?.totalVendas || 0}
          />

          {/* Tabela de Dados */}
          <Card>
            <HistoricoDataTable
              vendas={paginationHook.vendas}
              pagination={paginationHook.pagination}
              isLoading={paginationHook.isLoading}
              isLoadingMore={paginationHook.isLoadingMore}
              sortBy={paginationHook.sortBy}
              sortOrder={paginationHook.sortOrder}
              onSort={paginationHook.updateSort}
              onPageChange={paginationHook.goToPage}
              onPageSizeChange={paginationHook.changePageSize}
              onRefresh={paginationHook.refetch}
              onBulkAction={handleBulkAction}
            />
          </Card>

          {/* Analytics Avançado */}
          <Card className="p-6">
            <HistoricoAdvancedAnalytics 
              vendas={paginationHook.vendas}
              summary={paginationHook.summary}
              dateRange={{
                start: filtersHook.filters.dataInicio,
                end: filtersHook.filters.dataFim
              }}
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};