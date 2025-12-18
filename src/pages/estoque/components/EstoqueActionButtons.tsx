import { Button } from "@/components/ui/button";
import { Plus, Settings, LinkIcon, Trash2, Upload, Filter, Search, X } from "lucide-react";
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
  onSearchChange
}: EstoqueActionButtonsProps) {
  const [importModalOpen, setImportModalOpen] = useState(false);
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
    <>
      {!isMobile && (
        <div className="flex flex-wrap gap-2 p-4 bg-card/50 border border-border rounded-lg shadow-sm">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Produto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onCreateParent}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto Pai
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateChild}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto Filho
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedProducts.length > 0 && (
            <>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onLinkChild}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Gerenciar Vinculação
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </>
          )}
          
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
          
          <Button variant="outline" size="sm" asChild>
            <Link to="/category-manager">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Categorias
            </Link>
          </Button>

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
                {/* Filtro de categoria */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Categoria</h4>
                  <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de status */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Status do Estoque</h4>
                  <Select value={selectedStatus} onValueChange={onStatusChange}>
                    <SelectTrigger>
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
                </div>

                {/* Filtro de tipo de produto */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Tipo de Produto</h4>
                  <Select value={selectedProductType} onValueChange={onProductTypeChange}>
                    <SelectTrigger>
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
                </div>

                {/* TODO: Implementar filtros de Faixa de Preço e Estoque quando houver integração com a lógica de filtragem */}

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
