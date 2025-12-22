import { Button } from "@/components/ui/button";
import { Plus, Settings, LinkIcon, Trash2, Upload, Filter, Search, X, Layers, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ImportModal } from "@/components/estoque/ImportModal";
import { EstoqueExport } from "@/components/estoque/EstoqueExport";
import { EstoqueReports } from "@/components/estoque/EstoqueReports";
import { EstoqueSettings } from "@/components/estoque/EstoqueSettings";
import { Product } from "@/hooks/useProducts";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EstoqueActionButtonsProps {
  selectedProducts: string[];
  products: Product[];
  finalFilteredProducts: Product[];
  onCreateParent: () => void;
  onCreateChild: () => void;
  onLinkChild: () => void;
  onDelete: () => void;
  onImportSuccess: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProductType: string;
  onProductTypeChange: (value: string) => void;
  categories: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onSearch: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  // Controles de visualização hierárquica
  showHierarchy?: boolean;
  onToggleHierarchy?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export function EstoqueActionButtons({
  selectedProducts,
  products,
  finalFilteredProducts,
  onCreateParent,
  onCreateChild,
  onLinkChild,
  onDelete,
  onImportSuccess,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedProductType,
  onProductTypeChange,
  categories,
  onClearFilters,
  hasActiveFilters,
  onSearch,
  searchTerm,
  onSearchChange,
  showHierarchy = true,
  onToggleHierarchy,
  onExpandAll,
  onCollapseAll
}: EstoqueActionButtonsProps) {
  const [importModalOpen, setImportModalOpen] = useState(false);
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
    <>
      {!isMobile && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-card/50 border border-border rounded-md shadow-sm">
          
          <Button 
            variant="outline" 
            onClick={() => setImportModalOpen(true)}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Upload className="h-3 w-3" />
            Importar
          </Button>
          
          <EstoqueExport 
            products={products}
            filteredProducts={finalFilteredProducts}
          />
          
          <EstoqueReports products={products} />

          {/* Separador */}
          <div className="h-7 w-px bg-muted-foreground/50 mx-0.5" />

          {/* Visualização Hierárquica */}
          {onToggleHierarchy && (
            <Button
              variant={showHierarchy ? "default" : "outline"}
              onClick={onToggleHierarchy}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <Layers className="h-3 w-3" />
              Hierárquica
            </Button>
          )}
          
          {/* Expandir Todos */}
          {showHierarchy && onExpandAll && (
            <Button variant="ghost" onClick={onExpandAll} className="h-7 px-2.5 text-xs gap-1.5">
              <ChevronsUpDown className="h-3 w-3" />
              Expandir
            </Button>
          )}
          
          {/* Recolher Todos */}
          {showHierarchy && onCollapseAll && (
            <Button variant="ghost" onClick={onCollapseAll} className="h-7 px-2.5 text-xs gap-1.5">
              <ChevronsDownUp className="h-3 w-3" />
              Recolher
            </Button>
          )}

          {/* Separador */}
          <div className="h-7 w-px bg-muted-foreground/50 mx-0.5" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-7 px-2.5 text-xs gap-1.5">
                <Filter className="w-3 h-3" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[9px]">
                    •
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-background z-50 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-xs">Filtros Avançados</h4>
                
                {/* Campo de busca */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Nome, SKU, categoria..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="pl-7 h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Categoria</label>
                  <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                      <SelectValue placeholder="Todas categorias" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Status</label>
                  <Select value={selectedStatus} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-1.5">
                            <option.icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Produto */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Tipo de Produto</label>
                  <Select value={selectedProductType} onValueChange={onProductTypeChange}>
                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="parent">Produto Pai</SelectItem>
                      <SelectItem value="child">Produto Filho</SelectItem>
                      <SelectItem value="standalone">Produto Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ações */}
                <div className="flex gap-1.5 pt-2 border-t">
                  <Button variant="outline" onClick={onClearFilters} className="h-7 px-2.5 text-xs">
                    Limpar
                  </Button>
                  <Button onClick={onSearch} className="h-7 px-2.5 text-xs">
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

    <ImportModal
      open={importModalOpen}
      onOpenChange={setImportModalOpen}
      onSuccess={() => {
        onImportSuccess();
        setImportModalOpen(false);
      }}
      tipo="produtos"
    />
  </>
  );
}
