/**
 * 🔍 DEVOLUÇÃO FILTERS BAR
 * Barra de filtros para Devoluções
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { useDevolucaoStore } from '../store/useDevolucaoStore';
import { useCallback } from 'react';

export const DevolucaoFiltersBar = () => {
  const filters = useDevolucaoStore(state => state.filters);
  const updateFilters = useDevolucaoStore(state => state.updateFilters);
  const resetFilters = useDevolucaoStore(state => state.resetFilters);

  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ search: value });
  }, [updateFilters]);

  const hasActiveFilters = filters.search !== '' || filters.status.length > 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, Order ID, Claim ID ou Tracking..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};
