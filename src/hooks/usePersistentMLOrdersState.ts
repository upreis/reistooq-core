import React, { useState, useEffect, useCallback } from 'react';

interface PersistentMLOrdersState {
  filters: any;
  devolucoes: any[];
  total: number;
  currentPage: number;
  integrationAccountId?: string;
  quickFilter?: string;
  appliedAt: string;
  cachedAt: string;
}

const STORAGE_KEY = 'ml_orders_persistent_state';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export const usePersistentMLOrdersState = () => {
  const [persistedState, setPersistedState] = useState<PersistentMLOrdersState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado do localStorage na inicialização
  useEffect(() => {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        const now = Date.now();
        const cacheAge = now - new Date(parsed.cachedAt).getTime();
        
        // Verificar se o cache não expirou
        if (cacheAge < CACHE_DURATION_MS) {
          setPersistedState(parsed);
          console.log('🔄 Estado persistido ML Orders carregado:', {
            filters: parsed.filters,
            devolucoes: parsed.devolucoes?.length || 0,
            cacheAge: `${Math.round(cacheAge / 1000)}s`
          });
        } else {
          console.log('⏰ Cache ML Orders expirado, limpando estado persistido');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado persistido ML Orders:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsStateLoaded(true);
    }
  }, []);

  // Função genérica para salvar estado
  const saveState = useCallback((state: Partial<PersistentMLOrdersState>) => {
    try {
      const currentState = persistedState || {} as PersistentMLOrdersState;
      const newState = {
        ...currentState,
        ...state,
        cachedAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPersistedState(newState);
      
      console.log('💾 Estado ML Orders salvo:', {
        hasFilters: !!newState.filters,
        devolucoes: newState.devolucoes?.length || 0,
        page: newState.currentPage
      });
    } catch (error) {
      console.error('❌ Erro ao salvar estado persistido ML Orders:', error);
    }
  }, [persistedState]);

  // Salvar filtros aplicados
  const saveAppliedFilters = useCallback((filters: any) => {
    saveState({
      filters,
      appliedAt: new Date().toISOString()
    });
  }, [saveState]);

  // Salvar dados das devoluções
  const saveOrdersData = useCallback((devolucoes: any[], total: number, currentPage: number) => {
    saveState({
      devolucoes,
      total,
      currentPage
    });
  }, [saveState]);

  // Salvar filtro rápido
  const saveQuickFilter = useCallback((quickFilter: string) => {
    saveState({ quickFilter });
  }, [saveState]);

  // Salvar integration account ID
  const saveIntegrationAccountId = useCallback((integrationAccountId: string) => {
    saveState({ integrationAccountId });
  }, [saveState]);

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      console.log('🗑️ Estado persistido ML Orders removido');
    } catch (error) {
      console.error('❌ Erro ao limpar estado persistido ML Orders:', error);
    }
  }, []);

  // Verificar se existe estado válido
  const hasValidPersistedState = useCallback(() => {
    return persistedState && persistedState.devolucoes && persistedState.devolucoes.length > 0;
  }, [persistedState]);

  // Verificar se deve recarregar dados
  const shouldRefreshData = useCallback((currentFilters: any) => {
    if (!persistedState) return true;
    
    // Comparar filtros básicos
    const storedFilters = persistedState.filters || {};
    const filtersChanged = JSON.stringify(storedFilters) !== JSON.stringify(currentFilters);
    
    return filtersChanged;
  }, [persistedState]);

  return {
    persistedState,
    isStateLoaded,
    hasValidPersistedState,
    shouldRefreshData,
    saveAppliedFilters,
    saveOrdersData,
    saveQuickFilter,
    saveIntegrationAccountId,
    clearPersistedState
  };
};