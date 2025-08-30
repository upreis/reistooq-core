/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - PRIORIDADE 2 CONCLUÍDA
 * Arquitetura modular com componentes menores e performance otimizada
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePedidosManager } from '@/hooks/usePedidosManager.fixed';
import { useColumnManager } from '@/features/pedidos/hooks/useColumnManager';
import { usePedidosData } from './hooks/usePedidosData';

// Componentes refatorados
import { PedidosHeader } from './sections/PedidosHeader';
import { PedidosFiltersSection } from './sections/PedidosFiltersSection';
import { PedidosTableSection } from './sections/PedidosTableSection';
import { IntelligentPedidosDashboard } from './dashboard/IntelligentPedidosDashboard';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { ExportModal } from './ExportModal';

// Types
import { Row } from '@/services/orders';

type Props = {
  className?: string;
};

export default function SimplePedidosPage({ className }: Props) {
  // 🎯 Hooks principais otimizados
  const pedidosManager = usePedidosManager();
  const { filters, appliedFilters, state, actions, hasPendingChanges, hasActiveFilters, totalPages } = pedidosManager;
  
  const columnManager = useColumnManager();
  const pedidosData = usePedidosData();
  
  // 🔄 Debug otimizado
  console.log('🔄 [RENDER] Pedidos Page State:', {
    hasPendingChanges,
    hasActiveFilters,
    ordersCount: state.orders.length,
    currentPage: state.currentPage,
    totalPages
  });
  
  // Aliases para compatibilidade
  const { orders, total, loading, error, currentPage, pageSize, hasNextPage, hasPrevPage, isRefreshing } = state;

  // Estados locais memoizados
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(state.integrationAccountIds || []);

  // 🚀 Carregar dados iniciais de forma otimizada
  useEffect(() => {
    pedidosData.loadAccounts();
  }, []);

  // Selecionar conta automaticamente se nenhuma estiver selecionada
  useEffect(() => {
    if ((!selectedAccounts || selectedAccounts.length === 0) && pedidosData.accounts.length > 0) {
      const first = pedidosData.accounts[0];
      if (first?.id) {
        setSelectedAccounts([first.id]);
        actions.setIntegrationAccountIds([first.id]);
        actions.clearFilters();
      }
    }
  }, [selectedAccounts, pedidosData.accounts, actions]);

  // 🚀 Sincronizar contas selecionadas
  useEffect(() => {
    const idsFromState = state.integrationAccountIds || [];
    const changed = JSON.stringify(idsFromState) !== JSON.stringify(selectedAccounts);
    if (selectedAccounts && selectedAccounts.length > 0 && changed) {
      actions.setIntegrationAccountIds(selectedAccounts);
    }
  }, [selectedAccounts, state.integrationAccountIds, actions])

  // 🚀 Carregar mapeamentos quando os pedidos mudarem
  useEffect(() => {
    if (orders.length > 0) {
      pedidosData.loadMappingData(orders);
    }
  }, [orders, pedidosData.loadMappingData]);

  // 🚀 Callbacks otimizados com useCallback
  const handleAccountChange = useCallback((accountId: string) => {
    setSelectedAccounts(accountId ? [accountId] : []);
  }, []);

  const handleSelectionChange = useCallback((selectedRows: Row[]) => {
    const selectedIds = new Set(selectedRows.map(row => row.unified?.id || row.raw?.id || ''));
    pedidosData.setSelectedOrders(selectedIds);
  }, [pedidosData]);

  const handleApplyFilters = useCallback(() => {
    actions.applyFilters();
  }, [actions]);

  const handleClearFilters = useCallback(() => {
    actions.clearFilters();
    pedidosData.clearSelection();
  }, [actions, pedidosData]);

  const handleRefresh = useCallback(() => {
    actions.refetch();
  }, [actions]);

  const handlePageChange = useCallback((page: number) => {
    actions.setPage(page);
  }, [actions]);

  const handlePageSizeChange = useCallback((size: number) => {
    actions.setPageSize(size);
  }, [actions]);

  // 🚀 Dados memoizados para performance
  const memoizedMappingData = useMemo(() => 
    pedidosData.mappingData, 
    [pedidosData.mappingData]
  );

  return (
    <div className={className}>
      {/* Header */}
      <PedidosHeader
        totalPedidos={total}
        loading={loading}
        isRefreshing={isRefreshing}
        hasPendingChanges={hasPendingChanges}
        hasActiveFilters={hasActiveFilters}
        onRefresh={handleRefresh}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Dashboard Inteligente */}
      <IntelligentPedidosDashboard
        orders={orders}
        loading={loading}
        onRefresh={handleRefresh}
        totalCount={total}
        className="mb-6"
      />

      {/* Filtros */}
  <PedidosFiltersSection
        filters={filters}
        appliedFilters={appliedFilters}
        accounts={pedidosData.accounts}
        selectedAccount={selectedAccounts[0] || ''}
        actions={actions}
        onAccountChange={handleAccountChange}
        hasPendingChanges={hasPendingChanges}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Tabela */}
      <PedidosTableSection
        orders={orders}
        total={total}
        loading={loading}
        error={error}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        selectedOrders={pedidosData.selectedOrders}
        mapeamentosVerificacao={memoizedMappingData}
        columnManager={columnManager}
        onRefresh={handleRefresh}
        onSelectionChange={handleSelectionChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modais */}
  {pedidosData.showBaixaModal && (
        <BaixaEstoqueModal
          pedidos={orders.filter(order => pedidosData.selectedOrders.has(order.unified?.id || order.raw?.id || ''))}
          contextoDaUI={{
            mappingData: memoizedMappingData,
            accounts: pedidosData.accounts,
            selectedAccounts: selectedAccounts,
            integrationAccountId: selectedAccounts[0]
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          onExport={async (format) => {
            console.log('Exportando em formato:', format);
            // TODO: Implementar exportação
          }}
          totalRecords={total}
          isLoading={loading}
        />
      )}
    </div>
  );
}