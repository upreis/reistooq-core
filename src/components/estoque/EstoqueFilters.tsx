import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  X,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus
} from "lucide-react";
import { HierarchicalCategoryFilter } from '@/features/products/components/HierarchicalCategoryFilter';
import { useIsMobile } from "@/hooks/use-mobile";

interface EstoqueFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProductType?: string;
  onProductTypeChange?: (value: string) => void;
  categories: string[];
  onSearch: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  // Filtros hierárquicos opcionais
  useHierarchicalCategories?: boolean;
  hierarchicalFilters?: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  };
  onHierarchicalFiltersChange?: (filters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }) => void;
  // Callbacks para criar produtos
  onCreateParent?: () => void;
  onCreateChild?: () => void;
}

export function EstoqueFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedProductType = "all",
  onProductTypeChange,
  categories,
  onSearch,
  onClearFilters,
  hasActiveFilters,
  useHierarchicalCategories = false,
  hierarchicalFilters,
  onHierarchicalFiltersChange,
  onCreateParent,
  onCreateChild,
}: EstoqueFiltersProps) {
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const isMobile = useIsMobile();

  const statusOptions = [
    { value: "all", label: "Todos", icon: Package },
    { value: "active_only", label: "Apenas Ativos", icon: Package },
    { value: "inactive_only", label: "Apenas Inativos", icon: X },
    { value: "low", label: "Estoque baixo", icon: AlertTriangle },
    { value: "out", label: "Sem estoque", icon: AlertTriangle },
    { value: "high", label: "Estoque alto", icon: TrendingUp },
    { value: "critical", label: "Crítico", icon: TrendingDown },
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha principal de filtros */}
      <div className="flex items-center gap-3">
        {/* Layout Mobile - organizado como na aba composições */}
        {isMobile ? (
          <>
            {/* Campo de busca expansível */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar produtos..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Ícone de filtro compacto */}
            <Button variant="outline" size="sm" className="p-2 h-10 w-10">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
            
            {/* Dropdown + Produto compacto */}
            {onCreateParent && onCreateChild && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="p-2 h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem onClick={onCreateParent}>
                    + Criar Produto Pai
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCreateChild}>
                    + Criar Produto Filho
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        ) : (
          <>
            {/* Layout Desktop - reordenado: busca, categoria, status, tipo, filtros avançados */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nome, SKU, código de barras..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Filtro de categoria */}
            {useHierarchicalCategories && onHierarchicalFiltersChange ? (
              <div className="min-w-[200px]">
                <HierarchicalCategoryFilter
                  selectedFilters={hierarchicalFilters}
                  onFilterChange={onHierarchicalFiltersChange}
                  className="space-y-2"
                />
              </div>
            ) : (
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filtro de status */}
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Filtro de tipo de produto (Pai/Filho) */}
            {onProductTypeChange && (
              <Select value={selectedProductType} onValueChange={onProductTypeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Produto" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Todos os Produtos
                    </div>
                  </SelectItem>
                  <SelectItem value="parent">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Apenas Produtos Pai
                    </div>
                  </SelectItem>
                  <SelectItem value="child">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Apenas Produtos Filho
                    </div>
                  </SelectItem>
                  <SelectItem value="standalone">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Produtos Sem Vínculo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Filtros avançados */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros Avançados
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      •
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Faixa de Preço (Custo)</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Mín"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        type="number"
                        step="0.01"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        placeholder="Máx"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        type="number"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Faixa de Estoque</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Mín"
                        value={stockRange.min}
                        onChange={(e) => setStockRange(prev => ({ ...prev, min: e.target.value }))}
                        type="number"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        placeholder="Máx"
                        value={stockRange.max}
                        onChange={(e) => setStockRange(prev => ({ ...prev, max: e.target.value }))}
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      Limpar Filtros
                    </Button>
                    <Button size="sm" onClick={onSearch}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Limpar filtros */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={onClearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </>
        )}
      </div>

      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchTerm}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {selectedCategory}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onCategoryChange("all")}
              />
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === selectedStatus)?.label}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onStatusChange("all")}
              />
            </Badge>
          )}
          {selectedProductType !== "all" && onProductTypeChange && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {
                selectedProductType === "parent" ? "Produtos Pai" :
                selectedProductType === "child" ? "Produtos Filho" :
                selectedProductType === "standalone" ? "Sem Vínculo" : ""
              }
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onProductTypeChange("all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}