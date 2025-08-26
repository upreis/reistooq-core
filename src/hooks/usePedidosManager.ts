/**
 * 🛡️ HOOK UNIFICADO PARA GESTÃO DE PEDIDOS - FASE 2 & 3
 * Centraliza toda a lógica de filtros, carregamento e mapeamentos
 * + Otimizações de performance + Experiência aprimorada
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
  // 🚀 FASE 2: Estados de performance
  cachedAt?: Date;
  lastQuery?: string;
  isRefreshing: boolean;
  // 🚀 Paginação robusta
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  paging?: { total?: number; limit?: number; offset?: number };
}

export interface PedidosManagerActions {
  setFilters: (filters: Partial<PedidosFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setIntegrationAccountId: (id: string) => void;
  refetch: () => void;
  applyClientSideFilters: (orders: any[]) => any[];
  // 🚀 FASE 2 & 3: Novas ações
  exportData: (format: 'csv' | 'xlsx') => Promise<void>;
  saveCurrentFilters: (name: string) => void;
  loadSavedFilters: (name: string) => void;
  getSavedFilters: () => SavedFilter[];
}

// 🚀 FASE 3: Filtros salvos
export interface SavedFilter {
  id: string;
  name: string;
  filters: PedidosFilters;
  createdAt: Date;
}

import { PAGINATION, CACHE, DEBOUNCE } from '@/lib/constants';

const DEFAULT_FILTERS: PedidosFilters = {};

export function usePedidosManager(initialAccountId?: string) {
  // Estados principais
  const [filters, setFiltersState] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [integrationAccountId, setIntegrationAccountId] = useState(initialAccountId || '');
  const [fonte, setFonte] = useState<'banco' | 'tempo-real' | 'hibrido'>('hibrido');
  
  // 🚀 FASE 2: Estados de cache e performance
  const [cachedAt, setCachedAt] = useState<Date>();
  const [lastQuery, setLastQuery] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  
  // 🚀 Paginação do servidor e flags
  const [paging, setPaging] = useState<{ total?: number; limit?: number; offset?: number }>();
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  
  // 🚀 FASE 2: Debounce nos filtros para performance (P2.2: usando constants)
  const debouncedFilters = useDebounce(filters, DEBOUNCE.FILTER_DELAY_MS);
  
  // 🚀 FASE 3: Filtros salvos (localStorage)
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

    // Busca
    if (filters.search) {
      params.q = filters.search;
    }

    // Status do Envio - enviar múltiplos valores se necessário
    if (filters.situacao) {
      const situacoes = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
      if (situacoes.length > 0) {
        // Para suporte a múltiplas seleções, enviar array
        params.shipping_status = situacoes.length === 1 ? situacoes[0] : situacoes;
      }
    }

    // Datas - validação segura antes de usar getFullYear
    if (filters.dataInicio) {
      const d = filters.dataInicio instanceof Date ? filters.dataInicio : new Date(filters.dataInicio);
      if (!isNaN(d.getTime())) {
        params.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    if (filters.dataFim) {
      const d = filters.dataFim instanceof Date ? filters.dataFim : new Date(filters.dataFim);
      if (!isNaN(d.getTime())) {
        params.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
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
    const { shipping_status, ...rest } = apiParams || {};
    const requestBody = {
      integration_account_id: integrationAccountId,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      enrich: true,
      include_shipping: true,
      ...rest,
      // Enviar shipping_status diretamente para o edge function
      shipping_status: shipping_status,
      ...getUrlParams(), // URL tem prioridade
      // Sempre enriquecer para ter os dados de SKUs e mapeamentos
      enrich_skus: true,
      include_skus: true
    } as any;

    // P1.2: Remover logs sensíveis que expõem dados do sistema

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
  }, [integrationAccountId, currentPage, pageSize, getUrlParams]);

  /**
   * Fallback para banco de dados
   */
  const loadFromDatabase = useCallback(async (apiParams: any) => {
    // P1.2: Fallback para DB - log removido por segurança
    
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
      if (debouncedFilters.search) {
        const searchTerm = debouncedFilters.search.toLowerCase();
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

      // Filtro de status - MODIFICADO para usar shipping_status
      if (debouncedFilters.situacao) {
        const selectedStatuses = Array.isArray(debouncedFilters.situacao) ? debouncedFilters.situacao : [debouncedFilters.situacao];
        
        // Usar shipping_status como referência principal
        const orderShippingStatus = order.shipping_status || order.shipping?.status || order.raw?.shipping?.status || '';
        
        // Verificar se o shipping_status corresponde ao filtro selecionado
        const statusMatches = selectedStatuses.some(selectedStatus => {
          // Comparação direta ou normalizada
          return orderShippingStatus.toLowerCase() === selectedStatus.toLowerCase() ||
                 orderShippingStatus === selectedStatus;
        });
        
        if (!statusMatches) {
          return false;
        }
      }

      // Filtro de data
      if (debouncedFilters.dataInicio || debouncedFilters.dataFim) {
        const orderDate = new Date(order.data_pedido || order.date_created);
        
        if (debouncedFilters.dataInicio && orderDate < debouncedFilters.dataInicio) {
          return false;
        }
        if (debouncedFilters.dataFim && orderDate > debouncedFilters.dataFim) {
          return false;
        }
      }

      // Outros filtros
      if (debouncedFilters.cidade && !order.cidade?.toLowerCase().includes(debouncedFilters.cidade.toLowerCase())) {
        return false;
      }
      if (debouncedFilters.uf && order.uf !== debouncedFilters.uf) {
        return false;
      }
      if (debouncedFilters.valorMin !== undefined && (order.valor_total || 0) < debouncedFilters.valorMin) {
        return false;
      }
      if (debouncedFilters.valorMax !== undefined && (order.valor_total || 0) > debouncedFilters.valorMax) {
        return false;
      }

      return true;
    });
  }, [debouncedFilters]);

  /**
   * 🚀 FASE 2: Cache inteligente
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
   * Carrega pedidos com estratégia híbrida + cache inteligente
   */
  const loadOrders = useCallback(async (forceRefresh = false) => {
    if (!integrationAccountId) return;

    // 🚀 FASE 2: Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const apiParams = buildApiParams(debouncedFilters);
    const cacheKey = getCacheKey(apiParams);

    // 🚀 FASE 2: Verificar cache
    if (!forceRefresh && isCacheValid(cacheKey)) {
      // P1.2: Cache usado - log removido por segurança
      return;
    }

    setLoading(true);
    setError(null);
    if (forceRefresh) setIsRefreshing(true);

    try {
      
      try {
        // Tentativa 1: unified-orders com filtros
        const unifiedResult = await loadFromUnifiedOrders(apiParams);
        
        // Se o servidor retornou que aplicou filtros, usar direto, senão aplicar client-side
        const serverAppliedFiltering = (unifiedResult as any).server_filtering_applied;
        const shouldApplyClientFilter = Boolean(apiParams.shipping_status) && !serverAppliedFiltering;
        const filteredClientResults = shouldApplyClientFilter
          ? applyClientSideFilters(unifiedResult.results)
          : unifiedResult.results;

        // Sempre usar o total do servidor quando disponível
        setOrders(filteredClientResults);
        setTotal(unifiedResult.total);
        setFonte('tempo-real');
        
        // Atualizar paginação com dados do servidor (fallback se ausente)
        const p: any = (unifiedResult as any).paging;
        if (p && typeof p.limit === 'number' && typeof p.offset === 'number') {
          const totalVal = (p.total ?? p.count ?? unifiedResult.total ?? 0) as number;
          setPaging({ total: totalVal, limit: p.limit, offset: p.offset });
          setHasPrevPage(p.offset > 0);
          setHasNextPage(p.offset + p.limit < totalVal);
        } else {
          setPaging(undefined);
          setHasPrevPage(currentPage > 1);
          setHasNextPage(filteredClientResults.length >= pageSize);
        }
        
        // 🚀 FASE 2: Atualizar cache
        setCachedAt(new Date());
        setLastQuery(cacheKey);
        
        // P1.2: Debug removido por segurança - não expor dados sensíveis
        
      } catch (unifiedError: any) {
        // P1.2: Log minimizado para evitar exposição de dados
        
        try {
          // Tentativa 2: unified-orders sem filtros (aplicar client-side)
          const unifiedNoFilters = await loadFromUnifiedOrders({});
          const filteredResults = applyClientSideFilters(unifiedNoFilters.results);
          
          // Para client-side filtering, precisamos ajustar a paginação
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedResults = filteredResults.slice(startIndex, endIndex);
          
          setOrders(paginatedResults);
          setTotal(filteredResults.length); // Total dos resultados filtrados
          setFonte('hibrido');
          
          // Paginação fallback (client-side)
          setPaging({ total: filteredResults.length, limit: pageSize, offset: startIndex });
          setHasPrevPage(currentPage > 1);
          setHasNextPage(endIndex < filteredResults.length);
          
        } catch (fallbackError: any) {
          // P1.2: Log minimizado para evitar exposição de dados
          
          // Tentativa 3: banco de dados
          const dbResult = await loadFromDatabase(apiParams);
          setOrders(dbResult.results);
          setTotal(dbResult.total);
          setFonte('banco');
          
          // Paginação baseada no total do banco (se disponível)
          const totalDb = dbResult.total ?? 0;
          setPaging({ total: totalDb, limit: pageSize, offset: (currentPage - 1) * pageSize });
          setHasPrevPage(currentPage > 1);
          setHasNextPage(currentPage * pageSize < totalDb);
        }
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // P1.2: Request cancelado - log minimizado
        return;
      }
      
      // P1.2: Error minimizado para não expor dados sensíveis
      setError(error.message || 'Erro ao carregar pedidos');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [integrationAccountId, debouncedFilters, currentPage, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters, getCacheKey, isCacheValid]);

  // 🚀 FASE 3: Exportação de dados
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      setLoading(true);
      
      // Carregar todos os dados sem paginação
      const apiParams = buildApiParams(debouncedFilters);
      const allData = await loadFromUnifiedOrders({ ...apiParams, limit: PAGINATION.EXPORT_LIMIT });
      
      if (format === 'csv') {
        const csvContent = generateCSV(allData.results);
        downloadFile(csvContent, 'pedidos.csv', 'text/csv');
      } else {
        const xlsxContent = generateXLSX(allData.results);
        downloadFile(xlsxContent, 'pedidos.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } catch (error: any) {
      setError('Erro ao exportar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams, debouncedFilters, loadFromUnifiedOrders]);

  // 🚀 FASE 3: Gerenciamento de filtros salvos
  const saveCurrentFilters = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...debouncedFilters },
      createdAt: new Date()
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updated));
  }, [debouncedFilters, savedFilters]);

  const loadSavedFilters = useCallback((name: string) => {
    const saved = savedFilters.find(f => f.name === name);
    if (saved) {
      setFiltersState(saved.filters);
      setCurrentPage(1);
    }
  }, [savedFilters]);

  const getSavedFilters = useCallback(() => savedFilters, [savedFilters]);

  // Actions melhoradas
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
    
    setPageSize: (size: number) => {
      setPageSizeState(size);
      setCurrentPage(1);
    },
    
    setIntegrationAccountId: (id: string) => {
      setIntegrationAccountId(prev => {
        if (prev !== id) {
          setCurrentPage(1);
          return id;
        }
        return prev;
      });
    },
    
    refetch: () => {
      loadOrders(true); // 🚀 FASE 2: Force refresh
    },
    
    applyClientSideFilters,
    
    // 🚀 FASE 3: Novas ações
    exportData,
    saveCurrentFilters,
    loadSavedFilters,
    getSavedFilters
  }), [loadOrders, applyClientSideFilters, exportData, saveCurrentFilters, loadSavedFilters, getSavedFilters]);

  // State object melhorado
  const state: PedidosManagerState = {
    orders,
    total,
    loading,
    error,
    currentPage,
    pageSize,
    integrationAccountId,
    fonte,
    // 🚀 FASE 2: Estados de performance
    cachedAt,
    lastQuery,
    isRefreshing,
    // 🚀 Paginação robusta
    hasNextPage,
    hasPrevPage,
    paging
  };

  // Effects otimizados
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // 🚀 FASE 2: Cleanup ao desmontar (P1.3: Implementado AbortController cleanup)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    filters: debouncedFilters, // 🚀 FASE 2: Usar filtros com debounce
    state,
    actions,
    // Computed values
    totalPages: Math.ceil(total / pageSize),
    hasActiveFilters: Object.keys(debouncedFilters).some(key => 
      debouncedFilters[key as keyof PedidosFilters] !== undefined && 
      debouncedFilters[key as keyof PedidosFilters] !== ''
    )
  };
}

// 🚀 FASE 3: Funções utilitárias para exportação
function generateCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

function generateXLSX(data: any[]): ArrayBuffer {
  // Implementação simplificada - na produção usar biblioteca como 'xlsx'
  return new ArrayBuffer(0);
}

function downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}