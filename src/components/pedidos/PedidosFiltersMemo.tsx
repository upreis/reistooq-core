import React, { memo } from 'react';
import { PedidosFilters } from './PedidosFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE } from '@/lib/constants';

interface PedidosFiltersMemoProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  isLoading?: boolean;
}

function PedidosFiltersMemo({
  filters,
  onFiltersChange,
  onClearFilters,
  hasPendingChanges,
  isLoading = false
}: PedidosFiltersMemoProps) {
  // Debounce search para melhor performance
  const debouncedSearch = useDebounce(filters.search || '', DEBOUNCE.SEARCH_DELAY_MS);
  
  React.useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  return (
    <PedidosFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
      hasPendingChanges={hasPendingChanges}
    />
  );
}

export default memo(PedidosFiltersMemo);

