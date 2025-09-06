/**
 * Hook para buscar contadores agregados de pedidos (totais de todas as páginas)
 * Usado nos cards de status para mostrar totais globais em vez de apenas da página atual
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PedidosFiltersState } from '@/hooks/usePedidosFiltersUnified';
import { mapSituacaoToApiStatus } from '@/utils/statusMapping';

interface PedidosAggregatorCounts {
  total: number;
  prontosBaixa: number;
  mapeamentoPendente: number;
  baixados: number;
  shipped: number;
  delivered: number;
}

interface UsePedidosAggregatorReturn {
  counts: PedidosAggregatorCounts | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePedidosAggregator(
  integrationAccountId: string,
  appliedFilters: PedidosFiltersState
): UsePedidosAggregatorReturn {
  const [counts, setCounts] = useState<PedidosAggregatorCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    const accountIds = (appliedFilters?.contasML && (appliedFilters as any).contasML.length > 0)
      ? (appliedFilters as any).contasML as string[]
      : (integrationAccountId ? [integrationAccountId] : []);
    if (!accountIds.length) return;

    setLoading(true);
    setError(null);

    try {
      // Converter filtros para formato da API
      const apiFilters: any = {};
      
      if (appliedFilters.search) {
        apiFilters.search = appliedFilters.search;
      }
      
      if (appliedFilters.dataInicio) {
        const d = appliedFilters.dataInicio instanceof Date 
          ? appliedFilters.dataInicio 
          : new Date(appliedFilters.dataInicio);
        
        if (!isNaN(d.getTime())) {
          apiFilters.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }

      if (appliedFilters.dataFim) {
        const d = appliedFilters.dataFim instanceof Date 
          ? appliedFilters.dataFim 
          : new Date(appliedFilters.dataFim);
        
        if (!isNaN(d.getTime())) {
          apiFilters.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }

      if (appliedFilters.cidade) {
        apiFilters.cidade = appliedFilters.cidade;
      }

      if (appliedFilters.uf) {
        apiFilters.uf = appliedFilters.uf;
      }

      if (appliedFilters.valorMin) {
        apiFilters.valorMin = appliedFilters.valorMin;
      }

      if (appliedFilters.valorMax) {
        apiFilters.valorMax = appliedFilters.valorMax;
      }

      // Mapear situacao -> shipping_status (quando houver apenas uma)
      if ((appliedFilters as any).situacao) {
        const situacoes = Array.isArray((appliedFilters as any).situacao)
          ? (appliedFilters as any).situacao
          : [(appliedFilters as any).situacao];
        const mapped = situacoes
          .map((sit: string) => mapSituacaoToApiStatus(sit) || null)
          .filter(Boolean) as string[];
        if (mapped.length === 1) {
          apiFilters.shipping_status = mapped[0];
        }
      }

      const requestBody: any = {
        filters: apiFilters
      };
      if (accountIds.length > 1) {
        requestBody.integration_account_ids = accountIds;
      } else {
        requestBody.integration_account_id = accountIds[0];
      }
      console.log('🔢 [Aggregator] Buscando contadores agregados:', requestBody);

      const { data, error } = await supabase.functions.invoke('pedidos-aggregator', {
        body: requestBody
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar contadores agregados');
      }

      if (!data?.ok) {
        throw new Error('Resposta inválida da API de agregação');
      }

      const aggregatedCounts: PedidosAggregatorCounts = {
        total: data.total || 0,
        prontosBaixa: data.prontosBaixa || 0,
        mapeamentoPendente: data.mapeamentoPendente || 0,
        baixados: data.baixados || 0,
        shipped: data.shipped || 0,
        delivered: data.delivered || 0
      };

      console.log('📊 [Aggregator] Contadores recebidos:', aggregatedCounts);
      setCounts(aggregatedCounts);

    } catch (err: any) {
      console.error('❌ [Aggregator] Erro ao buscar contadores:', err);
      setError(err.message || 'Erro ao buscar contadores agregados');
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [integrationAccountId, appliedFilters]);

  // Buscar contadores quando dependências mudarem
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
}