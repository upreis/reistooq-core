/**
 * 📦 VENDAS COM ENVIO - Zustand Store
 * Gerenciamento de estado global da feature
 * NOTA: Dados ficam apenas em memória (não persiste no localStorage devido ao tamanho)
 */

import { create } from 'zustand';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import type { VendaComEnvio, VendasComEnvioFilters, VendasComEnvioStats } from '../types';
import { STORAGE_KEYS, DEFAULT_ITEMS_PER_PAGE } from '../config';

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

// Defaults com datas
const getDefaultFilters = (): VendasComEnvioFilters => ({
  startDate: startOfDay(subDays(new Date(), 6)),
  endDate: endOfDay(new Date()),
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
});

// Carregar filtros persistidos do localStorage (leve, apenas filtros)
const loadPersistedFilters = (): VendasComEnvioFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        startDate: parsed.startDate ? new Date(parsed.startDate) : getDefaultFilters().startDate,
        endDate: parsed.endDate ? new Date(parsed.endDate) : getDefaultFilters().endDate,
        selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
        shippingStatus: parsed.shippingStatus || 'all',
        searchTerm: parsed.searchTerm || '',
        currentPage: parsed.currentPage || 1,
        itemsPerPage: parsed.itemsPerPage || DEFAULT_ITEMS_PER_PAGE,
        activeTab: parsed.activeTab || 'ativas',
      };
    }
  } catch (e) {
    console.warn('[VendasComEnvioStore] Erro ao carregar filtros:', e);
  }
  
  return getDefaultFilters();
};

// Persistir apenas filtros no localStorage (leve)
const persistFilters = (filters: VendasComEnvioFilters) => {
  try {
    const toSave = {
      ...filters,
      startDate: filters.startDate?.toISOString() || null,
      endDate: filters.endDate?.toISOString() || null,
    };
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(toSave));
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
const initialFilters = loadPersistedFilters();
const initialStats = { total: 0, readyToShip: 0, pending: 0, handling: 0, shipped: 0, totalValue: 0 };

export const useVendasComEnvioStore = create<VendasComEnvioState>((set, get) => ({
  // Dados iniciais vazios (sem cache localStorage)
  vendas: [],
  totalCount: 0,
  
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
  
  // Stats
  stats: initialStats,
  
  // Metadados
  lastSyncedAt: null,
  dataSource: 'empty',
  
  // Actions
  setVendas: (vendas, totalCount) => {
    const stats = calculateStats(vendas);
    
    // NÃO persistir no localStorage - dados são muito grandes (500+ vendas)
    // Manter apenas em memória via Zustand
    
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
    set({
      vendas: [],
      totalCount: 0,
      stats: initialStats,
      dataSource: 'empty',
      lastSyncedAt: null,
    });
  },
  
  reset: () => {
    try {
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
      appliedFilters: getDefaultFilters(),
      shouldFetch: false,
      hasFetchedFromAPI: false,
      stats: initialStats,
      lastSyncedAt: null,
      dataSource: 'empty',
    });
  },
}));
