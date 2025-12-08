/**
 * 📦 VENDAS COM ENVIO - Página Principal
 * ✅ Atualizada para usar mesma estrutura de /vendas-canceladas
 */
import { useMemo, useEffect } from 'react';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { 
  useVendasComEnvioFilters, 
  useVendasComEnvioData, 
  useVendasComEnvioPolling,
  useVendasComEnvioAccounts 
} from '../hooks';
import { useVendasComEnvioColumnManager } from '../hooks/useVendasComEnvioColumnManager';
import { VendasComEnvioStats } from './VendasComEnvioStats';
import { VendasComEnvioFilters } from './VendasComEnvioFilters';
import { VendasComEnvioTableNew } from './VendasComEnvioTableNew';
import { VendasComEnvioPagination } from './VendasComEnvioPagination';
import { VendasComEnvioColumnManager } from './VendasComEnvioColumnManager';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VendasComEnvioPage() {
  const { accounts, isLoading: isLoadingAccounts } = useVendasComEnvioAccounts();
  
  // 🎯 Column Manager
  const columnManager = useVendasComEnvioColumnManager();
  const visibleColumnKeys = useMemo(() => {
    return Array.from(columnManager.state.visibleColumns);
  }, [columnManager.state.visibleColumns]);

  const {
    vendas,
    totalCount,
    stats,
    isFetching,
    dataSource,
    lastSyncedAt,
    appliedFilters,
  } = useVendasComEnvioStore();

  const {
    pendingFilters,
    updatePendingFilter,
    applyFilters,
    changePage,
    changeItemsPerPage,
    clearFilters,
    hasChanges,
  } = useVendasComEnvioFilters();

  const { refetch } = useVendasComEnvioData({ accounts });

  // Polling automático após primeira busca
  useVendasComEnvioPolling({ enabled: true });

  // Paginação local
  const paginatedVendas = useMemo(() => {
    const start = (appliedFilters.currentPage - 1) * appliedFilters.itemsPerPage;
    const end = start + appliedFilters.itemsPerPage;
    return vendas.slice(start, end);
  }, [vendas, appliedFilters.currentPage, appliedFilters.itemsPerPage]);

  // Auto-selecionar todas as contas no primeiro carregamento
  useEffect(() => {
    if (accounts.length > 0 && pendingFilters.selectedAccounts.length === 0) {
      const allAccountIds = accounts.map(a => a.id);
      updatePendingFilter('selectedAccounts', allAccountIds);
    }
  }, [accounts, pendingFilters.selectedAccounts.length, updatePendingFilter]);

  // Formatar última sincronização
  const formatLastSync = () => {
    if (!lastSyncedAt) return null;
    const date = new Date(lastSyncedAt);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vendas com Envio</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie pedidos aguardando envio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de fonte de dados */}
          {dataSource === 'cache' && (
            <Badge variant="outline" className="text-xs">
              Cache local
            </Badge>
          )}
          
          {/* Última atualização */}
          {lastSyncedAt && (
            <Badge variant="secondary" className="text-xs">
              Atualizado às {formatLastSync()}
            </Badge>
          )}

          {/* Indicador de fetching */}
          {isFetching && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Atualizando...
            </Badge>
          )}

          {/* Botão de refresh manual */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <VendasComEnvioStats stats={stats} />

      {/* Filtros + Seletor de Colunas */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <VendasComEnvioFilters
          accounts={accounts}
          pendingFilters={pendingFilters}
          onFilterChange={updatePendingFilter}
          onApply={applyFilters}
          onClear={clearFilters}
          hasChanges={hasChanges}
          isFetching={isFetching}
        />
        <VendasComEnvioColumnManager manager={columnManager} />
      </div>

      {/* Tabela - NOVA com colunas de /vendas-canceladas */}
      <Card className="overflow-hidden">
        <VendasComEnvioTableNew
          orders={paginatedVendas}
          total={totalCount}
          loading={isFetching && vendas.length === 0}
          currentPage={appliedFilters.currentPage}
          itemsPerPage={appliedFilters.itemsPerPage}
          onPageChange={changePage}
          visibleColumnKeys={visibleColumnKeys}
        />
      </Card>

      {/* Paginação */}
      <VendasComEnvioPagination
        currentPage={appliedFilters.currentPage}
        totalPages={Math.ceil(totalCount / appliedFilters.itemsPerPage)}
        itemsPerPage={appliedFilters.itemsPerPage}
        totalItems={totalCount}
        onPageChange={changePage}
        onItemsPerPageChange={changeItemsPerPage}
      />
    </div>
  );
}
