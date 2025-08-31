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
  contasML?: Array<{ id: string; name: string; nickname?: string; active?: boolean; }>; // ✅ NOVO: Lista de contas ML
}

function PedidosFiltersMemo({
  filters,
  onFiltersChange,
  onClearFilters,
  hasPendingChanges,
  isLoading = false,
  contasML = [] // ✅ NOVO: Contas ML
}: PedidosFiltersMemoProps) {
  // ✅ APLICAÇÃO AUTOMÁTICA: Debounce apenas search, outros filtros aplicam imediatamente
  const debouncedSearch = useDebounce(filters.search || '', DEBOUNCE.SEARCH_DELAY_MS);
  
  React.useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  return (
    <PedidosFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
      hasPendingChanges={hasPendingChanges}
      contasML={contasML} // ✅ NOVO: Passar contas ML
    />
  );
}

export default memo(PedidosFiltersMemo);

