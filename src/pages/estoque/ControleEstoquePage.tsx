// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { useState, useEffect, useCallback, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstoqueTable } from "@/components/estoque/EstoqueTable";
import { HierarchicalEstoqueTable } from "@/components/estoque/HierarchicalEstoqueTable";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { EstoqueIntelligentFilters } from "@/components/estoque/EstoqueIntelligentFilters";
import { useEstoqueFilters } from "@/features/estoque/hooks/useEstoqueFilters";
import { ProductModal } from "@/components/estoque/ProductModal";
import { CreateParentProductModal } from "@/components/estoque/CreateParentProductModal";
import { CreateChildProductModal } from "@/components/estoque/CreateChildProductModal";
import { LinkChildToParentModal } from "@/components/estoque/LinkChildToParentModal";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Filter, Upload, Plus, Settings, X, Trash2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { EstoqueSkeleton } from "@/components/estoque/EstoqueSkeleton";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { CategoryImportModal } from "@/components/estoque/CategoryImportModal";
import { ProductImportModal } from "@/components/estoque/ProductImportModal";
import { EstoqueNotifications } from "@/components/estoque/EstoqueNotifications";
import { EstoqueExport } from "@/components/estoque/EstoqueExport";
import { EstoqueImport } from "@/components/estoque/EstoqueImport";
import { EstoqueSettings } from "@/components/estoque/EstoqueSettings";
import { EstoqueReports } from "@/components/estoque/EstoqueReports";
import { BulkPriceUpdateModal } from "@/components/estoque/BulkPriceUpdateModal";
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
  console.log('🔍 DEBUG: ControleEstoquePage renderizando');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [parentProductModalOpen, setParentProductModalOpen] = useState(false);
  const [childProductModalOpen, setChildProductModalOpen] = useState(false);
  const [linkChildModalOpen, setLinkChildModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingParentProduct, setEditingParentProduct] = useState<Product | null>(null);
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  
  console.log('🔍 DEBUG: Estados:', {
    parentProductModalOpen,
    childProductModalOpen,
    linkChildModalOpen,
    selectedProductsCount: selectedProducts.length
  });
  
  const { getProducts, getCategories, deleteProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  // Hook para filtros inteligentes
  const { filters: intelligentFilters, setFilters: setIntelligentFilters, filteredData: intelligentFilteredData, stats: intelligentStats } = useEstoqueFilters(products);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determinar o filtro de ativo/inativo baseado no selectedStatus
      let ativoFilter: boolean | undefined;
      
      if (selectedStatus === "active_only") {
        ativoFilter = true;
      } else if (selectedStatus === "inactive_only") {
        ativoFilter = false;
      }
      // Se for "all" ou outros status, não filtra por ativo (undefined)
      
      // Buscar produtos do banco
      const allProducts = await getProducts({
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        ativo: ativoFilter,
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
  }, [selectedCategory, selectedStatus, getProducts, toast]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      // Erro ao carregar categorias - silencioso
    }
  }, [getCategories]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione ao menos um produto para excluir.",
        variant: "destructive",
      });
      return;
    }

    // FILTRAR apenas produtos que existem no estado atual
    const validProductIds = selectedProducts.filter(id => 
      products.some(p => p.id === id)
    );

    if (validProductIds.length === 0) {
      toast({
        title: "Produtos não encontrados",
        description: "Os produtos selecionados não foram encontrados.",
        variant: "destructive",
      });
      setSelectedProducts([]);
      return;
    }

    console.log('🗑️ Excluindo produtos:', validProductIds);
    
    try {
      // Tentar excluir cada produto válido
      const results = await Promise.allSettled(
        validProductIds.map(id => deleteProduct(id))
      );
      
      // Contar sucessos e falhas
      const sucessos = results.filter(r => r.status === 'fulfilled').length;
      const falhas = results.filter(r => r.status === 'rejected').length;
      
      // Coletar mensagens de erro
      const erros = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Erro desconhecido');
      
      if (falhas > 0) {
        toast({
          title: "Exclusão parcial",
          description: `${sucessos} produto(s) excluído(s). ${falhas} falhou(aram): ${erros[0]}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Produtos excluídos",
          description: `${sucessos} produto(s) excluído(s) com sucesso.`,
        });
      }
      
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('❌ Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir os produtos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (productIds: string[], newStatus: boolean) => {
    if (productIds.length === 0) return;
    
    try {
      await Promise.all(
        productIds.map(id => updateProduct(id, { ativo: newStatus }))
      );
      
      toast({
        title: "Status atualizado",
        description: `${productIds.length} produto(s) ${newStatus ? 'ativado(s)' : 'desativado(s)'} com sucesso.`,
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

  const handleEditParentProduct = (product: Product) => {
    setEditingParentProduct(product);
    setParentProductModalOpen(true);
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
    setCurrentPage(1);
    setTimeout(() => {
      loadProducts();
    }, 100);
    toast({
      title: "Produto atualizado",
      description: "Produto atualizado com sucesso!",
    });
  };

  const handleParentProductSuccess = () => {
    setCurrentPage(1);
    setTimeout(() => {
      loadProducts();
    }, 100);
  };

  const handleChildProductSuccess = () => {
    setCurrentPage(1);
    setTimeout(() => {
      loadProducts();
    }, 100);
  };
  
  const handleRefresh = () => loadProducts();

  const handleNotificationProductClick = (product: Product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleBulkPriceUpdate = (productIds: string[]) => {
    setBulkPriceModalOpen(true);
  };

  const handleBulkCategoryUpdate = (productIds: string[]) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Atualização de categorias em massa será implementada em breve.",
    });
  };

  // Aplicar filtros de status de estoque e busca aos dados já filtrados pelos filtros inteligentes
  const finalFilteredProducts = useMemo(() => {
    let filtered = [...intelligentFilteredData];

    // Aplicar busca por termo (SKU, Nome, Código de Barras)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.nome.toLowerCase().includes(searchLower) ||
        product.sku_interno.toLowerCase().includes(searchLower) ||
        (product.codigo_barras && product.codigo_barras.toLowerCase().includes(searchLower))
      );
    }

    // Aplicar filtros de status de estoque
    if (selectedStatus && selectedStatus !== "all" && selectedStatus !== "active_only" && selectedStatus !== "inactive_only") {
      filtered = filtered.filter(product => {
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

    return filtered;
  }, [intelligentFilteredData, searchTerm, selectedStatus]);

  const paginatedProducts = useMemo(() => 
    finalFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [finalFilteredProducts, currentPage, itemsPerPage]
  );
  
  const totalPages = Math.ceil(finalFilteredProducts.length / itemsPerPage);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      // Adicionar produtos da página atual à seleção existente
      const currentPageIds = paginatedProducts.map(p => p.id);
      setSelectedProducts(prev => {
        const uniqueIds = new Set([...prev, ...currentPageIds]);
        return Array.from(uniqueIds);
      });
    } else {
      // Remover apenas produtos da página atual
      const currentPageIds = new Set(paginatedProducts.map(p => p.id));
      setSelectedProducts(prev => prev.filter(id => !currentPageIds.has(id)));
    }
  };

  
  
  return (
    <div className="space-y-6">
      {/* Notificações do Estoque */}
      <EstoqueNotifications 
        products={products}
        onProductClick={handleNotificationProductClick}
        onFilterByStock={(type) => {
          if (type === 'out') {
            setSelectedStatus('out');
          } else if (type === 'low') {
            setSelectedStatus('low');
          }
          // Scroll para a tabela
          setTimeout(() => {
            const tableWrapper = document.querySelector('[class*="space-y-4"]');
            if (tableWrapper) {
              tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
        onOpenPriceModal={(productsWithoutPrice) => {
          // Selecionar os produtos sem preço
          setSelectedProducts(productsWithoutPrice.map(p => p.id));
          // Abrir modal de atualização de preços em massa
          setBulkPriceModalOpen(true);
        }}
        onOpenOrphanModal={(orphanProducts) => {
          // Selecionar os produtos órfãos
          setSelectedProducts(orphanProducts.map(p => p.id));
          // Abrir modal de vincular filhos
          setLinkChildModalOpen(true);
        }}
        onOrphanProductClick={(product) => {
          // Ao clicar em um produto órfão específico, abrir modal de vinculação com ele selecionado
          setSelectedProducts([product.id]);
          setLinkChildModalOpen(true);
        }}
      />

      {/* Botões de ação principais */}
      <div className="flex flex-wrap gap-2 p-4 bg-card/50 border border-border rounded-lg shadow-sm">
        <Button 
          variant="default" 
          size="sm"
          onClick={() => setParentProductModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Produto Pai
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setChildProductModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Produto Filho
        </Button>

        {selectedProducts.length > 0 && (() => {
          console.log('🔍 DEBUG: Renderizando botões condicionais - produtos selecionados:', selectedProducts.length);
          return (
            <>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setLinkChildModalOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Gerenciar Vinculação
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </>
          );
        })()}
        
        <EstoqueImport onSuccess={loadProducts} />
        
        <EstoqueExport 
          products={products}
          filteredProducts={finalFilteredProducts}
        />
        
        <EstoqueReports products={products} />
        
        <EstoqueSettings />
        
        <Button variant="outline" size="sm" asChild>
          <Link to="/category-manager">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Categorias
          </Link>
        </Button>
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
      <div className="bg-black p-4 rounded-lg">
        <TableWrapper>
          {loading ? (
            <EstoqueSkeleton />
          ) : (
            <HierarchicalEstoqueTable
              products={paginatedProducts}
              onSort={() => {}}
              sortBy=""
              sortOrder="desc"
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onSelectAll={handleSelectAll}
              onStockMovement={handleStockMovement}
              onEditProduct={handleEditProduct}
              onEditParentProduct={handleEditParentProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
        </TableWrapper>
      </div>

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
      
      {/* Modal de criação/edição de produto pai */}
      <CreateParentProductModal
        open={parentProductModalOpen}
        onOpenChange={(open) => {
          setParentProductModalOpen(open);
          if (!open) {
            setEditingParentProduct(null);
          }
        }}
        editProduct={editingParentProduct}
        onSuccess={handleParentProductSuccess}
      />

      {/* Modal de criação de produto filho (variação) */}
      <CreateChildProductModal
        open={childProductModalOpen}
        onOpenChange={setChildProductModalOpen}
        onSuccess={handleChildProductSuccess}
      />

      {/* Modal de vinculação de filho a pai */}
      <LinkChildToParentModal
        open={linkChildModalOpen}
        onOpenChange={setLinkChildModalOpen}
        selectedProducts={selectedProducts}
        allProducts={products}
        onSuccess={handleRefresh}
      />

      {/* Modal de atualização de preços em massa */}
      <BulkPriceUpdateModal
        open={bulkPriceModalOpen}
        onOpenChange={setBulkPriceModalOpen}
        selectedProductIds={selectedProducts}
        products={products}
        onSuccess={() => {
          setBulkPriceModalOpen(false);
          setSelectedProducts([]);
          loadProducts();
        }}
      />
    </div>
  );
}