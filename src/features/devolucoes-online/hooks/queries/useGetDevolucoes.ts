/**
 * 🔍 USE GET DEVOLUCOES - FASE 4
 * Hook React Query para buscar devoluções otimizadas
 */

import { useQuery } from '@tanstack/react-query';
import { devolucaoService, DevolucaoFilters, PaginationParams } from '../../services/DevolucaoService';

export const DEVOLUCOES_QUERY_KEY = 'devolucoes';

export function useGetDevolucoes(
  filters: DevolucaoFilters,
  pagination: PaginationParams = {},
  options: {
    includeStats?: boolean;
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery({
    queryKey: [DEVOLUCOES_QUERY_KEY, filters, pagination, options.includeStats],
    queryFn: () =>
      devolucaoService.getDevolucoes(filters, pagination, {
        includeStats: options.includeStats,
      }),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * 📄 Hook simplificado para paginação
 */
export function useDevolucoesPaginated(
  integrationAccountId: string,
  page: number = 1,
  limit: number = 50
) {
  return useGetDevolucoes(
    { integrationAccountId },
    { page, limit, sortBy: 'data_criacao_claim', sortOrder: 'desc' },
    { includeStats: true }
  );
}

/**
 * 📊 Hook para buscar apenas estatísticas
 */
export function useDevolucaoStats(integrationAccountId: string) {
  return useGetDevolucoes(
    { integrationAccountId },
    { limit: 1 },
    { includeStats: true }
  );
}
