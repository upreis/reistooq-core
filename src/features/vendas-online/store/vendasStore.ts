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

// ✅ Salvar estado no localStorage (apenas metadados essenciais para evitar QuotaExceededError)
const persistState = (orders: MLOrder[]) => {
  try {
    // Salvar apenas campos essenciais para restauração rápida (sem order_data JSONB gigante)
    const ordersMinimal = orders.map(order => ({
      id: order.id,
      status: order.status,
      date_created: order.date_created,
      total_amount: order.total_amount,
      buyer: order.buyer ? { id: order.buyer.id, nickname: order.buyer.nickname } : null,
      pack_id: order.pack_id,
      shipping_id: order.shipping?.id
    }));
    
    const toSave = {
      orders: ordersMinimal,
      timestamp: Date.now()
    };
    
    const serialized = JSON.stringify(toSave);
    
    // Verificar tamanho antes de salvar (limite ~5MB, usar 2MB como safe limit)
    if (serialized.length > 2 * 1024 * 1024) {
      console.warn('[VENDAS-STORE] Dados muito grandes para localStorage, salvando apenas últimos 50 pedidos');
      toSave.orders = ordersMinimal.slice(0, 50);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    // QuotaExceededError - limpar cache antigo e tentar novamente
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[VENDAS-STORE] QuotaExceededError - limpando cache antigo');
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('vendas-anotacoes');
        // Limpar outros caches relacionados se existirem
        const keysToClean = Object.keys(localStorage).filter(k => 
          k.startsWith('vendas-') || k.startsWith('ml-orders')
        );
        keysToClean.forEach(k => localStorage.removeItem(k));
      } catch (cleanError) {
        console.error('[VENDAS-STORE] Falha ao limpar localStorage:', cleanError);
      }
    } else {
      console.error('[VENDAS-STORE] Erro ao salvar estado:', error);
    }
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
