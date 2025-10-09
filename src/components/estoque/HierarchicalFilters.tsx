import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Package, 
  Link2, 
  Users, 
  Filter, 
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface HierarchicalFiltersProps {
  onFilterChange: (filters: HierarchicalFilterState) => void;
  totalProducts: number;
  filteredCount: number;
}

export interface HierarchicalFilterState {
  productType: 'all' | 'parent' | 'child' | 'independent';
  stockStatus: 'all' | 'normal' | 'low' | 'out' | 'high';
  hasChildren: 'all' | 'yes' | 'no';
  priceRange: 'all' | 'low' | 'medium' | 'high';
  showOnlyProblems: boolean;
}

export function HierarchicalFilters({ 
  onFilterChange, 
  totalProducts, 
  filteredCount 
}: HierarchicalFiltersProps) {
  const [filters, setFilters] = useState<HierarchicalFilterState>({
    productType: 'all',
    stockStatus: 'all',
    hasChildren: 'all',
    priceRange: 'all',
    showOnlyProblems: false
  });

  const updateFilter = (key: keyof HierarchicalFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: HierarchicalFilterState = {
      productType: 'all',
      stockStatus: 'all',
      hasChildren: 'all',
      priceRange: 'all',
      showOnlyProblems: false
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== false
  );

  const getFilterCount = () => {
    let count = 0;
    if (filters.productType !== 'all') count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.hasChildren !== 'all') count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.showOnlyProblems) count++;
    return count;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Hierárquicos
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getFilterCount()} ativo{getFilterCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filteredCount} de {totalProducts} produtos
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tipo de Produto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Produto</label>
            <Select 
              value={filters.productType} 
              onValueChange={(value: any) => updateFilter('productType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="parent">Produtos Pai</SelectItem>
                <SelectItem value="child">Produtos Filho</SelectItem>
                <SelectItem value="independent">Independentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status do Estoque */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status do Estoque</label>
            <Select 
              value={filters.stockStatus} 
              onValueChange={(value: any) => updateFilter('stockStatus', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Estoque Baixo</SelectItem>
                <SelectItem value="out">Sem Estoque</SelectItem>
                <SelectItem value="high">Estoque Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tem Filhos */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tem Variações</label>
            <Select 
              value={filters.hasChildren} 
              onValueChange={(value: any) => updateFilter('hasChildren', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Com Variações</SelectItem>
                <SelectItem value="no">Sem Variações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de Preço */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Faixa de Preço</label>
            <Select 
              value={filters.priceRange} 
              onValueChange={(value: any) => updateFilter('priceRange', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Até R$ 50</SelectItem>
                <SelectItem value="medium">R$ 50 - R$ 200</SelectItem>
                <SelectItem value="high">Acima de R$ 200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apenas Problemas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtros Especiais</label>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <Checkbox
                id="problems-only"
                checked={filters.showOnlyProblems}
                onCheckedChange={(checked) => updateFilter('showOnlyProblems', checked)}
              />
              <label 
                htmlFor="problems-only" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Apenas Problemas
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
