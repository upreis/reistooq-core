/**
 * 🗄️ VENDAS STORE - Zustand
 * Store único para gerenciar todo o estado de Vendas Canceladas
 * ✅ COM PERSISTÊNCIA AUTOMÁTICA no localStorage
 */

import { create } from 'zustand';
import { VendasFilters, VendasPagination, MLOrder, MLPack, MLShipping } from '../types/vendas.types';

interface VendasState {
  // Data
  orders: MLOrder[];
  packs: Record<number, MLPack>;
  shippings: Record<number, MLShipping>;
  
  // 📝 Anotações locais
  anotacoes: Record<string, string>;
  
  // Filters
  filters: VendasFilters;
  
  // Pagination
  pagination: VendasPagination;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  setOrders: (orders: MLOrder[], total: number) => void;
  setPacks: (packs: Record<number, MLPack>) => void;
  setShippings: (shippings: Record<number, MLShipping>) => void;
  
  // 📝 Anotações
  setAnotacao: (orderId: string, anotacao: string) => void;
  
  updateFilters: (filters: Partial<VendasFilters>) => void;
  resetFilters: () => void;
  
  setPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  
  setLoading: (isLoading: boolean) => void;
  setLoadingMore: (isLoadingMore: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getOrderById: (orderId: number) => MLOrder | undefined;
  getPackById: (packId: number) => MLPack | undefined;
  getShippingById: (shippingId: number) => MLShipping | undefined;
}

const STORAGE_KEY = 'vendas-canceladas-store';

const initialFilters: VendasFilters = {
  search: '',
  status: [],
  dateFrom: null,
  dateTo: null,
  integrationAccountId: '',
  hasPack: null,
  hasShipping: null,
  paymentStatus: []
};

const initialPagination: VendasPagination = {
  currentPage: 1,
  itemsPerPage: 50,
  total: 0
};

// ✅ Carregar estado do localStorage (igual reclamacoesStore)
const loadPersistedState = (): { orders: MLOrder[], pagination: VendasPagination } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar TTL (30 minutos)
      if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        console.log('📦 [VENDAS-STORE] Restaurando estado do localStorage:', {
          orders: parsed.orders?.length || 0
        });
        return {
          orders: parsed.orders || [],
          pagination: { ...initialPagination, total: parsed.orders?.length || 0 }
        };
      }
    }
  } catch (error) {
    console.error('[VENDAS-STORE] Erro ao carregar estado:', error);
  }
  return { orders: [], pagination: initialPagination };
};

// ✅ Salvar estado no localStorage
const persistState = (orders: MLOrder[]) => {
  try {
    const toSave = {
      orders,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('[VENDAS-STORE] Erro ao salvar estado:', error);
  }
};

const persistedState = loadPersistedState();

export const useVendasStore = create<VendasState>((set, get) => ({
  // Initial state (com hydration do localStorage)
  orders: persistedState.orders,
  packs: {},
  shippings: {},
  anotacoes: (() => {
    try {
      const stored = localStorage.getItem('vendas-anotacoes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })(),
  filters: initialFilters,
  pagination: persistedState.pagination,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  
  // Actions
  setOrders: (orders, total) => {
    set({ 
      orders, 
      pagination: { ...get().pagination, total } 
    });
    // ✅ Persistir automaticamente
    persistState(orders);
  },
  
  setPacks: (packs) => set({ packs }),
  
  setShippings: (shippings) => set({ shippings }),
  
  // 📝 Anotações
  setAnotacao: (orderId, anotacao) => {
    const newAnotacoes = { ...get().anotacoes, [orderId]: anotacao };
    set({ anotacoes: newAnotacoes });
    try {
      localStorage.setItem('vendas-anotacoes', JSON.stringify(newAnotacoes));
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
    }
  },
  
  updateFilters: (newFilters) => set({ 
    filters: { ...get().filters, ...newFilters },
    pagination: { ...get().pagination, currentPage: 1 } // Reset to page 1 on filter change
  }),
  
  resetFilters: () => set({ 
    filters: initialFilters,
    pagination: initialPagination
  }),
  
  setPage: (page) => set({ 
    pagination: { ...get().pagination, currentPage: page } 
  }),
  
  setItemsPerPage: (itemsPerPage) => set({ 
    pagination: { ...get().pagination, itemsPerPage, currentPage: 1 } 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  
  setError: (error) => set({ error }),
  
  // Computed
  getOrderById: (orderId) => get().orders.find(o => o.id === orderId),
  
  getPackById: (packId) => get().packs[packId],
  
  getShippingById: (shippingId) => get().shippings[shippingId]
}));
