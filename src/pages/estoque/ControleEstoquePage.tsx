// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstoqueActions } from "@/components/estoque/EstoqueActions";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueIntelligentFilters } from "@/components/estoque/EstoqueIntelligentFilters";
import { useEstoqueFilters } from "@/features/estoque/hooks/useEstoqueFilters";
import { ProductModal } from "@/components/estoque/ProductModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Filter } from "lucide-react";
import { EstoqueSkeleton } from "@/components/estoque/EstoqueSkeleton";
import { TableWrapper } from "@/components/ui/table-wrapper";

interface ControleEstoquePageProps {
  initialProducts?: Product[];
  initialLoading?: boolean;
}

export default function ControleEstoquePage({ initialProducts = [], initialLoading = true }: ControleEstoquePageProps = {}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialLoading);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { getProducts, getCategories, deleteProduct } = useProducts();
  const { toast } = useToast();

  // Hook para filtros inteligentes
  const { filters: intelligentFilters, setFilters: setIntelligentFilters, filteredData: intelligentFilteredData, stats: intelligentStats } = useEstoqueFilters(products);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 ControleEstoquePage: Carregando produtos (fallback)...', { hasInitialProducts: initialProducts.length > 0 });
      
      let allProducts = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 1000,
        ativo: selectedStatus === "inactive" ? false : (selectedStatus === "all" ? 'all' : true),
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

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, [getCategories]);

  // Sincronizar com produtos iniciais do componente pai
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [initialProducts]);

  useEffect(() => {
    // Só carrega produtos se não foram fornecidos produtos iniciais
    if (initialProducts.length === 0) {
      loadProducts();
      loadCategories();
    } else {
      loadCategories();
    }
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, loadProducts]);

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

  // Aplicar busca por termo aos dados já filtrados pelos filtros inteligentes
  const finalFilteredProducts = useMemo(() => {
    let filtered = [...intelligentFilteredData];

    // Aplicar busca por termo
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo_barras && product.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [intelligentFilteredData, searchTerm]);

  const paginatedProducts = useMemo(() => 
    finalFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [finalFilteredProducts, currentPage, itemsPerPage]
  );
  
  const totalPages = Math.ceil(finalFilteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Filtros básicos */}
      <EstoqueFilters
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        categories={categories}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
        onSearch={handleSearch}
        useHierarchicalCategories={false}
        hasActiveFilters={searchTerm !== "" || selectedCategory !== "all" || selectedStatus !== "all"}
      />

      {/* Tabela de produtos */}
      <TableWrapper>
        {loading ? (
          <EstoqueSkeleton />
        ) : (
          <EstoqueTable
            products={paginatedProducts}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            onStockMovement={handleStockMovement}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </TableWrapper>

      {/* Modal de produto */}
      <ProductModal
        open={editModalOpen || newProductModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalOpen(false);
            setNewProductModalOpen(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}