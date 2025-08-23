import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Pedido, PedidosFilters } from '../types/pedidos.types';

interface PedidosState {
  // Data
  pedidos: Pedido[];
  total: number;
  page: number;
  hasNextPage: boolean;
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  isSelectMode: boolean;
  
  // Filters
  filters: PedidosFilters;
  appliedFilters: PedidosFilters;
  
  // Cache
  lastFetch: number | null;
  cacheKey: string | null;
}

interface PedidosActions {
  // Data actions
  setPedidos: (pedidos: Pedido[], total: number, hasNextPage: boolean) => void;
  appendPedidos: (pedidos: Pedido[], hasNextPage: boolean) => void;
  updatePedido: (id: string, updates: Partial<Pedido>) => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selection actions
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectMode: (enabled: boolean) => void;
  
  // Filter actions
  setFilters: (filters: PedidosFilters) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  
  // Cache actions
  invalidateCache: () => void;
  setCacheKey: (key: string) => void;
  
  // Utilities
  reset: () => void;
}

const initialState: PedidosState = {
  pedidos: [],
  total: 0,
  page: 1,
  hasNextPage: false,
  loading: false,
  error: null,
  selectedIds: new Set(),
  isSelectMode: false,
  filters: {},
  appliedFilters: {},
  lastFetch: null,
  cacheKey: null,
};

export const usePedidosStore = create<PedidosState & PedidosActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Data actions
        setPedidos: (pedidos, total, hasNextPage) =>
          set((state) => {
            state.pedidos = pedidos;
            state.total = total;
            state.hasNextPage = hasNextPage;
            state.page = 1;
            state.lastFetch = Date.now();
            state.loading = false;
            state.error = null;
          }),
          
        appendPedidos: (pedidos, hasNextPage) =>
          set((state) => {
            state.pedidos.push(...pedidos);
            state.hasNextPage = hasNextPage;
            state.loading = false;
          }),
          
        updatePedido: (id, updates) =>
          set((state) => {
            const index = state.pedidos.findIndex(p => p.id === id);
            if (index !== -1) {
              Object.assign(state.pedidos[index], updates);
            }
          }),
          
        // Loading actions
        setLoading: (loading) =>
          set((state) => {
            state.loading = loading;
            if (loading) {
              state.error = null;
            }
          }),
          
        setError: (error) =>
          set((state) => {
            state.error = error;
            state.loading = false;
          }),
          
        // Selection actions
        toggleSelection: (id) =>
          set((state) => {
            if (state.selectedIds.has(id)) {
              state.selectedIds.delete(id);
            } else {
              state.selectedIds.add(id);
            }
          }),
          
        selectAll: () =>
          set((state) => {
            state.selectedIds = new Set(state.pedidos.map(p => p.id));
          }),
          
        clearSelection: () =>
          set((state) => {
            state.selectedIds = new Set();
            state.isSelectMode = false;
          }),
          
        setSelectMode: (enabled) =>
          set((state) => {
            state.isSelectMode = enabled;
            if (!enabled) {
              state.selectedIds = new Set();
            }
          }),
          
        // Filter actions
        setFilters: (filters) =>
          set((state) => {
            state.filters = filters;
          }),
          
        applyFilters: () =>
          set((state) => {
            state.appliedFilters = { ...state.filters };
            state.page = 1;
            state.pedidos = [];
            state.lastFetch = null;
          }),
          
        clearFilters: () =>
          set((state) => {
            state.filters = {};
            state.appliedFilters = {};
            state.page = 1;
            state.pedidos = [];
            state.lastFetch = null;
          }),
          
        // Pagination
        setPage: (page) =>
          set((state) => {
            state.page = page;
          }),
          
        nextPage: () =>
          set((state) => {
            if (state.hasNextPage) {
              state.page += 1;
            }
          }),
          
        // Cache actions
        invalidateCache: () =>
          set((state) => {
            state.lastFetch = null;
            state.cacheKey = null;
          }),
          
        setCacheKey: (key) =>
          set((state) => {
            state.cacheKey = key;
          }),
          
        // Utilities
        reset: () => set(initialState),
      })),
      {
        name: 'pedidos-store',
      }
    )
  )
);

// Selectors
export const getSelectedPedidos = () => {
  const { pedidos, selectedIds } = usePedidosStore.getState();
  return pedidos.filter(p => selectedIds.has(p.id));
};

export const getFilteredCount = () => {
  const { pedidos, appliedFilters } = usePedidosStore.getState();
  // Apply local filters if needed
  return pedidos.length;
};

export const isCacheValid = (maxAge = 5 * 60 * 1000) => { // 5 minutes
  const { lastFetch } = usePedidosStore.getState();
  if (!lastFetch) return false;
  return Date.now() - lastFetch < maxAge;
};