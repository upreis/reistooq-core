import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PedidosRepository } from '../services/PedidosRepository';
import { PedidosFilters, Pedido } from '../types/pedidos.types';
import { usePedidosStore } from '../stores/usePedidosStore';

const QUERY_KEYS = {
  pedidos: (accountId: string, filters: PedidosFilters) => 
    ['pedidos', accountId, filters],
  analytics: (accountId: string, filters: PedidosFilters) => 
    ['pedidos-analytics', accountId, filters],
  mapeamentos: (skus: string[]) => 
    ['mapeamentos', skus],
} as const;

interface UsePedidosQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

export function usePedidosQuery(
  accountId: string,
  filters: PedidosFilters = {},
  options: UsePedidosQueryOptions = {}
) {
  const { setLoading, setError, setPedidos } = usePedidosStore();

  return useQuery({
    queryKey: QUERY_KEYS.pedidos(accountId, filters),
    queryFn: async () => {
      setLoading(true);
      try {
        const result = await PedidosRepository.findWithFilters(accountId, filters, 1, 25);
        setPedidos(result.data, result.total, result.has_next_page);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar pedidos');
        throw error;
      }
    },
    enabled: !!accountId && (options.enabled ?? true),
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function usePedidosInfiniteQuery(
  accountId: string,
  filters: PedidosFilters = {},
  options: UsePedidosQueryOptions = {}
) {
  const { setLoading, setError, setPedidos, appendPedidos } = usePedidosStore();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.pedidos(accountId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      setLoading(true);
      try {
        const result = await PedidosRepository.findWithFilters(accountId, filters, pageParam, 25);
        
        if (pageParam === 1) {
          setPedidos(result.data, result.total, result.has_next_page);
        } else {
          appendPedidos(result.data, result.has_next_page);
        }
        
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar pedidos');
        throw error;
      }
    },
    enabled: !!accountId && (options.enabled ?? true),
    getNextPageParam: (lastPage, pages) => 
      lastPage.has_next_page ? pages.length + 1 : undefined,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 2,
  });
}

export function usePedidosAnalytics(
  accountId: string,
  filters: PedidosFilters = {},
  options: UsePedidosQueryOptions = {}
) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(accountId, filters),
    queryFn: () => PedidosRepository.getAnalytics(accountId, filters),
    enabled: !!accountId && (options.enabled ?? true),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useMapeamentosVerification(skus: string[]) {
  return useQuery({
    queryKey: QUERY_KEYS.mapeamentos(skus),
    queryFn: () => PedidosRepository.verifyMapeamentos(skus),
    enabled: skus.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000,
  });
}

export function usePedidosMutations() {
  const queryClient = useQueryClient();
  const { updatePedido } = usePedidosStore();

  const updatePedidoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pedido> }) =>
      PedidosRepository.updatePedido(id, updates),
    onSuccess: (updatedPedido) => {
      updatePedido(updatedPedido.id, updatedPedido);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-analytics'] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Pedido> }) =>
      PedidosRepository.bulkUpdate(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-analytics'] });
    },
  });

  const baixaEstoqueMutation = useMutation({
    mutationFn: (pedidoIds: string[]) =>
      PedidosRepository.processarBaixaEstoque(pedidoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mapeamentos'] });
    },
  });

  return {
    updatePedido: updatePedidoMutation,
    bulkUpdate: bulkUpdateMutation,
    baixaEstoque: baixaEstoqueMutation,
  };
}

// Utility hooks
export function useInvalidatePedidos() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['mapeamentos'] });
    },
    invalidatePedidos: (accountId?: string, filters?: PedidosFilters) => {
      if (accountId && filters) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.pedidos(accountId, filters) 
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      }
    },
    invalidateAnalytics: (accountId?: string, filters?: PedidosFilters) => {
      if (accountId && filters) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.analytics(accountId, filters) 
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pedidos-analytics'] });
      }
    },
  };
}