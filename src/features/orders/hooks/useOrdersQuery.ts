import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { OrderAdvanced, OrderFiltersState, OrderPaginationState, OrderSortState } from '../types/orders-advanced.types';
import { OrdersQueryService } from '../services/OrdersQueryService';
import { useDebounce } from '@/hooks/useDebounce';

interface UseOrdersQueryOptions {
  initialPageSize?: number;
  enableRealtime?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

interface UseOrdersQueryReturn {
  // Data
  orders: OrderAdvanced[];
  total: number;
  
  // Loading states
  isLoading: boolean;
  isValidating: boolean;
  isError: boolean;
  error: Error | null;
  
  // Pagination
  pagination: OrderPaginationState;
  setPagination: (pagination: Partial<OrderPaginationState>) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  
  // Sorting
  sorting: OrderSortState;
  setSorting: (sorting: OrderSortState) => void;
  
  // Filters
  filters: OrderFiltersState;
  setFilters: (filters: Partial<OrderFiltersState>) => void;
  clearFilters: () => void;
  
  // Actions
  refresh: () => void;
  mutate: (data?: any) => Promise<any>;
}

const DEFAULT_FILTERS: OrderFiltersState = {
  search: '',
  date_range: { start: null, end: null, preset: 'this_week' },
  status: [],
  source: [],
  priority: [],
  value_range: { min: null, max: null },
  location: { cities: [], states: [] },
  tags: [],
  custom_fields: {},
};

const DEFAULT_PAGINATION: OrderPaginationState = {
  page: 1,
  page_size: 25,
  total_items: 0,
  total_pages: 0,
};

const DEFAULT_SORTING: OrderSortState = {
  field: 'data_pedido',
  direction: 'desc',
};

export function useOrdersQuery(options: UseOrdersQueryOptions = {}): UseOrdersQueryReturn {
  const {
    initialPageSize = 25,
    enableRealtime = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL
  const [filters, setFiltersState] = useState<OrderFiltersState>(() => {
    const urlFilters = { ...DEFAULT_FILTERS };
    
    // Parse URL parameters
    const search = searchParams.get('search');
    if (search) urlFilters.search = search;
    
    const status = searchParams.get('status');
    if (status) urlFilters.status = status.split(',') as any[];
    
    const source = searchParams.get('source');
    if (source) urlFilters.source = source.split(',') as any[];
    
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');
    if (dateStart || dateEnd) {
      urlFilters.date_range = {
        start: dateStart,
        end: dateEnd,
        preset: null,
      };
    }
    
    return urlFilters;
  });

  const [pagination, setPaginationState] = useState<OrderPaginationState>(() => ({
    ...DEFAULT_PAGINATION,
    page: parseInt(searchParams.get('page') || '1', 10),
    page_size: parseInt(searchParams.get('page_size') || initialPageSize.toString(), 10),
  }));

  const [sorting, setSortingState] = useState<OrderSortState>(() => ({
    field: (searchParams.get('sort_field') as keyof OrderAdvanced) || 'data_pedido',
    direction: (searchParams.get('sort_dir') as 'asc' | 'desc') || 'desc',
  }));

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  // Build query key for SWR
  const queryKey = useMemo(() => [
    'orders',
    {
      ...filters,
      search: debouncedSearch,
    },
    pagination,
    sorting,
  ], [filters, debouncedSearch, pagination, sorting]);

  // SWR query with optimizations
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    queryKey,
    ([, filters, pagination, sorting]) => 
      OrdersQueryService.getInstance().getOrdersPaginated(filters as OrderFiltersState, pagination, sorting),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds
      focusThrottleInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      keepPreviousData: true,
      onSuccess: (data) => {
        // Update pagination with server response
        setPaginationState(prev => ({
          ...prev,
          total_items: data.total,
          total_pages: Math.ceil(data.total / prev.page_size),
        }));
      },
    }
  );

  // Update URL when state changes
  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (filters.search) newParams.set('search', filters.search);
    if (filters.status.length > 0) newParams.set('status', filters.status.join(','));
    if (filters.source.length > 0) newParams.set('source', filters.source.join(','));
    if (filters.date_range.start) newParams.set('date_start', filters.date_range.start);
    if (filters.date_range.end) newParams.set('date_end', filters.date_range.end);
    
    if (pagination.page > 1) newParams.set('page', pagination.page.toString());
    if (pagination.page_size !== initialPageSize) newParams.set('page_size', pagination.page_size.toString());
    
    if (sorting.field !== 'data_pedido') newParams.set('sort_field', sorting.field);
    if (sorting.direction !== 'desc') newParams.set('sort_dir', sorting.direction);
    
    setSearchParams(newParams);
  }, [filters, pagination, sorting, initialPageSize, setSearchParams]);

  // Action handlers
  const setFilters = useCallback((newFilters: Partial<OrderFiltersState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPaginationState(prev => ({ ...prev, page: 1 }));
    updateURL();
  }, [updateURL]);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPaginationState(prev => ({ ...prev, page: 1 }));
    updateURL();
  }, [updateURL]);

  const setPagination = useCallback((newPagination: Partial<OrderPaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }));
    updateURL();
  }, [updateURL]);

  const setSorting = useCallback((newSorting: OrderSortState) => {
    setSortingState(newSorting);
    setPaginationState(prev => ({ ...prev, page: 1 }));
    updateURL();
  }, [updateURL]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.total_pages) {
      setPagination({ page: pagination.page + 1 });
    }
  }, [pagination.page, pagination.total_pages, setPagination]);

  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination({ page: pagination.page - 1 });
    }
  }, [pagination.page, setPagination]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      setPagination({ page });
    }
  }, [pagination.total_pages, setPagination]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    // Data
    orders: data?.orders || [],
    total: data?.total || 0,
    
    // Loading states
    isLoading,
    isValidating,
    isError: !!error,
    error: error || null,
    
    // Pagination
    pagination,
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    
    // Sorting
    sorting,
    setSorting,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
    
    // Actions
    refresh,
    mutate,
  };
}