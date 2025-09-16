/**
 * 🔄 HOOK DE PERSISTÊNCIA PARA DEVOLUÇÕES AVANÇADAS
 * Sistema focado em tempo real com cache inteligente
 */

import { useState, useEffect, useCallback } from 'react';

interface DevolucoesPersistentState {
  data: any[];
  filters: any;
  searchFilters: any;
  currentPage: number;
  total: number;
  lastApiCall: number;
  dataSource: 'api' | 'database';
  selectedAccounts: string[];
}

const STORAGE_KEY = 'devolucoes_avancadas_state';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para dados da API

export function useDevolucoesPersistence() {
  const [persistedState, setPersistedState] = useState<DevolucoesPersistentState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado inicial
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: DevolucoesPersistentState = JSON.parse(saved);
          
          // Verificar validade do cache
          const now = Date.now();
          const isExpired = now - parsed.lastApiCall > CACHE_DURATION;
          
          if (!isExpired || parsed.dataSource === 'database') {
            console.log('🔄 Estado devoluções carregado:', {
              dataCount: parsed.data.length,
              source: parsed.dataSource,
              cacheAge: Math.round((now - parsed.lastApiCall) / 1000) + 's'
            });
            setPersistedState(parsed);
          } else {
            console.log('⏰ Cache de devoluções expirado');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar estado devoluções:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadPersistedState();
  }, []);

  // Salvar estado
  const saveState = useCallback((state: Partial<DevolucoesPersistentState>) => {
    try {
      const currentState = persistedState || {
        data: [],
        filters: {},
        searchFilters: {},
        currentPage: 1,
        total: 0,
        lastApiCall: 0,
        dataSource: 'database' as const,
        selectedAccounts: []
      };

      const newState: DevolucoesPersistentState = {
        ...currentState,
        ...state,
        lastApiCall: state.dataSource === 'api' ? Date.now() : currentState.lastApiCall
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPersistedState(newState);
      
      console.log('💾 Estado devoluções salvo:', {
        dataCount: newState.data.length,
        source: newState.dataSource
      });
    } catch (error) {
      console.warn('Erro ao salvar estado devoluções:', error);
    }
  }, [persistedState]);

  // Salvar dados da API
  const saveApiData = useCallback((data: any[], searchFilters: any) => {
    saveState({
      data,
      searchFilters,
      total: data.length,
      currentPage: 1,
      dataSource: 'api'
    });
  }, [saveState]);

  // Salvar dados do banco
  const saveDatabaseData = useCallback((data: any[], filters: any) => {
    saveState({
      data,
      filters,
      total: data.length,
      dataSource: 'database'
    });
  }, [saveState]);

  // Salvar contas selecionadas
  const saveSelectedAccounts = useCallback((selectedAccounts: string[]) => {
    saveState({ selectedAccounts });
  }, [saveState]);

  // Verificar se precisa recarregar
  const shouldRefreshData = useCallback((currentFilters: any, dataSource: 'api' | 'database') => {
    if (!persistedState) return true;
    
    if (persistedState.dataSource !== dataSource) return true;
    
    const relevantFilters = dataSource === 'api' ? persistedState.searchFilters : persistedState.filters;
    return JSON.stringify(relevantFilters) !== JSON.stringify(currentFilters);
  }, [persistedState]);

  // Verificar se tem dados válidos
  const hasValidData = useCallback(() => {
    return Boolean(persistedState && persistedState.data.length > 0);
  }, [persistedState]);

  // Limpar cache
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      console.log('🗑️ Cache devoluções limpo');
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, []);

  return {
    persistedState,
    isStateLoaded,
    hasValidData,
    shouldRefreshData,
    saveApiData,
    saveDatabaseData,
    saveSelectedAccounts,
    clearPersistedState
  };
}