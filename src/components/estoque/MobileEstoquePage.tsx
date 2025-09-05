import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { FilterSheet } from "@/components/mobile/standard/FilterSheet";
import { DataListCard, DataField, CardAction } from "@/components/mobile/standard/DataListCard";
import { StickyActionBar } from "@/components/mobile/standard/StickyActionBar";
import { MobileStatusBar, StatusFilter } from "@/components/mobile/standard/MobileStatusBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, Package, Edit, Trash2, AlertTriangle, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface MobileEstoquePageProps {
  products: Product[];
  loading: boolean;
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  onNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onStockMovement: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
}

export function MobileEstoquePage({
  products,
  loading,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onClearSelection,
  onRefresh,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onStockMovement,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories
}: MobileEstoquePageProps) {
  const isMobile = useIsMobile();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Se não for mobile, retorna null
  if (!isMobile) return null;

  // Status filters
  const statusFilters: StatusFilter[] = [
    { 
      key: 'all', 
      label: 'Todos', 
      count: products.length, 
      active: selectedStatus === 'all' 
    },
    { 
      key: 'active', 
      label: 'Ativos', 
      count: products.filter(p => p.ativo && p.quantidade_atual > p.estoque_minimo).length, 
      active: selectedStatus === 'active',
      variant: 'default' as const
    },
    { 
      key: 'low', 
      label: 'Estoque Baixo', 
      count: products.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length, 
      active: selectedStatus === 'low',
      variant: 'destructive' as const
    },
    { 
      key: 'out', 
      label: 'Sem Estoque', 
      count: products.filter(p => p.quantidade_atual === 0).length, 
      active: selectedStatus === 'out',
      variant: 'destructive' as const
    }
  ];

  // Converter produtos para cards
  const productCards = useMemo(() => {
    return products.map((product) => {
      const getStockStatus = () => {
        if (product.quantidade_atual === 0) {
          return { label: "Sem estoque", variant: "destructive" as const };
        } else if (product.quantidade_atual <= product.estoque_minimo) {
          return { label: "Estoque baixo", variant: "secondary" as const };
        } else {
          return { label: "Em estoque", variant: "default" as const };
        }
      };

      const stockStatus = getStockStatus();

      const fields: DataField[] = [
        {
          key: 'nome',
          label: 'Produto',
          value: product.nome,
          isMain: true
        },
        {
          key: 'sku',
          label: 'SKU',
          value: product.sku_interno
        },
        {
          key: 'categoria',
          label: 'Categoria',
          value: product.categoria || 'Sem categoria'
        },
        {
          key: 'quantidade',
          label: 'Quantidade',
          value: product.quantidade_atual.toString()
        },
        {
          key: 'preco',
          label: 'Preço',
          value: product.preco_venda ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco_venda) : 
            'N/A'
        },
        {
          key: 'status',
          label: 'Status',
          value: stockStatus.label,
          isBadge: true,
          variant: stockStatus.variant
        }
      ];

      const actions: CardAction[] = [
        {
          label: 'Editar',
          onClick: () => onEditProduct(product),
          icon: <Edit className="h-4 w-4" />
        },
        {
          label: 'Entrada',
          onClick: () => onStockMovement(product.id, 'entrada', 1),
          icon: <TrendingUp className="h-4 w-4" />,
          variant: 'secondary'
        },
        {
          label: 'Saída',
          onClick: () => onStockMovement(product.id, 'saida', 1),
          icon: <TrendingDown className="h-4 w-4" />,
          variant: 'secondary'
        },
        {
          label: 'Excluir',
          onClick: () => onDeleteProduct(product.id),
          icon: <Trash2 className="h-4 w-4" />,
          variant: 'destructive'
        }
      ];

      return {
        id: product.id,
        fields,
        actions,
        isSelected: selectedProducts.includes(product.id),
        onSelectChange: (selected: boolean) => {
          if (selected) {
            onSelectProduct(product.id);
          } else {
            // Remove from selection
            onClearSelection();
          }
        }
      };
    });
  }, [products, selectedProducts, onEditProduct, onStockMovement, onDeleteProduct, onSelectProduct, onClearSelection]);

  // Ações em massa
  const bulkActions = [
    {
      label: 'Excluir Selecionados',
      onClick: () => {
        selectedProducts.forEach(id => onDeleteProduct(id));
        onClearSelection();
      },
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const
    }
  ];

  // Contar filtros ativos
  const activeFiltersCount = (searchTerm ? 1 : 0) + 
                            (selectedCategory !== 'all' ? 1 : 0) + 
                            (selectedStatus !== 'all' ? 1 : 0);

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onStatusChange('all');
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="h-9 w-9 p-0"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={onNewProduct}
        className="h-9 px-3"
      >
        <Plus className="h-4 w-4 mr-1" />
        Novo
      </Button>
    </div>
  );

  return (
    <MobileAppShell title="Estoque" headerActions={headerActions}>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos, SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3">
          <FilterSheet
            title="Filtros"
            activeFiltersCount={activeFiltersCount}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status do Estoque</label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="low">Estoque Baixo</SelectItem>
                    <SelectItem value="out">Sem Estoque</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FilterSheet>

          {selectedProducts.length === 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectAll(true)}
              className="shrink-0"
            >
              Selecionar Todos
            </Button>
          )}
        </div>

        {/* Status Bar */}
        <MobileStatusBar
          filters={statusFilters}
          onFilterChange={onStatusChange}
        />

        {/* Products List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : productCards.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou adicione um novo produto.
              </p>
              <Button onClick={onNewProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          ) : (
            productCards.map((card) => (
              <DataListCard
                key={card.id}
                id={card.id}
                fields={card.fields}
                actions={card.actions}
                isSelected={card.isSelected}
                onSelectChange={card.onSelectChange}
                showSelect={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      {selectedProducts.length > 0 && (
        <StickyActionBar
          selectedCount={selectedProducts.length}
          totalCount={products.length}
          actions={bulkActions}
          onClearSelection={onClearSelection}
        />
      )}
    </MobileAppShell>
  );
}