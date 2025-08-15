import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HistoricoQueryService } from '../services/historicoQueryService';
import { 
  HistoricoVenda, 
  HistoricoFilters, 
  HistoricoResponse,
  SortableFields 
} from '../types/historicoTypes';

interface UseHistoricoServerPaginationOptions {
  initialFilters?: HistoricoFilters;
  initialPage?: number;
  initialLimit?: number;
  initialSort?: {
    field: SortableFields;
    order: 'asc' | 'desc';
  };
  enableRealtime?: boolean;
}

export const useHistoricoServerPagination = (
  options: UseHistoricoServerPaginationOptions = {}
) => {
  const {
    initialFilters = {},
    initialPage = 1,
    initialLimit = 20,
    initialSort = { field: 'data_pedido', order: 'desc' },
    enableRealtime = false
  } = options;

  const queryClient = useQueryClient();

  // Estados de paginação e filtros
  const [filters, setFilters] = useState<HistoricoFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<SortableFields>(initialSort.field);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort.order);

  // Chave da query para cache inteligente
  const queryKey = useMemo(() => [
    'historico-vendas',
    filters,
    page,
    limit,
    sortBy,
    sortOrder
  ], [filters, page, limit, sortBy, sortOrder]);

  // Query principal
  const {
    data: response,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useQuery<HistoricoResponse>({
    queryKey,
    queryFn: () => HistoricoQueryService.getHistoricoVendas(
      filters,
      page,
      limit,
      sortBy,
      sortOrder
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000,   // 30 minutos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Prefetch da próxima página
  useEffect(() => {
    if (response?.pagination.hasNextPage) {
      const nextPageKey = [
        'historico-vendas',
        filters,
        page + 1,
        limit,
        sortBy,
        sortOrder
      ];

      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => HistoricoQueryService.getHistoricoVendas(
          filters,
          page + 1,
          limit,
          sortBy,
          sortOrder
        ),
        staleTime: 5 * 60 * 1000
      });
    }
  }, [response, filters, page, limit, sortBy, sortOrder, queryClient]);

  // Handlers com debounce automático
  const updateFilters = useCallback((newFilters: Partial<HistoricoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset para primeira página ao filtrar
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  const updateSort = useCallback((field: SortableFields, order?: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order || (sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'));
    setPage(1); // Reset para primeira página ao ordenar
  }, [sortBy, sortOrder]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && (!response || newPage <= response.pagination.totalPages)) {
      setPage(newPage);
    }
  }, [response]);

  const changePageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset para primeira página ao mudar tamanho
  }, []);

  // Invalidar cache quando necessário
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['historico-vendas']
    });
  }, [queryClient]);

  // Estados computados
  const hasFilters = useMemo(() => {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const isLoadingFirstPage = isLoading && page === 1;
  const isLoadingNextPage = isFetching && !isLoading;

  // Utilitários de navegação
  const canGoNext = response?.pagination.hasNextPage ?? false;
  const canGoPrev = response?.pagination.hasPrevPage ?? false;

  const nextPage = useCallback(() => {
    if (canGoNext) goToPage(page + 1);
  }, [canGoNext, goToPage, page]);

  const prevPage = useCallback(() => {
    if (canGoPrev) goToPage(page - 1);
  }, [canGoPrev, goToPage, page]);

  return {
    // Dados
    vendas: response?.data ?? [],
    pagination: response?.pagination,
    summary: response?.summary,

    // Estados de loading
    isLoading: isLoadingFirstPage,
    isLoadingMore: isLoadingNextPage,
    isError,
    error,

    // Filtros e ordenação
    filters,
    sortBy,
    sortOrder,
    hasFilters,

    // Ações
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    refetch,
    invalidateCache,

    // Estados de navegação
    canGoNext,
    canGoPrev,
    currentPage: page,
    pageSize: limit
  };
};