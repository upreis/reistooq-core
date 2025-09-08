import { memo, useEffect, useState } from 'react';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { usePedidosFiltersUnified } from '@/hooks/usePedidosFiltersUnified';
import { PedidosHeaderSection } from './components/PedidosHeaderSection';
import { PedidosFiltersSection } from './components/PedidosFiltersSection';
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

  // Sistema de filtros unificado
  const filters = usePedidosFiltersUnified({
    onFiltersApply: (filterParams) => {
      console.log('🔍 Aplicando filtros:', filterParams);
      // Converter filtros unificados para formato do manager
      const managerFilters: any = {};

      if (filterParams.search) {
        managerFilters.searchTerm = filterParams.search;
      }
      if (filterParams.dataInicio) {
        managerFilters.dateRange = { from: filterParams.dataInicio };
      }
      if (filterParams.dataFim) {
        managerFilters.dateRange = {
          ...managerFilters.dateRange,
          to: filterParams.dataFim,
        };
      }
      // Ajuste: a conta válida é a do filtro (ao lado de Situação)
      if (filterParams.contasML && filterParams.contasML.length > 0) {
        try {
          setSelectedAccount(filterParams.contasML[0]);
        } catch (e) {
          console.warn('Conta ML inválida nos filtros:', e);
        }
      }

      applyFilters(managerFilters);
    },
    loadSavedFilters: true
  });

  // Auto-selecionar conta quando especificada
  useEffect(() => {
    if (accountId && accountId !== selectedAccount) {
      setSelectedAccount(accountId);
    }
  }, [accountId, selectedAccount, setSelectedAccount]);

  const totalPages = Math.max(1, Math.ceil(pedidos.length / 25));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Seletor de Conta ML removido: usar o filtro 'Contas ML' ao lado de Situação */}

        {/* Seção de Filtros */}
        <PedidosFiltersSection
          filters={filters.filters}
          appliedFilters={filters.appliedFilters}
          onFiltersChange={(newFilters) => {
            Object.keys(newFilters).forEach(key => {
              filters.updateFilter(key as any, newFilters[key]);
            });
          }}
          onClearFilters={filters.clearFilters}
          hasPendingChanges={filters.hasPendingChanges}
          loading={loading}
          contasML={accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            nickname: acc.nickname,
            active: acc.is_active
          }))}
        />

        <PedidosHeaderSection
          title="Pedidos"
          subtitle="Gerencie seus pedidos do Mercado Livre"
          totalCount={pedidos.length}
          loading={loading}
          onRefresh={refresh}
          onApplyFilters={filters.applyFilters}
          hasPendingChanges={filters.hasPendingChanges}
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