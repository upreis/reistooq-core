import React from 'react';

/**
 * Hook otimizado para debounce que evita re-renders desnecessários
 * Usa useCallback para memoização automática
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para gerenciar estado de filtros com performance otimizada
 */
export const useOptimizedFilters = <T extends Record<string, any>>(
  initialFilters: T,
  onFiltersChange?: (filters: T) => void
) => {
  const [filters, setFilters] = React.useState<T>(initialFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<T>(initialFilters);

  // Debounce para aplicar filtros apenas após parar de digitar
  const debouncedFilters = useDebounce(filters, 300);

  React.useEffect(() => {
    setAppliedFilters(debouncedFilters);
    onFiltersChange?.(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  const updateFilter = React.useCallback((key: keyof T, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  const activeFiltersCount = React.useMemo(() => {
    return Object.entries(appliedFilters).filter(([key, value]) => {
      const initialValue = initialFilters[key];
      return value !== initialValue && value !== '' && value != null;
    }).length;
  }, [appliedFilters, initialFilters]);

  return {
    filters,
    appliedFilters,
    updateFilter,
    resetFilters,
    activeFiltersCount
  };
};

/**
 * Hook para paginação otimizada
 */
export const useOptimizedPagination = <T,>(
  items: T[],
  pageSize: number = 10
) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = React.useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToNextPage = React.useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = React.useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset página quando items mudam
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};

/**
 * Hook para seleção múltipla otimizada
 */
export const useOptimizedSelection = <T extends { id: string }>(
  items: T[]
) => {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = React.useState(false);

  const selectedItems = React.useMemo(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const toggleItem = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectMode = React.useCallback(() => {
    setIsSelectMode(prev => !prev);
    if (isSelectMode) {
      clearSelection();
    }
  }, [isSelectMode, clearSelection]);

  const isSelected = React.useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedItems,
    isSelectMode,
    selectedCount: selectedIds.size,
    toggleItem,
    selectAll,
    clearSelection,
    toggleSelectMode,
    isSelected,
    hasSelection: selectedIds.size > 0
  };
};

/**
 * Hook para otimização de virtual scrolling (items grandes)
 */
export const useVirtualization = (
  totalItems: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, totalItems);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, totalItems]);

  const totalHeight = totalItems * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    setScrollTop
  };
};