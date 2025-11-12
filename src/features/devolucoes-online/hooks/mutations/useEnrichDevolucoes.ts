/**
 * ✨ USE ENRICH DEVOLUCOES - FASE 4
 * Hook React Query mutation para enriquecer devoluções
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { devolucaoService } from '../../services/DevolucaoService';
import { DEVOLUCOES_QUERY_KEY } from '../queries/useGetDevolucoes';

export function useEnrichDevolucoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      integrationAccountId,
      limit = 50,
    }: {
      integrationAccountId: string;
      limit?: number;
    }) => devolucaoService.enrichDevolucoes(integrationAccountId, limit),

    onMutate: () => {
      toast.loading('Enriquecimento iniciado...', {
        id: 'enrich-devolucoes',
        description: 'Buscando dados de compradores e produtos',
      });
    },

    onSuccess: (data) => {
      const failedCount = data.failed;
      
      if (failedCount > 0) {
        toast.warning('Enriquecimento concluído com avisos', {
          id: 'enrich-devolucoes',
          description: `${data.enriched} enriquecidos, ${failedCount} falharam`,
        });
      } else {
        toast.success('Enriquecimento concluído!', {
          id: 'enrich-devolucoes',
          description: `${data.enriched} devoluções enriquecidas com sucesso`,
        });
      }

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: [DEVOLUCOES_QUERY_KEY] });
    },

    onError: (error: Error) => {
      toast.error('Erro no enriquecimento', {
        id: 'enrich-devolucoes',
        description: error.message,
      });
    },
  });
}
