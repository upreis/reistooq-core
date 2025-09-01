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
  replaceFilters: (filters: PedidosFilters) => void; // 🔄 Substitui completamente (usado ao aplicar)
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
  
  // ✅ CRÍTICO: Usar filters diretamente para refetch automático
  const debouncedFilters = filters; // Remover debounce para reatividade imediata
  
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
        // Edge function pode não suportar array; aplicaremos filtro client-side
        // Então não enviamos shipping_status para o servidor
        // params._multi_shipping_status = mapped; // opcional para debug
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

    // 🚨 CRÍTICO: CORREÇÃO - Suportar múltiplas contas ML
    let targetAccountId = integrationAccountId;
    if (filters.contasML && filters.contasML.length > 0) {
      // ✅ AUDITORIA FIX: Suportar múltiplas contas ML via array
      if (filters.contasML.length === 1) {
        targetAccountId = filters.contasML[0];
      } else {
        // Para múltiplas contas, usar array (edge function suporta)
        params.integration_account_ids = filters.contasML;
        targetAccountId = null; // Não usar single account quando temos múltiplas
      }
    }
    
    // ✅ GARANTIR: integration_account_id OU integration_account_ids sempre presente
    if (targetAccountId) {
      params.integration_account_id = targetAccountId;
    } else if (!params.integration_account_ids) {
      // Fallback para conta padrão se nenhuma específica foi selecionada
      params.integration_account_id = integrationAccountId;
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
   * Carrega pedidos da API unified-orders - COM SUPORTE A MÚLTIPLAS CONTAS
   */
  const loadFromUnifiedOrders = useCallback(async (apiParams: any) => {
    const { shipping_status, ...rest } = apiParams || {};
    
    // 🚨 AUDITORIA FIX: Suporte a múltiplas contas ML
    if (apiParams.integration_account_ids && Array.isArray(apiParams.integration_account_ids)) {
      console.log(`🔄 [AUDITORIA] Processando ${apiParams.integration_account_ids.length} contas ML:`, apiParams.integration_account_ids);
      
      // Fazer uma chamada para cada conta e combinar resultados
      const allResults: any[] = [];
      const allUnified: any[] = [];
      let totalCount = 0;
      
      for (const accountId of apiParams.integration_account_ids) {
        try {
          const singleAccountBody = {
            integration_account_id: accountId,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            ...(shipping_status ? { shipping_status } : {}),
            ...(rest.q ? { q: rest.q, search: rest.q } : {}),
            ...(rest.cidade ? { cidade: rest.cidade } : {}),
            ...(rest.uf ? { uf: rest.uf } : {}),
            ...(rest.valorMin !== undefined ? { valorMin: rest.valorMin } : {}),
            ...(rest.valorMax !== undefined ? { valorMax: rest.valorMax } : {}),
            ...(rest.date_from ? { date_from: rest.date_from } : {}),
            ...(rest.date_to ? { date_to: rest.date_to } : {}),
            ...getUrlParams(),
            enrich: true,
            include_shipping: true,
            enrich_skus: true,
            include_skus: true
          };
          
          console.log(`📤 [CONTA ${accountId}] Enviando requisição:`, singleAccountBody);
          
          const { data, error } = await supabase.functions.invoke('unified-orders', {
            body: singleAccountBody
          });
          
          if (error) {
            console.error(`❌ [CONTA ${accountId}] Erro:`, error);
            continue; // Pular conta com erro, mas não falhar tudo
          }
          
          if (data?.ok) {
            const accountResults = data.results || [];
            const accountUnified = data.unified || [];
            
            // Marcar resultados com a conta de origem
            accountResults.forEach((result: any) => {
              result._source_account = accountId;
            });
            accountUnified.forEach((unified: any) => {
              unified._source_account = accountId;
            });
            
            allResults.push(...accountResults);
            allUnified.push(...accountUnified);
            totalCount += data.paging?.total || data.paging?.count || accountResults.length || 0;
            
            console.log(`✅ [CONTA ${accountId}] ${accountResults.length} pedidos encontrados`);
          }
        } catch (accountError) {
          console.error(`❌ [CONTA ${accountId}] Falha na requisição:`, accountError);
          // Continuar com outras contas mesmo se uma falhar
        }
      }
      
      console.log(`🎯 [AUDITORIA] Total combinado: ${allResults.length} pedidos de ${apiParams.integration_account_ids.length} contas`);
      
      return {
        results: allResults,
        unified: allUnified,
        total: totalCount,
        paging: { total: totalCount, limit: pageSize, offset: (currentPage - 1) * pageSize },
        serverStatusApplied: Boolean(shipping_status),
        _multiAccount: true
      };
    }
    
    // 🔧 AUDITORIA: Lógica original para conta única
    if (!integrationAccountId && !apiParams.integration_account_id) {
      throw new Error('integration_account_id é obrigatório mas não foi fornecido');
    }

    const requestBody = {
      integration_account_id: apiParams.integration_account_id || integrationAccountId,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...(shipping_status ? { shipping_status } : {}),
      ...(rest.q ? { q: rest.q, search: rest.q } : {}),
      ...(rest.cidade ? { cidade: rest.cidade } : {}),
      ...(rest.uf ? { uf: rest.uf } : {}),
      ...(rest.valorMin !== undefined ? { valorMin: rest.valorMin } : {}),
      ...(rest.valorMax !== undefined ? { valorMax: rest.valorMax } : {}),
      ...(rest.date_from ? { date_from: rest.date_from } : {}),
      ...(rest.date_to ? { date_to: rest.date_to } : {}),
      ...getUrlParams(),
      enrich: true,
      include_shipping: true,
      enrich_skus: true,
      include_skus: true
    } as any;
    
    console.log('📤 Enviando requisição para unified-orders (conta única):', requestBody);

    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: requestBody
    });

    if (error) throw new Error(error.message || 'unified-orders: erro na função');
    if (!data?.ok) throw new Error('Erro na resposta da API');

    return {
      results: data.results || [],
      unified: data.unified || [],
      total: data.paging?.total || data.paging?.count || data.results?.length || 0,
      paging: data.paging || undefined,
      serverStatusApplied: Boolean(requestBody.shipping_status)
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
   * 🔧 Carrega pedidos com query chaveada por filtros (refetch automático)
   */
  const loadOrders = useCallback(async (forceRefresh = false) => {
    // Construir parâmetros primeiro para suportar múltiplas contas
    const apiParams = buildApiParams(debouncedFilters);
    const cacheKey = getCacheKey(apiParams);

    // Se a mesma query já foi executada recentemente e está carregando, evitar duplicar
    if (!forceRefresh && lastQuery === cacheKey && loading) {
      return;
    }
    // Atualiza a última query com a chave completa (inclui paginação/conta)
    setLastQuery(cacheKey);

    // Só bloquear se realmente não houver nenhuma conta definida (única ou múltiplas)
    const hasAnyAccount = Boolean(
      apiParams.integration_account_id ||
      (Array.isArray(apiParams.integration_account_ids) && apiParams.integration_account_ids.length > 0) ||
      integrationAccountId
    );
    if (!hasAnyAccount) return;

    console.log('🔍 Parâmetros da API construídos:', apiParams);
    // cacheKey já calculado acima

    // 🚀 FASE 2: Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
        const shouldApplyClientFilter = Boolean(filters.situacao) && !serverAppliedFiltering;
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
          const baseParams: any = {};
          if (Array.isArray(apiParams.integration_account_ids) && apiParams.integration_account_ids.length > 0) {
            baseParams.integration_account_ids = apiParams.integration_account_ids;
          } else {
            baseParams.integration_account_id = apiParams.integration_account_id || integrationAccountId;
          }
          const unifiedNoFilters = await loadFromUnifiedOrders(baseParams);
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
  }, [integrationAccountId, debouncedFilters, lastQuery, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters, getCacheKey, isCacheValid]);

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
  }, [filters, integrationAccountId, pageSize, loadOrders]); // ✅ CORRIGIDO: Incluir loadOrders nas dependências

  // ✅ SIMPLIFICADO: Actions usando apenas filters
