/**
 * 🗄️ RECLAMACOES STORE - Zustand
 * Store único para gerenciar todo o estado de Reclamações
 * Padrão idêntico ao vendasStore.ts
 */

import { create } from 'zustand';
import { FullReclamacao } from '@/lib/validation';

interface ReclamacoesFilters {
  search: string;
  status: string[];
  tipo: string[];
  periodo: string;
  dateFrom: string | null;
  dateTo: string | null;
  integrationAccountId: string;
}

interface ReclamacoesPagination {
  currentPage: number;
  itemsPerPage: number;
  total: number;
}

interface ReclamacoesState {
  // Data
  reclamacoes: FullReclamacao[];
  
  // 📝 Anotações locais
  anotacoes: Record<string, string>;
  
  // Filters
  filters: ReclamacoesFilters;
  
  // Selected accounts
  selectedAccounts: string[];
  
  // Pagination
  pagination: ReclamacoesPagination;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Data source tracking
  dataSource: 'cache' | 'api' | null;
  
  // Error
  error: string | null;
  
  // Actions
  setReclamacoes: (reclamacoes: FullReclamacao[], total?: number) => void;
  appendReclamacoes: (reclamacoes: FullReclamacao[]) => void;
  clearReclamacoes: () => void;
  
  // 📝 Anotações
  setAnotacao: (reclamacaoId: string, anotacao: string) => void;
  
  // Filters
  updateFilters: (filters: Partial<ReclamacoesFilters>) => void;
  resetFilters: () => void;
  
  // Accounts
  setSelectedAccounts: (accounts: string[]) => void;
  
  // Pagination
  setPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  
  // Loading
  setLoading: (isLoading: boolean) => void;
  setLoadingMore: (isLoadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setDataSource: (source: 'cache' | 'api' | null) => void;
  
  // Computed
  getReclamacaoById: (reclamacaoId: string) => FullReclamacao | undefined;
  
  // Hydration
  hydrate: (data: Partial<ReclamacoesState>) => void;
}

const STORAGE_KEY = 'reclamacoes-store';

const initialFilters: ReclamacoesFilters = {
  search: '',
  status: [],
  tipo: [],
  periodo: '60',
  dateFrom: null,
  dateTo: null,
  integrationAccountId: ''
};

const initialPagination: ReclamacoesPagination = {
  currentPage: 1,
  itemsPerPage: 50,
  total: 0
};

// Carregar estado do localStorage
const loadPersistedState = (): Partial<ReclamacoesState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar TTL (30 minutos)
      if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        console.log('📦 [RECLAMACOES-STORE] Restaurando estado do localStorage:', {
          reclamacoes: parsed.reclamacoes?.length || 0,
          selectedAccounts: parsed.selectedAccounts?.length || 0
        });
        return {
          reclamacoes: parsed.reclamacoes || [],
          selectedAccounts: parsed.selectedAccounts || [],
          filters: parsed.filters || initialFilters,
          pagination: { ...initialPagination, total: parsed.reclamacoes?.length || 0 },
          dataSource: parsed.reclamacoes?.length > 0 ? 'cache' : null
        };
      }
    }
  } catch (error) {
    console.error('[RECLAMACOES-STORE] Erro ao carregar estado:', error);
  }
  return {};
};

// Salvar estado no localStorage
const persistState = (state: Partial<ReclamacoesState>) => {
  try {
    const toSave = {
      reclamacoes: state.reclamacoes,
      selectedAccounts: state.selectedAccounts,
      filters: state.filters,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('[RECLAMACOES-STORE] Erro ao salvar estado:', error);
  }
};

const persistedState = loadPersistedState();

export const useReclamacoesStore = create<ReclamacoesState>((set, get) => ({
  // Initial state (com hydration do localStorage)
  reclamacoes: persistedState.reclamacoes || [],
  anotacoes: (() => {
    try {
      const stored = localStorage.getItem('reclamacoes-anotacoes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })(),
  filters: persistedState.filters || initialFilters,
  selectedAccounts: persistedState.selectedAccounts || [],
  pagination: persistedState.pagination || initialPagination,
  isLoading: false,
  isLoadingMore: false,
  dataSource: persistedState.dataSource || null,
  error: null,
  
  // Actions
  setReclamacoes: (reclamacoes, total) => {
    set({ 
      reclamacoes, 
      pagination: { ...get().pagination, total: total ?? reclamacoes.length },
      dataSource: 'api'
    });
    persistState({ ...get(), reclamacoes });
  },
  
  appendReclamacoes: (newReclamacoes) => {
    const current = get().reclamacoes;
    const merged = [...current, ...newReclamacoes];
    set({ 
      reclamacoes: merged,
      pagination: { ...get().pagination, total: merged.length }
    });
    persistState({ ...get(), reclamacoes: merged });
  },
  
  clearReclamacoes: () => {
    set({ reclamacoes: [], pagination: initialPagination, dataSource: null });
  },
  
  // 📝 Anotações
  setAnotacao: (reclamacaoId, anotacao) => {
    const newAnotacoes = { ...get().anotacoes, [reclamacaoId]: anotacao };
    set({ anotacoes: newAnotacoes });
    try {
      localStorage.setItem('reclamacoes-anotacoes', JSON.stringify(newAnotacoes));
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
    }
  },
  
  updateFilters: (newFilters) => {
    const updated = { ...get().filters, ...newFilters };
    set({ 
      filters: updated,
      pagination: { ...get().pagination, currentPage: 1 } // Reset to page 1 on filter change
    });
    persistState({ ...get(), filters: updated });
  },
  
  resetFilters: () => set({ 
    filters: initialFilters,
    pagination: initialPagination
  }),
  
  setSelectedAccounts: (accounts) => {
    set({ selectedAccounts: accounts });
    persistState({ ...get(), selectedAccounts: accounts });
  },
  
  setPage: (page) => set({ 
    pagination: { ...get().pagination, currentPage: page } 
  }),
  
  setItemsPerPage: (itemsPerPage) => set({ 
    pagination: { ...get().pagination, itemsPerPage, currentPage: 1 } 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  
  setError: (error) => set({ error }),
  
  setDataSource: (dataSource) => set({ dataSource }),
  
  // Computed
  getReclamacaoById: (reclamacaoId) => 
    get().reclamacoes.find(r => r.id === reclamacaoId || r.claim_id === reclamacaoId),
  
  // Hydration (para restaurar estado externamente)
  hydrate: (data) => {
    set(data);
    if (data.reclamacoes) {
      persistState({ ...get(), ...data });
    }
  }
}));
