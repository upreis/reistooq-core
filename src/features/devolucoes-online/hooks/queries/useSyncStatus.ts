/**
 * 📊 USE SYNC STATUS - FASE 4
 * Hook React Query para monitorar status de sincronização
 */

import { useQuery } from '@tanstack/react-query';
import { devolucaoService } from '../../services/DevolucaoService';

export const SYNC_STATUS_QUERY_KEY = 'devolucoes-sync-status';

export function useSyncStatus(
  integrationAccountId: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery({
    queryKey: [SYNC_STATUS_QUERY_KEY, integrationAccountId],
    queryFn: () => devolucaoService.getSyncStatus(integrationAccountId),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 5000, // Atualizar a cada 5s durante sync
    staleTime: 3000,
    gcTime: 60000,
  });
}

export function useSyncHistory(
  integrationAccountId: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: [SYNC_STATUS_QUERY_KEY, 'history', integrationAccountId, limit],
    queryFn: () => devolucaoService.getSyncHistory(integrationAccountId, limit),
    staleTime: 60000, // 1 minuto
    gcTime: 5 * 60 * 1000,
  });
}
