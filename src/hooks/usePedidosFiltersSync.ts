/**
 * 🔄 ETAPA 2 - SINCRONIZAÇÃO URL + LOCALSTORAGE
 * Hook híbrido que gerencia filtros tanto na URL quanto no localStorage
 * 
 * ESTRATÉGIA DE MIGRAÇÃO GRADUAL:
 * 1. Lê da URL primeiro (prioridade)
 * 2. Fallback para localStorage se URL vazia
 * 3. Sincroniza mudanças em AMBOS os locais
 * 4. Mantém compatibilidade total com sistema atual
 * 
 * BENEFÍCIOS:
 * - ✅ URLs compartilháveis (copiar/colar link mantém filtros)
 * - ✅ Bookmark funciona corretamente
 * - ✅ Navegação back/forward do browser
 * - ✅ Fallback seguro para localStorage
 * - ✅ Zero breaking changes
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PedidosFiltersState } from './usePedidosFiltersUnified';

const isDev = process.env.NODE_ENV === 'development';

interface UsePedidosFiltersSyncOptions {
  enabled?: boolean; // Permite desabilitar sync durante testes
  localStorageKey?: string;
}

/**
 * Converte filtros para params de URL (formato compacto)
 */
function filtersToURLParams(filters: PedidosFiltersState): URLSearchParams {
  const params = new URLSearchParams();
  
  // Search
  if (filters.search && filters.search.trim()) {
    params.set('q', filters.search.trim());
  }
  
  // Status do Pedido
  if (filters.statusPedido && filters.statusPedido.length > 0) {
    params.set('status', filters.statusPedido.join(','));
  }
  
  // Datas (formato YYYY-MM-DD)
  if (filters.dataInicio) {
    const date = filters.dataInicio instanceof Date ? filters.dataInicio : new Date(filters.dataInicio);
    if (!isNaN(date.getTime())) {
      params.set('from', date.toISOString().split('T')[0]);
    }
  }
  
  if (filters.dataFim) {
    const date = filters.dataFim instanceof Date ? filters.dataFim : new Date(filters.dataFim);
    if (!isNaN(date.getTime())) {
      params.set('to', date.toISOString().split('T')[0]);
    }
  }
  
  // Contas ML
  if (filters.contasML && filters.contasML.length > 0) {
    params.set('accounts', filters.contasML.join(','));
  }
  
  return params;
}

/**
 * Converte params de URL para filtros (parsing seguro)
 */
function urlParamsToFilters(params: URLSearchParams): PedidosFiltersState {
  const filters: PedidosFiltersState = {};
  
  // Search
  const search = params.get('q');
  if (search) {
    filters.search = search;
  }
  
  // Status do Pedido
  const status = params.get('status');
  if (status) {
    filters.statusPedido = status.split(',').filter(Boolean);
  }
  
  // Datas
  const from = params.get('from');
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    const [year, month, day] = from.split('-').map(Number);
    filters.dataInicio = new Date(year, month - 1, day);
  }
  
  const to = params.get('to');
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const [year, month, day] = to.split('-').map(Number);
    filters.dataFim = new Date(year, month - 1, day);
  }
  
  // Contas ML
  const accounts = params.get('accounts');
  if (accounts) {
    filters.contasML = accounts.split(',').filter(Boolean);
  }
  
  return filters;
}

