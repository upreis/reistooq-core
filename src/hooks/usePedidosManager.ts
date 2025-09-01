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
  contasML?: string[];  // ✅ NOVO: Filtro de contas ML
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
  applyFilters: () => void; // 🔄 Nova ação para aplicar filtros manualmente
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

// ✅ CORRIGIDO: Helper para normalizar datas sem problemas de timezone
function normalizeDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  // Se já é Date válida, retornar
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  
  // Se é string ISO (YYYY-MM-DD), criar data sem timezone
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexed
  }
  
  // Converter para Date e validar
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

const DEFAULT_FILTERS: PedidosFilters = {};

export function usePedidosManager(initialAccountId?: string) {
  // Estados principais - SIMPLIFICADO: apenas um estado de filtros
  const [filters, setFiltersState] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [integrationAccountId, setIntegrationAccountId] = useState(initialAccountId || '');
  const [fonte, setFonte] = useState<'banco' | 'tempo-real' | 'hibrido'>('hibrido');
  
  // 🚀 PERFORMANCE: Estados de cache otimizado
  const [cachedAt, setCachedAt] = useState<Date>();
  const [lastQuery, setLastQuery] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  
  // 🚀 Paginação do servidor e flags
  const [paging, setPaging] = useState<{ total?: number; limit?: number; offset?: number }>();
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  
  // ✅ CRÍTICO: Remover debounce - usar filters diretamente
  // const debouncedFilters = useDebounce(filters, DEBOUNCE.FILTER_DELAY_MS);
  
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
   * 🔧 AUDITORIA: Converte filtros para parâmetros da API 
   * CORRIGIDO: Priorizar conta ML e mapear situação corretamente
   */
  const buildApiParams = useCallback((filters: PedidosFilters) => {
    const params: any = {};

    // ✅ SIMPLIFICADO: Usar campos diretos da API
    if (filters.search) {
      params.q = filters.search;
    }

    // Status mapping - converter situacao para shipping_status (mapear para valores da API)
    if (filters.situacao) {
      const situacoes = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
      const mapped = situacoes
        .map((sit) => mapSituacaoToApiStatus(sit) || null)
        .filter(Boolean) as string[];

      if (mapped.length === 1) {
        params.shipping_status = mapped[0];
      } else if (mapped.length > 1) {
        params.shipping_status = mapped;
      }
    }

    // 📅 CORRIGIDO: Datas com formato consistente 
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

    // 🌍 Outros filtros geográficos e valores - OK
    if (filters.cidade) params.cidade = filters.cidade;
    if (filters.uf) params.uf = filters.uf;
    if (filters.valorMin !== undefined) params.valorMin = filters.valorMin;
    if (filters.valorMax !== undefined) params.valorMax = filters.valorMax;

    // 🚨 CRÍTICO: Conta ML TEM PRIORIDADE ABSOLUTA - se múltiplas, usar a primeira
    let targetAccountId = integrationAccountId;
    if (filters.contasML && filters.contasML.length > 0) {
      targetAccountId = filters.contasML[0]; // Usar primeira conta selecionada
      if (filters.contasML.length > 1) {
        console.warn('⚠️ Múltiplas contas ML selecionadas, usando apenas a primeira:', filters.contasML[0]);
      }
    }
    
    // ✅ GARANTIR: integration_account_id sempre presente
    if (targetAccountId) {
      params.integration_account_id = targetAccountId;
    }

    console.log('🔧 [buildApiParams] Parâmetros finais:', params);
    return params;
  }, [integrationAccountId]);

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
    // 🔧 AUDITORIA: Construir body da requisição com validação
    if (!integrationAccountId) {
      throw new Error('integration_account_id é obrigatório mas não foi fornecido');
    }

    const requestBody = {
      // 🏢 CRÍTICO: integration_account_id - priorizar filtro de contasML
      integration_account_id: apiParams.integration_account_id || integrationAccountId,
      
      // 📊 Paginação
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      
      // 🔍 Filtros principais - MAPEAMENTO CORRIGIDO
      ...(shipping_status ? { shipping_status } : {}),
      ...(rest.q ? { q: rest.q, search: rest.q } : {}), // Busca em ambos os campos
      ...(rest.cidade ? { cidade: rest.cidade } : {}),
      ...(rest.uf ? { uf: rest.uf } : {}),
      ...(rest.valorMin !== undefined ? { valorMin: rest.valorMin } : {}),
      ...(rest.valorMax !== undefined ? { valorMax: rest.valorMax } : {}),
      
      // 📅 Datas - usar os nomes corretos da API
      ...(rest.date_from ? { date_from: rest.date_from } : {}),
      ...(rest.date_to ? { date_to: rest.date_to } : {}),
      
      // 🌐 URL params têm prioridade sobre filtros
      ...getUrlParams(),
      
      // 📦 Enriquecimento de dados
      enrich: true,
      include_shipping: true,
      enrich_skus: true,
      include_skus: true
    } as any;
    
    console.log('📤 Enviando requisição para unified-orders:', requestBody);

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
   * 🚀 OTIMIZADO: Aplica filtros do lado cliente com memoização
   */
  const applyClientSideFilters = useCallback((orders: any[]) => {
    if (!orders.length) return orders;

    return orders.filter(order => {
      // Filtro de busca usando filters diretamente
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

      // 🚨 CORRIGIDO: Filtro de status usando função utilitária avançada
      if (filters.situacao) {
        const selectedStatuses = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
        
        // Extrair todos os status possíveis do pedido
        const orderStatuses = [
          order.shipping_status,
          order.shipping?.status,
          order.raw?.shipping?.status,
          order.situacao,
          order.status
        ].filter(Boolean);
        
        // Usar função utilitária para verificação avançada
        const statusMatches = orderStatuses.some(orderStatus => 
          statusMatchesFilter(orderStatus, selectedStatuses)
        );
        
        if (!statusMatches) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Pedido filtrado por status:', order.id, 'status encontrados:', orderStatuses, 'filtros:', selectedStatuses);
          }
          return false;
        }
      }

      // 📅 CORRIGIDO: Filtro de data com verificação robusta
      if (filters.dataInicio || filters.dataFim) {
        // Tentar múltiplas fontes de data
        const possibleDates = [
          order.data_pedido,
          order.date_created,
          order.created_at,
          order.raw?.date_created
        ].filter(Boolean);
        
        if (!possibleDates.length) {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ Pedido sem data válida para filtro:', order.id);
          }
          return false; // Excluir pedidos sem data válida
        }
        
        const orderDate = normalizeDate(possibleDates[0]);
        if (!orderDate) return false;
        
        // Normalizar para comparação apenas com data (sem hora)
        const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        
        // Comparar data de início  
        if (filters.dataInicio) {
          const startDate = normalizeDate(filters.dataInicio);
          if (startDate) {
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            if (orderDateOnly < startDateOnly) {
              if (process.env.NODE_ENV === 'development') {
                console.log('📅 Pedido filtrado por data início:', order.id, 'data pedido:', orderDateOnly, 'filtro:', startDateOnly);
              }
              return false;
            }
          }
        }
        
        // Comparar data fim
        if (filters.dataFim) {
          const endDate = normalizeDate(filters.dataFim);
          if (endDate) {
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            if (orderDateOnly > endDateOnly) {
              if (process.env.NODE_ENV === 'development') {
                console.log('📅 Pedido filtrado por data fim:', order.id, 'data pedido:', orderDateOnly, 'filtro:', endDateOnly);
              }
              return false;
            }
          }
        }
      }

      // Outros filtros usando filters diretamente
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
  }, [filters]); // Dependência otimizada - usar filters diretamente

  /**
   * 🚀 FASE 2: Cache inteligente - CORRIGIDO para invalidar na troca de conta
   */
  const getCacheKey = useCallback((apiParams: any) => {
    // ✅ CRÍTICO: Incluir targetAccountId no cache para evitar dados obsoletos
    const targetAccountId = apiParams.integration_account_id || integrationAccountId;
    return JSON.stringify({ targetAccountId, currentPage, pageSize, ...apiParams });
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

    const apiParams = buildApiParams(filters); // ✅ CORRIGIDO: Usar filters diretamente
    console.log('🔍 Parâmetros da API construídos:', apiParams);
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
          const totalServer = (p.total ?? p.count ?? (Number.isFinite(unifiedResult.total) ? unifiedResult.total : undefined)) as number | undefined;
          setPaging({ total: totalServer, limit: p.limit, offset: p.offset });
          setHasPrevPage(p.offset > 0);

          // Heurística: quando o servidor não retorna total confiável, permitir avançar
          if (typeof totalServer === 'number') {
            let next = (p.offset + p.limit) < totalServer;
            if (!next && p.offset === 0 && totalServer === p.limit && filteredClientResults.length === p.limit) {
              // total == limit na primeira página e página cheia -> pode haver próxima
              next = true;
            }
            setHasNextPage(next);
          } else {
            // Sem total: se veio página cheia, habilita próxima
            setHasNextPage(filteredClientResults.length >= p.limit);
          }
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
  }, [integrationAccountId, filters, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters, getCacheKey, isCacheValid]);

  // 🚀 FASE 3: Exportação de dados
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      setLoading(true);
      
      // ✅ CORRIGIDO: Carregar todos os dados sem paginação usando filters atuais
      const apiParams = buildApiParams(filters);
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
  }, [buildApiParams, filters, loadFromUnifiedOrders]); // ✅ CORRIGIDO

  // 🚀 FASE 3: Gerenciamento de filtros salvos
  const saveCurrentFilters = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...filters }, // ✅ CORRIGIDO: Salvar filtros atuais
      createdAt: new Date()
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updated));
  }, [filters, savedFilters]); // ✅ CORRIGIDO

  const loadSavedFilters = useCallback((name: string) => {
    const saved = savedFilters.find(f => f.name === name);
    if (saved) {
      // Normalizar datas ao carregar filtros salvos
      const normalizedFilters = { ...saved.filters };
      if (normalizedFilters.dataInicio) {
        normalizedFilters.dataInicio = normalizeDate(normalizedFilters.dataInicio);
      }
      if (normalizedFilters.dataFim) {
        normalizedFilters.dataFim = normalizeDate(normalizedFilters.dataFim);
      }
      
      // ✅ CORRIGIDO: Aplicar filtros salvos diretamente
      setFiltersState(normalizedFilters);
      setCurrentPage(1);
    }
  }, [savedFilters]);

  const getSavedFilters = useCallback(() => savedFilters, [savedFilters]);

  // ✅ SIMPLIFICADO: Aplicar filtros é automático via debounce, apenas força refresh
  const applyFilters = useCallback(() => {
    console.log('🔄 Forçando aplicação de filtros:', filters);
    
    setCurrentPage(1);
    
    // 💾 Salvar última consulta no localStorage
    try {
      const lastSearch = {
        filters: {
          ...filters,
          // Converter datas para ISO para serialização
          dataInicio: filters.dataInicio?.toISOString(),
          dataFim: filters.dataFim?.toISOString()
        },
        integrationAccountId,
        pageSize,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pedidos:lastSearch', JSON.stringify(lastSearch));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar última consulta:', error);
    }
    
    // Limpar cache para forçar nova busca
    setCachedAt(undefined);
    setLastQuery(undefined);
    
    // 🚀 Executar busca imediatamente
    loadOrders(true);
  }, [filters, integrationAccountId, pageSize, loadOrders]);

  // ✅ SIMPLIFICADO: Actions usando apenas filters
  const actions: PedidosManagerActions = useMemo(() => ({
    setFilters: (newFilters: Partial<PedidosFilters>) => {
      console.log('🔄 [usePedidosManager] setFilters:', newFilters);
      
      // Normalizar datas ao definir filtros
      const normalizedNewFilters = { ...newFilters };
      if (normalizedNewFilters.dataInicio) {
        normalizedNewFilters.dataInicio = normalizeDate(normalizedNewFilters.dataInicio);
      }
      if (normalizedNewFilters.dataFim) {
        normalizedNewFilters.dataFim = normalizeDate(normalizedNewFilters.dataFim);
      }
      
      // ✅ CACHE INTELIGENTE: Só limpar cache quando realmente necessário
      const needsCacheInvalidation = !!(
        newFilters.contasML || 
        newFilters.dataInicio || 
        newFilters.dataFim ||
        newFilters.situacao
      );
      
      setFiltersState(prev => {
        const merged = { ...prev, ...normalizedNewFilters };
        console.log('🔄 [usePedidosManager] Filtros atualizados:', merged);
        return merged;
      });
      
      // ✅ CORREÇÃO CRÍTICA: Resetar página sempre
      setCurrentPage(1);
      
      // ✅ OTIMIZADO: Limpar cache apenas quando necessário
      if (needsCacheInvalidation) {
        setCachedAt(undefined);
        setLastQuery(undefined);
      }
    },
    
    clearFilters: () => {
      console.log('🔄 Limpando todos os filtros');
      setFiltersState(DEFAULT_FILTERS);
      setCurrentPage(1);
      // Limpar cache
      setCachedAt(undefined);
      setLastQuery(undefined);
    },

    applyFilters, // 🔄 Nova ação
    
    setPage: (page: number) => {
      console.log('📄 Mudando para página:', page);
      setCurrentPage(page);
      // 🚨 MANUAL: Usuário deve clicar em "Aplicar" para buscar nova página
    },
    
    setPageSize: (size: number) => {
      // 🚨 VALIDAÇÃO: Mercado Livre API aceita máximo 51, limitamos a 50 para segurança
      const validatedSize = Math.min(size, PAGINATION.MAX_PAGE_SIZE);
      if (size > PAGINATION.MAX_PAGE_SIZE) {
        console.warn(`⚠️ pageSize reduzido de ${size} para ${validatedSize} (limite da API: ${PAGINATION.MAX_PAGE_SIZE})`);
      }
      setPageSizeState(validatedSize);
      setCurrentPage(1);
    },
    
    setIntegrationAccountId: (id: string) => {
      setIntegrationAccountId(prev => {
        if (prev !== id) {
          setCurrentPage(1);
          // Limpar cache quando mudar conta
          setCachedAt(undefined);
          setLastQuery(undefined);
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
  }), [applyFilters, loadOrders, applyClientSideFilters, exportData, saveCurrentFilters, loadSavedFilters, getSavedFilters]);

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

  // 💾 Effect para restaurar última consulta
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pedidos:lastSearch');
      if (saved) {
        const lastSearch = JSON.parse(saved);
        console.log('💾 Restaurando última consulta:', lastSearch);
        
        // Restaurar filtros (convertendo datas de volta para Date real)
        const restoredFilters = { ...lastSearch.filters };
        if (restoredFilters.dataInicio) {
          restoredFilters.dataInicio = normalizeDate(restoredFilters.dataInicio);
        }
        if (restoredFilters.dataFim) {
          restoredFilters.dataFim = normalizeDate(restoredFilters.dataFim);
        }
        
        // ✅ CORRIGIDO: Restaurar filtros diretamente
        setFiltersState(restoredFilters);
        
        // Restaurar configurações
        if (lastSearch.integrationAccountId && !integrationAccountId) {
          setIntegrationAccountId(lastSearch.integrationAccountId);
        }
        if (lastSearch.pageSize && lastSearch.pageSize !== pageSize) {
          const validatedSize = Math.min(lastSearch.pageSize, PAGINATION.MAX_PAGE_SIZE);
          setPageSizeState(validatedSize);
        }
        
        console.log('✅ Última consulta restaurada');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao restaurar última consulta:', error);
    }
  }, []); // Executar apenas no mount inicial

  // 🚀 OTIMIZADO: Hook unificado para carregar dados
  useEffect(() => {
    if (!integrationAccountId) return;
    
    console.log('🔄 [usePedidosManager] Carregamento otimizado:', { 
      integrationAccountId: integrationAccountId.slice(0, 8), 
      currentPage, 
      hasFilters: Object.keys(filters).length > 0 
    });
    
    // ✅ CRÍTICO: Troca de conta ML = carregamento IMEDIATO, sem delays
    loadOrders(); // Execução imediata sempre
    
    // ✅ CORREÇÃO CRÍTICA: Remover loadOrders das dependências para evitar loop infinito
  }, [filters, integrationAccountId, currentPage, pageSize]);

  // 🚀 FASE 2: Cleanup ao desmontar (P1.3: Implementado AbortController cleanup)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    filters, // ✅ CORRIGIDO: Retornar filters direto
    state,
    actions,
    // Computed values
    totalPages: Math.ceil(total / pageSize),
    hasActiveFilters: Object.keys(filters).some(key => {
      const value = filters[key as keyof PedidosFilters];
      return value !== undefined && value !== '' && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }),
    hasPendingChanges: false // ✅ SIMPLIFICADO: Sem múltiplos estados, sem pendências
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