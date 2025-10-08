// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstoqueActions } from "@/components/estoque/EstoqueActions";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { HierarchicalEstoqueTable } from "@/components/estoque/HierarchicalEstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueIntelligentFilters } from "@/components/estoque/EstoqueIntelligentFilters";
import { useEstoqueFilters } from "@/features/estoque/hooks/useEstoqueFilters";
import { ProductModal } from "@/components/estoque/ProductModal";
import { ParentProductModal } from "@/components/estoque/ParentProductModal";
import { AddVariationsModal } from "@/components/estoque/AddVariationsModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Filter, Upload, Plus, Settings, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EstoqueSkeleton } from "@/components/estoque/EstoqueSkeleton";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { CategoryImportModal } from "@/components/estoque/CategoryImportModal";
import { ProductImportModal } from "@/components/estoque/ProductImportModal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ControleEstoquePage() {
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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [variationsModalOpen, setVariationsModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [parentProductForVariations, setParentProductForVariations] = useState<Product | null>(null);
  
  const { getProducts, getCategories, deleteProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  // Hook para filtros inteligentes
  const { filters: intelligentFilters, setFilters: setIntelligentFilters, filteredData: intelligentFilteredData, stats: intelligentStats } = useEstoqueFilters(products);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determinar filtro de ativo para busca no banco
      let ativoFilter: boolean | 'all' = 'all';
      if (selectedStatus === "active_only") {
        ativoFilter = true;
      } else if (selectedStatus === "inactive_only") {
        ativoFilter = false;
      } else if (["low", "out", "high", "critical"].includes(selectedStatus)) {
        ativoFilter = true; // Filtros de estoque só aplicam a produtos ativos
      }
      
      // Buscar produtos do banco com filtro de ativo aplicado
      let allProducts = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 10000, // Aumentar limite para garantir que busque todos
        ativo: ativoFilter,
      });

      // Aplicar filtros adicionais de estoque localmente
      if (selectedStatus !== "all" && selectedStatus !== "active_only" && selectedStatus !== "inactive_only") {
        allProducts = allProducts.filter(product => {
          switch (selectedStatus) {
            case "low":
              return product.quantidade_atual <= product.estoque_minimo && product.quantidade_atual > 0;
            case "out":
              return product.quantidade_atual === 0;
            case "high":
              return product.quantidade_atual >= product.estoque_maximo;
            case "critical":
              return product.quantidade_atual <= product.estoque_minimo;
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

  useEffect(() => {
    loadProducts();
    loadCategories();
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
    console.log('🔍 handleSelectProduct chamado com ID:', productId);
    console.log('📋 Estado atual de selectedProducts:', selectedProducts);
    
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      console.log('✅ Nova seleção:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    console.log('🔍 handleSelectAll chamado com:', selected);
    console.log('📋 Produtos paginados:', paginatedProducts.length);
    
    const newSelection = selected ? paginatedProducts.map(p => p.id) : [];
    console.log('✅ Selecionando:', newSelection);
    setSelectedProducts(newSelection);
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

  const handleBulkStatusChange = async (newStatus: boolean) => {
    if (selectedProducts.length === 0) return;
    
    try {
      await Promise.all(
        selectedProducts.map(id => updateProduct(id, { ativo: newStatus }))
      );
      
      toast({
        title: "Status atualizado",
        description: `${selectedProducts.length} produto(s) ${newStatus ? 'ativado(s)' : 'desativado(s)'} com sucesso.`,
      });
      
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Erro ao atualizar status em massa:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status dos produtos selecionados.",
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

  const handleDetailsSuccess = () => {
    setDetailsModalOpen(false);
    setEditingProduct(null);
    loadProducts();
    toast({
      title: "Produto atualizado",
      description: "Produto atualizado com sucesso!",
    });
  };

  const handleNewProduct = () => {
    setParentModalOpen(true);
  };

  const handleParentCreated = (product: Product) => {
    setParentProductForVariations(product);
    setVariationsModalOpen(true);
  };

  const handleEditVariation = (product: Product) => {
    setEditingProduct(product);
    setDetailsModalOpen(true);
  };

  const handleVariationsFinish = () => {
    setVariationsModalOpen(false);
    setParentProductForVariations(null);
    loadProducts();
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

  console.log('🔵 Renderizando ControleEstoquePage - Botões de ação');
  
  return (
    <div className="space-y-6">
      {/* Botões de ação */}
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex gap-2">
          {selectedProducts.length === 0 ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSelectAll(true)}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Package className="h-4 w-4 mr-2" />
              Selecionar Todos
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAll(false)}
                className="border-muted-foreground text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Seleção ({selectedProducts.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkStatusChange(true)}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Package className="h-4 w-4 mr-2" />
                Ativar ({selectedProducts.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkStatusChange(false)}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <X className="h-4 w-4 mr-2" />
                Desativar ({selectedProducts.length})
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir ({selectedProducts.length})
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              console.log('🔵 Botão Adicionar Produto clicado');
              handleNewProduct();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
          <ProductImportModal 
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar Produtos
              </Button>
            }
            onSuccess={() => {
              loadProducts();
              toast({
                title: "Produtos importados",
                description: "Os produtos foram importados com sucesso.",
              });
            }}
          />
          <Button variant="outline" size="sm" asChild>
            <Link to="/category-manager">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Categorias
            </Link>
          </Button>
        </div>
      </div>

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
          <HierarchicalEstoqueTable
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

      {/* Paginação */}
      {!loading && finalFilteredProducts.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, finalFilteredProducts.length)} de {finalFilteredProducts.length} produtos
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modal de edição de produto */}
      <ProductModal
        open={editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalOpen(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        onSuccess={handleEditSuccess}
      />
      
      {/* Modal de criação do produto pai */}
      <ParentProductModal
        open={parentModalOpen}
        onOpenChange={setParentModalOpen}
        onParentCreated={handleParentCreated}
      />

      {/* Modal de adição de variações */}
      <AddVariationsModal
        open={variationsModalOpen}
        onOpenChange={setVariationsModalOpen}
        parentProduct={parentProductForVariations}
        onFinish={handleVariationsFinish}
        onEditVariation={handleEditVariation}
      />

      {/* Modal completo de edição/detalhamento do produto */}
      <ProductModal
        open={detailsModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsModalOpen(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        onSuccess={handleDetailsSuccess}
      />
    </div>
  );
}