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

// 🔧 Helper para normalizar datas (corrige serialização) - FORTALECIDO
function normalizeDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  // Se já é Date válida, retornar
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  
  // Se é string ISO, converter com validação
  if (typeof value === 'string') {
    // Remover possíveis caracteres extras e normalizar
    const cleanValue = value.trim();
    if (cleanValue === '') return undefined;
    
    const date = new Date(cleanValue);
    return (!isNaN(date.getTime())) ? date : undefined;
  }
  
  // Se é número (timestamp), converter com validação
  if (typeof value === 'number' && value > 0) {
    const date = new Date(value);
    return (!isNaN(date.getTime())) ? date : undefined;
  }
  
  // Se é objeto serializado do tipo {_type: 'Date', value: {iso: ...}}
  if (value && typeof value === 'object') {
    if (value._type === 'Date' && value.value?.iso) {
      const date = new Date(value.value.iso);
      return (!isNaN(date.getTime())) ? date : undefined;
    }
    
    // Se é objeto com value.iso diretamente
    if (value.value?.iso) {
      const date = new Date(value.value.iso);
      return (!isNaN(date.getTime())) ? date : undefined;
    }
    
    // Se é objeto com iso diretamente
    if (value.iso) {
      const date = new Date(value.iso);
      return (!isNaN(date.getTime())) ? date : undefined;
    }
  }
  
  console.warn('⚠️ Não foi possível normalizar data:', value);
  return undefined;
}

const DEFAULT_FILTERS: PedidosFilters = {};

