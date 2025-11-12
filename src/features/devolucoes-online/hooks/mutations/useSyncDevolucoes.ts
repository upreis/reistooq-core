/**
 * 🔄 USE SYNC DEVOLUCOES - FASE 4
 * Hook React Query mutation para sincronizar devoluções
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { devolucaoService } from '../../services/DevolucaoService';
import { DEVOLUCOES_QUERY_KEY } from '../queries/useGetDevolucoes';
import { SYNC_STATUS_QUERY_KEY } from '../queries/useSyncStatus';

export function useSyncDevolucoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      integrationAccountId,
      batchSize = 100,
      incremental = false, // ✅ NOVO: sincronização incremental
    }: {
      integrationAccountId: string;
      batchSize?: number;
      incremental?: boolean;
    }) => devolucaoService.syncDevolucoes(integrationAccountId, batchSize, incremental),

    onMutate: ({ incremental }) => {
      const syncType = incremental ? 'incremental (rápida)' : 'completa';
      toast.loading(`Sincronização ${syncType} iniciada...`, {
        id: 'sync-devolucoes',
        description: incremental 
          ? 'Buscando apenas dados novos do Mercado Livre'
          : 'Buscando todos os dados do Mercado Livre',
      });
    },

    onSuccess: (data, variables) => {
      const syncType = variables.incremental ? 'incremental' : 'completa';
      toast.success(`Sincronização ${syncType} concluída!`, {
        id: 'sync-devolucoes',
        description: `${data.totalProcessed} devoluções processadas em ${(data.durationMs / 1000).toFixed(1)}s`,
      });

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: [DEVOLUCOES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SYNC_STATUS_QUERY_KEY] });
    },

    onError: (error: Error) => {
      toast.error('Erro na sincronização', {
        id: 'sync-devolucoes',
        description: error.message,
      });
    },
  });
}
