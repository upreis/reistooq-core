// Hook otimizado para paginação server-side do histórico
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHistoricoRealtime } from './useHistoricoRealtime';
import { HistoricoDataService } from '../services/HistoricoDataService';
import { 
  HistoricoFilters, 
  HistoricoResponse, 
  SortableFields 
} from '../types/historicoTypes';

export interface UseHistoricoServerPaginationOptions {
  initialFilters?: HistoricoFilters;
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: SortableFields;
  initialSortOrder?: 'asc' | 'desc';
  enableRealtime?: boolean;
}

export function useHistoricoServerPagination(options: UseHistoricoServerPaginationOptions = {}) {
  const {
    initialFilters = {},
    initialPage = 1,
    initialLimit = 50,
    initialSortBy = 'data_pedido',
    initialSortOrder = 'desc',
    enableRealtime = false
  } = options;

  // Estados
  const [filters, setFilters] = useState<HistoricoFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<SortableFields>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  const queryClient = useQueryClient();

  // Query principal
  const queryKey = ['historico-vendas', filters, page, limit, sortBy, sortOrder];
  
  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery<HistoricoResponse>({
    queryKey,
    queryFn: () => HistoricoDataService.getHistoricoVendas(
      filters, 
      page, 
      limit, 
      sortBy, 
      sortOrder
    ),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000, // 5min
  });

  const vendas = response?.data || [];
  const pagination = response?.pagination;
  const summary = response?.summary;

  // Handlers otimizados
  const updateFilters = useCallback((newFilters: Partial<HistoricoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const updateSort = useCallback((field: SortableFields, order?: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order || (sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  }, [sortBy, sortOrder]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.totalPages)) {
      setPage(newPage);
    }
  }, [pagination]);

  const nextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      goToPage(page + 1);
    }
  }, [pagination?.hasNextPage, page, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrevPage) {
      goToPage(page - 1);
    }
  }, [pagination?.hasPrevPage, page, goToPage]);

  const changePageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const invalidateCache = useCallback((pattern?: string) => {
    HistoricoDataService.invalidateCache(pattern);
    queryClient.invalidateQueries({
      queryKey: ['historico-vendas']
    });
  }, [queryClient]);

  // Estados computados
  const hasFilters = Object.keys(filters).some(key => 
    filters[key as keyof HistoricoFilters] !== undefined &&
    filters[key as keyof HistoricoFilters] !== '' &&
    (Array.isArray(filters[key as keyof HistoricoFilters]) ? 
      (filters[key as keyof HistoricoFilters] as any[]).length > 0 : true)
  );

  const isLoadingFirstPage = isLoading && page === 1;
  const isLoadingNextPage = isFetching && !isLoading;
  const canGoNext = pagination?.hasNextPage && !isFetching;
  const canGoPrev = pagination?.hasPrevPage && !isFetching;

  // Hook para realtime updates
  useHistoricoRealtime({ enabled: enableRealtime });

  return {
    // Dados
    vendas,
    pagination,
    summary,
    
    // Estados
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    
    // Loading/Error
    isLoading: isLoadingFirstPage,
    isFetching,
    isLoadingNextPage,
    isLoadingMore: isLoadingNextPage,
    error,
    
    // Computados
    hasFilters,
    canGoNext,
    canGoPrev,
    
    // Actions
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    invalidateCache,
    refetch
  };
}