export function usePedidosManager(initialAccountId?: string) {
  // Estados principais
  const [filters, setFiltersState] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<PedidosFilters>(DEFAULT_FILTERS); // 🔄 Filtros pendentes
  const [appliedFilters, setAppliedFilters] = useState<PedidosFilters>(DEFAULT_FILTERS); // 🔄 Filtros aplicados
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
  
  // 🔄 Usar appliedFilters no lugar de filters para debounce
  const debouncedFilters = useDebounce(appliedFilters, DEBOUNCE.FILTER_DELAY_MS);
  
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

    // Datas - usar normalização segura
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
   * Aplica filtros do lado cliente (fallback)
   */
  const applyClientSideFilters = useCallback((orders: any[]) => {
    if (!orders.length) return orders;

    return orders.filter(order => {
      // Filtro de busca - usar appliedFilters no lugar de debouncedFilters
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

      // Filtro de status - MODIFICADO para usar shipping_status e appliedFilters
      if (appliedFilters.situacao) {
        const selectedStatuses = Array.isArray(appliedFilters.situacao) ? appliedFilters.situacao : [appliedFilters.situacao];
        
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

      // Filtro de data - CORRIGIDO com logs de debug para identificar problema
      if (appliedFilters.dataInicio || appliedFilters.dataFim) {
        // Debug: Verificar tipos das datas de filtro
        console.log('🔍 [DEBUG FILTRO DATA] appliedFilters.dataInicio:', {
          value: appliedFilters.dataInicio,
          type: typeof appliedFilters.dataInicio,
          isDate: appliedFilters.dataInicio instanceof Date,
          toString: appliedFilters.dataInicio?.toString()
        });
        console.log('🔍 [DEBUG FILTRO DATA] appliedFilters.dataFim:', {
          value: appliedFilters.dataFim,
          type: typeof appliedFilters.dataFim,
          isDate: appliedFilters.dataFim instanceof Date,
          toString: appliedFilters.dataFim?.toString()
        });
        
        // Normalizar a data do pedido
        let orderDate: Date;
        const rawOrderDate = order.data_pedido || order.date_created;
        
        console.log('🔍 [DEBUG FILTRO DATA] Data do pedido:', {
          rawOrderDate,
          type: typeof rawOrderDate,
          pedidoId: order.id
        });
        
        if (rawOrderDate instanceof Date) {
          orderDate = rawOrderDate;
        } else if (typeof rawOrderDate === 'string') {
          orderDate = new Date(rawOrderDate);
        } else {
          console.warn('⚠️ Data do pedido inválida:', rawOrderDate);
          return false; // Excluir pedidos com data inválida
        }
        
        // Validar se a data do pedido é válida após normalização
        if (isNaN(orderDate.getTime())) {
          console.warn('⚠️ Data do pedido não pôde ser convertida:', rawOrderDate);
          return false;
        }
        
        // Normalizar data de início e comparar
        if (appliedFilters.dataInicio) {
          const startDate = normalizeDate(appliedFilters.dataInicio);
          console.log('🔍 [DEBUG FILTRO DATA] Data início normalizada:', {
            original: appliedFilters.dataInicio,
            normalized: startDate,
            isValid: startDate && !isNaN(startDate.getTime())
          });
          
          if (startDate && !isNaN(startDate.getTime())) {
            // Zerar horário para comparação apenas de datas
            const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            
            console.log('🔍 [DEBUG FILTRO DATA] Comparação início:', {
              orderDateOnly: orderDateOnly.toISOString().split('T')[0],
              startDateOnly: startDateOnly.toISOString().split('T')[0],
              orderDateOnly_time: orderDateOnly.getTime(),
              startDateOnly_time: startDateOnly.getTime(),
              result: orderDateOnly >= startDateOnly
            });
            
            if (orderDateOnly < startDateOnly) {
              console.log('🚫 [DEBUG FILTRO DATA] Pedido excluído por data início');
              return false;
            }
          }
        }
        
        // Normalizar data fim e comparar
        if (appliedFilters.dataFim) {
          const endDate = normalizeDate(appliedFilters.dataFim);
          console.log('🔍 [DEBUG FILTRO DATA] Data fim normalizada:', {
            original: appliedFilters.dataFim,
            normalized: endDate,
            isValid: endDate && !isNaN(endDate.getTime())
          });
          
          if (endDate && !isNaN(endDate.getTime())) {
            // Zerar horário para comparação apenas de datas
            const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            console.log('🔍 [DEBUG FILTRO DATA] Comparação fim:', {
              orderDateOnly: orderDateOnly.toISOString().split('T')[0],
              endDateOnly: endDateOnly.toISOString().split('T')[0],
              orderDateOnly_time: orderDateOnly.getTime(),
              endDateOnly_time: endDateOnly.getTime(),
              result: orderDateOnly <= endDateOnly
            });
            
            if (orderDateOnly > endDateOnly) {
              console.log('🚫 [DEBUG FILTRO DATA] Pedido excluído por data fim');
              return false;
            }
          }
        }
        
        console.log('✅ [DEBUG FILTRO DATA] Pedido aprovado no filtro de data');
      }

      // Outros filtros - usar appliedFilters
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
  }, [appliedFilters]); // 🔄 Dependência alterada para appliedFilters

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

    const apiParams = buildApiParams(appliedFilters); // 🔄 Usar appliedFilters
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
  }, [integrationAccountId, appliedFilters, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters, getCacheKey, isCacheValid]);

  // 🚀 FASE 3: Exportação de dados
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      setLoading(true);
      
      // Carregar todos os dados sem paginação - usar appliedFilters
      const apiParams = buildApiParams(appliedFilters);
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
  }, [buildApiParams, appliedFilters, loadFromUnifiedOrders]); // 🔄 Dependência alterada

  // 🚀 FASE 3: Gerenciamento de filtros salvos
  const saveCurrentFilters = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...appliedFilters }, // 🔄 Salvar filtros aplicados
      createdAt: new Date()
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updated));
  }, [appliedFilters, savedFilters]); // 🔄 Dependência corrigida

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
      
      setPendingFilters(normalizedFilters); // 🔄 Carregar nos filtros pendentes
      setAppliedFilters(normalizedFilters); // 🔄 E aplicar imediatamente
      setCurrentPage(1);
    }
  }, [savedFilters]);

  const getSavedFilters = useCallback(() => savedFilters, [savedFilters]);

  // 🔄 Nova função para aplicar filtros manualmente + salvar consulta
  const applyFilters = useCallback(() => {
    console.log('🔄 Aplicando filtros manualmente:', pendingFilters);
    
    // Normalizar datas para objetos Date reais
    const normalizedFilters = { ...pendingFilters };
    if (normalizedFilters.dataInicio) {
      normalizedFilters.dataInicio = normalizeDate(normalizedFilters.dataInicio);
    }
    if (normalizedFilters.dataFim) {
      normalizedFilters.dataFim = normalizeDate(normalizedFilters.dataFim);
    }
    
    console.log('🔄 Filtros normalizados:', {
      original: pendingFilters,
      normalized: normalizedFilters
    });
    
    setAppliedFilters({ ...normalizedFilters });
    setCurrentPage(1);
    
    // 💾 Salvar última consulta E configuração de colunas no localStorage
    try {
      const lastSearch = {
        filters: {
          ...normalizedFilters,
          // Converter datas para ISO para serialização
          dataInicio: normalizedFilters.dataInicio?.toISOString(),
          dataFim: normalizedFilters.dataFim?.toISOString()
        },
        integrationAccountId,
        pageSize,
        // 🚨 NOVO: Salvar configuração de colunas também
        visibleColumns: JSON.parse(localStorage.getItem('pedidos-visible-columns') || '{}'),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pedidos:lastSearch', JSON.stringify(lastSearch));
      console.log('💾 Última consulta salva com colunas:', lastSearch);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar última consulta:', error);
    }
    
    // Limpar cache para forçar nova busca
    setCachedAt(undefined);
    setLastQuery(undefined);
    
    // 🚀 Executar busca imediatamente
    loadOrders(true);
  }, [pendingFilters, integrationAccountId, pageSize, loadOrders]);

  // Actions melhoradas
  const actions: PedidosManagerActions = useMemo(() => ({
    setFilters: (newFilters: Partial<PedidosFilters>) => {
      console.log('🔄 Atualizando filtros pendentes:', newFilters);
      
      // Normalizar datas ao definir filtros
      const normalizedNewFilters = { ...newFilters };
      if (normalizedNewFilters.dataInicio) {
        normalizedNewFilters.dataInicio = normalizeDate(normalizedNewFilters.dataInicio);
      }
      if (normalizedNewFilters.dataFim) {
        normalizedNewFilters.dataFim = normalizeDate(normalizedNewFilters.dataFim);
      }
      
      setPendingFilters(prev => ({ ...prev, ...normalizedNewFilters }));
      // NÃO resetar página nem aplicar automaticamente
    },
    
    clearFilters: () => {
      console.log('🔄 Limpando todos os filtros');
      setPendingFilters(DEFAULT_FILTERS);
      setAppliedFilters(DEFAULT_FILTERS);
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

  // 💾 Effect para restaurar última consulta E configuração de colunas (sem executar automaticamente)
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
        
        console.log('🔧 Datas normalizadas:', {
          original: lastSearch.filters,
          normalized: restoredFilters
        });
        
        // 🚨 PADRÃO: Restaurar apenas nos filtros pendentes; usuário decide quando aplicar
        setPendingFilters(restoredFilters);
        
        // Restaurar configurações
        if (lastSearch.integrationAccountId && !integrationAccountId) {
          setIntegrationAccountId(lastSearch.integrationAccountId);
        }
        if (lastSearch.pageSize && lastSearch.pageSize !== pageSize) {
          // 🚨 VALIDAÇÃO: Aplicar mesmo limite na restauração
          const validatedSize = Math.min(lastSearch.pageSize, PAGINATION.MAX_PAGE_SIZE);
          setPageSizeState(validatedSize);
        }
        
        console.log('✅ Última consulta restaurada e aplicada automaticamente');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao restaurar última consulta:', error);
    }
  }, []); // Executar apenas no mount inicial

  // 🔄 Effect para carregar dados APENAS quando integrationAccountId mudar (não filtros)
  useEffect(() => {
    if (integrationAccountId) {
      console.log('🔄 Carregando dados iniciais - conta:', integrationAccountId);
      loadOrders();
    }
  }, [integrationAccountId]);

  // ✅ Paginação: carregar automaticamente ao mudar currentPage ou pageSize
  useEffect(() => {
    if (!integrationAccountId) return;
    loadOrders(true);
  }, [currentPage, pageSize, integrationAccountId]);

  // 🚀 FASE 2: Cleanup ao desmontar (P1.3: Implementado AbortController cleanup)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    filters: pendingFilters, // 🔄 Retornar filtros pendentes para a UI
    appliedFilters, // 🔄 Filtros que estão realmente aplicados
    state,
    actions,
    // Computed values
    totalPages: Math.ceil(total / pageSize),
    hasActiveFilters: Object.keys(appliedFilters).some(key => {
      const value = appliedFilters[key as keyof PedidosFilters];
      return value !== undefined && value !== '' && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }),
    hasPendingChanges: JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters) // 🔄 Indicador de mudanças pendentes
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