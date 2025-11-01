import { useState, useMemo } from 'react';
import { Product } from '@/hooks/useProducts';
import { useEstoqueFilters } from '@/features/estoque/hooks/useEstoqueFilters';

export function useEstoquePagination(products: Product[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { filters: intelligentFilters, setFilters: setIntelligentFilters, filteredData: intelligentFilteredData, stats: intelligentStats } = useEstoqueFilters(products);

  const finalFilteredProducts = useMemo(() => {
    let filtered = [...intelligentFilteredData];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.nome.toLowerCase().includes(searchLower) ||
        product.sku_interno.toLowerCase().includes(searchLower) ||
        (product.codigo_barras && product.codigo_barras.toLowerCase().includes(searchLower))
      );
    }

    if (selectedProductType !== "all") {
      filtered = filtered.filter(product => {
        switch (selectedProductType) {
          case "parent":
            return product.eh_produto_pai === true;
          case "child":
            return product.sku_pai != null && product.sku_pai !== "";
          case "standalone":
            return !product.eh_produto_pai && (!product.sku_pai || product.sku_pai === "");
          default:
            return true;
        }
      });
    }

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
  }, [intelligentFilteredData, searchTerm, selectedStatus, selectedProductType]);

  const paginatedProducts = useMemo(() => 
    finalFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [finalFilteredProducts, currentPage, itemsPerPage]
  );
  
  const totalPages = Math.ceil(finalFilteredProducts.length / itemsPerPage);

  const handleSelectAll = (selected: boolean, paginatedProducts: Product[], setSelectedProducts: (fn: (prev: string[]) => string[]) => void) => {
    if (selected) {
      const currentPageIds = paginatedProducts.map(p => p.id);
      setSelectedProducts(prev => {
        const uniqueIds = new Set([...prev, ...currentPageIds]);
        return Array.from(uniqueIds);
      });
    } else {
      const currentPageIds = new Set(paginatedProducts.map(p => p.id));
      setSelectedProducts(prev => prev.filter(id => !currentPageIds.has(id)));
    }
  };

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm,
    selectedProductType,
    setSelectedProductType,
    selectedStatus: selectedStatus,
    setSelectedStatus,
    finalFilteredProducts,
    paginatedProducts,
    totalPages,
    handleSelectAll
  };
}
