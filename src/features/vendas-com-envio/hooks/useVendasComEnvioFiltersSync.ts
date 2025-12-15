/**
 * 🎯 VENDAS COM ENVIO - Sistema Híbrido: URL + localStorage
 * Hook que gerencia filtros através de URL params COM fallback para localStorage
 * 
 * ARQUITETURA (baseada em /pedidos):
 * 1. URL é a fonte primária de verdade para filtros (compartilhável)
 * 2. localStorage é usado como BACKUP quando URL está vazia
 * 3. URLs compartilháveis funcionam 100%
 * 4. Navegação interna preserva filtros via localStorage
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { VendasComEnvioFilters, ShippingStatus } from '../types';
import { DEFAULT_PERIODO, DEFAULT_ITEMS_PER_PAGE } from '../config';

const isDev = process.env.NODE_ENV === 'development';
const STORAGE_KEY = 'vendas_com_envio_filters_backup_v1';

interface UseVendasComEnvioFiltersSyncOptions {
  enabled?: boolean;
}

/**
 * Filtros padrão
 */
const DEFAULT_FILTERS: VendasComEnvioFilters = {
  periodo: DEFAULT_PERIODO,
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
};

/**
 * Converte filtros para params de URL (formato compacto)
 */
function filtersToURLParams(filters: VendasComEnvioFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Período (apenas se diferente do padrão)
  if (filters.periodo && filters.periodo !== DEFAULT_PERIODO) {
    params.set('periodo', filters.periodo.toString());
  }
  
  // Status de envio
  if (filters.shippingStatus && filters.shippingStatus !== 'all') {
    params.set('status', filters.shippingStatus);
  }
  
  // Busca
  if (filters.searchTerm && filters.searchTerm.trim()) {
    params.set('q', filters.searchTerm.trim());
  }
  
  // Contas selecionadas
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
function urlParamsToFilters(params: URLSearchParams): Partial<VendasComEnvioFilters> {
  const filters: Partial<VendasComEnvioFilters> = {};
  
  // Período
  const periodo = params.get('periodo');
  if (periodo && /^\d+$/.test(periodo)) {
    filters.periodo = parseInt(periodo, 10);
  }
  
  // Status de envio
  const status = params.get('status');
  if (status) {
    filters.shippingStatus = status as ShippingStatus | 'all';
  }
  
  // Busca
  const search = params.get('q');
  if (search) {
    filters.searchTerm = search;
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
function saveFiltersToStorage(filters: VendasComEnvioFilters): void {
  try {
    const serialized = JSON.stringify(filters);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (isDev) console.log('💾 [VENDAS-ENVIO-SYNC] Filtros salvos no localStorage (backup)');
  } catch (error) {
    console.error('❌ [VENDAS-ENVIO-SYNC] Erro ao salvar filtros no localStorage:', error);
  }
}

/**
 * Carregar filtros do localStorage (fallback)
 */
function loadFiltersFromStorage(): VendasComEnvioFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FILTERS };
    
    const parsed = JSON.parse(stored);
    
    // Validar e mesclar com defaults
    const validatedFilters: VendasComEnvioFilters = {
      ...DEFAULT_FILTERS,
      periodo: typeof parsed.periodo === 'number' ? parsed.periodo : DEFAULT_PERIODO,
      selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
      shippingStatus: parsed.shippingStatus || 'all',
      searchTerm: parsed.searchTerm || '',
      currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
      itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : DEFAULT_ITEMS_PER_PAGE,
      activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
    };
    
    if (isDev) console.log('📂 [VENDAS-ENVIO-SYNC] Filtros carregados do localStorage (backup):', validatedFilters);
    return validatedFilters;
  } catch (error) {
    console.error('❌ [VENDAS-ENVIO-SYNC] Erro ao carregar filtros do localStorage:', error);
    return { ...DEFAULT_FILTERS };
  }
}