export function usePedidosFiltersSync(
  options: UsePedidosFiltersSyncOptions = {}
) {
  const {
    enabled = true,
    localStorageKey = 'pedidos_unified_filters'
  } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const lastSyncedRef = useRef<string>('');
  
  /**
   * LER filtros (URL tem prioridade, fallback para localStorage)
   */
  const readFilters = useCallback((): PedidosFiltersState => {
    if (!enabled) return {};
    
    // 1. TENTAR LER DA URL PRIMEIRO
    const urlFilters = urlParamsToFilters(searchParams);
    const hasURLFilters = Object.keys(urlFilters).length > 0;
    
    if (hasURLFilters) {
      if (isDev) console.log('📍 [SYNC] Filtros lidos da URL:', urlFilters);
      return urlFilters;
    }
    
    // 2. FALLBACK: LER DO LOCALSTORAGE
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Converter datas string para Date
        if (parsed.dataInicio && typeof parsed.dataInicio === 'string') {
          parsed.dataInicio = new Date(parsed.dataInicio);
        }
        if (parsed.dataFim && typeof parsed.dataFim === 'string') {
          parsed.dataFim = new Date(parsed.dataFim);
        }
        
        if (isDev) console.log('💾 [SYNC] Filtros lidos do localStorage (fallback):', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('[SYNC] Erro ao ler localStorage:', error);
    }
    
    return {};
  }, [enabled, searchParams, localStorageKey]);
  
  /**
   * ESCREVER filtros (sincroniza URL + localStorage)
   */
  const writeFilters = useCallback((filters: PedidosFiltersState, source: 'user' | 'restore' = 'user') => {
    if (!enabled) return;
    
    // Serializar para comparação (evitar loops)
    const serialized = JSON.stringify(filters);
    if (serialized === lastSyncedRef.current) {
      if (isDev) console.log('🔄 [SYNC] Filtros já sincronizados, pulando...');
      return;
    }
    lastSyncedRef.current = serialized;
    
    // 1. ATUALIZAR URL (via react-router-dom)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true }); // replace evita poluir histórico
    
    // 2. ATUALIZAR LOCALSTORAGE (fallback)
    try {
      if (Object.keys(filters).length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(filters));
        if (isDev) console.log(`📍💾 [SYNC] Filtros salvos (${source}):`, { url: params.toString(), filters });
      } else {
        localStorage.removeItem(localStorageKey);
        if (isDev) console.log('🗑️ [SYNC] Filtros limpos');
      }
    } catch (error) {
      console.warn('[SYNC] Erro ao salvar localStorage:', error);
    }
  }, [enabled, setSearchParams, localStorageKey]);
  
  /**
   * LIMPAR filtros (remove de URL + localStorage)
   */
  const clearFilters = useCallback(() => {
    if (!enabled) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    
    try {
      localStorage.removeItem(localStorageKey);
      if (isDev) console.log('🗑️ [SYNC] Todos os filtros removidos');
    } catch (error) {
      console.warn('[SYNC] Erro ao limpar localStorage:', error);
    }
  }, [enabled, setSearchParams, localStorageKey]);
  
  /**
   * INICIALIZAÇÃO: Sincronizar localStorage → URL se URL estiver vazia
   */
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    
    // Se URL está vazia mas localStorage tem dados, migrar para URL
    const hasURLParams = searchParams.toString().length > 0;
    if (!hasURLParams) {
      try {
        const saved = localStorage.getItem(localStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Object.keys(parsed).length > 0) {
            const params = filtersToURLParams(parsed);
            setSearchParams(params, { replace: true });
            if (isDev) console.log('🔄 [SYNC] Migração inicial: localStorage → URL');
          }
        }
      } catch (error) {
        console.warn('[SYNC] Erro na migração inicial:', error);
      }
    } else {
      if (isDev) console.log('📍 [SYNC] URL já possui filtros, mantendo como fonte primária');
    }
  }, [enabled, searchParams, setSearchParams, localStorageKey]);
  
  /**
   * OBSERVAR mudanças na URL (browser back/forward)
   */
  const currentFilters = useMemo(() => {
    return readFilters();
  }, [searchParams, readFilters]);
  
  /**
   * Verificar se há filtros ativos
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof PedidosFiltersState];
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return !isNaN(value.getTime());
      return Boolean(value);
    });
  }, [currentFilters]);
  
  return {
    // Estado atual dos filtros (sempre sincronizado)
    filters: currentFilters,
    hasActiveFilters,
    
    // Ações
    writeFilters,
    clearFilters,
    readFilters,
    
    // Metadata
    source: searchParams.toString().length > 0 ? 'url' : 'localStorage',
    isEnabled: enabled
  };
}
