/**
 * 📦 VENDAS COM ENVIO - Página Principal
 * Implementa Combo 2.1: cache-first, busca manual
 */
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { 
  useVendasComEnvioFilters, 
  useVendasComEnvioData, 
  useVendasComEnvioPolling,
  useVendasComEnvioAccounts 
} from '../hooks';
import { VendasComEnvioStats } from './VendasComEnvioStats';
import { VendasComEnvioFilters } from './VendasComEnvioFilters';
import { VendasComEnvioTable } from './VendasComEnvioTable';
import { VendasComEnvioPagination } from './VendasComEnvioPagination';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VendasComEnvioPage() {
  const { accounts, isLoading: isLoadingAccounts } = useVendasComEnvioAccounts();
  
  const {
    vendas,
    totalCount,
    stats,
    isFetching,
    dataSource,
    lastSyncedAt,
  } = useVendasComEnvioStore();

  const {
    pendingFilters,
    appliedFilters,
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

      {/* Filtros */}
      <VendasComEnvioFilters
        accounts={accounts}
        pendingFilters={pendingFilters}
        onFilterChange={updatePendingFilter}
        onApply={applyFilters}
        onClear={clearFilters}
        hasChanges={hasChanges}
        isFetching={isFetching}
      />

      {/* Tabela */}
      <Card className="overflow-hidden">
        <VendasComEnvioTable
          vendas={vendas}
          isLoading={isFetching && vendas.length === 0}
          searchTerm={appliedFilters.searchTerm}
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
