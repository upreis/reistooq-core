/**
 * 🔍 VENDAS FILTERS BAR
 * Barra de filtros para Vendas Canceladas
 */

import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVendasFilters } from '../hooks/useVendasFilters';

export const VendasFiltersBar = () => {
  const { 
    filters, 
    setSearch, 
    resetFilters, 
    hasActiveFilters 
  } = useVendasFilters();
  
  const handleClearFilters = () => {
    setSearch('');
    resetFilters();
  };
  
  
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, comprador, produto..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
      
      {/* Active Filters */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary">
              Busca: {filters.search}
            </Badge>
          )}
          {filters.status.length > 0 && (
            <Badge variant="secondary">
              Status: {filters.status.length}
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary">
              De: {new Date(filters.dateFrom).toLocaleDateString('pt-BR')}
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary">
              Até: {new Date(filters.dateTo).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
