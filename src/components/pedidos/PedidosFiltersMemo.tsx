/**
 * 🚀 PRIORIDADE 2 - COMPONENTE MEMOIZADO DE FILTROS
 * Otimização de performance com memoização e debounce
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { PedidosFilters, PedidosFiltersState } from './PedidosFilters';

interface PedidosFiltersMemoProps {
  filters: PedidosFiltersState;
  onFiltersChange: (filters: PedidosFiltersState) => void;
  onClearFilters: () => void;
  hasPendingChanges?: boolean;
}

// Comparison function for memo
const areEqual = (prevProps: PedidosFiltersMemoProps, nextProps: PedidosFiltersMemoProps) => {
  return (
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.hasPendingChanges === nextProps.hasPendingChanges
  );
};

export const PedidosFiltersMemo = memo<PedidosFiltersMemoProps>(({
  filters,
  onFiltersChange,
  onClearFilters,
  hasPendingChanges
}) => {
  // Debounced search to avoid excessive API calls
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchValue, 300);

  // Memoized filters with debounced search
  const memoizedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch]);

  // Update parent when debounced search changes
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  // Memoized change handler
  const handleFiltersChange = useCallback((newFilters: PedidosFiltersState) => {
    if (newFilters.search !== undefined) {
      setSearchValue(newFilters.search);
      // Don't trigger immediate change for search - let debounce handle it
      return;
    }
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  return (
    <PedidosFilters
      filters={memoizedFilters}
      onFiltersChange={handleFiltersChange}
      onClearFilters={onClearFilters}
      hasPendingChanges={hasPendingChanges}
    />
  );
}, areEqual);

PedidosFiltersMemo.displayName = 'PedidosFiltersMemo';