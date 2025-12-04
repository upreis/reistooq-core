/**
 * Hook para buscar contadores agregados de pedidos (totais de todas as páginas)
 * Usado nos cards de status para mostrar totais globais em vez de apenas da página atual
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import { supabase } from '@/integrations/supabase/client';

const isDev = process.env.NODE_ENV === 'development';

// Tipo temporário compatível com ambos os sistemas
interface CompatibleFiltersState {
  search?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  statusEnvio?: string | string[];
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  contasML?: string[];
  situacao?: string | string[]; // Para compatibilidade
}
import { mapSituacaoToApiStatus } from '@/utils/statusMapping';

interface PedidosAggregatorCounts {
  total: number;
  prontosBaixa: number;
  mapeamentoPendente: number;
  baixados: number;
}

interface UsePedidosAggregatorOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
  debounceMs?: number;
}

interface UsePedidosAggregatorReturn {
  counts: PedidosAggregatorCounts | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePedidosAggregator(
  integrationAccountId: string,
  appliedFilters: CompatibleFiltersState,
  options: UsePedidosAggregatorOptions = {}
): UsePedidosAggregatorReturn {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutos padrão
    debounceMs = 1000
  } = options;

  const [counts, setCounts] = useState<PedidosAggregatorCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<{ data: PedidosAggregatorCounts; timestamp: number } | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!enabled) {
      if (isDev) console.log('🔢 [Aggregator] Hook desabilitado, pulando busca');
      return;
    }

    // Verificar cache local primeiro
    if (cacheRef.current && cacheTime > 0) {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      if (cacheAge < cacheTime) {
        if (isDev) console.log('📦 [Aggregator] Usando dados do cache local', { cacheAge });
        setCounts(cacheRef.current.data);
        return;
      }
    }

    if (isDev) console.log('🔢 [Aggregator] Iniciando busca com filtros:', appliedFilters);
    
    const accountIds = (appliedFilters?.contasML && appliedFilters.contasML.length > 0)
      ? appliedFilters.contasML
      : (integrationAccountId ? [integrationAccountId] : []);
    
    if (!accountIds.length) {
      console.warn('🔢 [Aggregator] Nenhuma conta disponível');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Converter filtros para formato da API
      const apiFilters: any = {};
      
      if (appliedFilters.search) {
        apiFilters.search = appliedFilters.search;
        if (isDev) console.log('🔍 [Aggregator] Search aplicado:', appliedFilters.search);
      }
      
      // ✅ CORREÇÃO: Normalizar datas corretamente
      if (appliedFilters.dataInicio) {
        const d = appliedFilters.dataInicio instanceof Date 
          ? appliedFilters.dataInicio 
          : new Date(appliedFilters.dataInicio);
        
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0); // Início do dia
          apiFilters.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (isDev) console.log('📅 [Aggregator] Data início:', appliedFilters.dataInicio, '=>', apiFilters.date_from);
        }
      }

      if (appliedFilters.dataFim) {
        const d = appliedFilters.dataFim instanceof Date 
          ? appliedFilters.dataFim 
          : new Date(appliedFilters.dataFim);
        
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999); // Fim do dia
          apiFilters.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (isDev) console.log('📅 [Aggregator] Data fim:', appliedFilters.dataFim, '=>', apiFilters.date_to);
        }
      }

      if (appliedFilters.cidade) {
        apiFilters.cidade = appliedFilters.cidade;
        if (isDev) console.log('🏙️ [Aggregator] Cidade:', appliedFilters.cidade);
      }

      if (appliedFilters.uf) {
        apiFilters.uf = appliedFilters.uf;
        if (isDev) console.log('🗺️ [Aggregator] UF:', appliedFilters.uf);
      }

      if (appliedFilters.valorMin !== undefined) {
        apiFilters.valorMin = appliedFilters.valorMin;
        if (isDev) console.log('💰 [Aggregator] Valor mín:', appliedFilters.valorMin);
      }

      if (appliedFilters.valorMax !== undefined) {
        apiFilters.valorMax = appliedFilters.valorMax;
        if (isDev) console.log('💰 [Aggregator] Valor máx:', appliedFilters.valorMax);
      }

      // ✅ CORREÇÃO: Mapear statusEnvio corretamente
      if (appliedFilters.statusEnvio) {
        const statusList = Array.isArray(appliedFilters.statusEnvio) 
          ? appliedFilters.statusEnvio 
          : [appliedFilters.statusEnvio];
        
        // Mapear valores da UI para API
        const statusMapping: Record<string, string> = {
          'Pendente': 'pending',
          'Pronto para Envio': 'ready_to_ship', 
          'Enviado': 'shipped',
          'Entregue': 'delivered',
          'Cancelado': 'cancelled'
        };
        
        const mapped = statusList
          .map(status => statusMapping[status] || status)
          .filter(Boolean);
          
        if (mapped.length === 1) {
          apiFilters.shipping_status = mapped[0];
          if (isDev) console.log('📊 [Aggregator] Status envio:', mapped[0]);
        }
      }

      // ✅ CORREÇÃO: Suportar múltiplas contas
      const requestBody: any = {
        filters: apiFilters
      };
      
      if (accountIds.length > 1) {
        requestBody.integration_account_ids = accountIds;
        if (isDev) console.log('🔗 [Aggregator] Múltiplas contas:', accountIds.length);
      } else {
        requestBody.integration_account_id = accountIds[0];
        if (isDev) console.log('🔗 [Aggregator] Conta única:', accountIds[0]);
      }
      
      if (isDev) console.log('🔢 [Aggregator] Request body completo:', requestBody);

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
        baixados: data.baixados || 0
      };

      if (isDev) console.log('📊 [Aggregator] Contadores recebidos:', aggregatedCounts);
      setCounts(aggregatedCounts);
      
      // Atualizar cache local
      if (cacheTime > 0) {
        cacheRef.current = {
          data: aggregatedCounts,
          timestamp: Date.now()
        };
        if (isDev) console.log('📦 [Aggregator] Dados salvos no cache local');
      }

    } catch (err: any) {
      console.error('❌ [Aggregator] Erro ao buscar contadores:', err);
      setError(err.message || 'Erro ao buscar contadores agregados');
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [integrationAccountId, appliedFilters, enabled, cacheTime]);

  // Implementar debounce para evitar muitas requisições
  const debouncedFetch = useMemo(() => 
    debounce(fetchCounts, debounceMs), 
    [fetchCounts, debounceMs]
  );

  // Auto-refetch quando filtros mudarem (com debounce)
  useEffect(() => {
    if (enabled) {
      debouncedFetch();
    }
    
    // Cleanup debounce on unmount
    return () => {
      debouncedFetch.cancel();
    };
  }, [integrationAccountId, appliedFilters, debouncedFetch, enabled]);

  // Implementar refetch interval se especificado
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        if (isDev) console.log('⏰ [Aggregator] Refetch automático por intervalo');
        fetchCounts();
      }, refetchInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refetchInterval, enabled, fetchCounts]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
}