/**
 * 🗄️ VENDAS STORE - Zustand
 * Store único para gerenciar todo o estado de Vendas Online
 */

import { create } from 'zustand';
import { VendasFilters, VendasPagination, MLOrder, MLPack, MLShipping } from '../types/vendas.types';

interface VendasState {
  // Data
  orders: MLOrder[];
  packs: Record<number, MLPack>;
  shippings: Record<number, MLShipping>;
  
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

export const useVendasStore = create<VendasState>((set, get) => ({
  // Initial state
  orders: [],
  packs: {},
  shippings: {},
  filters: initialFilters,
  pagination: initialPagination,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  
  // Actions
  setOrders: (orders, total) => set({ 
    orders, 
    pagination: { ...get().pagination, total } 
  }),
  
  setPacks: (packs) => set({ packs }),
  
  setShippings: (shippings) => set({ shippings }),
  
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
