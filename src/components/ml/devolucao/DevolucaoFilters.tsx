import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface DevolucaoFilterValues {
  searchTerm: string;
  statusClaim: string;
  dataInicio: string;
  dataFim: string;
}

interface DevolucaoFiltersProps {
  filters: DevolucaoFilterValues;
  onFilterChange: (filters: Partial<DevolucaoFilterValues>) => void;
  onClearFilters: () => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export const DevolucaoFilters = React.memo<DevolucaoFiltersProps>(({
  filters,
  onFilterChange,
  onClearFilters,
  onSearch,
  isLoading = false
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4" />
        <h3 className="font-semibold">Filtros de Busca</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Busca Unificada */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Produto, Order ID, SKU..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.statusClaim}
            onValueChange={(value) => onFilterChange({ statusClaim: value })}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="with_claims">Com Claims</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Início */}
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data Início</Label>
          <Input
            id="dataInicio"
            type="date"
            value={filters.dataInicio}
            onChange={(e) => onFilterChange({ dataInicio: e.target.value })}
          />
        </div>

        {/* Data Fim */}
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data Fim</Label>
          <Input
            id="dataFim"
            type="date"
            value={filters.dataFim}
            onChange={(e) => onFilterChange({ dataFim: e.target.value })}
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 mt-4">
        <Button 
          onClick={onSearch} 
          disabled={isLoading}
          className="flex-1"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar da API ML
        </Button>
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Limpar
        </Button>
      </div>
    </Card>
  );
});
