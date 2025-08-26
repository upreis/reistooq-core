// Hook simplificado para histórico - sem complexidade desnecessária
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { HistoricoSimpleService, HistoricoItem, HistoricoFilters } from '../services/HistoricoSimpleService';

export function useHistoricoSimple() {
  const [filters, setFilters] = useState<HistoricoFilters>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  const queryClient = useQueryClient();

  // Query principal para dados
  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['historico-simple', filters, page, limit],
    queryFn: () => HistoricoSimpleService.getHistorico(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: ['historico-stats'],
    queryFn: () => HistoricoSimpleService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para adicionar item
  const addItemMutation = useMutation({
    mutationFn: (item: Partial<HistoricoItem>) => 
      HistoricoSimpleService.addHistoricoItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-simple'] });
      queryClient.invalidateQueries({ queryKey: ['historico-stats'] });
    },
  });

  // Handlers
  const updateFilters = useCallback((newFilters: Partial<HistoricoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset para primeira página
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  }, []);

  const changePageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const addItem = useCallback((item: Partial<HistoricoItem>) => {
    return addItemMutation.mutateAsync(item);
  }, [addItemMutation]);

  // Estados computados
  const data = response?.data || [];
  const total = response?.total || 0;
  const hasMore = response?.hasMore || false;
  const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return {
    // Dados
    data,
    total,
    hasMore,
    stats,
    
    // Estados
    filters,
    page,
    limit,
    isLoading,
    isFetching,
    error,
    hasFilters,
    
    // Ações
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    refetch,
    addItem,
    
    // Estados das mutations
    isAdding: addItemMutation.isPending,
    addError: addItemMutation.error,
  };
}