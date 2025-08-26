/**
 * Wrapper da página de pedidos com filtros apply-on-click
 */

import { useState, useEffect } from 'react';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import { PedidosFilters } from './PedidosFilters';
import SimplePedidosPage from './SimplePedidosPage';
import { usePedidosManager } from '@/hooks/usePedidosManager';

export function PedidosPageWithFilters() {
  const {
    appliedFilters,
    draftFilters,
    setDraftFilters,
    applyFilters,
    clearFilters,
    cancelChanges,
    apiParams,
    hasActiveFilters,
    hasPendingChanges
  } = usePedidosFilters();

  // Usar o manager de pedidos padrão
  const pedidosManager = usePedidosManager();

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (pedidosManager.actions.setFilters) {
      pedidosManager.actions.setFilters(apiParams);
    }
  }, [apiParams, pedidosManager.actions]);

  return (
    <div className="space-y-6">
      <PedidosFilters
        draftFilters={draftFilters}
        onDraftFiltersChange={setDraftFilters}
        onApplyFilters={applyFilters}
        onClearFilters={clearFilters}
        onCancelChanges={cancelChanges}
        hasPendingChanges={hasPendingChanges}
      />
      
      <SimplePedidosPage manager={pedidosManager} disableInternalFilters />
    </div>
  );
}

export default PedidosPageWithFilters;