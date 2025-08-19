import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { orderService, OrderListParams } from '@/services/OrderService';
import { Order, OrderStats, OrderFilters } from '../../types/Orders.types';
import { PERFORMANCE_CONFIG } from '../../utils/OrdersConstants';

interface UseOrdersQueryOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
  refetchInterval?: number;
}

interface UseOrdersQueryReturn {
  // Data
  data: Order[];
  stats: OrderStats;
  total: number;
  
  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  
  // Error states
  isError: boolean;
  error: Error | null;
  
  // Actions
  refetch: () => void;
  invalidate: () => void;
}

interface UseOrdersInfiniteReturn {
  data: Order[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Hook for querying orders with pagination and caching
 */
export function useOrdersQuery(
  filters: OrderFilters,
  options: UseOrdersQueryOptions = {}
): UseOrdersQueryReturn {
  const queryClient = useQueryClient();
  
  // Optimize query key - stable reference for same filters
  const queryKey = useMemo(() => ['orders', filters], [filters]);
  
  // Orders query with optimized caching
  const {
    data: ordersData,
    isLoading,
    isFetching,
    isRefetching,
    isError,
    error,
    refetch: refetchOrders
  } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => orderService.list(params as OrderListParams),
    staleTime: PERFORMANCE_CONFIG.STALE_TIME,
    gcTime: PERFORMANCE_CONFIG.CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: options.refetchInterval,
    enabled: options.enabled !== false,
    placeholderData: options.keepPreviousData ? (prev) => prev : undefined,
    select: useCallback((data: any) => ({
      data: data?.data || [],
      count: data?.count || 0
    }), [])
  });
  
  // Stats query - longer cache time as stats change less frequently
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => orderService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: options.enabled !== false
  });
  
  // Combined refetch function
  const refetch = useCallback(() => {
    refetchOrders();
    refetchStats();
  }, [refetchOrders, refetchStats]);
  
  // Invalidate cache function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orderStats'] });
  }, [queryClient]);
  
  return {
    data: ordersData?.data || [],
    stats: stats || { today: 0, pending: 0, completed: 0, cancelled: 0 },
    total: ordersData?.count || 0,
    isLoading,
    isLoadingStats,
    isFetching,
    isRefetching,
    isError,
    error,
    refetch,
    invalidate
  };
}

/**
 * Hook for infinite scrolling orders
 */
export function useOrdersInfiniteQuery(
  filters: OrderFilters,
  options: UseOrdersQueryOptions = {}
): UseOrdersInfiniteReturn {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['ordersInfinite', filters],
    queryFn: ({ pageParam = 0, queryKey: [, baseFilters] }) =>
      orderService.list({
        ...(baseFilters as OrderFilters),
        offset: pageParam as number
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      const currentOffset = (allPages.length - 1) * (filters.limit || 50);
      const hasMore = lastPage.data?.length === (filters.limit || 50);
      return hasMore ? currentOffset + (filters.limit || 50) : undefined;
    },
    staleTime: PERFORMANCE_CONFIG.STALE_TIME,
    gcTime: PERFORMANCE_CONFIG.CACHE_TIME,
    refetchOnWindowFocus: false,
    enabled: options.enabled !== false,
    select: useCallback((data: any) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      flatData: data.pages.flatMap((page: any) => page.data || []),
      totalCount: data.pages[0]?.count || 0
    }), [])
  });
  
  return {
    data: data?.flatData || [],
    total: data?.totalCount || 0,
    isLoading,
    isFetching,
    isError,
    error,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch
  };
}

/**
 * Hook for single order query
 */
export function useOrderQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.details(orderId!),
    enabled: !!orderId,
    staleTime: PERFORMANCE_CONFIG.STALE_TIME,
    gcTime: PERFORMANCE_CONFIG.CACHE_TIME
  });
}

/**
 * Hook for prefetching orders
 */
export function useOrdersPrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchOrders = useCallback((filters: OrderFilters) => {
    queryClient.prefetchQuery({
      queryKey: ['orders', filters],
      queryFn: () => orderService.list({ ...filters, limit: filters.limit || 50, offset: filters.offset || 0 }),
      staleTime: PERFORMANCE_CONFIG.STALE_TIME
    });
  }, [queryClient]);
  
  const prefetchOrderDetails = useCallback((orderId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['order', orderId],
      queryFn: () => orderService.details(orderId),
      staleTime: PERFORMANCE_CONFIG.STALE_TIME
    });
  }, [queryClient]);
  
  return {
    prefetchOrders,
    prefetchOrderDetails
  };
}