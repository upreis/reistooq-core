/**
 * 🛡️ SEÇÃO DE FILTROS PEDIDOS - MIGRAÇÃO GRADUAL FASE 1.2
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade dos filtros
 */

import { memo } from 'react';
import PedidosFiltersMemo from '../PedidosFiltersMemo';

interface PedidosFiltersSectionProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  loading?: boolean;
}

export const PedidosFiltersSection = memo(function PedidosFiltersSection({
  filters,
  onFiltersChange,
  onClearFilters,
  hasPendingChanges,
  loading = false
}: PedidosFiltersSectionProps) {
  return (
    <PedidosFiltersMemo
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
      hasPendingChanges={hasPendingChanges}
      isLoading={loading}
    />
  );
});