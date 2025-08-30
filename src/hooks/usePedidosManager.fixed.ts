/**
 * 🔧 CORREÇÕES CRÍTICAS APLICADAS - PRIORIDADE 1
 * Hook refatorado para corrigir problemas de paginação e filtros
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { formatDate } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';

export interface PedidosFilters {
  search?: string;
  situacao?: string | string[];
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}

export interface PedidosManagerState {
  orders: any[];
  total: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  integrationAccountId: string;
  fonte: 'banco' | 'tempo-real' | 'hibrido';
  cachedAt?: Date;
  lastQuery?: string;
  isRefreshing: boolean;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  paging?: { total?: number; limit?: number; offset?: number };
}

export interface PedidosManagerActions {
  setFilters: (filters: Partial<PedidosFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setIntegrationAccountId: (id: string) => void;
  refetch: () => void;
  applyClientSideFilters: (orders: any[]) => any[];
  exportData: (format: 'csv' | 'xlsx') => Promise<void>;
  saveCurrentFilters: (name: string) => void;
  loadSavedFilters: (name: string) => void;
  getSavedFilters: () => SavedFilter[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: PedidosFilters;
  createdAt: Date;
}

const PAGINATION = { DEFAULT_PAGE_SIZE: 25, EXPORT_LIMIT: 10000 };
const CACHE = { VALIDITY_MS: 5 * 60 * 1000 }; // 5 minutos
const DEBOUNCE = { FILTER_DELAY_MS: 500 };

// 🔧 Helper para normalizar datas (corrige serialização)
function normalizeDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  if (value instanceof Date) return value;
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  if (value && typeof value === 'object') {
    if (value._type === 'Date' && value.value?.iso) {
      const date = new Date(value.value.iso);
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    if (value.value?.iso) {
      const date = new Date(value.value.iso);
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    if (value.iso) {
      const date = new Date(value.iso);
      return isNaN(date.getTime()) ? undefined : date;
    }
  }
  
  return undefined;
}

const DEFAULT_FILTERS: PedidosFilters = {};

export function usePedidosManager(initialAccountId?: string) {
  // 🔧 CORREÇÃO CRÍTICA: Estados simplificados
  const [filters, setFiltersState] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [integrationAccountId, setIntegrationAccountId] = useState(initialAccountId || '');
  const [fonte, setFonte] = useState<'banco' | 'tempo-real' | 'hibrido'>('hibrido');
  
  // Performance states
  const [cachedAt, setCachedAt] = useState<Date>();
  const [lastQuery, setLastQuery] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  
  // Paginação
  const [paging, setPaging] = useState<{ total?: number; limit?: number; offset?: number }>();
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  
  // 🔧 CORREÇÃO CRÍTICA: Usar appliedFilters no debounce
  const debouncedFilters = useDebounce(appliedFilters, DEBOUNCE.FILTER_DELAY_MS);
  
  // Filtros salvos
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('pedidos-saved-filters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /**
   * Converte filtros para parâmetros da API
   */
  const buildApiParams = useCallback((filters: PedidosFilters) => {
    const params: any = {};

    if (filters.search) {
      params.q = filters.search;
    }

    if (filters.situacao) {
      const situacoes = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
      if (situacoes.length > 0) {
        params.shipping_status = situacoes.length === 1 ? situacoes[0] : situacoes;
      }
    }

    if (filters.dataInicio) {
      const d = normalizeDate(filters.dataInicio);
      if (d && !isNaN(d.getTime())) {
        params.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    if (filters.dataFim) {
      const d = normalizeDate(filters.dataFim);
      if (d && !isNaN(d.getTime())) {
        params.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    if (filters.cidade) params.cidade = filters.cidade;
    if (filters.uf) params.uf = filters.uf;
    if (filters.valorMin !== undefined) params.valorMin = filters.valorMin;
    if (filters.valorMax !== undefined) params.valorMax = filters.valorMax;

    return params;
  }, []);

  /**
   * Carrega pedidos da API unified-orders
   */
  const loadFromUnifiedOrders = useCallback(async (apiParams: any) => {
    const { shipping_status, ...rest } = apiParams || {};
    const requestBody = {
      integration_account_id: integrationAccountId,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      enrich: true,
      include_shipping: true,
      ...rest,
      shipping_status: shipping_status,
      enrich_skus: true,
      include_skus: true
    } as any;
    
    console.log('📤 Enviando requisição para unified-orders:', requestBody);

    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: requestBody
    });

    if (error) throw error;
    if (!data?.ok) throw new Error('Erro na resposta da API');

    return {
      results: data.results || [],
      unified: data.unified || [],
      total: data.paging?.total || data.paging?.count || data.results?.length || 0,
      paging: data.paging || undefined,
      serverStatusApplied: Boolean(requestBody.status)
    };
  }, [integrationAccountId, currentPage, pageSize]);

  /**
   * Aplica filtros do lado cliente
   */
  const applyClientSideFilters = useCallback((orders: any[]) => {
    if (!orders.length) return orders;

    return orders.filter(order => {
      if (appliedFilters.search) {
        const searchTerm = appliedFilters.search.toLowerCase();
        const searchableFields = [
          order.id,
          order.numero,
          order.nome_cliente,
          order.cpf_cnpj,
          order.situacao
        ].join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      if (appliedFilters.situacao) {
        const selectedStatuses = Array.isArray(appliedFilters.situacao) ? appliedFilters.situacao : [appliedFilters.situacao];
        const orderShippingStatus = order.shipping_status || order.shipping?.status || order.raw?.shipping?.status || '';
        
        const statusMatches = selectedStatuses.some(selectedStatus => {
          return orderShippingStatus.toLowerCase() === selectedStatus.toLowerCase() ||
                 orderShippingStatus === selectedStatus;
        });
        
        if (!statusMatches) {
          return false;
        }
      }

      if (appliedFilters.dataInicio || appliedFilters.dataFim) {
        const orderDate = new Date(order.data_pedido || order.date_created);
        
        if (appliedFilters.dataInicio) {
          const startDate = normalizeDate(appliedFilters.dataInicio);
          if (startDate && orderDate < startDate) {
            return false;
          }
        }
        if (appliedFilters.dataFim) {
          const endDate = normalizeDate(appliedFilters.dataFim);
          if (endDate && orderDate > endDate) {
            return false;
          }
        }
      }

      if (appliedFilters.cidade && !order.cidade?.toLowerCase().includes(appliedFilters.cidade.toLowerCase())) {
        return false;
      }
      if (appliedFilters.uf && order.uf !== appliedFilters.uf) {
        return false;
      }
      if (appliedFilters.valorMin !== undefined && (order.valor_total || 0) < appliedFilters.valorMin) {
        return false;
      }
      if (appliedFilters.valorMax !== undefined && (order.valor_total || 0) > appliedFilters.valorMax) {
        return false;
      }

      return true;
    });
  }, [appliedFilters]);

  /**
   * Cache inteligente
   */
  const getCacheKey = useCallback((apiParams: any) => {
    return JSON.stringify({ integrationAccountId, currentPage, pageSize, ...apiParams });
  }, [integrationAccountId, currentPage, pageSize]);

  const isCacheValid = useCallback((cacheKey: string) => {
    if (!cachedAt || lastQuery !== cacheKey) return false;
    const cacheAge = Date.now() - cachedAt.getTime();
    return cacheAge < CACHE.VALIDITY_MS;
  }, [cachedAt, lastQuery]);

  /**
   * 🔧 CORREÇÃO CRÍTICA: Carrega pedidos com melhor controle
   */
  const loadOrders = useCallback(async (forceRefresh = false) => {
    if (!integrationAccountId) {
      console.log('⚠️ Sem integrationAccountId, não carregando pedidos');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const apiParams = buildApiParams(appliedFilters);
    console.log('🔍 Parâmetros da API construídos:', apiParams);
    const cacheKey = getCacheKey(apiParams);

    if (!forceRefresh && isCacheValid(cacheKey)) {
      console.log('📦 Usando dados do cache');
      return;
    }

    setLoading(true);
    setError(null);
    if (forceRefresh) setIsRefreshing(true);

    try {
      const unifiedResult = await loadFromUnifiedOrders(apiParams);
      
      const shouldApplyClientFilter = Boolean(apiParams.shipping_status) && !(unifiedResult as any).server_filtering_applied;
      const filteredResults = shouldApplyClientFilter
        ? applyClientSideFilters(unifiedResult.results)
        : unifiedResult.results;

      setOrders(filteredResults);
      setTotal(unifiedResult.total);
      setFonte('tempo-real');
      
      // 🔧 CORREÇÃO CRÍTICA: Melhor gestão de paginação
      const p: any = (unifiedResult as any).paging;
      if (p && typeof p.limit === 'number' && typeof p.offset === 'number') {
        const totalVal = (p.total ?? p.count ?? unifiedResult.total ?? 0) as number;
        setPaging({ total: totalVal, limit: p.limit, offset: p.offset });
        setHasPrevPage(p.offset > 0);
        setHasNextPage(p.offset + p.limit < totalVal);
      } else {
        setPaging(undefined);
        setHasPrevPage(currentPage > 1);
        setHasNextPage(filteredResults.length >= pageSize);
      }
      
      setCachedAt(new Date());
      setLastQuery(cacheKey);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Request cancelado');
        return;
      }
      
      console.error('❌ Erro ao carregar pedidos:', error);
      setError(error.message || 'Erro ao carregar pedidos');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [integrationAccountId, appliedFilters, currentPage, pageSize, buildApiParams, loadFromUnifiedOrders, applyClientSideFilters, getCacheKey, isCacheValid]);

  // 🔧 CORREÇÃO CRÍTICA: Efeitos para recarregar dados
  useEffect(() => {
    console.log('🔄 useEffect: debouncedFilters ou integrationAccountId mudou');
    if (integrationAccountId) {
      loadOrders();
    }
  }, [debouncedFilters, integrationAccountId, loadOrders]);

  useEffect(() => {
    console.log('🔄 useEffect: currentPage mudou para', currentPage);
    if (integrationAccountId && currentPage > 1) {
      loadOrders();
    }
  }, [currentPage, integrationAccountId, loadOrders]);

  useEffect(() => {
    console.log('🔄 useEffect: pageSize mudou para', pageSize);
    if (integrationAccountId) {
      loadOrders();
    }
  }, [pageSize, integrationAccountId, loadOrders]);

  // 🔧 CORREÇÃO CRÍTICA: Aplicar filtros manualmente
  const applyFilters = useCallback(() => {
    console.log('🔄 Aplicando filtros manualmente:', filters);
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  }, [filters]);

  // 🔧 CORREÇÃO CRÍTICA: Simplificar sistema de filtros
  const setFilters = useCallback((newFilters: Partial<PedidosFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // 🔧 CORREÇÃO CRÍTICA: Melhor gestão de paginação
  const setPage = useCallback((page: number) => {
    console.log('📄 Mudando para página:', page);
    setCurrentPage(page);
  }, []);

  const setPageSizeCallback = useCallback((size: number) => {
    console.log('📏 Mudando tamanho da página para:', size);
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Exportação (simplificada)
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    console.log('📊 Exportando dados em formato:', format);
    // Implementação simplificada
  }, []);

  // Filtros salvos (simplificado)
  const saveCurrentFilters = useCallback((name: string) => {
    console.log('💾 Salvando filtros:', name);
  }, []);

  const loadSavedFilters = useCallback((name: string) => {
    console.log('📂 Carregando filtros:', name);
  }, []);

  const getSavedFilters = useCallback(() => {
    return savedFilters;
  }, [savedFilters]);

  // Actions
  const actions: PedidosManagerActions = useMemo(() => ({
    setFilters,
    clearFilters,
    applyFilters,
    setPage,
    setPageSize: setPageSizeCallback,
    setIntegrationAccountId: (id: string) => {
      console.log('🏢 Mudando conta para:', id);
      setIntegrationAccountId(id);
      setCurrentPage(1);
    },
    refetch: () => loadOrders(true),
    applyClientSideFilters,
    exportData,
    saveCurrentFilters,
    loadSavedFilters,
    getSavedFilters
  }), [
    setFilters,
    clearFilters, 
    applyFilters,
    setPage,
    setPageSizeCallback,
    loadOrders,
    applyClientSideFilters,
    exportData,
    saveCurrentFilters,
    loadSavedFilters,
    getSavedFilters
  ]);

  // State
  const state: PedidosManagerState = {
    orders,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    integrationAccountId,
    fonte,
    cachedAt,
    lastQuery,
    isRefreshing,
    hasNextPage,
    hasPrevPage,
    paging
  };

  // 🔧 CORREÇÃO CRÍTICA: Verificar se há mudanças pendentes
  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
  }, [filters, appliedFilters]);

  return {
    filters,
    appliedFilters,
    state,
    actions,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1, // 🔧 CORREÇÃO CRÍTICA
    hasActiveFilters: Object.keys(appliedFilters).some(key => {
      const value = appliedFilters[key as keyof PedidosFilters];
      return value !== undefined && value !== '' && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }),
    hasPendingChanges
  };
}