/**
 * 🗄️ DEVOLUÇÕES STORE - Zustand
 * Store único para gerenciar dados de devoluções com restauração instantânea
 * Padrão idêntico ao vendasStore.ts de /vendas-online
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

export const useDevolucoesStore = create<DevolucoesState>((set, get) => ({
  // Initial state
  devolucoes: [],
  total: 0,
  dataSource: 'empty',
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
