/**
 * 🤖 USE AUTO ENRICHMENT
 * Hook que detecta dados faltantes e dispara enriquecimento automático em background
 */

import { useEffect, useRef } from 'react';
import { useSyncDevolucoes } from './mutations/useSyncDevolucoes';
import { useEnrichDevolucoes } from './mutations/useEnrichDevolucoes';
import { toast } from 'sonner';

interface UseAutoEnrichmentOptions {
  integrationAccountId: string;
  enabled?: boolean;
  data?: any[];
}

export function useAutoEnrichment({
  integrationAccountId,
  enabled = true,
  data = [],
}: UseAutoEnrichmentOptions) {
  const hasTriggeredRef = useRef(false);
  const { mutate: syncDevolucoes } = useSyncDevolucoes();
  const { mutate: enrichDevolucoes } = useEnrichDevolucoes();

  useEffect(() => {
    if (!enabled || !integrationAccountId || hasTriggeredRef.current) {
      return;
    }

    // Verificar se há dados faltantes que precisam de enriquecimento
    const hasMissingData = data.some((item) => {
      // Campos que precisam de enriquecimento via /reviews
      const needsReviewEnrichment = 
        !item.review_status || 
        !item.product_condition || 
        !item.product_destination;

      // Campos que precisam de re-sincronização
      const needsResync = 
        !item.status_money || 
        !item.resource_type || 
        !item.shipment_type;

      return needsReviewEnrichment || needsResync;
    });

    if (hasMissingData && data.length > 0) {
      hasTriggeredRef.current = true;

      toast.info('Enriquecimento automático iniciado', {
        description: 'Dados faltantes sendo processados em background...',
        duration: 3000,
      });

      // Disparar sincronização para corrigir 7 campos faltantes
      syncDevolucoes(
        { integrationAccountId, batchSize: 100 },
        {
          onSuccess: () => {
            // Após sync, disparar enriquecimento para popular campos de /reviews
            enrichDevolucoes(
              { integrationAccountId, limit: 100 },
              {
                onSuccess: () => {
                  toast.success('Dados enriquecidos com sucesso!', {
                    description: 'Todas as colunas foram atualizadas.',
                  });
                },
              }
            );
          },
        }
      );
    }
  }, [integrationAccountId, enabled, data, syncDevolucoes, enrichDevolucoes]);

  return {
    hasTriggered: hasTriggeredRef.current,
  };
}
