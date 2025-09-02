// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback } from "react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstoqueActions } from "@/components/estoque/EstoqueActions";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import { ProductModal } from "@/components/estoque/ProductModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Boxes } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { getProducts, getCategories, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadProducts();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      let allProducts = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 1000
      });

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
    }
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, getProducts, toast]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

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
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all" || selectedStatus !== "all";

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
    // Implementar modal de novo produto
    toast({
      title: "Novo produto",
      description: "Modal de criação de produto será implementado.",
    });
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

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando estoque...</p>
          </div>
        </div>
      </>
    );
  }

  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <EstoqueGuard>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Gestão de Estoque</span>
        </div>

        {/* Stats Cards */}
        <EstoqueStats products={products} />

        {/* Actions Bar */}
        <EstoqueActions
          onNewProduct={handleNewProduct}
          onDeleteSelected={handleDeleteSelected}
          onRefresh={handleRefresh}
          onSendAlerts={handleSendAlerts}
          selectedProducts={selectedProducts}
          products={products}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestão de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="estoque" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estoque" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Controle de Estoque
                  <span className="text-xs text-muted-foreground">
                    ({products.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="composicoes" className="flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  Composições
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="estoque" className="mt-6">
                <div className="flex gap-6">
                  {/* Sidebar */}
                  <div className="w-80 space-y-6">
                    {/* Filtro por Categoria */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Filtrar por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === "all" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Todas
                          </div>
                          <span className="text-xs">({products.length})</span>
                        </button>
                        {categories.map((category) => {
                          // Aplicar filtros de busca e status para contagem correta
                          let filteredProducts = products;
                          if (searchTerm) {
                            filteredProducts = filteredProducts.filter(p => 
                              p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.codigo_barras && p.codigo_barras.includes(searchTerm))
                            );
                          }
                          if (selectedStatus !== "all") {
                            filteredProducts = filteredProducts.filter(product => {
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
                          const categoryCount = filteredProducts.filter(p => p.categoria === category).length;
                          return (
                            <button
                              key={category}
                              onClick={() => setSelectedCategory(category)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                                selectedCategory === category 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {category}
                              </div>
                              <span className="text-xs">({categoryCount})</span>
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Ordenar por */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Ordenar por</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[
                          { value: "created_at", label: "Mais Recentes", order: 'desc' as const },
                          { value: "nome", label: "A-Z", order: 'asc' as const },
                          { value: "categoria", label: "Por Categoria", order: 'asc' as const },
                          { value: "quantidade_atual", label: "Por Estoque", order: 'desc' as const }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setSortOrder(option.order); }}
                            className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
                              sortBy === option.value 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                      </CardHeader>
                       <CardContent className="space-y-2">
                        {(() => {
                          // Aplicar filtros de busca e categoria para contagem correta
                          let baseProducts = products;
                          if (searchTerm) {
                            baseProducts = baseProducts.filter(p => 
                              p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.codigo_barras && p.codigo_barras.includes(searchTerm))
                            );
                          }
                          if (selectedCategory !== "all") {
                            baseProducts = baseProducts.filter(p => p.categoria === selectedCategory);
                          }

                          const statusOptions = [
                            { value: "all", label: "Todos", count: baseProducts.length },
                            { value: "active", label: "Em Estoque", count: baseProducts.filter(p => p.ativo && p.quantidade_atual > p.estoque_minimo).length },
                            { value: "low", label: "Estoque Baixo", count: baseProducts.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length },
                            { value: "out", label: "Sem Estoque", count: baseProducts.filter(p => p.quantidade_atual === 0).length },
                            { value: "high", label: "Estoque Alto", count: baseProducts.filter(p => p.quantidade_atual >= p.estoque_maximo).length }
                          ];

                          return (
                            <>
                              {statusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => setSelectedStatus(status.value)}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                                    selectedStatus === status.value 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                >
                                  <span>{status.label}</span>
                                  <span className="text-xs">({status.count})</span>
                                </button>
                              ))}

                              <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Total de produtos:</p>
                                <p className="text-2xl font-bold">{baseProducts.length}</p>
                                <p className="text-xs text-muted-foreground">
                                  {products.filter(p => !p.ativo).length} produtos inativos
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className="flex-1">
                    {/* Filtros no topo */}
                    <EstoqueFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      selectedStatus={selectedStatus}
                      onStatusChange={setSelectedStatus}
                      categories={categories}
                      onSearch={handleSearch}
                      onClearFilters={handleClearFilters}
                      hasActiveFilters={hasActiveFilters}
                    />

                    {/* Tabela */}
                    <div className="mt-6">
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
                    </div>

                    {/* Paginação */}
                    {products.length > itemsPerPage && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{" "}
                          {Math.min(currentPage * itemsPerPage, products.length)} de{" "}
                          {products.length} produtos
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="w-full sm:w-auto"
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-center">
                            Página {currentPage} de {Math.ceil(products.length / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(Math.ceil(products.length / itemsPerPage), currentPage + 1))}
                            disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                            className="w-full sm:w-auto"
                          >
                            Próximo
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="composicoes" className="mt-6">
                <ComposicoesEstoque />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal de Edição de Produto */}
        <ProductModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          product={editingProduct}
          onSuccess={handleEditSuccess}
        />
      </div>
    </EstoqueGuard>
  );
};

export default Estoque;