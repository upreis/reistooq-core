import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SimplePedidosFiltersState {
  search?: string;
}

interface SimplePedidosFiltersProps {
  filters: SimplePedidosFiltersState;
  onFiltersChange: (filters: SimplePedidosFiltersState) => void;
}

export function SimplePedidosFilters({ filters, onFiltersChange }: SimplePedidosFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
        <p className="text-sm text-muted-foreground">Buscar Pedidos</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, cliente, CPF/CNPJ..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}