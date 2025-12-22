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
        <div className="flex flex-wrap gap-2 p-4 bg-card/50 border border-border rounded-lg shadow-sm">
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <EstoqueExport 
            products={products}
            filteredProducts={finalFilteredProducts}
          />
          
          <EstoqueReports products={products} />

          {/* Separador */}
          <div className="h-8 w-px bg-border mx-1" />

          {/* Visualização Hierárquica */}
          {onToggleHierarchy && (
            <Button
              variant={showHierarchy ? "default" : "outline"}
              size="sm"
              onClick={onToggleHierarchy}
            >
              <Layers className="h-4 w-4 mr-2" />
              Visualização Hierárquica
            </Button>
          )}
          
          {/* Expandir Todos */}
          {showHierarchy && onExpandAll && (
            <Button variant="ghost" size="sm" onClick={onExpandAll}>
              <ChevronsUpDown className="h-4 w-4 mr-2" />
              Expandir Todos
            </Button>
          )}
          
          {/* Recolher Todos */}
          {showHierarchy && onCollapseAll && (
            <Button variant="ghost" size="sm" onClick={onCollapseAll}>
              <ChevronsDownUp className="h-4 w-4 mr-2" />
              Recolher Todos
            </Button>
          )}

          {/* Separador */}
          <div className="h-8 w-px bg-border mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros Avançados
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    •
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background z-50">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filtros Avançados</h4>
                
                {/* Campo de busca */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, SKU, categoria..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Categoria</label>
                  <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-full bg-background">
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
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Select value={selectedStatus} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4 text-muted-foreground" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Produto */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Tipo de Produto</label>
                  <Select value={selectedProductType} onValueChange={onProductTypeChange}>
                    <SelectTrigger className="w-full bg-background">
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
                <div className="flex gap-2 pt-2 border-t">
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
