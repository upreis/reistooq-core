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

// ✅ OTIMIZADO: Não persistir devolucoes no localStorage (causa travamento)
// Dados são gerenciados pelo React Query cache
const loadPersistedState = (): { devolucoes: DevolucaoData[], total: number, dataSource: 'localStorage' | 'empty' } => {
  // Retorna estado vazio - dados vêm do cache do React Query
  return { devolucoes: [], total: 0, dataSource: 'empty' };
};

// ✅ OTIMIZADO: Removida persistência de devolucoes (muito pesada)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const persistState = (_devolucoes: DevolucaoData[]) => {
  // Desabilitado - dados muito grandes causam travamento
  // Persistência agora é feita pelo React Query cache
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
