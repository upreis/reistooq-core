import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Boxes, Edit } from "lucide-react";
import { useShopProducts } from "@/features/shop/hooks/useShopProducts";
import { ShopProduct } from "@/features/shop/types/shop.types";
import { useComposicoesEstoque } from "@/hooks/useComposicoesEstoque";
import { ComposicoesModal } from "./ComposicoesModal";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

const sortOptions = [
  { id: "newest", name: "Mais Recentes", sortBy: "created_at", sortOrder: "desc" },
  { id: "name", name: "A-Z", sortBy: "nome", sortOrder: "asc" },
  { id: "category", name: "Por Categoria", sortBy: "categoria", sortOrder: "asc" },
];

export function ComposicoesEstoque() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ShopProduct | null>(null);
  const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>({});

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

  const { getComposicoesForSku, loadComposicoes } = useComposicoesEstoque();

  const abrirModalComposicoes = (produto: ShopProduct) => {
    setProdutoSelecionado(produto);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setProdutoSelecionado(null);
  };

  const handleSalvarComposicoes = () => {
    loadComposicoes(); // Recarrega as composições
  };

  // Sync local state with hook filters
  useEffect(() => {
    const selectedOption = sortOptions.find(option => option.id === selectedSort);
    updateFilters({
      search: searchQuery,
      categoria: selectedCategory || undefined,
      sortBy: selectedOption?.sortBy as any,
      sortOrder: selectedOption?.sortOrder as any,
      page: 1
    });
  }, [searchQuery, selectedCategory, selectedSort, updateFilters]);

  // Carregar custos dos produtos quando as composições mudarem
  useEffect(() => {
    const carregarCustos = async () => {
      if (!products || products.length === 0) return;
      
      try {
        const skusUnicos = Array.from(new Set(
          products.flatMap(p => {
            const comps = getComposicoesForSku(p.sku_interno);
            return comps?.map(c => c.sku_componente) || [];
          })
        ));

        if (skusUnicos.length === 0) return;

        const { data: produtosCusto } = await supabase
          .from('produtos')
          .select('sku_interno, preco_custo')
          .in('sku_interno', skusUnicos);

        const custosMap: Record<string, number> = {};
        produtosCusto?.forEach(p => {
          custosMap[p.sku_interno] = p.preco_custo || 0;
        });

        setCustosProdutos(custosMap);
      } catch (error) {
        console.error('Erro ao carregar custos:', error);
      }
    };

    carregarCustos();
  }, [products, getComposicoesForSku]);

  const renderProductCard = (product: ShopProduct) => {
    const composicoes = getComposicoesForSku(product.sku_interno);
    
    // Calcular custo total da composição
    const custoTotal = composicoes?.reduce((total, comp) => {
      const custoUnitario = custosProdutos[comp.sku_componente] || 0;
      return total + (custoUnitario * comp.quantidade);
    }, 0) || 0;

    return (
      <Card key={product.id} className="group hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <header className="mb-4">
            <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2">{product.nome}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">SKU Pai:</span>
              <Badge variant="outline" className="font-mono text-[11px]">{product.sku_interno}</Badge>
            </div>
          </header>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">SKUs Filhos</span>
                <span className="text-xs text-muted-foreground">{(composicoes?.length || 0)} itens</span>
              </div>
            </div>

            {composicoes && composicoes.length > 0 ? (
              <ul className="rounded-md border bg-card/50 divide-y">
                {composicoes.map((comp, index) => {
                  const custoUnitario = custosProdutos[comp.sku_componente] || 0;
                  const custoTotalItem = custoUnitario * comp.quantidade;
                  
                  return (
                    <li key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{comp.nome_componente}</div>
                        <div className="text-xs text-muted-foreground">SKU: {comp.sku_componente}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{comp.quantidade}</div>
                        <div className="text-xs text-muted-foreground">un</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatMoney(custoUnitario)}</div>
                        <div className="text-xs text-muted-foreground">custo unit.</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatMoney(custoTotalItem)}</div>
                        <div className="text-xs text-muted-foreground">total</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground italic border-2 border-dashed border-border rounded-lg p-3 text-center">
                Nenhuma composição cadastrada
                <br />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => abrirModalComposicoes(product)}
                >
                  + Adicionar composição
                </Button>
              </div>
            )}

            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => abrirModalComposicoes(product)}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                {composicoes && composicoes.length > 0 ? "Editar Composições" : "Adicionar Composições"}
              </Button>
            </div>
          </section>

          <footer className="mt-3 pt-3 border-t space-y-2">
            {composicoes && composicoes.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <span>Custo Total: </span>
                <span className="font-semibold text-foreground">{formatMoney(custoTotal)}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <span>Estoque Disponível: </span>
              <span className="font-medium text-foreground">{product.quantidade_atual}</span>
            </div>
          </footer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Composições de Produtos</h2>
          <div className="text-sm text-muted-foreground">
            Visualize e gerencie os componentes de cada SKU
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filter By Category */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Filtrar por Categoria</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedCategory === "" ? "default" : "ghost"}
                className={`w-full justify-start ${
                  selectedCategory === ""
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSelectedCategory("")}
              >
                <span className="mr-2">🛍️</span>
                Todas
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="mr-2">
                    {category.icone === 'Car' ? '🚗' :
                     category.icone === 'Coffee' ? '☕' :
                     category.icone === 'Sparkles' ? '✨' :
                     category.icone === 'Smartphone' ? '📱' :
                     category.icone === 'Home' ? '🏠' :
                     category.icone === 'Book' ? '📚' :
                     category.icone === 'Heart' ? '❤️' :
                     category.icone === 'Gamepad2' ? '🎮' :
                     category.icone === 'Hammer' ? '🔨' :
                     category.icone === 'Laptop' ? '💻' :
                     category.icone === 'Shirt' ? '👕' :
                     category.icone === 'Package' ? '📦' :
                     category.icone === 'Star' ? '⭐' :
                     category.icone === 'Circle' ? '⚪' :
                     '📦'}
                  </span>
                  {category.nome} ({category.products_count})
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Sort By */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Ordenar por</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedSort === option.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedSort === option.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedSort(option.id)}
                >
                  {option.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Status</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Total de produtos:</span>
                  <span className="font-medium">{total}</span>
                </div>
                {!isLoading && (
                  <div className="mt-2 text-xs">
                    {products?.length} produtos exibidos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Produtos com Composições</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
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
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

      {/* Modal de Composições */}
      <ComposicoesModal
        isOpen={modalOpen}
        onClose={fecharModal}
        produto={produtoSelecionado}
        composicoes={produtoSelecionado ? getComposicoesForSku(produtoSelecionado.sku_interno) : []}
        onSave={handleSalvarComposicoes}
      />
    </div>
  );
}