export function useVendasComEnvioFiltersSync(
  options: UseVendasComEnvioFiltersSyncOptions = {}
) {
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
  const currentFilters = useMemo((): VendasComEnvioFilters => {
    if (!enabled) return { ...DEFAULT_FILTERS };
    
    const urlFilters = urlParamsToFilters(searchParams);
    
    // Se URL tem filtros, usar (prioridade)
    if (Object.keys(urlFilters).length > 0) {
      if (isDev) console.log('📍 [VENDAS-ENVIO-SYNC] Filtros lidos da URL (prioridade):', urlFilters);
      return { ...DEFAULT_FILTERS, ...urlFilters };
    }
    
    // Se URL vazia, tentar restaurar do localStorage
    const storageFilters = loadFiltersFromStorage();
    const hasStorageFilters = Object.keys(storageFilters).some(key => {
      const val = storageFilters[key as keyof VendasComEnvioFilters];
      const def = DEFAULT_FILTERS[key as keyof VendasComEnvioFilters];
      if (Array.isArray(val)) return val.length > 0;
      return val !== def;
    });
    
    if (hasStorageFilters) {
      if (isDev) console.log('📂 [VENDAS-ENVIO-SYNC] Filtros restaurados do localStorage (fallback):', storageFilters);
      return storageFilters;
    }
    
    return { ...DEFAULT_FILTERS };
  }, [enabled, searchParams]);
  
  /**
   * ESCREVER filtros (atualiza URL E localStorage)
   */
  const writeFilters = useCallback((filters: VendasComEnvioFilters, source: 'user' | 'restore' = 'user') => {
    if (!enabled || !isMountedRef.current) return;
    
    // Serializar para comparação (evitar loops)
    const serialized = JSON.stringify(filters);
    if (serialized === lastSyncedRef.current) {
      if (isDev) console.log('🔄 [VENDAS-ENVIO-SYNC] Filtros já sincronizados, pulando...');
      return;
    }
    lastSyncedRef.current = serialized;
    
    // ATUALIZAR URL (fonte primária)
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true });
    
    // SALVAR NO localStorage (backup)
    saveFiltersToStorage(filters);
    
    if (isDev) console.log(`📍 [VENDAS-ENVIO-SYNC] Filtros salvos (URL + localStorage) [${source}]:`, { url: params.toString(), filters });
  }, [enabled, setSearchParams]);
  
  /**
   * LIMPAR filtros (remove da URL E localStorage)
   */
  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    localStorage.removeItem(STORAGE_KEY);
    
    if (isDev) console.log('🗑️ [VENDAS-ENVIO-SYNC] Filtros removidos (URL + localStorage)');
  }, [enabled, setSearchParams]);
  
  /**
   * INICIALIZAÇÃO: Log de status
   */
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    
    const hasURLParams = searchParams.toString().length > 0;
    const storageFilters = loadFiltersFromStorage();
    const hasStorageFilters = JSON.stringify(storageFilters) !== JSON.stringify(DEFAULT_FILTERS);
    
    if (isDev) {
      if (hasURLParams) {
        console.log('📍 [VENDAS-ENVIO-SYNC] Inicializado com filtros da URL');
      } else if (hasStorageFilters) {
        console.log('📂 [VENDAS-ENVIO-SYNC] Inicializado com filtros do localStorage');
      } else {
        console.log('📍 [VENDAS-ENVIO-SYNC] Inicializado sem filtros');
      }
    }
  }, [enabled, searchParams]);
  
  /**
   * Verificar se há filtros ativos
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof VendasComEnvioFilters];
      const defaultValue = DEFAULT_FILTERS[key as keyof VendasComEnvioFilters];
      
      if (Array.isArray(value)) return value.length > 0;
      return value !== defaultValue;
    });
  }, [currentFilters]);
  
  /**
   * Contar filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    return Object.keys(currentFilters).filter(key => {
      const value = currentFilters[key as keyof VendasComEnvioFilters];
      const defaultValue = DEFAULT_FILTERS[key as keyof VendasComEnvioFilters];
      
      // Ignorar página e itens por página na contagem
      if (key === 'currentPage' || key === 'itemsPerPage' || key === 'activeTab') return false;
      
      if (Array.isArray(value)) return value.length > 0;
      return value !== defaultValue;
    }).length;
  }, [currentFilters]);
  
  return {
    // Estado atual dos filtros (sempre sincronizado)
    filters: currentFilters,
    hasActiveFilters,
    activeFiltersCount,
    
    // Ações
    writeFilters,
    clearFilters,
    
    // Metadata
    source: currentFilters && hasActiveFilters 
      ? (searchParams.toString().length > 0 ? 'url' : 'localStorage') 
      : 'none' as const,
    isEnabled: enabled,
    
    // Defaults para referência
    defaultFilters: DEFAULT_FILTERS,
  };
}
