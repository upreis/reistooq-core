/**
 * 🔄 HOOK DE PERSISTÊNCIA PARA DEVOLUÇÕES AVANÇADAS
 * DESABILITADO - Sistema agora é 100% manual controlado pelo usuário
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
const CACHE_DURATION = 0; // ❌ CACHE DESABILITADO - Sempre expirado
const RESTORE_PROMPT_KEY = 'devolucoes_restore_prompt_shown';

export function useDevolucoesPersistence() {
  const [persistedState, setPersistedState] = useState<DevolucoesPersistentState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // ❌ CARREGAR ESTADO DESABILITADO - Sempre retorna vazio
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        // Limpar qualquer cache antigo
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(RESTORE_PROMPT_KEY);
        
        logger.info('✅ Persistência desabilitada - sistema manual');
      } catch (error) {
        logger.warn('Erro ao limpar cache antigo', error);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadPersistedState();
  }, []);

  // ❌ SALVAR ESTADO DESABILITADO - Não persiste mais nada
  const saveState = useCallback((state: Partial<DevolucoesPersistentState>) => {
    // Não fazer nada - persistência desabilitada
    logger.info('✅ Salvamento ignorado - sistema manual');
  }, []);

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