/**
 * 🗄️ DEVOLUÇÕES STORE - Zustand
 * Store único para gerenciar dados de devoluções com restauração instantânea
 * ✅ COM PERSISTÊNCIA AUTOMÁTICA no localStorage
 */

import { create } from 'zustand';

// Tipo flexível para devolução (aceita qualquer campo adicional)
export type DevolucaoData = Record<string, any>;

interface DevolucoesState {
  // Data
  devolucoes: DevolucaoData[];
  total: number;
  
  // Source tracking
  dataSource: 'localStorage' | 'cache' | 'api' | 'empty';
  lastUpdatedAt: number | null;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  setDevolucoes: (devolucoes: DevolucaoData[], total: number, source?: 'localStorage' | 'cache' | 'api') => void;
  clearDevolucoes: () => void;
  setLoading: (isLoading: boolean) => void;
  setFetching: (isFetching: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  hasDevolucoes: () => boolean;
}

const STORAGE_KEY = 'devolucoes-store';

// ✅ Carregar estado do localStorage (igual reclamacoesStore)
const loadPersistedState = (): { devolucoes: DevolucaoData[], total: number, dataSource: 'localStorage' | 'empty' } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar TTL (30 minutos)
      if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        console.log('📦 [DEVOLUCOES-STORE] Restaurando estado do localStorage:', {
          devolucoes: parsed.devolucoes?.length || 0
        });
        return {
          devolucoes: parsed.devolucoes || [],
          total: parsed.devolucoes?.length || 0,
          dataSource: 'localStorage'
        };
      }
    }
  } catch (error) {
    console.error('[DEVOLUCOES-STORE] Erro ao carregar estado:', error);
  }
  return { devolucoes: [], total: 0, dataSource: 'empty' };
};

// ✅ Salvar estado no localStorage
const persistState = (devolucoes: DevolucaoData[]) => {
  try {
    const toSave = {
      devolucoes,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('[DEVOLUCOES-STORE] Erro ao salvar estado:', error);
  }
};

const persistedState = loadPersistedState();

export const useDevolucoesStore = create<DevolucoesState>((set, get) => ({
  // Initial state (com hydration do localStorage)
  devolucoes: persistedState.devolucoes,
  total: persistedState.total,
  dataSource: persistedState.dataSource,
  lastUpdatedAt: null,
  isLoading: false,
  isFetching: false,
  error: null,
  
  // Actions
  setDevolucoes: (devolucoes, total, source = 'cache') => {
    console.log(`🗄️ [STORE] setDevolucoes: ${devolucoes.length} items, source: ${source}`);
    set({ 
      devolucoes, 
      total,
      dataSource: source,
      lastUpdatedAt: Date.now(),
      isLoading: false,
      error: null
    });
    // ✅ Persistir automaticamente
    persistState(devolucoes);
  },
  
  clearDevolucoes: () => set({ 
    devolucoes: [], 
    total: 0, 
    dataSource: 'empty',
    lastUpdatedAt: null 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setFetching: (isFetching) => set({ isFetching }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  // Computed
  hasDevolucoes: () => get().devolucoes.length > 0
}));
