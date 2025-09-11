/**
 * 🔄 HOOK DE PERSISTÊNCIA DE ESTADO DA PÁGINA PEDIDOS
 * Mantém filtros e dados quando o usuário sai e volta à página
 */

import { useState, useEffect, useCallback } from 'react';

interface PersistentPedidosState {
  filters: any;
  orders: any[];
  total: number;
  currentPage: number;
  integrationAccountId: string;
  quickFilter: string;
  appliedAt: number; // timestamp da última aplicação de filtros
  cachedAt: number; // timestamp do cache dos dados
}

const STORAGE_KEY = 'pedidos_persistent_state';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milliseconds

export function usePersistentPedidosState() {
  const [persistedState, setPersistedState] = useState<PersistentPedidosState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado persistido na inicialização
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: PersistentPedidosState = JSON.parse(saved);
          
          // ✅ VERIFICAR E LIMPAR FILTROS PROBLEMÁTICOS
          if (parsed.filters?.statusEnvio?.includes?.('Cancelado')) {
            console.log('🗑️ Removendo estado com filtros problemáticos:', parsed.filters);
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // Converter datas string para Date nos filtros
          if (parsed.filters) {
            if (parsed.filters.dataInicio && typeof parsed.filters.dataInicio === 'string') {
              parsed.filters.dataInicio = new Date(parsed.filters.dataInicio);
            }
            if (parsed.filters.dataFim && typeof parsed.filters.dataFim === 'string') {
              parsed.filters.dataFim = new Date(parsed.filters.dataFim);
            }
          }
          
          // Verificar se o cache ainda é válido (não expirou)
          const now = Date.now();
          const isExpired = now - parsed.cachedAt > CACHE_DURATION;
          
          if (!isExpired) {
            console.log('🔄 Estado persistido carregado:', {
              filters: parsed.filters,
              ordersCount: parsed.orders.length,
              cacheAge: Math.round((now - parsed.cachedAt) / 1000) + 's'
            });
            setPersistedState(parsed);
          } else {
            console.log('⏰ Cache expirado, limpando estado persistido');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar estado persistido:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadPersistedState();
  }, []);

  // Salvar estado atual
  const saveState = useCallback((state: Partial<PersistentPedidosState>) => {
    try {
      const currentState = persistedState || {
        filters: {},
        orders: [],
        total: 0,
        currentPage: 1,
        integrationAccountId: '',
        quickFilter: 'all',
        appliedAt: 0,
        cachedAt: 0
      };

      const newState: PersistentPedidosState = {
        ...currentState,
        ...state,
        cachedAt: Date.now() // Sempre atualizar timestamp do cache
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPersistedState(newState);
      
      console.log('💾 Estado salvo:', {
        hasFilters: Object.keys(newState.filters || {}).length > 0,
        ordersCount: newState.orders.length,
        page: newState.currentPage
      });
    } catch (error) {
      console.warn('Erro ao salvar estado:', error);
    }
  }, [persistedState]);

  // Salvar filtros aplicados
  const saveAppliedFilters = useCallback((filters: any) => {
    saveState({
      filters,
      appliedAt: Date.now()
    });
  }, [saveState]);

  // Salvar dados dos pedidos
  const saveOrdersData = useCallback((orders: any[], total: number, currentPage: number) => {
    saveState({
      orders,
      total,
      currentPage
    });
  }, [saveState]);

  // Salvar filtro rápido
  const saveQuickFilter = useCallback((quickFilter: string) => {
    saveState({ quickFilter });
  }, [saveState]);

  // Salvar conta de integração
  const saveIntegrationAccountId = useCallback((integrationAccountId: string) => {
    saveState({ integrationAccountId });
  }, [saveState]);

  // Limpar estado persistido (quando usuário fizer nova busca ou limpar filtros)
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      console.log('🗑️ Estado persistido removido');
    } catch (error) {
      console.warn('Erro ao limpar estado:', error);
    }
  }, []);

  // Verificar se existe estado válido para restaurar
  const hasValidPersistedState = useCallback(() => {
    return Boolean(persistedState && persistedState.orders.length > 0);
  }, [persistedState]);

  // Verificar se os filtros mudaram significativamente
  const shouldRefreshData = useCallback((currentFilters: any) => {
    if (!persistedState?.filters) return true;
    
    // Comparar filtros de forma simples
    const persistedFiltersStr = JSON.stringify(persistedState.filters);
    const currentFiltersStr = JSON.stringify(currentFilters);
    
    return persistedFiltersStr !== currentFiltersStr;
  }, [persistedState]);

  return {
    // Estado
    persistedState,
    isStateLoaded,
    
    // Verificações
    hasValidPersistedState,
    shouldRefreshData,
    
    // Ações
    saveAppliedFilters,
    saveOrdersData,
    saveQuickFilter,
    saveIntegrationAccountId,
    clearPersistedState
  };
}