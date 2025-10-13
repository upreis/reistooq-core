/**
 * 🔄 HOOK DE PERSISTÊNCIA PARA DEVOLUÇÕES AVANÇADAS
 * Sistema focado em tempo real com cache inteligente
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface DevolucoesPersistentState {
  data: any[];
  filters: any;
  searchFilters: any;
  currentPage: number;
  itemsPerPage: number;
  total: number;
  lastApiCall: number;
  dataSource: 'api' | 'database';
  selectedAccounts: string[];
}

const STORAGE_KEY = 'devolucoes_avancadas_state';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas para persistência
const RESTORE_PROMPT_KEY = 'devolucoes_restore_prompt_shown';

export function useDevolucoesPersistence() {
  const [persistedState, setPersistedState] = useState<DevolucoesPersistentState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // Carregar estado inicial
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: DevolucoesPersistentState = JSON.parse(saved);
          
          // Verificar validade do cache
          const now = Date.now();
          const cacheAge = now - parsed.lastApiCall;
          const isExpired = cacheAge > CACHE_DURATION;
          
          if (!isExpired) {
            const promptShown = sessionStorage.getItem(RESTORE_PROMPT_KEY);
            
            logger.info('Estado devoluções encontrado', {
              dataCount: parsed.data.length,
              source: parsed.dataSource,
              cacheAge: Math.round(cacheAge / 1000 / 60) + ' minutos',
              page: parsed.currentPage,
              itemsPerPage: parsed.itemsPerPage
            });
            
            setPersistedState(parsed);
            
            // Mostrar prompt apenas uma vez por sessão
            if (!promptShown && parsed.data.length > 0) {
              setShowRestorePrompt(true);
            }
          } else {
            logger.info('Cache de devoluções expirado (24h)');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        logger.warn('Erro ao carregar estado devoluções', error);
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
        itemsPerPage: 25,
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
      
      logger.info('Estado devoluções salvo', {
        dataCount: newState.data.length,
        source: newState.dataSource
      });
    } catch (error) {
      logger.warn('Erro ao salvar estado devoluções', error);
    }
  }, [persistedState]);

  // Salvar dados da API com página e itemsPerPage
  const saveApiData = useCallback((data: any[], searchFilters: any, currentPage?: number, itemsPerPage?: number) => {
    saveState({
      data,
      searchFilters,
      total: data.length,
      currentPage: currentPage || 1,
      itemsPerPage: itemsPerPage || 25,
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
      sessionStorage.removeItem(RESTORE_PROMPT_KEY);
      setPersistedState(null);
      setShowRestorePrompt(false);
      logger.info('Cache devoluções limpo');
    } catch (error) {
      logger.warn('Erro ao limpar cache', error);
    }
  }, []);

  // Aceitar restauração
  const acceptRestore = useCallback(() => {
    sessionStorage.setItem(RESTORE_PROMPT_KEY, 'true');
    setShowRestorePrompt(false);
  }, []);

  // Recusar restauração
  const rejectRestore = useCallback(() => {
    sessionStorage.setItem(RESTORE_PROMPT_KEY, 'true');
    setShowRestorePrompt(false);
    clearPersistedState();
  }, [clearPersistedState]);

  return {
    persistedState,
    isStateLoaded,
    showRestorePrompt,
    hasValidData,
    shouldRefreshData,
    saveApiData,
    saveDatabaseData,
    saveSelectedAccounts,
    clearPersistedState,
    acceptRestore,
    rejectRestore
  };
}