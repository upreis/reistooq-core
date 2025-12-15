/**
 * 🔗 HOOK DE SINCRONIZAÇÃO DE FILTROS COM URL - COMBO 2.1
 * Usa Date objects para startDate/endDate (não string periodo)
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { startOfDay, endOfDay, subDays, parseISO, isValid } from 'date-fns';

const isDev = import.meta.env.DEV;
const STORAGE_KEY = 'devolucoes_filters_v3';
const DEFAULT_ITEMS_PER_PAGE = 50;

export interface DevolucoesFilters {
  startDate?: Date;
  endDate?: Date;
  selectedAccounts: string[];
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  activeTab: 'ativas' | 'historico';
}

// Default: últimos 60 dias
export const DEFAULT_FILTERS: DevolucoesFilters = {
  startDate: startOfDay(subDays(new Date(), 60)),
  endDate: endOfDay(new Date()),
  selectedAccounts: [],
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas'
};

/**
 * Converte filtros para params de URL
 */
function filtersToURLParams(filters: DevolucoesFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Datas (apenas se definidas)
  if (filters.startDate) {
    params.set('from', filters.startDate.toISOString().split('T')[0]);
  }
  
  if (filters.endDate) {
    params.set('to', filters.endDate.toISOString().split('T')[0]);
  }
  
  // Contas (apenas se selecionadas)
  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }
  
  // Search term
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    params.set('search', filters.searchTerm);
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
function urlParamsToFilters(params: URLSearchParams): Partial<DevolucoesFilters> {
  const filters: Partial<DevolucoesFilters> = {};
  
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
  
  // Contas
  const accounts = params.get('accounts');
  if (accounts) {
    filters.selectedAccounts = accounts.split(',').filter(Boolean);
  }
  
  // Search term
  const search = params.get('search');
  if (search) {
    filters.searchTerm = search;
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
function saveFiltersToStorage(filters: DevolucoesFilters): void {
  try {
    const serialized = JSON.stringify({
      ...filters,
      startDate: filters.startDate?.toISOString() || null,
      endDate: filters.endDate?.toISOString() || null,
    });
    localStorage.setItem(STORAGE_KEY, serialized);
    if (isDev) console.log('💾 [DEVOLUCOES-SYNC] Filtros salvos no localStorage');
  } catch (error) {
    console.error('❌ [DEVOLUCOES-SYNC] Erro ao salvar filtros:', error);
  }
}

/**
 * Carregar filtros do localStorage (fallback)
 */
function loadFiltersFromStorage(): DevolucoesFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FILTERS };
    
    const parsed = JSON.parse(stored);
    
    // Validar e converter datas
    const validatedFilters: DevolucoesFilters = {
      ...DEFAULT_FILTERS,
      startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_FILTERS.startDate,
      endDate: parsed.endDate ? new Date(parsed.endDate) : DEFAULT_FILTERS.endDate,
      selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
      searchTerm: parsed.searchTerm || '',
      currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
      itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : DEFAULT_ITEMS_PER_PAGE,
      activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
    };
    
    if (isDev) console.log('📂 [DEVOLUCOES-SYNC] Filtros carregados do localStorage');
    return validatedFilters;
  } catch (error) {
    console.error('❌ [DEVOLUCOES-SYNC] Erro ao carregar filtros:', error);
    return { ...DEFAULT_FILTERS };
  }
}

export interface UseDevolucoesFiltersSyncOptions {
  enabled?: boolean;
}

export function useDevolucoesFiltersSync(options: UseDevolucoesFiltersSyncOptions = {}) {
  const { enabled = true } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
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
  const currentFilters = useMemo((): DevolucoesFilters => {
    if (!enabled) return { ...DEFAULT_FILTERS };
    
    const urlFilters = urlParamsToFilters(searchParams);
    
    // Se URL tem filtros, usar (prioridade)
    if (Object.keys(urlFilters).length > 0) {
      if (isDev) console.log('📍 [DEVOLUCOES-SYNC] Filtros lidos da URL:', urlFilters);
      return { ...DEFAULT_FILTERS, ...urlFilters };
    }
    
    // Se URL vazia, tentar restaurar do localStorage
    const storageFilters = loadFiltersFromStorage();
    const hasStorageFilters = Object.keys(storageFilters).some(key => {
      const val = storageFilters[key as keyof DevolucoesFilters];
      const def = DEFAULT_FILTERS[key as keyof DevolucoesFilters];
      if (Array.isArray(val)) return val.length > 0;
      if (val instanceof Date && def instanceof Date) {
        return val.getTime() !== def.getTime();
      }
      return val !== def;
    });
    
    if (hasStorageFilters) {
      if (isDev) console.log('📂 [DEVOLUCOES-SYNC] Filtros restaurados do localStorage');
      return storageFilters;
    }
    
    return { ...DEFAULT_FILTERS };
  }, [enabled, searchParams]);
  
  /**
   * ESCREVER filtros (atualiza URL E localStorage)
   */
  const writeFilters = useCallback((filters: DevolucoesFilters, source: 'user' | 'restore' = 'user') => {
    if (!enabled || !isMountedRef.current) return;
    
    // Serializar para comparação (evitar loops)
    const serialized = JSON.stringify({
      ...filters,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    });
    
    if (serialized === lastSyncedRef.current) {
      if (isDev) console.log('🔄 [DEVOLUCOES-SYNC] Filtros já sincronizados, pulando...');
      return;
    }
    lastSyncedRef.current = serialized;
    
    // ATUALIZAR URL (fonte primária)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true });
    
    // SALVAR NO localStorage (backup)
    saveFiltersToStorage(filters);
    
    if (isDev) console.log(`📍 [DEVOLUCOES-SYNC] Filtros salvos [${source}]:`, { url: params.toString() });
  }, [enabled, setSearchParams]);
  
  /**
   * LIMPAR filtros (remove da URL E localStorage)
   */
  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    localStorage.removeItem(STORAGE_KEY);
    
    if (isDev) console.log('🗑️ [DEVOLUCOES-SYNC] Filtros removidos');
  }, [enabled, setSearchParams]);
  
  /**
   * Verificar se há filtros ativos
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      if (key === 'currentPage' || key === 'itemsPerPage' || key === 'activeTab') return false;
      
      const value = currentFilters[key as keyof DevolucoesFilters];
      const defaultValue = DEFAULT_FILTERS[key as keyof DevolucoesFilters];
      
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
    if (currentFilters.searchTerm) count++;
    
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
