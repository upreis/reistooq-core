/**
 * 🏪 STORE - DEVOLUÇÕES
 * Zustand store para gerenciar estado de devoluções
 */

import { create } from 'zustand';
import { MLReturn, DevolucaoFilters, DevolucaoPagination } from '../types/devolucao.types';

interface DevolucaoStore {
  // Estado
  devolucoes: MLReturn[];
  filters: DevolucaoFilters;
  pagination: DevolucaoPagination;
  isLoading: boolean;
  error: string | null;

  // Ações
  setDevolucoes: (devolucoes: MLReturn[]) => void;
  updateFilters: (filters: Partial<DevolucaoFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPagination: (pagination: Partial<DevolucaoPagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: DevolucaoFilters = {
  search: '',
  status: [],
  dateFrom: null,
  dateTo: null,
  integrationAccountId: '',
};

const initialPagination: DevolucaoPagination = {
  currentPage: 1,
  itemsPerPage: 50,
  total: 0,
};

export const useDevolucaoStore = create<DevolucaoStore>((set) => ({
  // Estado inicial
  devolucoes: [],
  filters: initialFilters,
  pagination: initialPagination,
  isLoading: false,
  error: null,

  // Ações
  setDevolucoes: (devolucoes) => set({ devolucoes }),
  
  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, currentPage: 1 }, // Reset para página 1 ao filtrar
    })),
  
  resetFilters: () =>
    set({
      filters: initialFilters,
      pagination: initialPagination,
    }),
  
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    })),
  
  setPagination: (newPagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination },
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}));
