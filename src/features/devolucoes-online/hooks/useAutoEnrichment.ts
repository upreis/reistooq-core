/**
 * 🤖 USE AUTO ENRICHMENT - CORRIGIDO
 * Hook que detecta dados faltantes e dispara enriquecimento automático em background
 */

import { useEffect, useRef, useMemo } from 'react';
import { useSyncDevolucoes } from './mutations/useSyncDevolucoes';
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

  // ✅ Memoizar análise de dados faltantes
  // NOTA: Após FASE 1 e 2, sync-devolucoes já enriquece tudo inline (incluindo /reviews)
  const analysisResult = useMemo(() => {
    if (data.length === 0) {
      return { needsSync: false, totalMissing: 0 };
    }

    let needsSync = false;
    let missingCount = 0;

    for (const item of data) {
      // ✅ Campos que precisam de sincronização completa
      const missingSyncFields = 
        !item.status_money || 
        !item.resource_type || 
        !item.shipment_destination ||
        !item.delivery_limit ||
        !item.refund_at ||
        !item.available_actions ||
        // Reviews agora vêm do sync-devolucoes
        (item.has_review === true && (
          !item.review_status || 
          !item.review_method ||
          !item.review_stage ||
          !item.product_condition || 
          !item.product_destination
        ));

      if (missingSyncFields) {
        needsSync = true;
        missingCount++;
      }
    }

    return { needsSync, totalMissing: missingCount };
  }, [data]);

  useEffect(() => {
    // ⚠️ DESABILITADO até reconectar integrações ML (tokens corrompidos)
    // Erro: "Failed to decrypt secret data - reconnection may be required"
    return;
    
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

    const { needsSync, totalMissing } = analysisResult;

    if (!needsSync) {
      return; // ✅ Nada a fazer - sync-devolucoes já enriquece tudo
    }

    hasTriggeredRef.current = true;

    // ✅ Resetar flag após falha para permitir retry
    const resetFlag = () => {
      setTimeout(() => {
        hasTriggeredRef.current = false;
      }, 30000); // Retry após 30 segundos
    };

    toast.info('Sincronização automática iniciada', {
      description: `Processando ${totalMissing} registros com dados faltantes...`,
      duration: 3000,
    });

    // ✅ Estratégia única: sync-devolucoes agora faz tudo (incluindo /reviews)
    syncDevolucoes(
      { integrationAccountId, batchSize: 100 },
      {
        onSuccess: () => {
          toast.success('Sincronização concluída!', {
            description: 'Dados e reviews atualizados com sucesso.',
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
  }, [integrationAccountId, enabled, data.length, analysisResult, syncDevolucoes]);

  return {
    hasTriggered: hasTriggeredRef.current,
    needsSync: analysisResult.needsSync,
    totalMissing: analysisResult.totalMissing,
  };
}
