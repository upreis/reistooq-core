import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Package, AlertTriangle, TrendingUp, TrendingDown, X } from "lucide-react";

interface EstoqueFilterSheetProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProductType?: string;
  onProductTypeChange?: (value: string) => void;
  categories: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  children?: React.ReactNode;
}

export function EstoqueFilterSheet({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedProductType = "all",
  onProductTypeChange,
  categories,
  onClearFilters,
  hasActiveFilters,
  children,
}: EstoqueFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "Todos", icon: Package },
    { value: "active_only", label: "Apenas Ativos", icon: Package },
    { value: "inactive_only", label: "Apenas Inativos", icon: X },
    { value: "low", label: "Estoque baixo", icon: AlertTriangle },
    { value: "out", label: "Sem estoque", icon: AlertTriangle },
    { value: "high", label: "Estoque alto", icon: TrendingUp },
    { value: "critical", label: "Crítico", icon: TrendingDown },
  ];

  const handleClearAndClose = () => {
    onClearFilters();
    setOpen(false);
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedStatus !== "all",
    selectedProductType !== "all"
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="relative p-2 h-10 w-10">
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtros de Estoque</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Filtro de Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
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
          </div>

          {/* Filtro de Status */}
          <div className="space-y-2">
            <Label>Status do Estoque</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Tipo de Produto */}
          {onProductTypeChange && (
            <div className="space-y-2">
              <Label>Tipo de Produto</Label>
              <Select value={selectedProductType} onValueChange={onProductTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Todos os Produtos
                    </div>
                  </SelectItem>
                  <SelectItem value="parent">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Apenas Produtos Pai
                    </div>
                  </SelectItem>
                  <SelectItem value="child">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Apenas Produtos Filho
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-2">
          <Button 
            variant="outline" 
            onClick={handleClearAndClose}
            className="w-full"
            disabled={!hasActiveFilters}
          >
            Limpar Filtros
          </Button>
          <Button onClick={() => setOpen(false)} className="w-full">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
