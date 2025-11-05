/**
 * 🎯 ETAPA 3 - SISTEMA 100% BASEADO EM URL PARAMS
 * Hook que gerencia filtros exclusivamente através de URL params
 * 
 * ARQUITETURA FINAL:
 * 1. URL é a ÚNICA fonte de verdade para filtros
 * 2. LocalStorage usado APENAS para cache de dados
 * 3. URLs compartilháveis funcionam 100%
 * 4. Browser history funciona perfeitamente
 * 
 * BENEFÍCIOS:
 * - ✅ URLs compartilháveis (copiar/colar link mantém filtros)
 * - ✅ Bookmarks funcionam corretamente
 * - ✅ Navegação back/forward do browser
 * - ✅ Código mais simples e confiável
 * - ✅ Zero dependência de localStorage para filtros
 * - ✅ Separação clara: URL (filtros) vs LocalStorage (cache de dados)
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PedidosFiltersState } from './usePedidosFiltersUnified';

const isDev = process.env.NODE_ENV === 'development';

interface UsePedidosFiltersSyncOptions {
  enabled?: boolean; // Permite desabilitar sync durante testes
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
    enabled = true
  } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const lastSyncedRef = useRef<string>('');
  const isMountedRef = useRef(true); // ✅ FIX P5: Flag de montagem
  
  // ✅ FIX P5: Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  
  /**
   * LER filtros (100% da URL - sem fallback)
   */
  const currentFilters = useMemo((): PedidosFiltersState => {
    if (!enabled) return {};
    
    const urlFilters = urlParamsToFilters(searchParams);
    
    if (isDev && Object.keys(urlFilters).length > 0) {
      console.log('📍 [SYNC] Filtros lidos da URL:', urlFilters);
    }
    
    return urlFilters;
  }, [enabled, searchParams]);
  
  /**
   * ESCREVER filtros (atualiza apenas URL)
   */
  const writeFilters = useCallback((filters: PedidosFiltersState, source: 'user' | 'restore' = 'user') => {
    if (!enabled || !isMountedRef.current) return;
    
    // Serializar para comparação (evitar loops)
    const serialized = JSON.stringify(filters);
    if (serialized === lastSyncedRef.current) {
      if (isDev) console.log('🔄 [SYNC] Filtros já sincronizados, pulando...');
      return;
    }
    lastSyncedRef.current = serialized;
    
    // ATUALIZAR URL (única fonte de verdade)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true }); // replace evita poluir histórico
    
    if (isDev) console.log(`📍 [SYNC] Filtros salvos na URL (${source}):`, { url: params.toString(), filters });
  }, [enabled, setSearchParams]);
  
  /**
   * LIMPAR filtros (remove apenas da URL)
   */
  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    
    if (isDev) console.log('🗑️ [SYNC] Filtros removidos da URL');
  }, [enabled, setSearchParams]);
  
  /**
   * INICIALIZAÇÃO: Marca como inicializado (sem migração localStorage)
   */
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    
    if (isDev) {
      const hasURLParams = searchParams.toString().length > 0;
      if (hasURLParams) {
        console.log('📍 [SYNC] Inicializado com filtros da URL');
      } else {
        console.log('📍 [SYNC] Inicializado sem filtros');
      }
    }
  }, [enabled, searchParams]);
  
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
    
    // Metadata
    source: 'url' as const, // Sempre URL agora
    isEnabled: enabled
  };
}
