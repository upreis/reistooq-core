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
import { EstoqueFilterSheet } from "./EstoqueFilterSheet";

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
  // Removido: priceRange e stockRange eram estados locais não utilizados na filtragem real
  const isMobile = useIsMobile();

  const statusOptions = [
    { value: "all", label: "Todos", icon: Package },
    { value: "active_only", label: "Apenas Ativos", icon: Package },
    { value: "inactive_only", label: "Apenas Inativos", icon: X },
    { value: "in_stock", label: "Com estoque", icon: Package },
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
        {isMobile && (
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
            
            {/* Sheet de Filtros para Mobile */}
            <EstoqueFilterSheet
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              selectedStatus={selectedStatus}
              onStatusChange={onStatusChange}
              selectedProductType={selectedProductType}
              onProductTypeChange={onProductTypeChange}
              categories={categories}
              onClearFilters={onClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
            
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