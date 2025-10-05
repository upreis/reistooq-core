import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Grid3X3, 
  List, 
  ShoppingCart, 
  Heart, 
  Package,
  TrendingUp,
  Users,
  Star,
  AlertTriangle
} from "lucide-react";
import { useShopProducts } from "../hooks/useShopProducts";
import { ShopFilters } from "./ShopFilters";
import { ProductCard } from "./ProductCard";
import { ShopProduct } from "../types/shop.types";
import { StatsCard } from "@/components/dashboard/StatsCard";

export function ShopAdvancedPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  
  const {
    products,
    stats,
    categories,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    selectedProducts,
    selectProduct,
    selectAllProducts,
    isAllSelected,
    isIndeterminate,
    totalPages,
    hasNextPage,
    hasPrevPage,
    total,
    refresh,
  } = useShopProducts();

  const handleAddToCart = (product: ShopProduct) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', product);
  };

  const handleAddToWishlist = (product: ShopProduct) => {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', product);
  };

  const handleViewProduct = (product: ShopProduct) => {
    setSelectedProduct(product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os produtos. Tente novamente.
          </p>
          <Button onClick={() => refresh()}>Tentar Novamente</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loja</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize seus produtos como uma loja online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
        {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Produtos"
            value={stats.total_products.toString()}
            icon={Package}
          />
          <StatsCard
            title="Em Promoção"
            value={stats.on_sale_count.toString()}
            icon={TrendingUp}
          />
          <StatsCard
            title="Categorias"
            value={stats.categories_count.toString()}
            icon={Users}
          />
          <StatsCard
            title="Avaliação Média"
            value={stats.avg_rating.toFixed(1)}
            icon={Star}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ShopFilters
            filters={filters}
            categories={categories || []}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
            isLoading={isLoading}
          />
        </div>

        {/* Products Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={selectAllProducts}
                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedProducts.length > 0 
                      ? `${selectedProducts.length} selecionados`
                      : `${total} produtos`
                    }
                  </span>
                </div>
              </div>

              {/* Active Filters */}
              {(filters.categoria || filters.priceRange.min || filters.priceRange.max || filters.stockStatus?.length) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filters.categoria && (
                    <Badge variant="secondary">
                      Categoria: {filters.categoria}
                    </Badge>
                  )}
                  {filters.priceRange.min && (
                    <Badge variant="secondary">
                      Min: {formatPrice(filters.priceRange.min)}
                    </Badge>
                  )}
                  {filters.priceRange.max && (
                    <Badge variant="secondary">
                      Max: {formatPrice(filters.priceRange.max)}
                    </Badge>
                  )}
                  {filters.stockStatus?.map(status => (
                    <Badge key={status} variant="secondary">
                      {status === 'in_stock' && 'Em Estoque'}
                      {status === 'low_stock' && 'Estoque Baixo'}
                      {status === 'out_of_stock' && 'Sem Estoque'}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros para encontrar produtos.
              </p>
              <Button onClick={resetFilters}>Limpar Filtros</Button>
            </Card>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.includes(product.id)}
                  onSelect={selectProduct}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  onViewProduct={handleViewProduct}
                  showSelection
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page - 1 })}
                disabled={!hasPrevPage || isLoading}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={filters.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ page })}
                      disabled={isLoading}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page + 1 })}
                disabled={!hasNextPage || isLoading}
              >
                Próximo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.nome}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                {selectedProduct.url_imagem ? (
                  <img
                    src={selectedProduct.url_imagem}
                    alt={selectedProduct.nome}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedProduct.nome}</h3>
                  <p className="text-muted-foreground">SKU: {selectedProduct.sku_interno}</p>
                </div>
                
                {selectedProduct.descricao && (
                  <p className="text-sm">{selectedProduct.descricao}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedProduct.preco_venda)}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  <Badge variant="outline">
                    {selectedProduct.quantidade_atual} unidades em estoque
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={selectedProduct.stock_status === 'out_of_stock'}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleAddToWishlist(selectedProduct)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}