// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstoqueActions } from "@/components/estoque/EstoqueActions";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { EstoqueIntelligentFilters } from "@/components/estoque/EstoqueIntelligentFilters";
import { useEstoqueFilters } from "@/features/estoque/hooks/useEstoqueFilters";
import { ProductModal } from "@/components/estoque/ProductModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, Boxes, Search, X, Filter } from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { EstoqueSkeleton } from "@/components/estoque/EstoqueSkeleton";
import { OptimizedCategorySidebar } from "@/components/estoque/OptimizedCategorySidebar";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { cn } from "@/lib/utils";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockMovement {
  id: string;
  produto_id: string;
  tipo_movimentacao: 'entrada' | 'saida';
  quantidade_anterior: number;
  quantidade_nova: number;
  quantidade_movimentada: number;
  motivo: string;
  created_at: string;
}

const ControleEstoquePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Para primeira carga
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Filtros hierárquicos
  const [hierarchicalFilters, setHierarchicalFilters] = useState<{
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }>({});
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { getProducts, getCategories, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const { getCategoriasPrincipais, getCategorias, getSubcategorias, categories: hierarchicalCategories, loading: categoriesLoading } = useHierarchicalCategories();
  const { isSidebarCollapsed: sidebarCollapsed, toggleSidebar } = useSidebarUI();

  // Hook para filtros inteligentes
  const { filters: intelligentFilters, setFilters: setIntelligentFilters, filteredData: intelligentFilteredData, stats: intelligentStats } = useEstoqueFilters(products);

  // Filtros estáveis para evitar loops
  const stableFilters = useMemo(() => 
    JSON.stringify(hierarchicalFilters), 
    [hierarchicalFilters]
  );

  const loadProducts = useCallback(async () => {
    try {
      // Só mostrar loading na primeira carga ou se não há produtos
      if (products.length === 0) {
        setLoading(true);
      }
      
      let allProducts = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 1000,
        ativo: selectedStatus === "inactive" ? false : (selectedStatus === "all" ? 'all' : true),
      });

      // Aplicar filtros hierárquicos
      if (hierarchicalFilters.categoriaPrincipal || hierarchicalFilters.categoria || hierarchicalFilters.subcategoria) {
        allProducts = allProducts.filter(product => {
          const categoriaCompleta = product.categoria || '';
          
          if (hierarchicalFilters.subcategoria) {
            const subcategoria = getSubcategorias(hierarchicalFilters.categoria || '').find(c => c.id === hierarchicalFilters.subcategoria);
            return categoriaCompleta.includes(subcategoria?.nome || '');
          }
          
          if (hierarchicalFilters.categoria) {
            const categoria = getCategorias(hierarchicalFilters.categoriaPrincipal || '').find(c => c.id === hierarchicalFilters.categoria);
            return categoriaCompleta.includes(categoria?.nome || '');
          }
          
          if (hierarchicalFilters.categoriaPrincipal) {
            const categoriaPrincipal = getCategoriasPrincipais().find(c => c.id === hierarchicalFilters.categoriaPrincipal);
            return categoriaCompleta.includes(categoriaPrincipal?.nome || '') || categoriaCompleta === categoriaPrincipal?.nome;
          }
          
          return true;
        });
      }
      
      // Não carregar categorias aqui para evitar loops

      // Aplicar filtro de status
      if (selectedStatus !== "all") {
        allProducts = allProducts.filter(product => {
          switch (selectedStatus) {
            case "active":
              return product.ativo && product.quantidade_atual > product.estoque_minimo;
            case "low":
              return product.quantidade_atual <= product.estoque_minimo && product.quantidade_atual > 0;
            case "out":
              return product.quantidade_atual === 0;
            case "high":
              return product.quantidade_atual >= product.estoque_maximo;
            case "critical":
              return product.quantidade_atual <= product.estoque_minimo;
            case "inactive":
              return !product.ativo;
            default:
              return true;
          }
        });
      }

      // Aplicar ordenação
      allProducts.sort((a, b) => {
        let aVal = a[sortBy as keyof Product];
        let bVal = b[sortBy as keyof Product];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      setProducts(allProducts);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false); // Marca que carregou pela primeira vez
    }
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, stableFilters, getProducts, getCategoriasPrincipais, getCategorias, getSubcategorias, toast, products.length]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, [getCategories]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []); // Remover dependência loadProducts do mount

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, stableFilters, loadProducts]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedProducts(selected ? products.map(p => p.id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      await Promise.all(
        selectedProducts.map(id => deleteProduct(id))
      );
      
      toast({
        title: "Produtos excluídos",
        description: `${selectedProducts.length} produto(s) excluído(s) com sucesso.`,
      });
      
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os produtos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleSendAlerts = () => {
    const alertProducts = products.filter(p => 
      p.quantidade_atual <= p.estoque_minimo
    );
    
    toast({
      title: "Alertas enviados",
      description: `Alertas enviados para ${alertProducts.length} produto(s) com estoque baixo.`,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedProducts([]);
    setHierarchicalFilters({});
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all" || selectedStatus !== "all" || Object.values(hierarchicalFilters).some(Boolean);
  
  const appliedFilters = {
    busca: searchTerm,
    categoria: selectedCategory !== "all" ? selectedCategory : null,
    status: selectedStatus !== "all" ? selectedStatus : null,
    ...hierarchicalFilters
  };
  
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setHierarchicalFilters({});
  };

  const handleStockMovement = async (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Produto não encontrado ou quantidade inválida.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Usar StockMovementService para registrar movimento completo
      const { stockMovementService } = await import('@/features/scanner/services/StockMovementService');
      
      let result;
      if (type === 'entrada') {
        result = await stockMovementService.processStockIn({
          produto_id: productId,
          tipo: 'entrada',
          quantidade: quantity,
          motivo: reason || 'Movimentação manual via estoque',
          observacoes: 'Movimentação feita pela página de estoque'
        });
      } else {
        result = await stockMovementService.processStockOut({
          produto_id: productId,
          tipo: 'saida',
          quantidade: quantity,
          motivo: reason || 'Movimentação manual via estoque',
          observacoes: 'Movimentação feita pela página de estoque'
        });
      }

      if (result.success) {
        toast({
          title: "Movimentação realizada",
          description: `${type === 'entrada' ? 'Entrada' : 'Saída'} de ${quantity} unidades realizada com sucesso.`,
        });
        loadProducts();
      } else {
        toast({
          title: "Erro na movimentação",
          description: result.error || "Não foi possível realizar a movimentação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro na movimentação:', error);
      toast({
        title: "Erro na movimentação",
        description: "Não foi possível realizar a movimentação de estoque.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso.",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    loadProducts();
    toast({
      title: "Produto atualizado",
      description: "Produto atualizado com sucesso!",
    });
  };

  const handleNewProduct = () => {
    setNewProductModalOpen(true);
  };
  const handleRefresh = () => loadProducts();
  const getStockStatus = (product: Product) => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "bg-red-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "bg-yellow-500",
        icon: AlertTriangle
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "bg-green-500",
        icon: Package
      };
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Memoizar dados derivados para melhor performance
  // Aplicar filtros hierárquicos e busca aos dados já filtrados pelos filtros inteligentes
  const finalFilteredProducts = useMemo(() => {
    let filtered = [...intelligentFilteredData];

    // Aplicar filtros hierárquicos
    if (hierarchicalFilters.categoriaPrincipal || hierarchicalFilters.categoria || hierarchicalFilters.subcategoria) {
      filtered = filtered.filter(product => {
        const categoriaCompleta = product.categoria || '';
        
        if (hierarchicalFilters.subcategoria) {
          const subcategoria = getSubcategorias(hierarchicalFilters.categoria || '').find(c => c.id === hierarchicalFilters.subcategoria);
          return categoriaCompleta.includes(subcategoria?.nome || '');
        }
        
        if (hierarchicalFilters.categoria) {
          const categoria = getCategorias(hierarchicalFilters.categoriaPrincipal || '').find(c => c.id === hierarchicalFilters.categoria);
          return categoriaCompleta.includes(categoria?.nome || '');
        }
        
        if (hierarchicalFilters.categoriaPrincipal) {
          const categoriaPrincipal = getCategoriasPrincipais().find(c => c.id === hierarchicalFilters.categoriaPrincipal);
          return categoriaCompleta.includes(categoriaPrincipal?.nome || '') || categoriaCompleta === categoriaPrincipal?.nome;
        }
        
        return true;
      });
    }

    // Aplicar busca por termo
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo_barras && product.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [intelligentFilteredData, hierarchicalFilters, searchTerm, getCategoriasPrincipais, getCategorias, getSubcategorias]);

  const paginatedProducts = useMemo(() => 
    finalFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [finalFilteredProducts, currentPage, itemsPerPage]
  );
  
  const totalPages = Math.ceil(finalFilteredProducts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header moderno com melhor espaçamento - oculto no mobile */}
      <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/3 via-primary/5 to-primary/3 border-b border-border/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
        <div className="relative container mx-auto px-6 py-12">
          {/* Header com melhor hierarquia visual */}
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Controle de Estoque
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Gerencie seus produtos e estoque com facilidade
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <EstoqueActions
                selectedProducts={selectedProducts}
                onDeleteSelected={handleDeleteSelected}
                onSendAlerts={handleSendAlerts}
                onRefresh={handleRefresh}
                onNewProduct={handleNewProduct}
                products={products}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com padding responsivo */}
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
        {/* Header mobile com título menor */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Controle de Estoque
              </h1>
            </div>
            <EstoqueActions
              selectedProducts={selectedProducts}
              onDeleteSelected={handleDeleteSelected}
              onSendAlerts={handleSendAlerts}
              onRefresh={handleRefresh}
              onNewProduct={handleNewProduct}
              products={products}
            />
          </div>
        </div>

        {/* Stats Cards - Com melhor responsividade */}
        {!loading && !initialLoading && (
          <div className="mb-8">
            <EstoqueStats products={finalFilteredProducts} />
          </div>
        )}

        {/* Layout principal com sidebar condicional */}
        <div className={cn(
          "grid gap-6 transition-all duration-300",
          sidebarCollapsed ? "grid-cols-1" : "lg:grid-cols-[280px_1fr]"
        )}>
          {/* Sidebar de categorias - escondida quando colapsada */}
          {!sidebarCollapsed && (
            <div className="space-y-6">
              <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" />
                    Filtros Avançados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Simplified filters placeholder */}
                  <div className="text-sm text-muted-foreground">
                    Filtros inteligentes disponíveis
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Boxes className="h-4 w-4" />
                    Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Simplified categories placeholder */}
                  <div className="text-sm text-muted-foreground">
                    Categorias disponíveis
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="space-y-6">
            {/* Filtros e busca */}
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                {/* Simplified filters */}
                <div className="text-sm text-muted-foreground">
                  Filtros de estoque
                </div>
              </CardContent>
            </Card>

            {/* Tabs para diferentes visualizações */}
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <Tabs defaultValue="grid" className="w-full">
                <div className="border-b border-border/30 px-6 pt-4">
                  <TabsList className="grid w-full max-w-sm grid-cols-2 bg-muted/30">
                    <TabsTrigger value="grid" className="data-[state=active]:bg-background">
                      Lista
                    </TabsTrigger>
                    <TabsTrigger value="table" className="data-[state=active]:bg-background">
                      Tabela
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="grid" className="p-6 mt-0">
                  {loading || initialLoading ? (
                    <EstoqueSkeleton />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Tabela de estoque será carregada aqui</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="table" className="p-6 mt-0">
                  {loading || initialLoading ? (
                    <EstoqueSkeleton />
                  ) : (
                    <div className="space-y-4">
                      <TableWrapper>
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Visualização em tabela</p>
                        </div>
                      </TableWrapper>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ProductModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSuccess={handleEditSuccess}
        product={editingProduct}
      />

      <ProductModal
        open={newProductModalOpen}
        onOpenChange={setNewProductModalOpen}
        onSuccess={() => {
          setNewProductModalOpen(false);
          loadProducts();
          toast({
            title: "Produto criado",
            description: "Produto criado com sucesso!",
          });
        }}
      />
    </div>
  );
};

export default ControleEstoquePage;
