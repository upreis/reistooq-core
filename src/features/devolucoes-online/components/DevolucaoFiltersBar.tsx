/**
 * 🔍 DEVOLUÇÃO FILTERS BAR - OTIMIZADA
 * Barra de filtros com debounce
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { DevolucaoFilters } from '../types/devolucao.types';

interface DevolucaoFiltersBarProps {
  filters: DevolucaoFilters;
  onFiltersChange: (filters: Partial<DevolucaoFilters>) => void;
  onReset: () => void;
}

export const DevolucaoFiltersBar = memo(({ filters, onFiltersChange, onReset }: DevolucaoFiltersBarProps) => {
  // Estado local para input (sem debounce no display)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Sync com filtros externos
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    onFiltersChange({ search: value });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.search !== '' || (filters.status && filters.status.length > 0);

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, Order ID, Claim ID ou Tracking..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
});

DevolucaoFiltersBar.displayName = 'DevolucaoFiltersBar';
