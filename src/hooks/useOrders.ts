import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { orderService, OrderListParams, Order, OrderStats } from '@/services/OrderService';
import { useDebounce } from '@/hooks/useDebounce';

interface UseOrdersReturn {
  // Data
  orders: Order[];
  stats: OrderStats;
  total: number;
  
  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => void;
  setSearch: (search: string) => void;
  setDateRange: (start: string, end: string) => void;
  setSituacoes: (situacoes: string[]) => void;
  setFonte: (fonte: 'interno' | 'mercadolivre' | 'shopee' | 'tiny') => void;
  setPagination: (offset: number) => void;
  
  // Current filters
  filters: OrderListParams;
}

function getLastSevenDays() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return { 
    from: sevenDaysAgo.toISOString().split('T')[0], 
    to: today.toISOString().split('T')[0] 
  };
}

export function useOrders(): UseOrdersReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL state as source of truth
  const search = searchParams.get('q') || '';
  const startDate = searchParams.get('from') || getLastSevenDays().from;
  const endDate = searchParams.get('to') || getLastSevenDays().to;
  const situacoes = searchParams.get('situacoes')?.split(',').filter(Boolean) || [];
  const fonte = (searchParams.get('fonte') as any) || 'interno';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);
  
  // Build filters object
  const filters = useMemo<OrderListParams>(() => ({
    search: debouncedSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    situacoes: situacoes.length > 0 ? situacoes : undefined,
    fonte,
    limit: 100,
    offset,
  }), [debouncedSearch, startDate, endDate, situacoes, fonte, offset]);
  
  // SWR for orders list with intelligent deduping
  const { data: ordersData, error: ordersError, isLoading, mutate: refreshOrders } = useSWR(
    ['orders', filters],
    ([, params]) => orderService.list(params),
    {
      dedupingInterval: 30000, // 30s deduping
      revalidateOnFocus: false,
      errorRetryCount: 2,
      keepPreviousData: true, // Better UX during filter changes
    }
  );
  
  // SWR for stats with longer cache
  const { data: stats, isLoading: isLoadingStats } = useSWR(
    'orderStats',
    () => orderService.getStats(),
    {
      dedupingInterval: 60000, // 1 min deduping for stats
      revalidateOnFocus: false,
      errorRetryCount: 1,
    }
  );
  
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
  
  // Action handlers
  const setSearch = useCallback((search: string) => {
    updateSearchParams({ q: search || null });
  }, [updateSearchParams]);
  
  const setDateRange = useCallback((start: string, end: string) => {
    updateSearchParams({ from: start, to: end });
  }, [updateSearchParams]);
  
  const setSituacoes = useCallback((situacoes: string[]) => {
    updateSearchParams({ situacoes: situacoes.length > 0 ? situacoes.join(',') : null });
  }, [updateSearchParams]);
  
  const setFonte = useCallback((fonte: 'interno' | 'mercadolivre' | 'shopee' | 'tiny') => {
    updateSearchParams({ fonte });
  }, [updateSearchParams]);
  
  const setPagination = useCallback((offset: number) => {
    updateSearchParams({ offset: offset > 0 ? offset.toString() : null });
  }, [updateSearchParams]);
  
  const refresh = useCallback(() => {
    refreshOrders();
  }, [refreshOrders]);
  
  return {
    // Data
    orders: ordersData?.data || [],
    stats: stats || { today: 0, pending: 0, completed: 0, cancelled: 0 },
    total: ordersData?.count || 0,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isError: !!ordersError,
    error: ordersError || null,
    
    // Actions
    refresh,
    setSearch,
    setDateRange,
    setSituacoes,
    setFonte,
    setPagination,
    
    // Current filters
    filters,
  };
}