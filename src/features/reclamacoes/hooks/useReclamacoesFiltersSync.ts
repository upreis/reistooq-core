/**
 * 🔗 HOOK DE SINCRONIZAÇÃO DE FILTROS COM URL
 * PADRÃO COMBO 2.1: Sincronizar filtros com URL + localStorage (fallback)
 * Usa startDate/endDate (Date objects) ao invés de periodo (string)
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subDays, startOfDay, endOfDay, format, parseISO, isValid } from 'date-fns';
import { STORAGE_KEYS } from '../constants/storage-keys';

const isDev = import.meta.env.DEV;
const STORAGE_KEY = STORAGE_KEYS.FILTERS;
const DEFAULT_ITEMS_PER_PAGE = 50;

export interface ReclamacoesFilters {
  startDate?: Date;
  endDate?: Date;
  status: string;
  type: string;
  stage: string;
  selectedAccounts: string[];
  currentPage: number;
  itemsPerPage: number;
  activeTab: 'ativas' | 'historico';
}

// Defaults com datas (últimos 7 dias)
export const DEFAULT_FILTERS: ReclamacoesFilters = {
  startDate: startOfDay(subDays(new Date(), 6)),
  endDate: endOfDay(new Date()),
  status: '',
  type: '',
  stage: '',
  selectedAccounts: [],
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
};

/**
 * Converte filtros para parâmetros de URL
 */
function filtersToURLParams(filters: ReclamacoesFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Datas - formato yyyy-MM-dd
  if (filters.startDate) {
    params.set('from', format(filters.startDate, 'yyyy-MM-dd'));
  }
  if (filters.endDate) {
    params.set('to', format(filters.endDate, 'yyyy-MM-dd'));
  }
  
  // Status
  if (filters.status && filters.status !== '') {
    params.set('status', filters.status);
  }
  
  // Type
  if (filters.type && filters.type !== '') {
    params.set('type', filters.type);
  }
  
  // Stage
  if (filters.stage && filters.stage !== '') {
    params.set('stage', filters.stage);
  }
  
  // Contas
  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }
  
  // Página (apenas se > 1)
  if (filters.currentPage && filters.currentPage > 1) {
    params.set('page', filters.currentPage.toString());
  }
  
  // Itens por página (apenas se diferente do padrão)
  if (filters.itemsPerPage && filters.itemsPerPage !== DEFAULT_ITEMS_PER_PAGE) {
    params.set('limit', filters.itemsPerPage.toString());
  }
  
  // Tab ativa (apenas se não for 'ativas')
  if (filters.activeTab && filters.activeTab !== 'ativas') {
    params.set('tab', filters.activeTab);
  }
  
  return params;
}

/**
 * Converte params de URL para filtros (parsing seguro)
 */
function urlParamsToFilters(params: URLSearchParams): Partial<ReclamacoesFilters> {
  const filters: Partial<ReclamacoesFilters> = {};
  
  // Datas
  const fromStr = params.get('from');
  if (fromStr) {
    const parsed = parseISO(fromStr);
    if (isValid(parsed)) {
      filters.startDate = startOfDay(parsed);
    }
  }
  
  const toStr = params.get('to');
  if (toStr) {
    const parsed = parseISO(toStr);
    if (isValid(parsed)) {
      filters.endDate = endOfDay(parsed);
    }
  }
  
  // Status
  const status = params.get('status');
  if (status) {
    filters.status = status;
  }
  
  // Type
  const type = params.get('type');
  if (type) {
    filters.type = type;
  }
  
  // Stage
  const stage = params.get('stage');
  if (stage) {
    filters.stage = stage;
  }
  
  // Contas
  const accounts = params.get('accounts');
  if (accounts) {
    filters.selectedAccounts = accounts.split(',').filter(Boolean);
  }
  
  // Página
  const page = params.get('page');
  if (page && /^\d+$/.test(page)) {
    filters.currentPage = parseInt(page, 10);
  }
  
  // Itens por página
  const limit = params.get('limit');
  if (limit && /^\d+$/.test(limit)) {
    filters.itemsPerPage = parseInt(limit, 10);
  }
  
  // Tab
  const tab = params.get('tab');
  if (tab === 'ativas' || tab === 'historico') {
    filters.activeTab = tab;
  }
  
  return filters;
}

/**
 * Salvar filtros no localStorage como backup
 */
function saveFiltersToStorage(filters: ReclamacoesFilters): void {
  try {
    const serialized = JSON.stringify({
      ...filters,
      startDate: filters.startDate?.toISOString() || null,
      endDate: filters.endDate?.toISOString() || null,
    });
    localStorage.setItem(STORAGE_KEY, serialized);
    if (isDev) console.log('💾 [RECLAMACOES-SYNC] Filtros salvos no localStorage');
  } catch (error) {
    console.error('❌ [RECLAMACOES-SYNC] Erro ao salvar filtros:', error);
  }
}

/**
 * Carregar filtros do localStorage (fallback)
 */
