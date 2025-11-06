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

  // 🎯 CRITICAL FIX: Paginar mantendo hierarquia (pais e filhos juntos)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Pegar a "fatia" inicial da paginação
    const pageSlice = finalFilteredProducts.slice(startIndex, endIndex);
    
    // Criar Set com IDs e SKUs dos produtos na página
    const productIds = new Set(pageSlice.map(p => p.id));
    const productSkus = new Set(pageSlice.map(p => p.sku_interno));
    const parentSkus = new Set(pageSlice.map(p => p.sku_pai).filter(Boolean));
    
    // Adicionar produtos relacionados que não estão na página
    const relatedProducts: Product[] = [];
    
    finalFilteredProducts.forEach(product => {
      // Já está na página
      if (productIds.has(product.id)) return;
      
      // É filho de um produto pai que está na página
      if (product.sku_pai && productSkus.has(product.sku_pai)) {
        relatedProducts.push(product);
        return;
      }
      
      // É pai de um produto filho que está na página
      if (product.eh_produto_pai && parentSkus.has(product.sku_interno)) {
        relatedProducts.push(product);
        return;
      }
    });
    
    // Combinar produtos da página + relacionados e ordenar
    const allProducts = [...pageSlice, ...relatedProducts];
    
    // Ordenar: pais primeiro, depois seus filhos
    return allProducts.sort((a, b) => {
      // Se A é pai de B, A vem primeiro
      if (a.eh_produto_pai && b.sku_pai === a.sku_interno) return -1;
      if (b.eh_produto_pai && a.sku_pai === b.sku_interno) return 1;
      
      // Se têm o mesmo pai, manter ordem original
      if (a.sku_pai && b.sku_pai && a.sku_pai === b.sku_pai) {
        return a.sku_interno.localeCompare(b.sku_interno);
      }
      
      // Manter ordem da fatia original
      const indexA = pageSlice.findIndex(p => p.id === a.id);
      const indexB = pageSlice.findIndex(p => p.id === b.id);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return 0;
    });
  }, [finalFilteredProducts, currentPage, itemsPerPage]);
  
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
