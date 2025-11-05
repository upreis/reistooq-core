/**
 * 🎯 ETAPA 3.1 - SISTEMA HÍBRIDO: URL + localStorage
 * Hook que gerencia filtros através de URL params COM fallback para localStorage
 * 
 * ARQUITETURA MELHORADA:
 * 1. URL é a fonte primária de verdade para filtros (compartilhável)
 * 2. localStorage é usado como BACKUP quando URL está vazia
 * 3. URLs compartilháveis funcionam 100%
 * 4. Navegação interna preserva filtros via localStorage
 * 
 * BENEFÍCIOS:
 * - ✅ URLs compartilháveis (copiar/colar link mantém filtros)
 * - ✅ Navegação interna preserva filtros (via localStorage)
 * - ✅ Browser history funciona perfeitamente
 * - ✅ Melhor UX: filtros persistem mesmo sem query params na URL
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PedidosFiltersState } from './usePedidosFiltersUnified';

const isDev = process.env.NODE_ENV === 'development';
const STORAGE_KEY = 'pedidos_filters_backup_v1'; // ✅ Key para backup no localStorage

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

/**
 * Salvar filtros no localStorage como backup
 */
function saveFiltersToStorage(filters: PedidosFiltersState): void {
  try {
    const serialized = JSON.stringify(filters);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (isDev) console.log('💾 [SYNC] Filtros salvos no localStorage (backup)');
  } catch (error) {
    console.error('❌ [SYNC] Erro ao salvar filtros no localStorage:', error);
  }
}

/**
 * Carregar filtros do localStorage (fallback)
 */
function loadFiltersFromStorage(): PedidosFiltersState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Converter datas string para Date
    if (parsed.dataInicio && typeof parsed.dataInicio === 'string') {
      const [year, month, day] = parsed.dataInicio.split('-').map(Number);
      parsed.dataInicio = new Date(year, month - 1, day);
    }
    
    if (parsed.dataFim && typeof parsed.dataFim === 'string') {
      const [year, month, day] = parsed.dataFim.split('-').map(Number);
      parsed.dataFim = new Date(year, month - 1, day);
    }
    
    if (isDev) console.log('📂 [SYNC] Filtros carregados do localStorage (backup):', parsed);
    return parsed;
  } catch (error) {
    console.error('❌ [SYNC] Erro ao carregar filtros do localStorage:', error);
    return {};
  }
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
   * LER filtros (prioriza URL, fallback para localStorage)
   */
  const currentFilters = useMemo((): PedidosFiltersState => {
    if (!enabled) return {};
    
    const urlFilters = urlParamsToFilters(searchParams);
    
    // ✅ Se URL tem filtros, usar (prioridade)
    if (Object.keys(urlFilters).length > 0) {
      if (isDev) console.log('📍 [SYNC] Filtros lidos da URL (prioridade):', urlFilters);
      return urlFilters;
    }
    
    // ✅ Se URL vazia, tentar restaurar do localStorage
    const storageFilters = loadFiltersFromStorage();
    if (Object.keys(storageFilters).length > 0) {
      if (isDev) console.log('📂 [SYNC] Filtros restaurados do localStorage (fallback):', storageFilters);
      return storageFilters;
    }
    
    return {};
  }, [enabled, searchParams]);
  
  /**
   * ESCREVER filtros (atualiza URL E localStorage)
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
    
    // ✅ ATUALIZAR URL (fonte primária)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true });
    
    // ✅ SALVAR NO localStorage (backup)
    saveFiltersToStorage(filters);
    
    if (isDev) console.log(`📍 [SYNC] Filtros salvos (URL + localStorage) [${source}]:`, { url: params.toString(), filters });
  }, [enabled, setSearchParams]);
  
  /**
   * LIMPAR filtros (remove da URL E localStorage)
   */
  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    localStorage.removeItem(STORAGE_KEY);
    
    if (isDev) console.log('🗑️ [SYNC] Filtros removidos (URL + localStorage)');
  }, [enabled, setSearchParams]);
  
  /**
   * INICIALIZAÇÃO: Verificar se há filtros (URL ou localStorage)
   */
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    
    const hasURLParams = searchParams.toString().length > 0;
    const storageFilters = loadFiltersFromStorage();
    const hasStorageFilters = Object.keys(storageFilters).length > 0;
    
    if (isDev) {
      if (hasURLParams) {
        console.log('📍 [SYNC] Inicializado com filtros da URL');
      } else if (hasStorageFilters) {
        console.log('📂 [SYNC] Inicializado com filtros do localStorage');
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
    source: currentFilters && Object.keys(currentFilters).length > 0 
      ? (searchParams.toString().length > 0 ? 'url' : 'localStorage') 
      : 'none' as const,
    isEnabled: enabled
  };
}
