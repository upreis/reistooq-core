/**
 * 🛡️ HOOK UNIFICADO PARA GESTÃO DE PEDIDOS
 * Centraliza toda a lógica de filtros, carregamento e mapeamentos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { formatDate } from '@/lib/format';

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
  integrationAccountId: string;
  fonte: 'banco' | 'tempo-real' | 'hibrido';
}

export interface PedidosManagerActions {
  setFilters: (filters: Partial<PedidosFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setIntegrationAccountId: (id: string) => void;
  refetch: () => void;
  applyClientSideFilters: (orders: any[]) => any[];
}

const DEFAULT_FILTERS: PedidosFilters = {};
const PAGE_SIZE = 25;

export function usePedidosManager(initialAccountId?: string) {
  // Estados principais
  const [filters, setFiltersState] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [integrationAccountId, setIntegrationAccountId] = useState(initialAccountId || '');
  const [fonte, setFonte] = useState<'banco' | 'tempo-real' | 'hibrido'>('hibrido');

  /**
   * Converte filtros para parâmetros da API
   */
  const buildApiParams = useCallback((filters: PedidosFilters) => {
    const params: any = {};

    // Busca
    if (filters.search) {
      params.q = filters.search;
    }

    // Status/Situação - mapear para API quando possível
    if (filters.situacao) {
      const situacoes = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
      if (situacoes.length > 0) {
        const mapped = mapSituacaoToApiStatus(situacoes[0]);
        if (mapped) {
          params.status = mapped;
        }
      }
    }

    // Datas - usar formatação local consistente
    if (filters.dataInicio) {
      const d = filters.dataInicio;
      params.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (filters.dataFim) {
      const d = filters.dataFim;
      params.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // Outros filtros
    if (filters.cidade) params.cidade = filters.cidade;
    if (filters.uf) params.uf = filters.uf;
    if (filters.valorMin !== undefined) params.valorMin = filters.valorMin;
    if (filters.valorMax !== undefined) params.valorMax = filters.valorMax;

    return params;
  }, []);

  /**
   * Prioriza parâmetros da URL quando disponíveis
   */
  const getUrlParams = useCallback(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlParams: any = {};
      
      if (sp.get('dateFrom')) urlParams.date_from = sp.get('dateFrom');
      if (sp.get('dateTo')) urlParams.date_to = sp.get('dateTo');
      if (sp.get('status')) urlParams.status = sp.get('status');
      
      return urlParams;
    } catch {
      return {};
    }
  }, []);

  /**
   * Carrega pedidos da API unified-orders
   */
  const loadFromUnifiedOrders = useCallback(async (apiParams: any) => {
    const requestBody = {
      integration_account_id: integrationAccountId,
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
      enrich: true,
      include_shipping: true,
      ...apiParams,
      ...getUrlParams() // URL tem prioridade
    };

    console.info('[PedidosManager] Calling unified-orders with:', requestBody);

    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: requestBody
    });

    if (error) throw error;
    if (!data?.ok) throw new Error('Erro na resposta da API');

    return {
      results: data.results || [],
      unified: data.unified || [],
      total: data.paging?.total || data.results?.length || 0
    };
  }, [integrationAccountId, currentPage, getUrlParams]);

  /**
   * Fallback para banco de dados
   */
  const loadFromDatabase = useCallback(async (apiParams: any) => {
    console.info('[PedidosManager] Fallback to database');
    
    // Aqui você pode implementar a busca no banco se necessário
    // Por enquanto retorna vazio para usar o fallback client-side
    return { results: [], unified: [], total: 0 };
  }, []);

  /**
   * Aplica filtros do lado cliente (fallback)
   */
  const applyClientSideFilters = useCallback((orders: any[]) => {
    if (!orders.length) return orders;

    return orders.filter(order => {
      // Filtro de busca
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
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

      // Filtro de status
      if (filters.situacao) {
        const selectedStatuses = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
        const orderStatus = order.situacao || order.status_original || order.status || '';
        
        if (!statusMatchesFilter(orderStatus, selectedStatuses)) {
          return false;
        }
      }

      // Filtro de data
      if (filters.dataInicio || filters.dataFim) {
        const orderDate = new Date(order.data_pedido || order.date_created);
        
        if (filters.dataInicio && orderDate < filters.dataInicio) {
          return false;
        }
        if (filters.dataFim && orderDate > filters.dataFim) {
          return false;
        }
      }

      // Outros filtros
      if (filters.cidade && !order.cidade?.toLowerCase().includes(filters.cidade.toLowerCase())) {
        return false;
      }
      if (filters.uf && order.uf !== filters.uf) {
        return false;
      }
      if (filters.valorMin !== undefined && (order.valor_total || 0) < filters.valorMin) {
        return false;
      }
      if (filters.valorMax !== undefined && (order.valor_total || 0) > filters.valorMax) {
        return false;
      }

      return true;
    });
  }, [filters]);

  /**
   * Carrega pedidos com estratégia híbrida
   */
  const loadOrders = useCallback(async () => {
    if (!integrationAccountId) return;

    setLoading(true);
    setError(null);

    try {
      const apiParams = buildApiParams(filters);
      
      try {
        // Tentativa 1: unified-orders com filtros
        const unifiedResult = await loadFromUnifiedOrders(apiParams);
        
        setOrders(unifiedResult.results);
        setTotal(unifiedResult.total);
        setFonte('tempo-real');
        
      } catch (unifiedError: any) {
        console.warn('[PedidosManager] Unified-orders failed:', unifiedError.message);
        
        try {
          // Tentativa 2: unified-orders sem filtros (aplicar client-side)
          const unifiedNoFilters = await loadFromUnifiedOrders({});
          const filteredResults = applyClientSideFilters(unifiedNoFilters.results);
          
          setOrders(filteredResults);
          setTotal(filteredResults.length);
          setFonte('hibrido');
          
        } catch (fallbackError: any) {
          console.warn('[PedidosManager] All sources failed:', fallbackError.message);
          
          // Tentativa 3: banco de dados
          const dbResult = await loadFromDatabase(apiParams);
          setOrders(dbResult.results);
          setTotal(dbResult.total);
          setFonte('banco');
        }
      }
      
    } catch (error: any) {
      console.error('[PedidosManager] Load error:', error);
      setError(error.message || 'Erro ao carregar pedidos');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [integrationAccountId, filters, currentPage, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters]);

  // Actions
  const actions: PedidosManagerActions = useMemo(() => ({
    setFilters: (newFilters: Partial<PedidosFilters>) => {
      setFiltersState(prev => ({ ...prev, ...newFilters }));
      setCurrentPage(1); // Reset page when filters change
    },
    
    clearFilters: () => {
      setFiltersState(DEFAULT_FILTERS);
      setCurrentPage(1);
    },
    
    setPage: (page: number) => {
      setCurrentPage(page);
    },
    
    setIntegrationAccountId: (id: string) => {
      setIntegrationAccountId(id);
      setCurrentPage(1);
    },
    
    refetch: () => {
      loadOrders();
    },
    
    applyClientSideFilters
  }), [loadOrders, applyClientSideFilters]);

  // State object
  const state: PedidosManagerState = {
    orders,
    total,
    loading,
    error,
    currentPage,
    integrationAccountId,
    fonte
  };

  // Effects
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    filters,
    state,
    actions,
    // Computed values
    totalPages: Math.ceil(total / PAGE_SIZE),
    hasActiveFilters: Object.keys(filters).some(key => 
      filters[key as keyof PedidosFilters] !== undefined && 
      filters[key as keyof PedidosFilters] !== ''
    )
  };
}