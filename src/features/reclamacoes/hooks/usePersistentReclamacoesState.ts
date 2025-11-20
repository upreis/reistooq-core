/**
 * 💾 HOOK DE PERSISTÊNCIA DE RECLAMAÇÕES
 * Cache inteligente com localStorage + validação de 30 minutos
 */

import { useState, useEffect, useCallback } from 'react';

interface PersistentReclamacoesState {
  reclamacoes: any[];
  selectedAccounts: string[];
  filters: {
    periodo: string;
    status?: string;
    type?: string;
    stage?: string;
  };
  currentPage: number;
  itemsPerPage: number;
  visibleColumns?: string[]; // ✅ AJUSTE 1: Adicionar colunas visíveis
  cachedAt: number;
}

function validatePersistedState(state: any): state is PersistentReclamacoesState {
  return (
    state &&
    typeof state === 'object' &&
    Array.isArray(state.reclamacoes) &&
    Array.isArray(state.selectedAccounts) &&
    typeof state.filters === 'object' &&
    typeof state.currentPage === 'number' &&
    typeof state.itemsPerPage === 'number' &&
    typeof state.cachedAt === 'number'
  );
}

const STORAGE_KEY = 'reclamacoes_persistent_state';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos de validade do cache

export function usePersistentReclamacoesState() {
  const [persistedState, setPersistedState] = useState<PersistentReclamacoesState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Validar estrutura
          if (!validatePersistedState(parsed)) {
            console.warn('⚠️ Estado persistido inválido, removendo...');
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // Verificar se o cache ainda é válido (30 minutos)
          const now = Date.now();
          const cacheAge = now - parsed.cachedAt;
          const isExpired = cacheAge > CACHE_DURATION;
          
          if (!isExpired) {
            console.log('🔄 Cache de reclamações carregado:', {
              reclamacoesCount: parsed.reclamacoes.length,
              cacheAge: Math.round(cacheAge / 1000) + 's',
              accounts: parsed.selectedAccounts.join(', '),
              filters: parsed.filters
            });
            setPersistedState(parsed);
          } else {
            console.log('⏰ Cache expirado (>30min), removendo...');
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

  // Salvar estado no localStorage
  const saveState = useCallback((newState: Partial<PersistentReclamacoesState>) => {
    try {
      const currentState = persistedState || {
        reclamacoes: [],
        selectedAccounts: [],
        filters: { periodo: '7' },
        currentPage: 1,
        itemsPerPage: 50,
        cachedAt: Date.now()
      };

      const updatedState: PersistentReclamacoesState = {
        ...currentState,
        ...newState,
        cachedAt: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      setPersistedState(updatedState);
      
      console.log('💾 Estado de reclamações salvo:', {
        reclamacoesCount: updatedState.reclamacoes.length,
        accounts: updatedState.selectedAccounts.join(', '),
        page: updatedState.currentPage
      });
    } catch (error) {
      console.error('Erro ao salvar estado persistido:', error);
    }
  }, [persistedState]);

  // Função helper para salvar cache de dados
  const saveDataCache = useCallback((
    reclamacoes: any[],
    selectedAccounts: string[],
    filters: any,
    currentPage: number,
    itemsPerPage: number,
    visibleColumns?: string[] // ✅ AJUSTE 1: Adicionar parâmetro opcional
  ) => {
    saveState({
      reclamacoes,
      selectedAccounts,
      filters,
      currentPage,
      itemsPerPage,
      visibleColumns
    });
  }, [saveState]);

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ Cache de reclamações limpo');
  }, []);

  // Verificar se há estado válido
  const hasValidPersistedState = useCallback(() => {
    return persistedState !== null && isStateLoaded;
  }, [persistedState, isStateLoaded]);

  return {
    persistedState,
    isStateLoaded,
    saveState,
    saveDataCache,
    clearPersistedState,
    hasValidPersistedState
  };
}
