/**
 * 🛡️ HOOK MANAGER CENTRALIZADO - DEVOLUÇÕES ML
 * Arquitetura robusta inspirada em usePedidosManager
 * - SWR para cache inteligente
 * - Debounce automático
 * - Multi-conta com agregação
 * - Persistência de estado
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import useSWR from 'swr';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { MLReturn, DevolucaoFilters } from '../types/devolucao.types';

export interface DevolucaoManagerState {
  devolucoes: MLReturn[];
  total: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  integrationAccountId: string;
  cachedAt?: Date;
  isRefreshing: boolean;
}

export interface DevolucaoManagerActions {
  setFilters: (filters: Partial<DevolucaoFilters>) => void;
  replaceFilters: (filters: DevolucaoFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setIntegrationAccountId: (id: string) => void;
  setMultipleAccounts: (ids: string[]) => void; // ✅ ADICIONAR
  refetch: () => void;
  restorePersistedData: (devolucoes: MLReturn[], total: number, page: number) => void;
}

const DEFAULT_FILTERS: DevolucaoFilters = {
  search: '',
  status: [],
  dateFrom: null,
  dateTo: null,
  integrationAccountId: '',
};

// Serializador estável para cache key
function stableSerializeFilters(f: DevolucaoFilters): string {
  const sorted = Object.keys(f || {})
    .sort()
    .reduce((acc, k) => {
      const v = (f as any)[k];
      if (v === undefined || v === '' || v === null || (Array.isArray(v) && v.length === 0)) return acc;
      (acc as any)[k] = Array.isArray(v) ? [...v].sort() : v;
      return acc;
    }, {} as any);
  return JSON.stringify(sorted);
}

export function useDevolucaoManager(initialAccountId?: string) {
  // Estados principais
  const [filters, setFiltersState] = useState<DevolucaoFilters>(DEFAULT_FILTERS);
  const [devolucoes, setDevolucoes] = useState<MLReturn[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(50);
  const [integrationAccountId, setIntegrationAccountId] = useState(initialAccountId || '');
  const [cachedAt, setCachedAt] = useState<Date>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Suporte para múltiplas contas
  const [multipleAccountIds, setMultipleAccountIds] = useState<string[]>([]);

  // Controle de requests concorrentes
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce para filtros (500ms como em pedidos)
  const debouncedFilters = useDebounce(filters, 500);

  // Carregar contas ML ativas
  const [availableMlAccounts, setAvailableMlAccounts] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('integration_accounts')
          .select('id, name')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (err) {
          console.warn('[ML Accounts] Erro ao carregar:', err.message);
        } else {
          const mlIds = (data || []).map((d: any) => d.id).filter(Boolean);
          if (active) {
            setAvailableMlAccounts(mlIds);
            // Auto-selecionar primeira conta se não houver seleção
            if (mlIds.length > 0 && !integrationAccountId) {
              setIntegrationAccountId(mlIds[0]);
              setFiltersState(prev => ({ ...prev, integrationAccountId: mlIds[0] }));
            }
          }
        }
      } catch (e: any) {
        console.warn('[Accounts] Erro:', e?.message || e);
      }
    })();
    return () => { active = false; };
  }, []);

  // Build API params - SUPORTE PARA MÚLTIPLAS CONTAS
  const buildApiParams = useCallback((filters: DevolucaoFilters, page: number, size: number, accountIds: string[]) => {
    if (!accountIds || accountIds.length === 0) {
      console.warn('[buildApiParams] Nenhuma conta disponível');
      return null;
    }

    const formatDate = (date: Date | string | null) => {
      if (!date) return undefined;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return date;
    };

    const params: any = {
      accountIds, // Array de contas (pode ter 1 ou mais)
      filters: {
        search: filters.search || undefined,
        status: filters.status && filters.status.length > 0 ? filters.status : undefined,
        dateFrom: formatDate(filters.dateFrom),
        dateTo: formatDate(filters.dateTo),
      },
      pagination: {
        offset: (page - 1) * size,
        limit: size,
      },
    };

    return params;
  }, []);

  // Fetcher function para SWR - suporte para múltiplas contas
  const fetcher = useCallback(async ([_key, accountKey, filters, page, size]: [string, string, DevolucaoFilters, number, number]) => {
    // Se accountKey contém vírgulas, são múltiplas contas
    const isMultiple = accountKey.includes(',');
    const accountsToFetch = isMultiple ? accountKey.split(',') : [accountKey];
    
    const params = buildApiParams(filters, page, size, accountsToFetch);
    if (!params) {
      throw new Error('Nenhuma conta ML disponível');
    }

    console.log('🔄 [ml-returns] Buscando devoluções de', accountsToFetch.length, 'conta(s):', params);

    const { data, error: err } = await supabase.functions.invoke('ml-returns', {
      body: params,
    });

    if (err) {
      console.error('❌ [ml-returns] Erro:', err);
      throw err;
    }

    console.log('✅ [ml-returns] Retornado:', data?.returns?.length || 0, 'devoluções');

    return {
      returns: data?.returns || [],
      total: data?.total || 0,
    };
  }, [buildApiParams]);

  // SWR key baseada em filtros debounced E integrationAccountId OU múltiplas contas
  const swrKey = useMemo(() => {
    // Se tem múltiplas contas selecionadas, usar elas na key
    if (multipleAccountIds.length > 0) {
      const accountsKey = multipleAccountIds.sort().join(',');
      return ['devolucoes', accountsKey, debouncedFilters, currentPage, pageSize] as const;
    }
    
    // Senão, usar conta única
    const accountToUse = integrationAccountId || (availableMlAccounts.length > 0 ? availableMlAccounts[0] : null);
    
    if (!accountToUse && multipleAccountIds.length === 0) {
      return null;
    }
    
    return ['devolucoes', accountToUse, debouncedFilters, currentPage, pageSize] as const;
  }, [integrationAccountId, multipleAccountIds, debouncedFilters, currentPage, pageSize, availableMlAccounts]);

  // SWR com cache inteligente e proteção contra duplicação
  const { data, error: swrError, isLoading, mutate } = useSWR(
    swrKey || null,
    swrKey ? fetcher : null,
    {
      dedupingInterval: 60000, // ✅ 60s de deduplicação (evita chamadas duplicadas)
      revalidateOnFocus: false,
      revalidateOnReconnect: false, // ✅ Não revalidar ao reconectar
      errorRetryCount: 2,
      keepPreviousData: true, // ✅ Manter dados anteriores durante loading
      onSuccess: (data) => {
        if (data) {
          setDevolucoes(data.returns);
          setTotal(data.total);
          setCachedAt(new Date());
          setError(null);
        }
      },
      onError: (err) => {
        console.error('[SWR] Erro:', err);
        setError(err?.message || 'Erro ao carregar devoluções');
        toast.error('Erro ao carregar devoluções');
      },
    }
  );

  // ✅ CORREÇÃO: Limpar dados APENAS quando trocar conta DEPOIS de já ter dados
  // Isso evita limpar durante restauração de cache mas limpa ao trocar conta manualmente
  const prevAccountsRef = useRef<string>('');
  
  useEffect(() => {
    const currentKey = multipleAccountIds.length > 0 
      ? multipleAccountIds.sort().join(',') 
      : integrationAccountId;
    
    // Só limpar se:
    // 1. Já temos dados carregados
    // 2. A conta mudou de fato
    // 3. Não é a primeira montagem
    if (prevAccountsRef.current && currentKey !== prevAccountsRef.current && devolucoes.length > 0) {
      console.log('🗑️ Limpando dados devido a mudança de conta');
      setDevolucoes([]);
      setTotal(0);
    }
    
    prevAccountsRef.current = currentKey;
  }, [integrationAccountId, multipleAccountIds, devolucoes.length]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Actions
  const setFilters = useCallback((newFilters: Partial<DevolucaoFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset página ao filtrar
  }, []);

  const replaceFilters = useCallback((newFilters: DevolucaoFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const setAccountId = useCallback((id: string) => {
    setIntegrationAccountId(id);
    setFiltersState(prev => ({ ...prev, integrationAccountId: id }));
    setMultipleAccountIds([]); // Limpar múltiplas contas ao selecionar uma única
    setCurrentPage(1);
  }, []);

  // ACTION: Buscar de múltiplas contas
  const setMultipleAccounts = useCallback((ids: string[]) => {
    setMultipleAccountIds(ids);
    setIntegrationAccountId(''); // Limpar conta única ao selecionar múltiplas
    setFiltersState(prev => ({ ...prev, integrationAccountId: '' }));
    setCurrentPage(1);
  }, []);

  const refetch = useCallback(() => {
    setIsRefreshing(true);
    mutate().finally(() => setIsRefreshing(false));
  }, [mutate]);

  const restorePersistedData = useCallback((restoredDevolucoes: MLReturn[], restoredTotal: number, page: number) => {
    console.log('✅ Restaurando dados persistidos (exibindo instantaneamente):', restoredDevolucoes.length, 'devoluções');
    setDevolucoes(restoredDevolucoes);
    setTotal(restoredTotal);
    setCurrentPage(page);
    setCachedAt(new Date());
    setLoading(false); // ✅ FIX: Desligar loading para mostrar dados em cache imediatamente
  }, []);

  // Calcular total de páginas
  const totalPages = Math.ceil(total / pageSize);

  return {
    state: {
      devolucoes,
      total,
      loading,
      error,
      currentPage,
      pageSize,
      integrationAccountId,
      multipleAccountIds,
      cachedAt,
      isRefreshing,
    },
    actions: {
      setFilters,
      replaceFilters,
      clearFilters,
      setPage,
      setPageSize,
      setIntegrationAccountId: setAccountId,
      setMultipleAccounts,
      refetch,
      restorePersistedData,
    },
    totalPages,
    availableMlAccounts,
  };
}
