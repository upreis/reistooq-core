/**
 * 🪝 HOOK - GET DEVOLUÇÕES (FASE 3)
 * Hook otimizado para consultar devoluções usando a Edge Function get-devolucoes
 * 
 * Performance esperada: <500ms vs 3min+ da abordagem anterior
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DevolucaoFilters {
  search?: string;
  status?: string[];
  status_devolucao?: string[];
  dateFrom?: string;
  dateTo?: string;
  integrationAccountId: string;
  claimId?: string;
  orderId?: string;
  buyerId?: number;
  itemId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DevolucaoResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats?: {
    total: number;
    por_status: Record<string, number>;
    por_status_devolucao: Record<string, number>;
    valor_total: number;
  };
  performance: {
    queryTimeMs: number;
    cached: boolean;
  };
}

export function useGetDevolucoes(
  filters: DevolucaoFilters,
  pagination: PaginationParams = {},
  options: {
    includeStats?: boolean;
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const {
    includeStats = false,
    enabled = true,
    refetchInterval
  } = options;

  return useQuery<DevolucaoResponse, Error>({
    queryKey: ['get-devolucoes', filters, pagination, includeStats],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-devolucoes', {
        body: {
          filters,
          pagination,
          includeStats
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar devoluções');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao buscar devoluções');
      }

      return data;
    },
    enabled: enabled && !!filters.integrationAccountId,
    staleTime: 30000, // 30 segundos
    refetchInterval,
    retry: 2,
  });
}

/**
 * 🔄 Hook simplificado para buscar devoluções com paginação automática
 */
export function useDevolucoesPaginated(
  integrationAccountId: string,
  page: number = 1,
  limit: number = 50
) {
  return useGetDevolucoes(
    { integrationAccountId },
    { page, limit, sortBy: 'date_created', sortOrder: 'desc' },
    { includeStats: true }
  );
}

/**
 * 📊 Hook para buscar estatísticas de devoluções
 */
export function useDevolucaoStats(integrationAccountId: string) {
  return useGetDevolucoes(
    { integrationAccountId },
    { page: 1, limit: 1 }, // Apenas estatísticas, não precisamos dos dados
    { includeStats: true }
  );
}
