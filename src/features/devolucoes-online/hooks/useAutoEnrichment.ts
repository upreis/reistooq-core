/**
 * 🤖 USE AUTO ENRICHMENT - CORRIGIDO
 * Hook que detecta dados faltantes e dispara enriquecimento automático em background
 */

import { useEffect, useRef, useMemo } from 'react';
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
  const lastCheckLengthRef = useRef(0);
  const { mutate: syncDevolucoes } = useSyncDevolucoes();
  const { mutate: enrichDevolucoes } = useEnrichDevolucoes();

  // ✅ Memoizar análise de dados faltantes
  const analysisResult = useMemo(() => {
    if (data.length === 0) {
      return { needsSync: false, needsEnrich: false, totalMissing: 0 };
    }

    let needsSync = false;
    let needsEnrich = false;
    let missingCount = 0;

    for (const item of data) {
      // ✅ Campos que precisam de re-sincronização
      const missingSyncFields = 
        !item.status_money || 
        !item.resource_type || 
        !item.shipment_type ||
        !item.shipment_destination ||
        !item.delivery_limit ||
        !item.refund_at ||
        !item.available_actions;

      if (missingSyncFields) {
        needsSync = true;
        missingCount++;
      }

      // ✅ Campos que precisam de enriquecimento via /reviews
      // IMPORTANTE: Só verificar se has_review === true
      if (item.has_review === true) {
        const missingReviewFields = 
          !item.review_status || 
          !item.review_method ||
          !item.review_stage ||
          !item.product_condition || 
          !item.product_destination;

        if (missingReviewFields) {
          needsEnrich = true;
          missingCount++;
        }
      }
    }

    return { needsSync, needsEnrich, totalMissing: missingCount };
  }, [data]);

  useEffect(() => {
    // ✅ Condições de disparo mais robustas
    if (!enabled || !integrationAccountId || data.length === 0) {
      return;
    }

    // ✅ Resetar flag se dados mudaram significativamente
    if (data.length !== lastCheckLengthRef.current) {
      hasTriggeredRef.current = false;
      lastCheckLengthRef.current = data.length;
    }

    if (hasTriggeredRef.current) {
      return;
    }

    const { needsSync, needsEnrich, totalMissing } = analysisResult;

    if (!needsSync && !needsEnrich) {
      return; // ✅ Nada a fazer
    }

    hasTriggeredRef.current = true;

    // ✅ Resetar flag após falha para permitir retry
    const resetFlag = () => {
      setTimeout(() => {
        hasTriggeredRef.current = false;
      }, 30000); // Retry após 30 segundos
    };

    toast.info('Enriquecimento automático iniciado', {
      description: `Processando ${totalMissing} registros com dados faltantes...`,
      duration: 3000,
    });

    // ✅ ESTRATÉGIA 1: Só precisa de Sync
    if (needsSync && !needsEnrich) {
      syncDevolucoes(
        { integrationAccountId, batchSize: 100 },
        {
          onSuccess: () => {
            toast.success('Sincronização concluída!', {
              description: 'Dados atualizados com sucesso.',
            });
          },
          onError: (error: Error) => {
            toast.error('Erro na sincronização', {
              description: error.message,
            });
            resetFlag();
          },
        }
      );
    }
    
    // ✅ ESTRATÉGIA 2: Só precisa de Enrich
    else if (!needsSync && needsEnrich) {
      enrichDevolucoes(
        { integrationAccountId, limit: 100 },
        {
          onSuccess: () => {
            toast.success('Enriquecimento concluído!', {
              description: 'Dados de revisão atualizados.',
            });
          },
          onError: (error: Error) => {
            toast.error('Erro no enriquecimento', {
              description: error.message,
            });
            resetFlag();
          },
        }
      );
    }
    
    // ✅ ESTRATÉGIA 3: Precisa de ambos (Sync → Enrich)
    else {
      syncDevolucoes(
        { integrationAccountId, batchSize: 100 },
        {
          onSuccess: () => {
            toast.success('Sincronização concluída! Iniciando enriquecimento...', {
              duration: 2000,
            });
            
            // Aguardar 2s antes de enriquecer
            setTimeout(() => {
              enrichDevolucoes(
                { integrationAccountId, limit: 100 },
                {
                  onSuccess: () => {
                    toast.success('Enriquecimento completo concluído!', {
                      description: 'Todos os dados foram atualizados.',
                    });
                  },
                  onError: (error: Error) => {
                    toast.error('Erro no enriquecimento', {
                      description: error.message,
                    });
                    resetFlag();
                  },
                }
              );
            }, 2000);
          },
          onError: (error: Error) => {
            toast.error('Erro na sincronização', {
              description: error.message,
            });
            resetFlag();
          },
        }
      );
    }
  }, [integrationAccountId, enabled, data.length, analysisResult, syncDevolucoes, enrichDevolucoes]);

  return {
    hasTriggered: hasTriggeredRef.current,
    needsSync: analysisResult.needsSync,
    needsEnrich: analysisResult.needsEnrich,
    totalMissing: analysisResult.totalMissing,
  };
}
