import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ShopFilters as ShopFiltersType, ShopCategory } from "../types/shop.types";
import { HierarchicalCategoryFilter } from '@/features/products/components/HierarchicalCategoryFilter';

interface ShopFiltersProps {
  filters: ShopFiltersType;
  categories: ShopCategory[];
  onFiltersChange: (filters: Partial<ShopFiltersType>) => void;
  onReset: () => void;
  isLoading?: boolean;
  useHierarchicalCategories?: boolean;
}

export function ShopFilters({ 
  filters, 
  categories, 
  onFiltersChange, 
  onReset,
  isLoading,
  useHierarchicalCategories = false
}: ShopFiltersProps) {
  const hasActiveFilters = !!(
    filters.search ||
    filters.categoria ||
    filters.priceRange.min ||
    filters.priceRange.max ||
    filters.stockStatus?.length ||
    filters.onSale
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <h3 className="font-semibold">Buscar Produtos</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite nome, SKU ou descrição..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10"
              disabled={isLoading}
            />
            {filters.search && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onFiltersChange({ search: '' })}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Categorias</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {useHierarchicalCategories ? (
            <HierarchicalCategoryFilter
              selectedFilters={{
                categoriaPrincipal: filters.categoriaPrincipal,
                categoria: filters.categoria,
                subcategoria: filters.subcategoria,
              }}
              onFilterChange={(hierarchicalFilters) => {
                onFiltersChange({
                  categoriaPrincipal: hierarchicalFilters.categoriaPrincipal,
                  categoria: hierarchicalFilters.categoria,
                  subcategoria: hierarchicalFilters.subcategoria,
                });
              }}
            />
          ) : (
            <>
              <Button
                variant={!filters.categoria ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onFiltersChange({ categoria: undefined })}
                disabled={isLoading}
              >
                <span className="mr-2">🛍️</span>
                Todas as Categorias
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={filters.categoria === category.nome ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => onFiltersChange({ 
                    categoria: filters.categoria === category.nome ? undefined : category.nome 
                  })}
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{category.icone || '📦'}</span>
                    {category.nome}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.products_count}
                  </Badge>
                </Button>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Faixa de Preço</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Mínimo</Label>
              <Input
                type="number"
                placeholder="R$ 0"
                value={filters.priceRange.min || ''}
                onChange={(e) => onFiltersChange({
                  priceRange: {
                    ...filters.priceRange,
                    min: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label className="text-xs">Máximo</Label>
              <Input
                type="number"
                placeholder="R$ 1000"
                value={filters.priceRange.max || ''}
                onChange={(e) => onFiltersChange({
                  priceRange: {
                    ...filters.priceRange,
                    max: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Status */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Status do Estoque</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'in_stock', label: 'Em Estoque', color: 'bg-success' },
            { id: 'low_stock', label: 'Estoque Baixo', color: 'bg-warning' },
            { id: 'out_of_stock', label: 'Sem Estoque', color: 'bg-destructive' },
          ].map((status) => (
            <div key={status.id} className="flex items-center space-x-2">
              <Checkbox
                id={status.id}
                checked={filters.stockStatus?.includes(status.id as any) || false}
                onCheckedChange={(checked: boolean) => {
                  const currentStatus = filters.stockStatus || [];
                  const newStatus = checked
                    ? [...currentStatus, status.id as any]
                    : currentStatus.filter(s => s !== status.id);
                  onFiltersChange({ stockStatus: newStatus.length ? newStatus : undefined });
                }}
                disabled={isLoading}
              />
              <Label htmlFor={status.id} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                {status.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sort Options */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Ordenar Por</h3>
        </CardHeader>
        <CardContent>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Recentes</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="price_asc">Menor Preço</SelectItem>
              <SelectItem value="price_desc">Maior Preço</SelectItem>
              <SelectItem value="rating">Melhor Avaliação</SelectItem>
              <SelectItem value="popularity">Mais Populares</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Promoções */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Promoções</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={filters.onSale || false}
              onCheckedChange={(checked: boolean) => onFiltersChange({ onSale: checked || undefined })}
              disabled={isLoading}
            />
            <Label htmlFor="on-sale" className="cursor-pointer">
              Apenas produtos em promoção
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={onReset}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}