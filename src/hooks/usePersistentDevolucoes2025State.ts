/**
 * 🔄 HOOK DE PERSISTÊNCIA - DEVOLUÇÕES 2025
 * Mantém filtros e dados em cache no localStorage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface PersistentDevolucoes2025State {
  selectedAccount: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  devolucoes: any[];
  total: number;
  currentPage: number;
  itemsPerPage: number;
  appliedAt: number;
  cachedAt: number;
}

const STORAGE_KEY = 'devolucoes2025_persistent_state';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export const usePersistentDevolucoes2025State = () => {
  const [persistedState, setPersistedState] = useState<PersistentDevolucoes2025State | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado do localStorage na montagem
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistentDevolucoes2025State;
        
        // Verificar se cache expirou
        const cacheAge = Date.now() - parsed.cachedAt;
        if (cacheAge > CACHE_DURATION_MS) {
          console.log('⏰ Cache de devoluções expirado, limpando estado persistido');
          localStorage.removeItem(STORAGE_KEY);
          setPersistedState(null);
        } else {
          // Reconstruir objetos Date
          parsed.dateRange = {
            from: new Date(parsed.dateRange.from),
            to: new Date(parsed.dateRange.to)
          };
          
          console.log('🔄 Estado de devoluções carregado:', {
            account: parsed.selectedAccount,
            devolucoes: parsed.devolucoes.length,
            cacheAge: `${Math.round(cacheAge / 1000)}s`,
            page: parsed.currentPage
          });
          
          setPersistedState(parsed);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado de devoluções:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsStateLoaded(true);
    }
  }, []);

  // Salvar estado genérico
  const saveState = useCallback((state: Partial<PersistentDevolucoes2025State>) => {
    setPersistedState(prev => {
      const newState = {
        ...prev,
        ...state,
        cachedAt: Date.now()
      } as PersistentDevolucoes2025State;
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        console.log('💾 Estado de devoluções salvo:', {
          account: newState.selectedAccount,
          devolucoes: newState.devolucoes?.length || 0,
          page: newState.currentPage
        });
      } catch (error) {
        console.error('❌ Erro ao salvar estado de devoluções:', error);
      }
      
      return newState;
    });
  }, []);

  // Salvar filtros aplicados
  const saveAppliedFilters = useCallback((
    selectedAccount: string,
    dateRange: { from: Date; to: Date },
    currentPage: number = 1,
    itemsPerPage: number = 50
  ) => {
    saveState({
      selectedAccount,
      dateRange,
      currentPage,
      itemsPerPage,
      appliedAt: Date.now(),
      devolucoes: persistedState?.devolucoes || [],
      total: persistedState?.total || 0
    });
  }, [saveState, persistedState]);

  // Salvar dados das devoluções
  const saveDevolucoes = useCallback((devolucoes: any[], total: number, currentPage: number) => {
    saveState({
      devolucoes,
      total,
      currentPage,
      selectedAccount: persistedState?.selectedAccount || 'all',
      dateRange: persistedState?.dateRange || { from: new Date(), to: new Date() },
      itemsPerPage: persistedState?.itemsPerPage || 50,
      appliedAt: persistedState?.appliedAt || Date.now()
    });
  }, [saveState, persistedState]);

  // Salvar página atual
  const saveCurrentPage = useCallback((currentPage: number) => {
    if (persistedState) {
      saveState({ ...persistedState, currentPage });
    }
  }, [saveState, persistedState]);

  // Salvar itens por página
  const saveItemsPerPage = useCallback((itemsPerPage: number) => {
    if (persistedState) {
      saveState({ ...persistedState, itemsPerPage, currentPage: 1 });
    }
  }, [saveState, persistedState]);

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ Estado de devoluções removido');
  }, []);

  // Verificar se tem estado válido
  const hasValidPersistedState = useCallback(() => {
    return !!(persistedState && persistedState.devolucoes && persistedState.devolucoes.length > 0);
  }, [persistedState]);

  // Verificar se precisa atualizar dados (comparando filtros)
  const shouldRefreshData = useCallback((
    currentAccount: string,
    currentDateRange: { from: Date; to: Date }
  ) => {
    if (!persistedState) return true;
    
    return (
      persistedState.selectedAccount !== currentAccount ||
      persistedState.dateRange.from.getTime() !== currentDateRange.from.getTime() ||
      persistedState.dateRange.to.getTime() !== currentDateRange.to.getTime()
    );
  }, [persistedState]);

  return {
    persistedState,
    isStateLoaded,
    hasValidPersistedState,
    shouldRefreshData,
    saveAppliedFilters,
    saveDevolucoes,
    saveCurrentPage,
    saveItemsPerPage,
    clearPersistedState
  };
};
