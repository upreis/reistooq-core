import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, ShoppingCart, Star, Package } from "lucide-react";
import { useShopProducts } from "@/features/shop/hooks/useShopProducts";
import { ShopProduct } from "@/features/shop/types/shop.types";
import { OptimizedCategorySidebar } from "@/components/estoque/OptimizedCategorySidebar";
import { Product } from "@/hooks/useProducts";

const sortOptions = [
  { id: "newest", name: "Mais Recentes" },
  { id: "price_desc", name: "Preço: Maior-Menor" },
  { id: "price_asc", name: "Preço: Menor-Maior" },
  { id: "name", name: "A-Z" },
];

const priceRanges = [
  { id: "all", name: "Todos" },
  { id: "0-50", name: "R$ 0 - R$ 50" },
  { id: "50-100", name: "R$ 50 - R$ 100" },
  { id: "100-200", name: "R$ 100 - R$ 200" },
  { id: "200+", name: "R$ 200+" },
];

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filtros hierárquicos para o sidebar
  const [hierarchicalFilters, setHierarchicalFilters] = useState<{
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }>({});

  const {
    products,
    categories,
    isLoading,
    filters,
    updateFilters,
    totalPages,
    hasNextPage,
    hasPrevPage,
    total
  } = useShopProducts();

  // Converter ShopProducts para Products para compatibilidade
  const productsForSidebar: Product[] = products?.map(product => ({
    id: product.id,
    sku_interno: product.sku_interno,
    nome: product.nome,
    categoria: product.categoria || null,
    descricao: product.descricao || null,
    codigo_barras: product.codigo_barras || null,
    quantidade_atual: product.quantidade_atual,
    estoque_minimo: product.estoque_minimo || 0,
    estoque_maximo: 999999,
    preco_custo: product.preco_custo || null,
    preco_venda: product.preco_venda || null,
    localizacao: null,
    unidade_medida_id: null,
    status: product.stock_status || 'in_stock',
    ativo: true,
    url_imagem: product.url_imagem || null,
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString(),
    ultima_movimentacao: null,
    organization_id: null,
    integration_account_id: null,
    sku_pai: null,
  })) || [];

  // Sync filters including hierarchical ones
  useEffect(() => {
    const priceRange: { min?: number; max?: number } = {};
    
    if (selectedPriceRange !== "all") {
      const range = selectedPriceRange.split("-");
      if (range.length === 2) {
        priceRange.min = parseInt(range[0]);
        priceRange.max = parseInt(range[1]);
      } else if (selectedPriceRange === "200+") {
        priceRange.min = 200;
      }
    }

    updateFilters({
      search: searchQuery,
      categoria: hierarchicalFilters.categoriaPrincipal || 
                 hierarchicalFilters.categoria || 
                 hierarchicalFilters.subcategoria || 
                 selectedCategory || undefined,
      sortBy: selectedSort as any,
      priceRange,
      page: 1
    });
  }, [searchQuery, selectedCategory, selectedSort, selectedPriceRange, hierarchicalFilters, updateFilters]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-orange-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Loja Virtual</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>🏠</span>
            <span>/</span>
            <span className="text-orange-500">Loja</span>
          </div>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          Comprar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Products Grid */}
        <div>
          {/* Search Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Produtos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar Produtos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product: ShopProduct) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      {product.url_imagem ? (
                        <img
                          src={product.url_imagem}
                          alt={product.nome}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop&q=80`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button size="icon" variant="ghost" className="bg-white/80 hover:bg-white">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="icon" className="bg-blue-500 hover:bg-blue-600 text-white">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                      {product.isOnSale && (
                        <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                          Promoção
                        </Badge>
                      )}
                      {product.stock_status === 'low_stock' && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                          Estoque Baixo
                        </Badge>
                      )}
                      {product.stock_status === 'out_of_stock' && (
                        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                          Sem Estoque
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.nome}</h3>
                    {product.categoria && (
                      <p className="text-xs text-muted-foreground mb-2">{product.categoria}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">
                        R$ {product.preco_venda?.toFixed(2) || "0,00"}
                      </span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground line-through text-sm">
                          R$ {product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(product.rating || 0)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({product.reviews_count || 0})
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Estoque: {product.quantidade_atual}
                      </span>
                    </div>
                    {product.descricao && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {product.descricao}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou a pesquisa para encontrar produtos.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button 
                variant="outline" 
                disabled={!hasPrevPage}
                onClick={() => updateFilters({ page: filters.page - 1 })}
              >
                Anterior
              </Button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Página {filters.page} de {totalPages}
              </span>
              <Button 
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}