import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OrderFilters, OrderSortOption, OrderViewMode, OrderStatus, OrderSource } from '../../types/Orders.types';
import { SavedFilter, OrdersUIState, OrdersUIActions } from '../../types/OrdersUI.types';
import { DEFAULT_FILTERS, SORT_OPTIONS, FILTER_PRESETS } from '../../utils/OrdersConstants';
import { useDebounce } from '@/hooks/useDebounce';

interface UseOrdersUIOptions {
  initialViewMode?: OrderViewMode;
  initialFilters?: Partial<OrderFilters>;
  autoSave?: boolean;
}

export function useOrdersUI(options: UseOrdersUIOptions = {}) {
  const { initialViewMode = { type: 'table' }, initialFilters = {}, autoSave = true } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // UI State
  const [viewMode, setViewModeState] = useState<OrderViewMode>(initialViewMode);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('orders-saved-filters');
      return saved ? JSON.parse(saved) : FILTER_PRESETS;
    } catch {
      return FILTER_PRESETS;
    }
  });
  
  // Get filters from URL with defaults
  const filters = useMemo<OrderFilters>(() => {
    const urlFilters: OrderFilters = {
      search: searchParams.get('q') || undefined,
      startDate: searchParams.get('from') || DEFAULT_FILTERS.startDate,
      endDate: searchParams.get('to') || DEFAULT_FILTERS.endDate,
      situacoes: searchParams.get('situacoes')?.split(',').filter(Boolean) as OrderStatus[] || [],
      fonte: (searchParams.get('fonte') as OrderSource) || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10)
    };
    
    return { ...DEFAULT_FILTERS, ...initialFilters, ...urlFilters };
  }, [searchParams, initialFilters]);
  
  // Debounced search
  const debouncedSearch = useDebounce(filters.search || '', 300);
  
  // Get sort from URL
  const sortBy = useMemo<OrderSortOption>(() => {
    const sortField = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDir') as 'asc' | 'desc';
    
    if (sortField && sortDirection) {
      return SORT_OPTIONS.find(option => 
        option.field === sortField && option.direction === sortDirection
      ) || SORT_OPTIONS[0];
    }
    
    return SORT_OPTIONS[0];
  }, [searchParams]);
  
  // Update URL params helper
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      
      // Reset offset when filters change (except when explicitly setting offset)
      if (!updates.offset && Object.keys(updates).some(key => key !== 'offset')) {
        newParams.delete('offset');
      }
      
      return newParams;
    });
  }, [setSearchParams]);
  
  // UI Actions
  const actions: OrdersUIActions = {
    // View actions
    setViewMode: useCallback((mode: OrderViewMode) => {
      setViewModeState(mode);
      if (autoSave) {
        localStorage.setItem('orders-view-mode', JSON.stringify(mode));
      }
    }, [autoSave]),
    
    toggleCompactMode: useCallback(() => {
      setIsCompactMode(prev => {
        const newValue = !prev;
        if (autoSave) {
          localStorage.setItem('orders-compact-mode', String(newValue));
        }
        return newValue;
      });
    }, [autoSave]),
    
    setExpandedOrder: useCallback((orderId: string | null) => {
      setExpandedOrderId(orderId);
    }, []),
    
    // Filter actions
    setFilters: useCallback((newFilters: Partial<OrderFilters>) => {
      const updates: Record<string, string | null> = {};
      
      if (newFilters.search !== undefined) {
        updates.q = newFilters.search || null;
      }
      if (newFilters.startDate !== undefined) {
        updates.from = newFilters.startDate || null;
      }
      if (newFilters.endDate !== undefined) {
        updates.to = newFilters.endDate || null;
      }
      if (newFilters.situacoes !== undefined) {
        updates.situacoes = newFilters.situacoes.length > 0 
          ? newFilters.situacoes.join(',') 
          : null;
      }
      if (newFilters.fonte !== undefined) {
        updates.fonte = newFilters.fonte || null;
      }
      if (newFilters.limit !== undefined) {
        updates.limit = newFilters.limit.toString();
      }
      if (newFilters.offset !== undefined) {
        updates.offset = newFilters.offset > 0 ? newFilters.offset.toString() : null;
      }
      
      updateSearchParams(updates);
    }, [updateSearchParams]),
    
    clearFilters: useCallback(() => {
      updateSearchParams({
        q: null,
        from: null,
        to: null,
        situacoes: null,
        fonte: null,
        offset: null
      });
    }, [updateSearchParams]),
    
    saveFilter: useCallback((name: string, filterData: OrderFilters) => {
      const newFilter: SavedFilter = {
        id: `custom-${Date.now()}`,
        name,
        filters: filterData,
        isDefault: false,
        color: '#3b82f6',
        icon: '🔍',
        createdAt: new Date().toISOString()
      };
      
      const updatedFilters = [...savedFilters, newFilter];
      setSavedFilters(updatedFilters);
      
      if (autoSave) {
        localStorage.setItem('orders-saved-filters', JSON.stringify(updatedFilters));
      }
    }, [savedFilters, autoSave]),
    
    loadFilterPreset: useCallback((presetId: string) => {
      const preset = savedFilters.find(f => f.id === presetId);
      if (preset) {
        actions.setFilters(preset.filters);
      }
    }, [savedFilters]),
    
    // Sort actions
    setSortBy: useCallback((sort: OrderSortOption) => {
      updateSearchParams({
        sortBy: sort.field,
        sortDir: sort.direction
      });
    }, [updateSearchParams]),
    
    // Selection actions
    toggleSelectMode: useCallback(() => {
      setIsSelectMode(prev => !prev);
      if (isSelectMode) {
        setSelectedOrderIds([]);
      }
    }, [isSelectMode]),
    
    selectOrder: useCallback((orderId: string) => {
      setSelectedOrderIds(prev => 
        prev.includes(orderId) ? prev : [...prev, orderId]
      );
    }, []),
    
    unselectOrder: useCallback((orderId: string) => {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }, []),
    
    selectAll: useCallback(() => {
      // This would be called with all order IDs from the parent component
    }, []),
    
    clearSelection: useCallback(() => {
      setSelectedOrderIds([]);
      setIsSelectMode(false);
    }, []),
    
    // Loading actions
    setLoading: useCallback(() => {
      // Handled by query hooks
    }, []),
    
    setError: useCallback((error: string | null) => {
      setError(error);
    }, []),
    
    // Pagination actions
    loadMore: useCallback(() => {
      const currentOffset = filters.offset || 0;
      const limit = filters.limit || 50;
      actions.setFilters({ offset: currentOffset + limit });
    }, [filters.offset, filters.limit]),
    
    refresh: useCallback(() => {
      // This would trigger query refetch from parent
    }, [])
  };
  
  // Computed state
  const state: OrdersUIState = {
    viewMode,
    isCompactMode,
    selectedOrderIds,
    expandedOrderId,
    filters: { ...filters, search: debouncedSearch },
    savedFilters,
    activeFilterPreset: null, // Would be computed based on current filters
    sortBy,
    isSelectMode,
    selectAll: false, // Would be computed based on selection
    isLoading: false, // Handled by query hooks
    isLoadingMore: false, // Handled by query hooks
    isRefreshing: false, // Handled by query hooks
    error,
    currentPage: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
    hasNextPage: false, // Would be set by query hooks
    totalCount: 0 // Would be set by query hooks
  };
  
  return {
    state,
    actions,
    debouncedSearch
  };
}