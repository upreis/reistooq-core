// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback, useMemo } from "react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstoqueActions } from "@/components/estoque/EstoqueActions";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
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
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { cn } from "@/lib/utils";
import { TableWrapper } from "@/components/ui/table-wrapper";

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

const Estoque = () => {
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
  const { isCollapsed: sidebarCollapsed, toggleCollapse: toggleSidebar } = useSidebarCollapse();

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
        limit: 1000
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
    <EstoqueGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Header moderno com melhor espaçamento - oculto no mobile */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/3 via-primary/5 to-primary/3 border-b border-border/30">
          <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
          <div className="relative container mx-auto px-6 py-12">
            {/* Breadcrumb melhorado */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
              <Package className="h-4 w-4" />
              <span>/</span>
              <span className="text-foreground font-medium">Gestão de Estoque</span>
            </nav>

            {/* Header com melhor hierarquia visual */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
              <div className="space-y-3 flex-1 min-w-[300px]">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Gestão de Estoque
                </h1>
              </div>
            </div>

            {/* Stats Cards */}
            <div>
              <EstoqueStats products={products} />
            </div>
          </div>
        </div>

        {/* Conteúdo principal - ajustado para mobile */}
        <div className="container mx-auto px-3 md:px-6 py-2 md:py-8 max-w-none">
          <Tabs defaultValue="estoque" className="w-full">
            {/* Container das tabs com botão no mobile */}
            <div className="flex items-center gap-2 mb-4 md:mb-8">
              {/* Tabs ocupando 80% no mobile */}
              <div className="flex-1 md:w-auto">
                <TabsList className="grid w-full md:w-auto grid-cols-2 h-10 md:h-12 bg-muted/30 backdrop-blur-sm border border-border/50">
                  <TabsTrigger 
                    value="estoque" 
                    className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                  >
                    <Package className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Controle de</span> Estoque
                    <Badge variant="secondary" className="ml-1 md:ml-2 text-xs px-1.5 md:px-2 py-0.5">
                      {finalFilteredProducts.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="composicoes" 
                    className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                  >
                    <Boxes className="h-3 w-3 md:h-4 md:w-4" />
                    Composições
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Botão Novo Produto ocupando 20% no mobile */}
              <div className="w-1/5 md:hidden">
                <Button
                  onClick={handleNewProduct}
                  className="w-full h-10 text-xs px-2 bg-primary hover:bg-primary/90"
                >
                  + Novo
                </Button>
              </div>
            </div>
            <TabsContent value="estoque" className="space-y-2 md:space-y-8">
              {/* Actions - já otimizadas para mobile */}
              <EstoqueActions
                onNewProduct={handleNewProduct}
                onDeleteSelected={handleDeleteSelected}
                onRefresh={handleRefresh}
                onSendAlerts={handleSendAlerts}
                selectedProducts={selectedProducts}
                products={products}
              />

              {/* Busca e Filtros - layout mobile otimizado */}
              <div className="space-y-3 md:space-y-0 md:flex md:gap-4 md:items-start">
                {/* Container flex para busca e filtros no mobile */}
                <div className="flex gap-2 md:flex-1">
                  {/* Busca - mais compacta no mobile */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10 bg-background/60 border-border/60 h-9 md:h-10 text-sm"
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Filtros - padrão simples igual à aba Composições */}
                  <div className="w-auto md:w-auto">
                    <Button
                      variant="outline" 
                      className="bg-background/60 border-border/60 flex-shrink-0 h-9 md:h-10 text-sm px-3 gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden md:inline">Filtros</span>
                    </Button>
                  </div>

                  {/* Botão de categorias no mobile */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden bg-background/60 border-border/60 flex-shrink-0 h-9"
                    onClick={toggleSidebar}
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Layout principal - mobile primeiro, desktop com sidebar */}
              <div className="flex flex-col md:flex-row gap-1 md:gap-6 relative">
                {/* Sidebar de categorias - oculta no mobile por padrão */}
                <div className={cn(
                  "transition-all duration-300 flex-shrink-0 hidden md:block",
                  sidebarCollapsed ? "w-12" : "w-64"
                )}>
                  <div className="sticky top-6">
                    <OptimizedCategorySidebar
                      products={products}
                      hierarchicalFilters={hierarchicalFilters}
                      onHierarchicalFiltersChange={setHierarchicalFilters}
                      isCollapsed={sidebarCollapsed}
                      onToggleCollapse={toggleSidebar}
                    />
                  </div>
                </div>

                {/* Sidebar mobile overlay */}
                {!sidebarCollapsed && (
                  <div className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
                    <div className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border shadow-xl">
                      <div className="p-6">
                        <OptimizedCategorySidebar
                          products={products}
                          hierarchicalFilters={hierarchicalFilters}
                          onHierarchicalFiltersChange={setHierarchicalFilters}
                          isCollapsed={false}
                          onToggleCollapse={toggleSidebar}
                        />
                      </div>
                    </div>
                    {/* Área para fechar clicando fora */}
                    <div 
                      className="absolute inset-0" 
                      onClick={toggleSidebar}
                    />
                  </div>
                )}

                {/* Área principal da tabela com melhor espaçamento */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* Indicadores de filtros ativos redesenhados */}
                  {hasActiveFilters && (
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Filter className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Filtros ativos</span>
                          <div className="flex gap-2">
                            {hasActiveFilters && Object.entries(appliedFilters)
                              .filter(([_, value]) => value)
                              .map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                  {key}: {String(value)}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Limpar todos
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Tabela principal */}
                  <Card>
                    {initialLoading ? (
                      <div className="p-6">
                        <EstoqueSkeleton />
                      </div>
                    ) : (
                      <TableWrapper>
                        <EstoqueTable
                          products={paginatedProducts}
                          selectedProducts={selectedProducts}
                          onSelectProduct={handleSelectProduct}
                          onSelectAll={handleSelectAll}
                          onEditProduct={handleEditProduct}
                          onDeleteProduct={handleDeleteProduct}
                          onStockMovement={handleStockMovement}
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                          onSort={handleSort}
                        />
                      </TableWrapper>
                    )}
                  </Card>

                  {/* Paginação melhorada */}
                  {finalFilteredProducts.length > itemsPerPage && (
                    <Card className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <p className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, finalFilteredProducts.length)} de {finalFilteredProducts.length} produtos
                          </p>
                          
                          <div className="flex items-center gap-4">
                            {/* Seletor de itens por página */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Itens por página:</span>
                              <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                  setItemsPerPage(Number(e.target.value));
                                  setCurrentPage(1);
                                }}
                                className="border border-input bg-background px-2 py-1 rounded text-sm"
                              >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                              </select>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                Anterior
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                Próxima
                              </Button>
                            </div>
                          </div>
                        </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="composicoes" className="space-y-2 md:space-y-8">
              <ComposicoesEstoque />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de Edição de Produto */}
        <ProductModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          product={editingProduct}
          onSuccess={handleEditSuccess}
        />

        {/* Modal de Novo Produto */}
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
    </EstoqueGuard>
  );
};

export default Estoque;