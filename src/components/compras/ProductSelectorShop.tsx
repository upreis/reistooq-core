import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, ShoppingCart, Minus, Plus, Filter } from "lucide-react";
import { useShopProducts } from "@/features/shop/hooks/useShopProducts";
import { ShopProduct } from "@/features/shop/types/shop.types";

interface SelectedProduct {
  id: string;
  nome: string;
  sku_interno: string;
  preco_custo: number;
  preco_venda: number;
  quantidade: number;
  categoria?: string;
}

interface ProductSelectorShopProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProducts: (products: SelectedProduct[]) => void;
  selectedProducts?: SelectedProduct[];
}

export const ProductSelectorShop: React.FC<ProductSelectorShopProps> = ({
  isOpen,
  onOpenChange,
  onSelectProducts,
  selectedProducts = []
}) => {
  const [selectedItems, setSelectedItems] = useState<{[key: string]: { product: ShopProduct; quantidade: number }}>({});
  
  const { 
    products, 
    categories, 
    filters, 
    updateFilters, 
    isLoading,
    total,
    totalPages
  } = useShopProducts();

  // Limpar seleção quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedItems({});
    }
  }, [isOpen]);

  const handleSearchChange = (search: string) => {
    updateFilters({ search, page: 1 });
  };

  const handleCategoryChange = (categoria: string) => {
    updateFilters({ categoria: categoria === 'all' ? undefined : categoria, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy: sortBy as any, page: 1 });
  };

  const handleProductToggle = (product: ShopProduct, checked: boolean) => {
    const newSelected = { ...selectedItems };
    
    if (checked) {
      newSelected[product.id] = { product, quantidade: 1 };
    } else {
      delete newSelected[product.id];
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (productId: string, quantidade: number) => {
    if (quantidade <= 0) return;
    
    const newSelected = { ...selectedItems };
    if (newSelected[productId]) {
      newSelected[productId].quantidade = quantidade;
      setSelectedItems(newSelected);
    }
  };

  const handleConfirm = () => {
    const productsToReturn: SelectedProduct[] = Object.values(selectedItems).map(({ product, quantidade }) => ({
      id: product.id,
      nome: product.nome,
      sku_interno: product.sku_interno,
      preco_custo: product.preco_custo || 0,
      preco_venda: product.preco_venda,
      quantidade: quantidade,
      categoria: product.categoria
    }));

    onSelectProducts(productsToReturn);
    setSelectedItems({});
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems({});
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatusBadge = (product: ShopProduct) => {
    const statusConfig = {
      'in_stock': { variant: "default" as const, label: "Em Estoque" },
      'low_stock': { variant: "secondary" as const, label: "Estoque Baixo" },
      'out_of_stock': { variant: "destructive" as const, label: "Sem Estoque" }
    };
    
    const config = statusConfig[product.stock_status] || statusConfig.in_stock;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalValue = Object.values(selectedItems).reduce(
    (sum, { product, quantidade }) => sum + (product.preco_custo || 0) * quantidade,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seletor Avançado de Produtos
            {selectedCount > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedCount} selecionado(s)
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, SKU ou descrição..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={filters.categoria || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.nome}>
                      {category.nome} ({category.products_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recente</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo da seleção */}
          {selectedCount > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Resumo da Seleção</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} produto(s) selecionado(s)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total (Custo)</div>
                </div>
              </div>
            </div>
          )}

          {/* Informações de paginação */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Exibindo {products.length} de {total} produtos
              {filters.search && ` • Filtrado por: "${filters.search}"`}
              {filters.categoria && ` • Categoria: ${filters.categoria}`}
            </span>
            <span>Página {filters.page} de {totalPages}</span>
          </div>

          {/* Tabela de produtos */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Selecionar</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="w-32">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        Carregando produtos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                      <p className="text-muted-foreground">
                        Tente ajustar seus filtros de busca.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const isSelected = !!selectedItems[product.id];
                    const quantidade = selectedItems[product.id]?.quantidade || 1;

                    return (
                      <TableRow key={product.id} className={isSelected ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleProductToggle(product, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.nome}</div>
                            {product.descricao && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.descricao}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {product.sku_interno}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.categoria || 'Sem categoria'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(product.preco_venda)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(product.preco_custo || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{product.quantidade_atual}</span>
                            {getStockStatusBadge(product)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(product.id, quantidade - 1)}
                                disabled={quantidade <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={quantidade}
                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center"
                                min="1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(product.id, quantidade + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page - 1 })}
                disabled={filters.page <= 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (filters.page <= 3) {
                    pageNum = i + 1;
                  } else if (filters.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = filters.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={filters.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ page: pageNum })}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount} produto(s) selecionado(s) • Total: {formatCurrency(totalValue)}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={selectedCount === 0}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Confirmar Seleção ({selectedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};