function loadFiltersFromStorage(): ReclamacoesFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FILTERS };
    
    const parsed = JSON.parse(stored);
    
    // Validar e converter datas
    const validatedFilters: ReclamacoesFilters = {
      ...DEFAULT_FILTERS,
      startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_FILTERS.startDate,
      endDate: parsed.endDate ? new Date(parsed.endDate) : DEFAULT_FILTERS.endDate,
      status: parsed.status || '',
      type: parsed.type || '',
      stage: parsed.stage || '',
      selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
      currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
      itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : DEFAULT_ITEMS_PER_PAGE,
      activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
    };
    
    if (isDev) console.log('📂 [RECLAMACOES-SYNC] Filtros carregados do localStorage');
    return validatedFilters;
  } catch (error) {
    console.error('❌ [RECLAMACOES-SYNC] Erro ao carregar filtros:', error);
    return { ...DEFAULT_FILTERS };
  }
}

export interface UseReclamacoesFiltersSyncOptions {
  enabled?: boolean;
}

export function useReclamacoesFiltersSync(options: UseReclamacoesFiltersSyncOptions = {}) {
  const { enabled = true } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const lastSyncedRef = useRef<string>('');
  const isMountedRef = useRef(true);
  
  // Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  /**
   * LER filtros (prioriza URL, fallback para localStorage)
   */
  const currentFilters = useMemo((): ReclamacoesFilters => {
    if (!enabled) return { ...DEFAULT_FILTERS };
    
    const urlFilters = urlParamsToFilters(searchParams);
    
    // Se URL tem filtros, usar (prioridade)
    if (Object.keys(urlFilters).length > 0) {
      if (isDev) console.log('📍 [RECLAMACOES-SYNC] Filtros lidos da URL:', urlFilters);
      return { ...DEFAULT_FILTERS, ...urlFilters };
    }
    
    // Se URL vazia, tentar restaurar do localStorage
    const storageFilters = loadFiltersFromStorage();
    const hasStorageFilters = Object.keys(storageFilters).some(key => {
      const val = storageFilters[key as keyof ReclamacoesFilters];
      const def = DEFAULT_FILTERS[key as keyof ReclamacoesFilters];
      if (Array.isArray(val)) return val.length > 0;
      if (val instanceof Date && def instanceof Date) {
        return val.getTime() !== def.getTime();
      }
      return val !== def;
    });
    
    if (hasStorageFilters) {
      if (isDev) console.log('📂 [RECLAMACOES-SYNC] Filtros restaurados do localStorage');
      return storageFilters;
    }
    
    return { ...DEFAULT_FILTERS };
  }, [enabled, searchParams]);
  
  /**
   * ESCREVER filtros (atualiza URL E localStorage)
   */
  const writeFilters = useCallback((filters: ReclamacoesFilters, source: 'user' | 'restore' = 'user') => {
    if (!enabled || !isMountedRef.current) return;
    
    // Serializar para comparação (evitar loops)
    const serialized = JSON.stringify({
      ...filters,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    });
    
    if (serialized === lastSyncedRef.current) {
      if (isDev) console.log('🔄 [RECLAMACOES-SYNC] Filtros já sincronizados, pulando...');
      return;
    }
    lastSyncedRef.current = serialized;
    
    // ATUALIZAR URL (fonte primária)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true });
    
    // SALVAR NO localStorage (backup)
    saveFiltersToStorage(filters);
    
    if (isDev) console.log(`📍 [RECLAMACOES-SYNC] Filtros salvos [${source}]:`, { url: params.toString() });
  }, [enabled, setSearchParams]);
  
  /**
   * LIMPAR filtros (remove da URL E localStorage)
   */
  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    localStorage.removeItem(STORAGE_KEY);
    
    if (isDev) console.log('🗑️ [RECLAMACOES-SYNC] Filtros removidos');
  }, [enabled, setSearchParams]);
  
  /**
   * Verificar se há filtros ativos
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      if (key === 'currentPage' || key === 'itemsPerPage' || key === 'activeTab') return false;
      
      const value = currentFilters[key as keyof ReclamacoesFilters];
      const defaultValue = DEFAULT_FILTERS[key as keyof ReclamacoesFilters];
      
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date && defaultValue instanceof Date) {
        return value.getTime() !== defaultValue.getTime();
      }
      return value !== defaultValue;
    });
  }, [currentFilters]);
  
  /**
   * Contar filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (currentFilters.startDate || currentFilters.endDate) count++;
    if (currentFilters.selectedAccounts.length > 0) count++;
    if (currentFilters.status) count++;
    if (currentFilters.type) count++;
    if (currentFilters.stage) count++;
    
    return count;
  }, [currentFilters]);
  
  return {
    filters: currentFilters,
    hasActiveFilters,
    activeFiltersCount,
    writeFilters,
    clearFilters,
    defaultFilters: DEFAULT_FILTERS,
    // Helpers para uso externo
    parseFiltersFromUrl: urlParamsToFilters,
    encodeFiltersToUrl: filtersToURLParams,
  };
}
