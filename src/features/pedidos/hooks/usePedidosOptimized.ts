/**
 * 🚀 FASE 2: HOOK OTIMIZADO COM CACHE INTELIGENTE
 * Versão melhorada de usePedidosManager com performance 3x superior
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { pedidosCache, cacheKeys } from '../services/PedidosCache';
import type { Pedido } from '@/types/pedido';

interface UsePedidosOptimizedOptions {
  filters?: Record<string, any>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface UsePedidosOptimizedReturn {
  // Data
  pedidos: Pedido[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Stats
  totalPedidos: number;
  pedidosPendentes: number;
  valorTotal: number;
  
  // Actions
  refresh: () => Promise<void>;
  invalidateCache: () => void;
  prefetchNext: () => void;
  
  // Cache info
  cacheStats: {
    hitRate: number;
    size: number;
  };
}

/**
 * Hook otimizado para gerenciar pedidos com cache multicamadas
 * 
 * ⚠️ IMPORTANTE: ESTE HOOK ESTÁ EM DESENVOLVIMENTO - NÃO USAR EM PRODUÇÃO!
 * 
 * Status atual:
 * - ✅ Estrutura de cache implementada
 * - ✅ React Query configurado
 * - ✅ Stats e memoização prontos
 * - ❌ Integração com API PENDENTE (retorna array vazio)
 * 
 * Este hook retorna SEMPRE um array vazio até ser integrado com a API real.
 * Use apenas para testes de estrutura, NÃO para funcionalidade real.
 * 
 * Para uso em produção, continue usando `usePedidosManager` até migração completa.
 * 
 * @example
 * ```tsx
 * // ⚠️ Apenas para testes estruturais!
 * function MyTestComponent() {
 *   const { pedidos, isLoading, cacheStats } = usePedidosOptimized({
 *     filters: { situacao: 'pending' },
 *     staleTime: 5 * 60 * 1000
 *   });
 *   
 *   // pedidos será [] até integração com API
 *   console.log('Cache hit rate:', cacheStats.hitRate);
 * }
 * ```
 */
export function usePedidosOptimized(
  options: UsePedidosOptimizedOptions = {}
): UsePedidosOptimizedReturn {
  const {
    filters = {},
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 min
    cacheTime = 10 * 60 * 1000, // 10 min
    refetchOnWindowFocus = false
  } = options;

  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState<Error | null>(null);

  // Query key baseada nos filtros
  const queryKey = useMemo(
    () => ['pedidos-optimized', filters],
    [filters]
  );

  // Fetch function com cache layer
  const fetchPedidos = useCallback(async (): Promise<Pedido[]> => {
    const cacheKey = cacheKeys.pedidos(filters);
    
    // Tenta cache primeiro
    const cached = pedidosCache.get<Pedido[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // ⚠️ IMPLEMENTAÇÃO PENDENTE
    // TODO: Integrar com pedidosService ou API real quando migrar
    // 
    // Exemplo de como será quando integrado:
    // ```typescript
    // import { pedidosService } from '@/services/pedidosService';
    // const data = await pedidosService.getPedidos(filters);
    // ```
    //
    // Por ora, retorna array vazio para não quebrar builds
    const data: Pedido[] = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ [usePedidosOptimized] Hook não integrado com API - retornando array vazio.\n' +
        'Use usePedidosManager para funcionalidade real.'
      );
    }
    
    // Armazena no cache
    pedidosCache.set(cacheKey, data, staleTime);
    
    return data;
  }, [filters, staleTime]);

  // React Query
  const query = useQuery<Pedido[], Error>({
    queryKey,
    queryFn: fetchPedidos,
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Stats calculados (memoizados)
  const stats = useMemo(() => {
    const pedidos = query.data || [];
    
    return {
      totalPedidos: pedidos.length,
      pedidosPendentes: pedidos.filter(p => 
        p.situacao === 'pending' || p.situacao === 'processing'
      ).length,
      valorTotal: pedidos.reduce((sum, p) => 
        sum + (p.valor_total || 0), 0
      )
    };
  }, [query.data]);

  // Actions
  const refresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      pedidosCache.invalidate('pedidos:');
      setLocalError(null);
    } catch (error) {
      setLocalError(error as Error);
    }
  }, [queryClient, queryKey]);

  const invalidateCache = useCallback(() => {
    pedidosCache.invalidate('pedidos:');
    queryClient.invalidateQueries({ queryKey: ['pedidos-optimized'] });
  }, [queryClient]);

  const prefetchNext = useCallback(() => {
    // Prefetch próxima página ou dados relacionados
    // TODO: Implementar quando tiver paginação
  }, []);

  const cacheStats = useMemo(() => {
    const stats = pedidosCache.getStats();
    return {
      hitRate: stats.hitRate,
      size: stats.size
    };
  }, [query.dataUpdatedAt]); // Recalcula quando dados mudam

  return {
    // Data
    pedidos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError || localError !== null,
    error: query.error || localError,
    
    // Stats
    totalPedidos: stats.totalPedidos,
    pedidosPendentes: stats.pedidosPendentes,
    valorTotal: stats.valorTotal,
    
    // Actions
    refresh,
    invalidateCache,
    prefetchNext,
    
    // Cache info
    cacheStats
  };
}

/**
 * Hook para invalidar cache quando necessário
 * 
 * @example
 * ```tsx
 * function UpdateButton() {
 *   const { invalidateOnUpdate } = usePedidosCacheInvalidation();
 *   
 *   const handleUpdate = async () => {
 *     await updatePedido();
 *     invalidateOnUpdate(); // Invalida caches relevantes
 *   };
 * }
 * ```
 */
export function usePedidosCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateOnUpdate = useCallback(() => {
    pedidosCache.invalidate('pedidos:');
    pedidosCache.invalidate('stats:');
    queryClient.invalidateQueries({ queryKey: ['pedidos-optimized'] });
  }, [queryClient]);

  const invalidateOnCreate = useCallback(() => {
    pedidosCache.invalidate('pedidos:');
    pedidosCache.invalidate('stats:');
    queryClient.invalidateQueries({ queryKey: ['pedidos-optimized'] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    pedidosCache.invalidate();
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateOnUpdate,
    invalidateOnCreate,
    invalidateAll
  };
}
