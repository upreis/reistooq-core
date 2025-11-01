import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";
import { EstoqueFilters } from "@/components/estoque/EstoqueFilters";
import { HierarchicalEstoqueTable } from "@/components/estoque/HierarchicalEstoqueTable";
import { EstoqueNotifications } from "@/components/estoque/EstoqueNotifications";
import { EstoqueSkeleton } from "@/components/estoque/EstoqueSkeleton";
import { TableWrapper } from "@/components/ui/table-wrapper";

import { useEstoqueData } from "./hooks/useEstoqueData";
import { useEstoqueActions } from "./hooks/useEstoqueActions";
import { useEstoquePagination } from "./hooks/useEstoquePagination";
import { EstoqueHeader } from "./components/EstoqueHeader";
import { EstoqueActionButtons } from "./components/EstoqueActionButtons";
import { EstoquePagination } from "./components/EstoquePagination";
import { EstoqueModals } from "./components/EstoqueModals";

export default function ControleEstoquePage() {
  console.log('🔍 DEBUG: ControleEstoquePage renderizando');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [parentProductModalOpen, setParentProductModalOpen] = useState(false);
  const [childProductModalOpen, setChildProductModalOpen] = useState(false);
  const [linkChildModalOpen, setLinkChildModalOpen] = useState(false);
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingParentProduct, setEditingParentProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  
  // Custom hooks
  const {
    products,
    categories,
    loading,
    selectedCategory,
    selectedStatus: dataSelectedStatus,
    setSelectedCategory,
    setSelectedStatus: setDataSelectedStatus,
    loadProducts
  } = useEstoqueData();

  const {
    selectedProducts,
    setSelectedProducts,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteErrors,
    setDeleteErrors,
    handleSelectProduct,
    handleDeleteSelected,
    handleDeleteProduct,
    handleBulkStatusChange,
    handleStockMovement
  } = useEstoqueActions(products, loadProducts);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm,
    selectedProductType,
    setSelectedProductType,
    selectedStatus: paginationSelectedStatus,
    setSelectedStatus: setPaginationSelectedStatus,
    finalFilteredProducts,
    paginatedProducts,
    totalPages,
    handleSelectAll
  } = useEstoquePagination(products);

  console.log('🔍 DEBUG: Estados:', {
    parentProductModalOpen,
    childProductModalOpen,
    linkChildModalOpen,
    selectedProductsCount: selectedProducts.length
  });

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setDataSelectedStatus("all");
    setPaginationSelectedStatus("all");
    setSelectedProductType("all");
    setSelectedProducts([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleEditParentProduct = (product: Product) => {
    setEditingParentProduct(product);
    setParentProductModalOpen(true);
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

  return (
    <div className="space-y-6">
      <EstoqueHeader onLocalChange={loadProducts} />

      <EstoqueNotifications 
        products={products}
        onProductClick={handleNotificationProductClick}
        onFilterByStock={(type) => {
          if (type === 'out') {
            setPaginationSelectedStatus('out');
          } else if (type === 'low') {
            setPaginationSelectedStatus('low');
          }
          setTimeout(() => {
            const tableWrapper = document.querySelector('[class*="space-y-4"]');
            if (tableWrapper) {
              tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
        onOpenPriceModal={(productsWithoutPrice) => {
          setSelectedProducts(productsWithoutPrice.map(p => p.id));
          setBulkPriceModalOpen(true);
        }}
        onOpenOrphanModal={(orphanProducts) => {
          setSelectedProducts(orphanProducts.map(p => p.id));
          setLinkChildModalOpen(true);
        }}
        onOrphanProductClick={(product) => {
          setSelectedProducts([product.id]);
          setLinkChildModalOpen(true);
        }}
      />

      <EstoqueActionButtons
        selectedProducts={selectedProducts}
        products={products}
        finalFilteredProducts={finalFilteredProducts}
        onCreateParent={() => setParentProductModalOpen(true)}
        onCreateChild={() => setChildProductModalOpen(true)}
        onLinkChild={() => setLinkChildModalOpen(true)}
        onDelete={handleDeleteSelected}
        onImportSuccess={loadProducts}
      />

      <EstoqueFilters
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedStatus={paginationSelectedStatus}
        selectedProductType={selectedProductType}
        categories={categories}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onStatusChange={setPaginationSelectedStatus}
        onProductTypeChange={setSelectedProductType}
        onClearFilters={handleClearFilters}
        onSearch={handleSearch}
        useHierarchicalCategories={false}
        hasActiveFilters={searchTerm !== "" || selectedCategory !== "all" || paginationSelectedStatus !== "all" || selectedProductType !== "all"}
      />

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
            onSelectAll={(selected) => handleSelectAll(selected, paginatedProducts, setSelectedProducts)}
            onStockMovement={handleStockMovement}
            onEditProduct={handleEditProduct}
            onEditParentProduct={handleEditParentProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </TableWrapper>

      {!loading && finalFilteredProducts.length > 0 && (
        <EstoquePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={finalFilteredProducts.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      <EstoqueModals
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        onEditSuccess={handleEditSuccess}
        parentProductModalOpen={parentProductModalOpen}
        setParentProductModalOpen={setParentProductModalOpen}
        editingParentProduct={editingParentProduct}
        setEditingParentProduct={setEditingParentProduct}
        onParentProductSuccess={handleParentProductSuccess}
        childProductModalOpen={childProductModalOpen}
        setChildProductModalOpen={setChildProductModalOpen}
        onChildProductSuccess={handleChildProductSuccess}
        linkChildModalOpen={linkChildModalOpen}
        setLinkChildModalOpen={setLinkChildModalOpen}
        selectedProducts={selectedProducts}
        allProducts={products}
        onLinkSuccess={handleRefresh}
        bulkPriceModalOpen={bulkPriceModalOpen}
        setBulkPriceModalOpen={setBulkPriceModalOpen}
        onBulkPriceSuccess={() => {
          setBulkPriceModalOpen(false);
          setSelectedProducts([]);
          loadProducts();
        }}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        deleteErrors={deleteErrors}
        setDeleteErrors={setDeleteErrors}
      />
    </div>
  );
}
