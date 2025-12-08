/**
 * 📦 VENDAS COM ENVIO - Zustand Store
 * Gerenciamento de estado global da feature
 */

import { create } from 'zustand';
import type { VendaComEnvio, VendasComEnvioFilters, VendasComEnvioStats } from '../types';
import { STORAGE_KEYS, CACHE_TTL_MS, DEFAULT_PERIODO, DEFAULT_ITEMS_PER_PAGE } from '../config';

interface VendasComEnvioState {
  // Dados
  vendas: VendaComEnvio[];
  totalCount: number;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  
  // Error
  error: string | null;
  
  // Filtros aplicados
  appliedFilters: VendasComEnvioFilters;
  
  // Controle de busca
  shouldFetch: boolean;
  hasFetchedFromAPI: boolean;
  
  // Estatísticas
  stats: VendasComEnvioStats;
  
  // Metadados
  lastSyncedAt: string | null;
  dataSource: 'cache' | 'api' | 'empty';
  
  // Actions
  setVendas: (vendas: VendaComEnvio[], totalCount: number) => void;
  setLoading: (isLoading: boolean) => void;
  setFetching: (isFetching: boolean) => void;
  setError: (error: string | null) => void;
  setAppliedFilters: (filters: VendasComEnvioFilters) => void;
  setShouldFetch: (shouldFetch: boolean) => void;
  setHasFetchedFromAPI: (hasFetched: boolean) => void;
  setStats: (stats: VendasComEnvioStats) => void;
  setLastSyncedAt: (timestamp: string | null) => void;
  setDataSource: (source: 'cache' | 'api' | 'empty') => void;
  clearVendas: () => void;
  reset: () => void;
}

// Carregar filtros persistidos do localStorage
const loadPersistedFilters = (): VendasComEnvioFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar estrutura
      if (parsed && typeof parsed.periodo === 'number') {
        return {
          periodo: parsed.periodo || DEFAULT_PERIODO,
          selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
          shippingStatus: parsed.shippingStatus || 'all',
          searchTerm: parsed.searchTerm || '',
          currentPage: parsed.currentPage || 1,
          itemsPerPage: parsed.itemsPerPage || DEFAULT_ITEMS_PER_PAGE,
        };
      }
    }
  } catch (e) {
    console.warn('[VendasComEnvioStore] Erro ao carregar filtros:', e);
  }
  
  return {
    periodo: DEFAULT_PERIODO,
    selectedAccounts: [],
    shippingStatus: 'all',
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  };
};

// Carregar cache do localStorage
const loadCachedData = (): { vendas: VendaComEnvio[]; totalCount: number; dataSource: 'cache' | 'empty' } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CACHE);
    if (stored) {
      const parsed = JSON.parse(stored);
      const age = Date.now() - (parsed.timestamp || 0);
      
      // Verificar TTL
      if (age < CACHE_TTL_MS && Array.isArray(parsed.data) && parsed.data.length > 0) {
        console.log('[VendasComEnvioStore] Cache restaurado:', parsed.data.length, 'vendas');
        return {
          vendas: parsed.data,
          totalCount: parsed.totalCount || parsed.data.length,
          dataSource: 'cache',
        };
      }
    }
  } catch (e) {
    console.warn('[VendasComEnvioStore] Erro ao carregar cache:', e);
  }
  
  return { vendas: [], totalCount: 0, dataSource: 'empty' };
};

// Persistir cache no localStorage
const persistCache = (vendas: VendaComEnvio[], totalCount: number, filters: VendasComEnvioFilters) => {
  try {
    const cacheEntry = {
      data: vendas,
      totalCount,
      filters,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('[VendasComEnvioStore] Erro ao persistir cache:', e);
  }
};

// Persistir filtros no localStorage
const persistFilters = (filters: VendasComEnvioFilters) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  } catch (e) {
    console.warn('[VendasComEnvioStore] Erro ao persistir filtros:', e);
  }
};

// Calcular estatísticas
const calculateStats = (vendas: VendaComEnvio[]): VendasComEnvioStats => {
  return vendas.reduce(
    (acc, venda) => {
      acc.total++;
      acc.totalValue += venda.total_amount || 0;
      
      switch (venda.shipping_status) {
        case 'ready_to_ship':
          acc.readyToShip++;
          break;
        case 'pending':
          acc.pending++;
          break;
        case 'handling':
          acc.handling++;
          break;
        case 'shipped':
          acc.shipped++;
          break;
      }
      
      return acc;
    },
    { total: 0, readyToShip: 0, pending: 0, handling: 0, shipped: 0, totalValue: 0 }
  );
};

// Estado inicial
const cachedData = loadCachedData();
const initialFilters = loadPersistedFilters();

export const useVendasComEnvioStore = create<VendasComEnvioState>((set, get) => ({
  // Dados iniciais do cache
  vendas: cachedData.vendas,
  totalCount: cachedData.totalCount,
  
  // Loading states
  isLoading: false,
  isFetching: false,
  
  // Error
  error: null,
  
  // Filtros
  appliedFilters: initialFilters,
  
  // Controle de busca (Combo 2.1 - busca manual)
  shouldFetch: false,
  hasFetchedFromAPI: false,
  
  // Stats calculadas do cache
  stats: calculateStats(cachedData.vendas),
  
  // Metadados
  lastSyncedAt: null,
  dataSource: cachedData.dataSource,
  
  // Actions
  setVendas: (vendas, totalCount) => {
    const stats = calculateStats(vendas);
    const filters = get().appliedFilters;
    
    // Persistir no localStorage
    if (vendas.length > 0) {
      persistCache(vendas, totalCount, filters);
    }
    
    set({
      vendas,
      totalCount,
      stats,
      dataSource: 'api',
      lastSyncedAt: new Date().toISOString(),
    });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setFetching: (isFetching) => set({ isFetching }),
  
  setError: (error) => set({ error }),
  
  setAppliedFilters: (filters) => {
    persistFilters(filters);
    set({ appliedFilters: filters });
  },
  
  setShouldFetch: (shouldFetch) => set({ shouldFetch }),
  
  setHasFetchedFromAPI: (hasFetched) => set({ hasFetchedFromAPI: hasFetched }),
  
  setStats: (stats) => set({ stats }),
  
  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
  
  setDataSource: (source) => set({ dataSource: source }),
  
  clearVendas: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CACHE);
    } catch (e) {
      console.warn('[VendasComEnvioStore] Erro ao limpar cache:', e);
    }
    
    set({
      vendas: [],
      totalCount: 0,
      stats: { total: 0, readyToShip: 0, pending: 0, handling: 0, shipped: 0, totalValue: 0 },
      dataSource: 'empty',
      lastSyncedAt: null,
    });
  },
  
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CACHE);
      localStorage.removeItem(STORAGE_KEYS.FILTERS);
    } catch (e) {
      console.warn('[VendasComEnvioStore] Erro ao resetar:', e);
    }
    
    set({
      vendas: [],
      totalCount: 0,
      isLoading: false,
      isFetching: false,
      error: null,
      appliedFilters: {
        periodo: DEFAULT_PERIODO,
        selectedAccounts: [],
        shippingStatus: 'all',
        searchTerm: '',
        currentPage: 1,
        itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
      },
      shouldFetch: false,
      hasFetchedFromAPI: false,
      stats: { total: 0, readyToShip: 0, pending: 0, handling: 0, shipped: 0, totalValue: 0 },
      lastSyncedAt: null,
      dataSource: 'empty',
    });
  },
}));
