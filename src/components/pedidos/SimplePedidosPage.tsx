import { memo, useEffect, useState } from 'react';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { PedidosHeaderSection } from './components/PedidosHeaderSection';
// import { PedidosDataTable } from './components/PedidosDataTable';

interface SimplePedidosPageProps {
  accountId?: string;
}

function SimplePedidosPage({ accountId }: SimplePedidosPageProps) {
  const manager = usePedidosManager();
  const { 
    pedidos, 
    loading, 
    error, 
    accounts, 
    selectedAccount, 
    setSelectedAccount, 
    stats, 
    refresh,
    applyFilters
  } = manager;

  // Auto-selecionar conta quando especificada
  useEffect(() => {
    if (accountId && accountId !== selectedAccount) {
      setSelectedAccount(accountId);
    }
  }, [accountId, selectedAccount, setSelectedAccount]);

  // Handlers
  const handleFiltersApply = (filters: any) => {
    const newFilters: any = {};
    
    if (filters.dateRange?.from) {
      newFilters.dateRange = { from: filters.dateRange.from };
    }
    if (filters.dateRange?.to) {
      newFilters.dateRange = { ...newFilters.dateRange, to: filters.dateRange.to };
    }
    if (filters.shippingStatus) {
      newFilters.shippingStatus = filters.shippingStatus;
    }
    if (filters.searchTerm) {
      newFilters.searchTerm = filters.searchTerm;
    }
    
    applyFilters(newFilters);
  };

  const totalPages = Math.max(1, Math.ceil(pedidos.length / 25));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <PedidosHeaderSection
          title="Pedidos"
          subtitle="Gerencie seus pedidos do Mercado Livre"
          totalCount={pedidos.length}
          loading={loading}
          onRefresh={refresh}
        />

        <div className="border rounded-lg">
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Carregando...' : `${pedidos.length} pedidos encontrados`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SimplePedidosPage);