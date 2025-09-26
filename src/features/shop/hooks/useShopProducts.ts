import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useDebounce } from '@/hooks/useDebounce';
import { ShopProduct, ShopFilters, ShopStats } from '../types/shop.types';
import { ShopService } from '../services/ShopService';

const DEFAULT_FILTERS: ShopFilters = {
  search: '',
  priceRange: {},
  sortBy: 'newest',
  page: 1,
  limit: 12,
};

export function useShopProducts() {
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const queryKey = useMemo(() => [
    'shop-products-frontend',
    { ...filters, search: debouncedSearch, _context: 'shop' }
  ], [filters, debouncedSearch]);

  const {
    data: productsData,
    error: productsError,
    isLoading: productsLoading,
    mutate: refreshProducts
  } = useSWR(
    queryKey,
    () => ShopService.getProducts({ ...filters, search: debouncedSearch }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading
  } = useSWR(
    'shop-stats',
    ShopService.getStats,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesLoading
  } = useSWR(
    'shop-categories',
    ShopService.getCategories,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 min
    }
  );

  // Actions
  const updateFilters = useCallback((newFilters: Partial<ShopFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset page when other filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSelectedProducts([]);
  }, []);

  const selectProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const selectAllProducts = useCallback((select: boolean) => {
    if (select && productsData?.products) {
      setSelectedProducts(productsData.products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [productsData?.products]);

  const isAllSelected = useMemo(() => {
    if (!productsData?.products || productsData.products.length === 0) return false;
    return productsData.products.every(p => selectedProducts.includes(p.id));
  }, [productsData?.products, selectedProducts]);

  const isIndeterminate = useMemo(() => {
    if (!productsData?.products || selectedProducts.length === 0) return false;
    return selectedProducts.length > 0 && selectedProducts.length < productsData.products.length;
  }, [productsData?.products, selectedProducts]);

  // Computed values
  const filteredProducts = useMemo(() => {
    return productsData?.products || [];
  }, [productsData?.products]);

  const totalPages = useMemo(() => {
    if (!productsData?.total || filters.limit <= 0) return 1;
    return Math.ceil(productsData.total / filters.limit);
  }, [productsData?.total, filters.limit]);

  const hasNextPage = useMemo(() => {
    return filters.page < totalPages;
  }, [filters.page, totalPages]);

  const hasPrevPage = useMemo(() => {
    return filters.page > 1;
  }, [filters.page]);

  return {
    // Data
    products: filteredProducts,
    stats,
    categories,
    
    // Loading states
    isLoading: productsLoading || statsLoading || categoriesLoading,
    productsLoading,
    statsLoading,
    categoriesLoading,
    
    // Error states
    error: productsError || statsError || categoriesError,
    productsError,
    statsError,
    categoriesError,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Selection
    selectedProducts,
    selectProduct,
    selectAllProducts,
    isAllSelected,
    isIndeterminate,
    
    // Pagination
    totalPages,
    hasNextPage,
    hasPrevPage,
    total: productsData?.total || 0,
    
    // Actions
    refresh: refreshProducts,
  };
}