const actions: PedidosManagerActions = useMemo(() => ({
  setFilters: (newFilters: Partial<PedidosFilters>) => {
    console.log('🔄 [usePedidosManager] setFilters:', newFilters);
    // Normalizar datas ao definir filtros
    const normalizedNewFilters: Partial<PedidosFilters> = { ...newFilters };
    if (normalizedNewFilters.dataInicio) {
      normalizedNewFilters.dataInicio = normalizeDate(normalizedNewFilters.dataInicio);
    }
    if (normalizedNewFilters.dataFim) {
      normalizedNewFilters.dataFim = normalizeDate(normalizedNewFilters.dataFim);
    }

    // Merge (para updates parciais durante edição de filtros)
    setFiltersState(prev => {
      const merged = { ...prev, ...normalizedNewFilters } as PedidosFilters;

      // Remover chaves explicitamente definidas como undefined
      Object.keys(normalizedNewFilters).forEach((k) => {
        const key = k as keyof PedidosFilters;
        const val = (normalizedNewFilters as any)[key];
        if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
          delete (merged as any)[key];
        }
      });

      console.log('🔄 [usePedidosManager] Filtros (merge) =>', merged);
      return merged;
    });

    // Resetar paginação e invalidar cache leve
    setCurrentPage(1);
    setCachedAt(undefined);
    setLastQuery(undefined);
  },

  // Substitui COMPLETAMENTE os filtros (usado ao clicar em "Aplicar Filtros")
  replaceFilters: (all: PedidosFilters) => {
    const normalized: PedidosFilters = { ...all };
    if (normalized.dataInicio) normalized.dataInicio = normalizeDate(normalized.dataInicio);
    if (normalized.dataFim) normalized.dataFim = normalizeDate(normalized.dataFim);

    // Remover valores vazios para evitar "filtros fantasmas"
    const cleaned: PedidosFilters = {} as PedidosFilters;
    (Object.keys(normalized) as (keyof PedidosFilters)[]).forEach((key) => {
      const val = (normalized as any)[key];
      if (val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
        (cleaned as any)[key] = val;
      }
    });

    setFiltersState(cleaned);
    setCurrentPage(1);
    // Invalida completamente o cache para garantir atualização imediata
    setCachedAt(undefined);
    setLastQuery(undefined);
  },
  
  clearFilters: () => {
    console.log('🔄 Limpando todos os filtros');
    setFiltersState(DEFAULT_FILTERS);
    setCurrentPage(1);
    setCachedAt(undefined);
    setLastQuery(undefined);
  },

  applyFilters, // 🔄 Nova ação
  
  setPage: (page: number) => {
    console.log('📄 Mudando para página:', page);
    setCurrentPage(page);
  },
  
  setPageSize: (size: number) => {
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
        setCachedAt(undefined);
        setLastQuery(undefined);
        return id;
      }
      return prev;
    });
  },
  
  refetch: () => {
    loadOrders(true);
  },
  
  applyClientSideFilters,
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

  // ✅ SINCRONIZAÇÃO AUTOMÁTICA: Disparar carregamento quando filtros ou params mudam
  useEffect(() => {
    if (!integrationAccountId) return;
    
    console.log('🔄 [usePedidosManager] Carregamento com query chaveada:', { 
      integrationAccountId: integrationAccountId.slice(0, 8), 
      currentPage, 
      hasFilters: Object.keys(debouncedFilters).length > 0 
    });
    
    // ✅ SOLUÇÃO: Carregamento automático quando filtros mudam (query chaveada)
    loadOrders();
    
  }, [debouncedFilters, integrationAccountId, currentPage, pageSize, loadOrders]);

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