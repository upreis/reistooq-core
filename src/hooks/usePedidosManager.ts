/**
 * 🛡️ HOOK UNIFICADO PARA GESTÃO DE PEDIDOS - FASE 2 & 3
 * Centraliza toda a lógica de filtros, carregamento e mapeamentos
 * + Otimizações de performance + Experiência aprimorada
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  mapOrderStatusToAPI
} from '@/utils/orderStatusMapping';
import { mapMLShippingSubstatus } from '@/utils/mlStatusMapping';
import { formatDate } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import { usePedidosCache } from '@/hooks/usePedidosCache';
import { toast } from 'react-hot-toast';
import { fetchShopeeOrders } from '@/services/orders';

const isDev = process.env.NODE_ENV === 'development';

export interface PedidosFilters {
  search?: string;
  statusPedido?: string | string[];   // ✅ NOVO: Status do pedido (order.status)
  dataInicio?: Date;
  dataFim?: Date;
  contasML?: string[];
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
  // 🔄 PERSISTÊNCIA: Restaurar dados diretamente sem refetch
  restorePersistedData: (orders: any[], total: number, page: number) => void;
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
    const result = isNaN(value.getTime()) ? undefined : value;
    return result;
  }
  
  // Se é string ISO (YYYY-MM-DD), criar data sem timezone
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = value.split('-').map(Number);
    const result = new Date(year, month - 1, day); // month é 0-indexed
    return result;
  }
  
  // Converter para Date e validar
  const date = new Date(value);
  const result = isNaN(date.getTime()) ? undefined : date;
  return result;
}

const DEFAULT_FILTERS: PedidosFilters = {};

// 🔒 Serializador estável e determinístico dos filtros para uso na queryKey/cache
function stableSerializeFilters(f: PedidosFilters): string {
  const replacer = (_key: string, value: any) => {
    if (value instanceof Date) {
      // 🚨 FIX 4: Normalizar datas - dataFim para fim do dia (23:59:59)
      const date = new Date(value);
      const key = _key.toLowerCase();
      if (key.includes('fim') || key.includes('end') || key.includes('to')) {
        // Fim do dia para data fim
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
      } else {
        // Início do dia para data início
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      }
    }
    return value;
  };
  const sorted = Object.keys(f || {})
    .sort()
    .reduce((acc, k) => {
      const v = (f as any)[k];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return acc;
      (acc as any)[k] = Array.isArray(v) ? [...v].sort() : v;
      return acc;
    }, {} as any);
  return JSON.stringify(sorted, replacer);
}

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
  
  // 🚀 P3.3: Cache otimizado com TTL de 5 minutos
  const pedidosCache = usePedidosCache({ ttl: 5 * 60 * 1000 });
  const [cachedAt, setCachedAt] = useState<Date>();
  const [lastQuery, setLastQuery] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 🚀 CONCORRÊNCIA: Controle de requests com AbortController + requestId
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Evita auto-load duplicado após um loadOrders(true) explícito
  const skipNextAutoLoadRef = useRef<boolean>(false);
  
  // 🚀 Paginação do servidor e flags
  const [paging, setPaging] = useState<{ total?: number; limit?: number; offset?: number }>();
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  // ✅ Contas ML disponíveis para seleção/agrupamento
  const [availableMlAccounts, setAvailableMlAccounts] = useState<string[]>([]);
  // 🛍️ Contas Shopee disponíveis
  const [availableShopeeAccounts, setAvailableShopeeAccounts] = useState<string[]>([]);
  
  // 🚀 P3.2: Debounce para filtros com 500ms para melhor performance
  const debouncedFilters = useDebounce(filters, 500);
  
  // 🚀 FASE 3: Filtros salvos (localStorage)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('pedidos-saved-filters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // (requestIdRef já declarado acima com abortControllerRef)

  // 🔍 Carregar contas ML e Shopee ativas e definir padrão
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // ✅ Carregar contas ML ativas
        const { data: mlData, error: mlError } = await supabase
          .from('integration_accounts')
          .select('id, name, account_identifier')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });
        
        if (mlError) {
          console.warn('[ML Accounts] Erro ao carregar contas:', mlError.message);
        } else {
          const mlIds = (mlData || []).map((d: any) => d.id).filter(Boolean);
          if (active) {
            setAvailableMlAccounts(mlIds);
            // Se usuário não escolheu contas explicitamente, usar todas por padrão
            setFiltersState(prev => {
              if (prev?.contasML && prev.contasML.length > 0) return prev;
              return mlIds.length > 0 ? { ...prev, contasML: mlIds } : prev;
            });
            // Garantir uma conta padrão para caminhos single-account
            setIntegrationAccountId(prev => prev || mlIds[0] || prev);
          }
        }

        // 🛍️ Carregar contas Shopee ativas
        const { data: shopeeData, error: shopeeError } = await supabase
          .from('integration_accounts')
          .select('id, name, account_identifier, provider')
          .eq('provider', 'shopee')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });
        
        if (shopeeError) {
          console.warn('[Shopee Accounts] Erro ao carregar contas:', shopeeError.message);
        } else {
          const shopeeIds = (shopeeData || []).map((d: any) => d.id).filter(Boolean);
          if (active) {
            setAvailableShopeeAccounts(shopeeIds);
            console.log('🛍️ [Shopee Accounts] Contas carregadas:', shopeeIds);
          }
        }
      } catch (e: any) {
        console.warn('[Accounts] Exceção ao carregar contas:', e?.message || e);
      }
    })();
    return () => { active = false; };
  }, []);

  /**
   * 🔧 AUDITORIA: Converte filtros para parâmetros da API 
   * CORRIGIDO: Mapear status PT→EN e separar filtros de API vs client-side
   */
  const buildApiParams = useCallback((filters: PedidosFilters) => {
    console.log('🔍 [buildApiParams] Iniciando construção de parâmetros com filtros:', filters);
    
    const params: any = {};

    // ✅ SIMPLIFICADO: Usar campos diretos da API
    if (filters.search) {
      params.q = filters.search;
      console.log('🔍 [buildApiParams] Search adicionado:', filters.search);
    }

    // ✅ NOVO: Status do PEDIDO (order.status) - mapear PT→EN para API
    if (filters.statusPedido) {
      const statusList = Array.isArray(filters.statusPedido) ? filters.statusPedido : [filters.statusPedido];
      const mappedStatusList = statusList
        .map(status => mapOrderStatusToAPI(status))
        .filter(Boolean);
      
      if (mappedStatusList.length > 0) {
        params.status = mappedStatusList.length === 1 ? mappedStatusList[0] : mappedStatusList.join(',');
        console.log('📊 [STATUS PEDIDO] PT→EN mapeado para API:', statusList, '→', mappedStatusList);
      }
    }

    // ✅ CORRIGIDO: Status de ENVIO (shipping.status) - APENAS CLIENT-SIDE (não enviar para API)
    // Status de envio será aplicado via client-side filtering após receber dados da API

    // 📅 CORRIGIDO: Datas com formato consistente e normalização para fim do dia
    if (filters.dataInicio) {
      const d = normalizeDate(filters.dataInicio);
      if (d && !isNaN(d.getTime())) {
        // Início do dia para dataInicio
        d.setHours(0, 0, 0, 0);
        params.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        console.log('🗓️ [DATE] dataInicio convertida:', filters.dataInicio, '=>', params.date_from);
      }
    }
    if (filters.dataFim) {
      const d = normalizeDate(filters.dataFim);
      if (d && !isNaN(d.getTime())) {
        // 🚨 FIX 4: Fim do dia para dataFim (23:59:59)
        d.setHours(23, 59, 59, 999);
        params.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        console.log('🗓️ [DATE] dataFim convertida para fim do dia:', filters.dataFim, '=>', params.date_to);
      }
    }


    // 🚨 CRÍTICO: CORREÇÃO - Suportar múltiplas contas ML
    let targetAccountId = integrationAccountId;
    console.log('🔗 [CONTAS] integrationAccountId padrão:', integrationAccountId);
    console.log('🔗 [CONTAS] filters.contasML:', filters.contasML);
    
    if (filters.contasML && filters.contasML.length > 0) {
      // ✅ AUDITORIA FIX: Suportar múltiplas contas ML via array
      if (filters.contasML.length === 1) {
        targetAccountId = filters.contasML[0];
        console.log('🔗 [CONTAS] Usando conta única:', targetAccountId);
      } else {
        // Para múltiplas contas, usar array (edge function suporta)
        params.integration_account_ids = filters.contasML;
        targetAccountId = null; // Não usar single account quando temos múltiplas
        console.log('🔗 [CONTAS] Usando múltiplas contas:', filters.contasML);
      }
    } else if (availableMlAccounts.length > 1) {
      // ✅ Sem seleção explícita: usar TODAS as contas ativas por padrão
      params.integration_account_ids = availableMlAccounts;
      targetAccountId = null;
      console.log('🔗 [CONTAS] Padrão multi-conta (todas ativas):', availableMlAccounts);
    } else if (!targetAccountId && availableMlAccounts.length === 1) {
      // ✅ Apenas uma conta disponível: usar como padrão
      targetAccountId = availableMlAccounts[0];
      console.log('🔗 [CONTAS] Padrão conta única disponível:', targetAccountId);
    }
    
    // ✅ GARANTIR: integration_account_id OU integration_account_ids sempre presente
    if (targetAccountId) {
      params.integration_account_id = targetAccountId;
      console.log('🔗 [CONTAS] Parâmetro final: integration_account_id =', targetAccountId);
    } else if (!params.integration_account_ids) {
      // 🚨 CORREÇÃO: Se não há integrationAccountId mas há contas disponíveis, usar a primeira
      if (!integrationAccountId && availableMlAccounts.length > 0) {
        params.integration_account_id = availableMlAccounts[0];
        console.log('🔗 [CONTAS] Fallback para primeira conta disponível:', availableMlAccounts[0]);
      } else if (integrationAccountId) {
        params.integration_account_id = integrationAccountId;
        console.log('🔗 [CONTAS] Fallback para conta padrão:', integrationAccountId);
      } else {
        // 🚨 CRÍTICO: Sem contas disponíveis - não fazer chamada
        console.warn('🔗 [CONTAS] Nenhuma conta disponível para fazer a chamada');
        return null;
      }
    } else {
      console.log('🔗 [CONTAS] Usando múltiplas contas via integration_account_ids');
    }

    // 🛍️ SHOPEE: Detectar se é uma conta Shopee e usar rota específica
    if (targetAccountId && availableShopeeAccounts.includes(targetAccountId)) {
      params._shopeeAccount = true;
      params._useShopeeOrders = true;
      console.log('🛍️ [SHOPEE] Conta Shopee detectada, usando fetchShopeeOrders:', targetAccountId);
    }
    
    return params;
   }, [integrationAccountId, availableMlAccounts, availableShopeeAccounts]);

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
   * ✅ BLINDAGEM: Tolerante a falhas de conta, agregação robusta, feedback claro
   */
  const loadFromUnifiedOrders = useCallback(async (apiParams: any) => {
    // ✅ AUDITORIA FIX: Não extrair _clientSideShippingStatuses pois não enviamos mais para API
    const rest = apiParams || {};
    
    // 🚨 AUDITORIA FIX: Suporte a múltiplas contas ML com blindagem total
    if (apiParams.integration_account_ids && Array.isArray(apiParams.integration_account_ids)) {
      console.log(`🔄 [MULTI-CONTA] Processando ${apiParams.integration_account_ids.length} contas ML:`, apiParams.integration_account_ids);
      
      // Fazer uma chamada para cada conta e combinar resultados
      const allResults: any[] = [];
      const allUnified: any[] = [];
      let totalCount = 0;
      const failedAccounts: string[] = [];
      const successfulAccounts: string[] = [];
      const accountErrors: Array<{accountId: string, error: string, status: string}> = [];
      
      for (const accountId of apiParams.integration_account_ids) {
        try {
        const singleAccountBody = {
          integration_account_id: accountId,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          // ✅ AUDITORIA: Apenas status do pedido (order.status) vai para API ML
          ...(rest.status ? { status: rest.status } : {}),
          ...(rest.q ? { q: rest.q, search: rest.q } : {}),
          ...(rest.date_from ? { date_from: rest.date_from } : {}),
          ...(rest.date_to ? { date_to: rest.date_to } : {}),
          ...getUrlParams(),
          enrich: true,
          include_shipping: true,
          enrich_skus: true,
          include_skus: true
        };
          
          console.groupCollapsed(`[CONTA ${accountId.slice(0, 8)}...] Requisição`);
          console.log('🚨 DEBUG - body completo:', JSON.stringify(singleAccountBody, null, 2));
          console.log('🚨 DEBUG - integration_account_id:', singleAccountBody.integration_account_id);
          console.groupEnd();
          
          let data: any | null = null;
          let error: any | null = null;
          
          // 🛍️ SHOPEE: Usar fetchShopeeOrders para contas Shopee
          if (availableShopeeAccounts.includes(accountId)) {
            try {
              console.log('🛍️ [SHOPEE] Usando fetchShopeeOrders para conta:', accountId);
              const shopeeResult = await fetchShopeeOrders({
                integration_account_id: accountId,
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
                status: rest.status,
                q: rest.q,
                date_from: rest.date_from,
                date_to: rest.date_to
              });
              
              // Converter resultado para formato esperado
              data = {
                ok: true,
                results: shopeeResult.rows.map(r => r.raw),
                unified: shopeeResult.rows.map(r => r.unified),
                paging: { total: shopeeResult.total },
                debug: shopeeResult.debug
              };
              error = null;
            } catch (e: any) {
              error = e;
              data = null;
            }
          } else {
            // ML: Usar unified-orders
            try {
              ({ data, error } = await supabase.functions.invoke('unified-orders', {
                body: singleAccountBody
              }));
            } catch (e: any) {
              error = e;
            }
          }

          // 🚨 AJUSTE 1: Captura detalhada de erro com toast específico
          if (error || data?.status >= 400) {
            const errorDetail = error?.message || data?.error || data?.detail || 'Erro desconhecido';
            const statusCode = data?.status || error?.status || 'unknown';
            
            console.error(`❌ [CONTA ${accountId.slice(0, 8)}...] Erro:`, errorDetail);
            
            // Toast específico baseado no tipo de erro
            if (errorDetail.includes('reconnect_required') || errorDetail.includes('no_tokens')) {
              toast.error(`Conta ${singleAccountBody.integration_account_id?.slice(0, 8)} precisa ser reconectada`);
            } else if (errorDetail.includes('ML API error')) {
              toast.error(`Erro na API do Mercado Livre para conta ${singleAccountBody.integration_account_id?.slice(0, 8)}`);
            } else {
              toast.error(`Erro ao buscar pedidos da conta ${singleAccountBody.integration_account_id?.slice(0, 8)}`);
            }

            // ✅ CORREÇÃO: Fallback único sem duplicação
            if (String(errorDetail).includes('401') || String(errorDetail).includes('Unauthorized')) {
              console.warn(`🔑 [CONTA ${accountId.slice(0, 8)}...] Token expirado - conta precisa ser reconectada`);
              
              failedAccounts.push(accountId);
              accountErrors.push({
                accountId,
                error: 'Token expirado - reconecte a conta',
                status: '401'
              });
              continue; // Pular conta sem token válido
            }

            // ✅ REMOVIDO: Fallback desnecessário pois shipping_status já não é enviado
            console.warn(`⚠️ [CONTA ${accountId.slice(0, 8)}...] Erro persistente, pulando conta`);
            
            failedAccounts.push(accountId);
            accountErrors.push({
              accountId,
              error: error?.message || data?.error || 'Erro desconhecido',
              status: String(data?.status || error?.status || 'unknown')
            });
            continue;

            // ✅ FINAL: Se ainda há erro após segunda tentativa
            if (error || data?.status >= 400) {
              const finalError = error?.message || data?.error || data?.detail || 'Erro desconhecido';
              console.error(`🚨 [CONTA ${accountId.slice(0, 8)}...] Erro crítico:`, finalError);
              
              failedAccounts.push(accountId);
              accountErrors.push({
                accountId,
                error: finalError,
                status: data?.status || error?.status || 'unknown'
              });
              continue;
            }
          }
          
          // ✅ VERIFICAÇÃO FINAL: Sucesso após fallback
          if (!error && data?.ok) {
            console.log(`✅ [CONTA ${accountId.slice(0, 8)}...] Dados recebidos com sucesso`);
          } else {
            const errorType = error?.message || data?.error || 'unknown';
            console.error(`❌ [CONTA ${accountId.slice(0, 8)}...] Erro final: ${errorType}`);
            
            failedAccounts.push(accountId);
            continue; // Pular conta com erro
          }
          
          if (data?.ok) {
            const accountResults = (data.results && data.results.length ? data.results : (data.pedidos || []));
            const accountUnified = (data.unified && data.unified.length ? data.unified : (data.pedidos || []));
            
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
            successfulAccounts.push(accountId);
            
            console.log(`✅ [CONTA ${accountId.slice(0, 8)}...] ${accountResults.length} pedidos encontrados`);
          }
        } catch (accountError: any) {
          console.error(`❌ [CONTA ${accountId.slice(0, 8)}...] Exceção:`, accountError?.message || accountError);
          failedAccounts.push(accountId);
          // Continuar com outras contas mesmo se uma falhar
        }
      }
      
      // 🚨 FEEDBACK INTELIGENTE: Toast baseado no resultado agregado
      if (successfulAccounts.length === 0 && failedAccounts.length > 0) {
        // Todas as contas falharam
        const hasTokenIssues = failedAccounts.length > 0; // Simplificado pois não temos detalhes aqui
        if (hasTokenIssues) {
          toast.error('❌ Todas as contas ML precisam ser reconectadas. Verifique o seletor de contas acima.', {
            duration: 6000,
          });
        } else {
          toast.error('❌ Erro ao buscar pedidos de todas as contas selecionadas');
        }
      } else if (failedAccounts.length > 0 && successfulAccounts.length > 0) {
        // Sucesso parcial
        toast.error(`⚠️ ${failedAccounts.length} conta(s) com problema, ${successfulAccounts.length} funcionando`, {
          duration: 4000,
        });
      } else if (successfulAccounts.length > 0) {
        // Sucesso total - sem toast para não ser intrusivo
        console.log(`🎯 [MULTI-CONTA] Sucesso total: ${successfulAccounts.length} contas`);
      }
      
      console.log(`🎯 [MULTI-CONTA] Resultado final: ${allResults.length} pedidos de ${successfulAccounts.length}/${apiParams.integration_account_ids.length} contas`);
      
      return {
        results: allResults,
        unified: allUnified,
        total: totalCount,
        paging: { total: totalCount, limit: pageSize, offset: (currentPage - 1) * pageSize },
        serverStatusApplied: false, // ✅ AUDITORIA: shipping_status não é mais enviado para API
        _multiAccount: true,
        _accountStats: {
          total: apiParams.integration_account_ids.length,
          successful: successfulAccounts.length,
          failed: failedAccounts.length,
          successfulAccounts,
          failedAccounts
        }
      };
    }
    
    // 🔧 AUDITORIA: Lógica original para conta única
    if (!apiParams?.integration_account_id && !apiParams?.integration_account_ids && !integrationAccountId) {
      throw new Error('integration_account_id ou integration_account_ids é obrigatório mas não foi fornecido');
    }

    const finalAccountId = apiParams?.integration_account_id || integrationAccountId;
    
    // 🚨 VERIFICAÇÃO FINAL: Se não há integration_account_id e não há array, erro crítico
    if (!finalAccountId && !apiParams?.integration_account_ids) {
      console.error('❌ [loadOrders] Nenhum integration_account_id ou integration_account_ids válido');
      throw new Error('integration_account_id ou integration_account_ids é obrigatório');
    }

    // 🛍️ SHOPEE: Detectar se é conta Shopee e usar serviço específico
    if (finalAccountId && apiParams?._shopeeAccount) {
      console.log('🛍️ [loadOrders] Detectada conta Shopee, usando serviço específico');
      
      const shopeeParams = {
        integration_account_id: finalAccountId,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        ...(rest.status ? { status: rest.status } : {}),
        ...(rest.q ? { q: rest.q } : {}),
        ...(rest.date_from ? { date_from: rest.date_from } : {}),
        ...(rest.date_to ? { date_to: rest.date_to } : {})
      };

      const shopeeResult = await fetchShopeeOrders(shopeeParams);
      
      return {
        results: shopeeResult.rows.map(row => row.raw).filter(Boolean),
        unified: shopeeResult.rows.map(row => row.unified).filter(Boolean),
        total: shopeeResult.total,
        paging: { total: shopeeResult.total, limit: pageSize, offset: (currentPage - 1) * pageSize },
        serverStatusApplied: false,
        _provider: 'shopee'
      };
    }

    const requestBody = {
      ...(finalAccountId ? { integration_account_id: finalAccountId } : {}),
      ...(apiParams?.integration_account_ids ? { integration_account_ids: apiParams.integration_account_ids } : {}),
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...(rest.shipping_status ? { shipping_status: rest.shipping_status } : {}),
      ...(rest.status ? { status: rest.status } : {}),
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
    
    console.groupCollapsed('[query/network]');
    console.groupEnd();

    let data: any | null = null;
    let error: any | null = null;
    try {
      ({ data, error } = await supabase.functions.invoke('unified-orders', {
        body: requestBody
      }));
    } catch (e: any) {
      error = e;
    }

    // ✅ REMOVIDO: Fallback desnecessário - statusEnvio não é mais enviado para API
    if (error || !data?.ok) {
      console.warn('⚠️ unified-orders falhou, verificando erro...');
      // Apenas relatar erro, não tentar novamente
      console.error('❌ [unified-orders] Erro final:', error?.message || data?.error || 'Erro desconhecido');
    }

    if (error) throw new Error(error.message || 'unified-orders: erro na função');
    if (!data?.ok) throw new Error('Erro na resposta da API');

    return {
      results: (data.results && data.results.length ? data.results : (data.pedidos || [])),
      unified: (data.unified && data.unified.length ? data.unified : (data.pedidos || [])),
      total: data.paging?.total || data.paging?.count || data.total || (Array.isArray(data.results) ? data.results.length : Array.isArray(data.pedidos) ? data.pedidos.length : 0),
      paging: data.paging || undefined,
      serverStatusApplied: Boolean(rest.shipping_status)
    };
  }, [integrationAccountId, currentPage, pageSize, getUrlParams]);

  /**
   * Fallback para banco de dados
   */
  const loadFromDatabase = useCallback(async (apiParams: any) => {
    // 🔁 Fallback real: buscar pedidos no banco com RPC segura
    try {
      const q = apiParams?.q ?? undefined;
      const start = apiParams?.date_from ?? undefined; // 'YYYY-MM-DD'
      const end = apiParams?.date_to ?? undefined;     // 'YYYY-MM-DD'

      // Desabilitado temporariamente para evitar loop de erros 404
      console.warn('[DB Fallback] RPC get_pedidos_masked desabilitada (função não existe)');
      const rows: any[] = [];

      // Aplica filtro de conta (se houver)
      const targetAccountId = apiParams?.integration_account_id;
      const filtered = targetAccountId
        ? rows.filter((r: any) => r.integration_account_id === targetAccountId)
        : rows;

      console.log(`[DB Fallback] Buscando no banco: search=${q}, dates=${start} to ${end}`);
      return { results: filtered, unified: [], total: filtered.length };
    } catch (e: any) {
      console.error('[DB Fallback] Erro ao buscar no banco:', e?.message || e);
      return { results: [], unified: [], total: 0 };
    }
  }, [currentPage, pageSize]);

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

      // ✅ REMOVIDO: Filtro de status de envio (statusEnvio) foi removido

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

      // ✅ Filtros removidos: cidade, uf, valorMin, valorMax

      return true;
    });
  }, [filters]); // Dependência otimizada - usar filters diretamente

  /**
   * 🚨 AJUSTE 3: Função para forçar refresh de tokens das contas ML
   */
  const refreshMLTokens = useCallback(async (accountIds: string[]) => {
    const promises = accountIds.map(async (accountId) => {
      try {
        console.log(`🔄 [REFRESH] Atualizando token da conta ${accountId.slice(0, 8)}...`);
        
        const { data, error } = await supabase.functions.invoke('mercadolibre-token-refresh', {
          body: { integration_account_id: accountId }
        });
        
        if (error || !data?.ok) {
          console.error(`❌ [REFRESH] Falha ao atualizar token ${accountId.slice(0, 8)}:`, error?.message || data?.error);
          return { accountId, success: false, error: error?.message || data?.error };
        }
        
        console.log(`✅ [REFRESH] Token atualizado com sucesso para ${accountId.slice(0, 8)}`);
        return { accountId, success: true };
      } catch (e: any) {
        console.error(`❌ [REFRESH] Exceção ao atualizar token ${accountId.slice(0, 8)}:`, e?.message);
        return { accountId, success: false, error: e?.message };
      }
    });
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0) {
      toast.success(`✅ ${successful} conta(s) reconectada(s) com sucesso!`);
    }
    if (failed > 0) {
      toast.error(`❌ ${failed} conta(s) falharam na reconexão`);
    }
    
    return results;
  }, []);

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
  const loadOrders = useCallback(async (forceRefresh = false, overrideFilters?: PedidosFilters) => {
    // ✅ CRÍTICO: Usar override ou filtros atuais
    const filtersToUse = overrideFilters ?? filters;
    
    const filtersKey = stableSerializeFilters(filtersToUse);
    const apiParams = buildApiParams(filtersToUse);
    
    // 🚨 CORREÇÃO: Se buildApiParams retorna null, não há contas disponíveis
    if (!apiParams) {
      console.log('[fetch:skip] buildApiParams retornou null - aguardando contas serem carregadas');
      return;
    }
    
    const cacheKey = getCacheKey({ ...apiParams, __filters_key: filtersKey });

    // 🚨 FIX 2: Controle de concorrência com AbortController + requestId
    const reqId = ++requestIdRef.current;
    
    // Abortar request anterior antes de iniciar novo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      
    }
    abortControllerRef.current = new AbortController();
    
    

    // Se a mesma query já foi executada recentemente e está carregando, evitar duplicar
    if (!forceRefresh && lastQuery === cacheKey && loading) {
      return;
    }
    // Atualiza a última query com a chave completa (inclui paginação/conta)
    setLastQuery(cacheKey);

    // 🚨 CORREÇÃO: Agora que buildApiParams já validou, não precisamos verificar novamente
    // A validação de contas já foi feita em buildApiParams

    

    // 🚨 Cancelamento já feito acima com novo requestId

    // 🚀 FASE 2: Verificar cache - IGNORAR quando forceRefresh = true
    if (!forceRefresh && isCacheValid(cacheKey) && orders.length > 0) {
      console.log('[query/skip] cache-hit - usando dados em cache (orders em memória)');
      return;
    }
    if (!forceRefresh && isCacheValid(cacheKey) && orders.length === 0) {
      console.log('[query/skip:ignored] cache-key válido, mas não há dados em memória → refetch');
    }
    
    // ✅ CRÍTICO: Quando forceRefresh = true, sempre invalidar cache e limpar UI antiga
    if (forceRefresh) {
      console.log('🔄 [LOAD ORDERS] ForceRefresh = true, invalidando cache completamente');
      setCachedAt(undefined);
      setLastQuery('');
      setOrders([]); // Sem keepPreviousData na UI
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
    // CORREÇÃO: Preservar dados RAW mesmo ao usar dados UNIFIED
    const baseList = (unifiedResult as any).unified && (unifiedResult as any).unified.length
      ? (unifiedResult as any).unified
      : (unifiedResult as any).results;
    const rawList = (unifiedResult as any).results || [];
    
    const shouldApplyClientFilter = false; // ✅ REMOVIDO: statusEnvio não existe mais
    const filteredClientResults = shouldApplyClientFilter
      ? applyClientSideFilters(baseList)
      : baseList;

    // CRÍTICO: Combinar dados unified + raw para preservar todas as informações
    const normalizedResults = filteredClientResults.map((o: any, index: number) => {
      // Buscar correspondente nos dados RAW para preservar informações completas
      const rawData = rawList.find((r: any) => r.id === o.id) || rawList[index] || {};
      
      // 🔍 DEBUG: Verificar estrutura de dados recebida
      if (index === 0) {
        console.log('🔍 [CAMPOS EMPRESA/LOGÍSTICA] Primeiro pedido:', {
          id: o.id || rawData.id,
          empresa: o.empresa || rawData.empresa,
          marketplace_origem: o.marketplace_origem || rawData.marketplace_origem,
          tipo_logistico: o.tipo_logistico || rawData.tipo_logistico,
          tipo_logistico_raw: o.tipo_logistico_raw || rawData.tipo_logistico_raw,
          has_empresa: !!(o.empresa || rawData.empresa),
          has_marketplace: !!(o.marketplace_origem || rawData.marketplace_origem),
          has_tipo_logistico: !!(o.tipo_logistico || rawData.tipo_logistico),
          first_payment_payer: o.payments?.[0]?.payer?.identification?.number,
          raw_first_payment_payer: rawData.payments?.[0]?.payer?.identification?.number
        });
      }
      
      // ✅ CORREÇÃO: Extração direta com prioridade correta incluindo raw
      const extractCpfCnpjLocal = (order: any): string => {
        // Buscar de múltiplas fontes prioritárias (incluindo raw)
        const rawDoc = order.cpf_cnpj || 
                       order.unified?.cpf_cnpj || 
                       order.documento_cliente ||
                       order.cliente_documento ||
                       order.buyer?.identification?.number ||
                       order.raw?.buyer?.identification?.number ||
                       order.payments?.[0]?.payer?.identification?.number ||
                       order.unified?.payments?.[0]?.payer?.identification?.number ||
                       order.raw?.payments?.[0]?.payer?.identification?.number;
        
        return rawDoc ? rawDoc.toString().trim() : '';
      };

      const cpfCnpjValue = extractCpfCnpjLocal(o) || extractCpfCnpjLocal(rawData);
      
      // 🔍 DEBUG: Log para TODOS os pedidos (apenas em dev)
      if (isDev) console.log(`[CPF/CNPJ] Pedido ${o.id || rawData.id}: ${cpfCnpjValue || 'VAZIO'} (length: ${cpfCnpjValue?.length || 0})`);

      return {
        ...o,
        // Preservar dados RAW para compatibilidade com colunas avançadas
        raw: rawData,
        // Garantir que campos importantes tenham fallback para RAW
        payments: o.payments || rawData.payments,
        shipping: o.shipping || rawData.shipping,
        order_items: o.order_items || rawData.order_items,
        tags: o.tags || rawData.tags,
        cpf_cnpj: cpfCnpjValue,
        // 🔧 Flatten para colunas "Tipo Método Envio" e "Tipo Entrega"
        shipping_method_type:
          o.shipping_method_type ||
          o.tipo_metodo_envio ||
          o.shipping_method?.type ||
          (o.shipping && o.shipping.shipping_method?.type) ||
          (o.unified && o.unified.shipping?.shipping_method?.type) ||
          (rawData && rawData.shipping?.shipping_method?.type) ||
          (o.shipping_details && o.shipping_details.shipping_method?.type) ||
          undefined,
        delivery_type:
          o.delivery_type ||
          o.tipo_entrega ||
          (o.shipping && o.shipping.delivery_type) ||
          (o.unified && o.unified.shipping?.delivery_type) ||
          (o.shipping_details && o.shipping_details.delivery_type) ||
          (rawData && rawData.shipping?.delivery_type) ||
          undefined,
        
        // ⭐ NOVOS CAMPOS DE STATUS DETALHADOS DA API
        order_status:
          o.order_status ||
          o.status ||
          rawData.status ||
          o.unified?.status ||
          undefined,
        order_status_detail:
          o.order_status_detail ||
          o.status_detail ||
          rawData.status_detail ||
          o.unified?.status_detail ||
          undefined,
        shipping_status:
          o.shipping_status ||
          o.shipping?.status ||
          rawData.shipping?.status ||
          o.shipping_details?.status ||
          o.unified?.shipping?.status ||
          undefined,
        shipping_substatus:
          o.shipping_substatus ||
          o.shipping?.substatus ||
          rawData.shipping?.substatus ||
          o.shipping_details?.substatus ||
          o.unified?.shipping?.substatus ||
          undefined,
      };
    });
        // 🚨 FIX 2: Evitar respostas fora de ordem
        if (reqId !== requestIdRef.current) {
          console.log(`[fetch:dropped id=${reqId}] - request overtaken`);
          return;
        }
        
        // Se página sem resultados, manter página atual e exibir vazio
        if (normalizedResults.length === 0 && currentPage > 1) {
          console.log(`[paging] page=${currentPage} sem resultados`);
          // Não forçar retorno para página 1
        }
        
        console.log(`[fetch:success id=${reqId}] total=${unifiedResult.total}`);
        setOrders(normalizedResults);
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
        console.error('❌ [loadOrders] Erro na unified-orders:', unifiedError?.message);
        
        // 🚨 AJUSTE 3: Auto-refresh de tokens quando há erro de autenticação
        const isTokenError = unifiedError?.message?.includes('reconnect_required') || 
                            unifiedError?.message?.includes('no_tokens') ||
                            unifiedError?.message?.includes('401');
        
        if (isTokenError && (apiParams.integration_account_ids || apiParams.integration_account_id)) {
          const accountsToRefresh = apiParams.integration_account_ids || [apiParams.integration_account_id];
          
          toast('🔄 Detectado problema de token, tentando reconectar automaticamente...');
          
          try {
            const refreshResults = await refreshMLTokens(accountsToRefresh);
            const successfulRefresh = refreshResults.filter(r => r.success);
            
            if (successfulRefresh.length > 0) {
              toast.success('✅ Tokens atualizados! Tentando buscar pedidos novamente...');
              
              // Tentar novamente após refresh
              const retryResult = await loadFromUnifiedOrders(apiParams);
              const retryBase = (retryResult as any).unified && (retryResult as any).unified.length
                ? (retryResult as any).unified
                : (retryResult as any).results;
              const retryRaw = (retryResult as any).results || [];
              const retryFiltered = applyClientSideFilters(retryBase);
              
              // Combinar unified + raw nos dados de retry também
              const retryNormalized = retryFiltered.map((o: any, index: number) => {
                const rawData = retryRaw.find((r: any) => r.id === o.id) || retryRaw[index] || {};
                return {
                  ...o,
                  raw: rawData,
                  payments: o.payments || rawData.payments,
                  shipping: o.shipping || rawData.shipping,
                  order_items: o.order_items || rawData.order_items,
                  tags: o.tags || rawData.tags,
                };
              });
              
              setOrders(retryNormalized);
              setTotal(retryResult.total || retryNormalized.length);
              setFonte('tempo-real');
              setCachedAt(new Date());
              setLastQuery(cacheKey);
              
              return; // Sucesso após refresh!
            }
          } catch (refreshError: any) {
            console.error('❌ [loadOrders] Falha no auto-refresh:', refreshError?.message);
            toast.error('❌ Falha na reconexão automática. Reconecte manualmente nas configurações.');
          }
        }
        
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
          
          const normalizedPaginated = paginatedResults.map((o: any) => {
            const extractDeep = (root: any): string | null => {
              const seen = new Set<any>();
              const queue: any[] = [root];
              const keyPriority = /(cpf|cnpj|doc|document|identif|tax)/i;
              let steps = 0;
              while (queue.length && steps < 800) {
                const node = queue.shift();
                steps++;
                if (!node || seen.has(node)) continue;
                seen.add(node);
                if (typeof node === 'string' || typeof node === 'number') {
                  const digits = String(node).replace(/\D/g, '');
                  if (digits.length === 11 || digits.length === 14) return digits;
                } else if (Array.isArray(node)) {
                  for (const child of node) queue.push(child);
                } else if (typeof node === 'object') {
                  const entries = Object.entries(node);
                  const prioritized = entries.filter(([k]) => keyPriority.test(k));
                  const others = entries.filter(([k]) => !keyPriority.test(k));
                  for (const [, v] of [...prioritized, ...others]) queue.push(v);
                }
              }
              return null;
            };

            const direct =
              o.cpf_cnpj ??
              o.unified?.cpf_cnpj ??
              o.documento_cliente ??
              o.cliente_documento ??
              o.buyer?.identification?.number ??
              o.raw?.buyer?.identification?.number ??
              o.payments?.[0]?.payer?.identification?.number ??
              o.unified?.payments?.[0]?.payer?.identification?.number ??
              o.raw?.payments?.[0]?.payer?.identification?.number ??
              null;

            return { ...o, cpf_cnpj: direct ?? extractDeep(o) };
          });
          // 🚨 FIX 2: Evitar respostas fora de ordem
          if (reqId !== requestIdRef.current) {
            console.log(`[fetch:dropped id=${reqId}] - request overtaken`);
            return;
          }
          
          // Se página sem resultados no fallback client-side, manter página atual
          if (paginatedResults.length === 0 && currentPage > 1) {
            console.log(`[paging] page=${currentPage} sem resultados (fallback client-side)`);
            // Não forçar retorno para página 1
          }
          
          console.log(`[fetch:success id=${reqId}] total=${filteredResults.length}`);
          setOrders(normalizedPaginated);
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
          const normalizedDbResults = (dbResult.results || []).map((o: any) => {
            const extractDeep = (root: any): string | null => {
              const seen = new Set<any>();
              const queue: any[] = [root];
              const keyPriority = /(cpf|cnpj|doc|document|identif|tax)/i;
              let steps = 0;
              while (queue.length && steps < 800) {
                const node = queue.shift();
                steps++;
                if (!node || seen.has(node)) continue;
                seen.add(node);
                if (typeof node === 'string' || typeof node === 'number') {
                  const digits = String(node).replace(/\D/g, '');
                  if (digits.length === 11 || digits.length === 14) return digits;
                } else if (Array.isArray(node)) {
                  for (const child of node) queue.push(child);
                } else if (typeof node === 'object') {
                  const entries = Object.entries(node);
                  const prioritized = entries.filter(([k]) => keyPriority.test(k));
                  const others = entries.filter(([k]) => !keyPriority.test(k));
                  for (const [, v] of [...prioritized, ...others]) queue.push(v);
                }
              }
              return null;
            };

            const direct =
              o.cpf_cnpj ??
              o.unified?.cpf_cnpj ??
              o.documento_cliente ??
              o.cliente_documento ??
              o.buyer?.identification?.number ??
              o.raw?.buyer?.identification?.number ??
              o.payments?.[0]?.payer?.identification?.number ??
              o.unified?.payments?.[0]?.payer?.identification?.number ??
              o.raw?.payments?.[0]?.payer?.identification?.number ??
              null;

            return { ...o, cpf_cnpj: direct ?? extractDeep(o) };
          });
          // 🚨 FIX 2: Evitar respostas fora de ordem
          if (reqId !== requestIdRef.current) {
            console.log(`[fetch:dropped id=${reqId}] - request overtaken`);
            return;
          }
          
          // 🚨 FIX 1: Fallback automático se página fora de alcance
          if (normalizedDbResults.length === 0 && currentPage > 1) {
            console.log(`[paging/fallback] page=${currentPage} & empty → page=1`);
            setCurrentPage(1);
            // Refetch com página 1
            loadOrders(forceRefresh, filtersToUse);
            return;
          }
          
          console.log(`[fetch:success id=${reqId}] total=${dbResult.total}`);
          setOrders(normalizedDbResults);
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
      // ❗ Corrigir cache fantasma após erro: invalida para evitar "cache-hit"
      setCachedAt(undefined);
      setLastQuery(undefined);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, integrationAccountId, currentPage, pageSize, buildApiParams, loadFromUnifiedOrders, loadFromDatabase, applyClientSideFilters, getCacheKey, isCacheValid]);

  // 🚀 FASE 3: Exportação de dados
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      setLoading(true);
      
      // ✅ CORRIGIDO: Carregar todos os dados sem paginação usando filters atuais
    const apiParams = buildApiParams(debouncedFilters);
      if (!apiParams) {
        throw new Error('Nenhuma conta disponível para exportação');
      }
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
    
    // Evitar auto-load duplicado gerado pelo effect
    skipNextAutoLoadRef.current = true;
    
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

    console.groupCollapsed('[filters/set]');
    const newHash = stableSerializeFilters(cleaned);
    console.log('applied', cleaned, 'hash', newHash);
    console.groupEnd();

    const prevKey = lastQuery;
    console.groupCollapsed('[invalidate]');
    console.log('key', prevKey);
    console.log('before', { cachedAt, lastQuery });
    console.groupEnd();

    setFiltersState(cleaned);
    setCurrentPage(1);
    // Invalida completamente o cache para garantir atualização imediata
    setCachedAt(undefined);
    setLastQuery(undefined);

    console.groupCollapsed('[invalidate]');
    console.log('after', { cachedAt: undefined, lastQuery: undefined });
    console.groupEnd();

    // Log de paginação para auditoria
    console.log(`[paging] before apply page=${currentPage} → after apply page=1`);
    // Evitar auto-load duplicado gerado pelo effect
    skipNextAutoLoadRef.current = true;

    // 🚀 Buscar imediatamente usando os filtros já normalizados/limpos
    loadOrders(true, cleaned);
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
    console.log('📄 [setPage] Mudando para página:', page, 'atual:', currentPage);
    setCurrentPage(page);
    // ✅ FORÇAR REFETCH quando página muda
    const cacheKey = getCacheKey({ currentPage: page, pageSize, integrationAccountId });
    setCachedAt(undefined);
    setLastQuery(undefined);
    console.log('📄 [setPage] Cache invalidado para forçar nova busca na página', page);
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
    console.groupCollapsed('[refetch] dispatch - FORÇA ATUALIZAÇÃO');
    console.log('lastQuery', lastQuery);
    console.log('filters atuais', filters);
    console.groupEnd();
    
    // ✅ CRÍTICO: Invalidar cache e forçar nova busca
    setCachedAt(undefined);
    setLastQuery(undefined);
    
    // ✅ CRÍTICO: Usar filtros atuais, não debounced
    const apiParams = buildApiParams(filters);
    if (!apiParams) {
      console.log('[refetch:skip] buildApiParams retornou null - aguardando contas serem carregadas');
      return;
    }
    const filtersKey = stableSerializeFilters(filters);
    const cacheKey = getCacheKey({ ...apiParams, __filters_key: filtersKey });
    
    console.log('🚀 [REFETCH] Cache invalidado, forçando nova busca com cacheKey:', cacheKey);
    loadOrders(true);
  },
  
  applyClientSideFilters,
  exportData,
  saveCurrentFilters,
  loadSavedFilters,
  getSavedFilters,
  
  // 🔄 PERSISTÊNCIA: Restaurar dados sem refetch
  restorePersistedData: (persistedOrders: any[], persistedTotal: number, persistedPage: number) => {
    console.log('🔄 [usePedidosManager] Restaurando dados persistidos:', {
      orders: persistedOrders.length,
      total: persistedTotal,
      page: persistedPage
    });
    
    setOrders(persistedOrders);
    setTotal(persistedTotal);
    setCurrentPage(persistedPage);
    setFonte('banco'); // Indicar que são dados restaurados
    setCachedAt(new Date());
  },
  
  // 🚨 AJUSTE 3: Expor função de refresh de tokens
  refreshMLTokens
}), [applyFilters, loadOrders, applyClientSideFilters, exportData, saveCurrentFilters, loadSavedFilters, getSavedFilters, refreshMLTokens]);

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
    // Removido o bloqueio estrito por integrationAccountId para suportar múltiplas contas

    // Evitar chamada duplicada imediatamente após um loadOrders(true)
    if (skipNextAutoLoadRef.current) {
      console.log('[auto-load:skip] prevented duplicate after explicit load');
      skipNextAutoLoadRef.current = false;
      return;
    }
    
    console.log('🔄 [usePedidosManager] Carregamento automático:', { 
      integrationAccountId: integrationAccountId ? integrationAccountId.slice(0, 8) : '(multi/none)', 
      currentPage, 
      hasFilters: Object.keys(filters).length > 0,
      filtersDebug: filters
    });
    
    // ✅ SOLUÇÃO: Carregamento automático quando filtros mudam (query chaveada)
    loadOrders();
    
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