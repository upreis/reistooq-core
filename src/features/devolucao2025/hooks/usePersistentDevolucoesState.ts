/**
 * 💾 HOOK DE CACHE DE DADOS - PÁGINA DEVOLUÇÕES DE VENDA
 * Mantém dados carregados (devoluções, filtros, paginação) para evitar re-fetch
 * 
 * RESPONSABILIDADES:
 * - ✅ Cache de dados (devoluções, total)
 * - ✅ Integration account selecionada
 * - ✅ Filtros aplicados (dateRange)
 * - ✅ Paginação (página atual, items por página)
 * - ✅ Colunas visíveis
 * 
 * MELHORIAS: Validação de integridade + Expiração automática
 */

import { useState, useEffect, useCallback } from 'react';

interface PersistentDevolucoesState {
  // DADOS DE CACHE
  devolucoes: any[];
  selectedAccount: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  
  // PAGINAÇÃO
  currentPage: number;
  itemsPerPage: number;
  
  // COLUNAS VISÍVEIS
  visibleColumns: string[];
  
  // TIMESTAMPS
  cachedAt: number; // timestamp do cache dos dados
}

const STORAGE_KEY = 'devolucoes_venda_persistent_state';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milliseconds

export function usePersistentDevolucoesState() {
  const [persistedState, setPersistedState] = useState<PersistentDevolucoesState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // VALIDAÇÃO DE INTEGRIDADE DOS DADOS
  const validatePersistedState = useCallback((state: PersistentDevolucoesState): boolean => {
    if (!state.devolucoes || !Array.isArray(state.devolucoes)) return false;
    if (typeof state.selectedAccount !== 'string') return false;
    if (!state.dateRange || !state.dateRange.from || !state.dateRange.to) return false;
    if (typeof state.currentPage !== 'number') return false;
    if (typeof state.itemsPerPage !== 'number') return false;
    if (!Array.isArray(state.visibleColumns)) return false;
    if (typeof state.cachedAt !== 'number') return false;
    return true;
  }, []);

  // Carregar estado persistido na inicialização
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: PersistentDevolucoesState = JSON.parse(saved);
          
          // Converter strings de data de volta para Date objects ANTES da validação
          if (parsed.dateRange) {
            parsed.dateRange.from = new Date(parsed.dateRange.from);
            parsed.dateRange.to = new Date(parsed.dateRange.to);
          }
          
          // VALIDAR INTEGRIDADE DOS DADOS
          if (!validatePersistedState(parsed)) {
            console.log('🗑️ Estado com integridade comprometida, removendo:', parsed);
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // Verificar se o cache ainda é válido (não expirou)
          const now = Date.now();
          const isExpired = now - parsed.cachedAt > CACHE_DURATION;
          
          if (!isExpired) {
            console.log('🔄 Cache de devoluções carregado:', {
              devolucoesCount: parsed.devolucoes.length,
              cacheAge: Math.round((now - parsed.cachedAt) / 1000) + 's',
              account: parsed.selectedAccount,
              dateRange: `${parsed.dateRange.from.toLocaleDateString()} - ${parsed.dateRange.to.toLocaleDateString()}`
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
  }, [validatePersistedState]);

  // Salvar estado atual
  const saveState = useCallback((state: Partial<PersistentDevolucoesState>) => {
    try {
      const currentState = persistedState || {
        devolucoes: [],
        selectedAccount: 'all',
        dateRange: {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date()
        },
        currentPage: 1,
        itemsPerPage: 50,
        visibleColumns: [],
        cachedAt: 0
      };

      const newState: PersistentDevolucoesState = {
        ...currentState,
        ...state,
        cachedAt: Date.now()
      };

      // Validar antes de salvar
      if (!validatePersistedState(newState)) {
        console.warn('⚠️ Estado inválido, não será persistido:', newState);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPersistedState(newState);
      
      console.log('💾 Estado de devoluções salvo:', {
        devolucoesCount: newState.devolucoes.length,
        account: newState.selectedAccount,
        page: newState.currentPage
      });
    } catch (error) {
      console.warn('Erro ao salvar estado:', error);
    }
  }, [persistedState, validatePersistedState]);

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ Estado de devoluções removido');
  }, []);

  // Verificar se existe estado válido
  const hasValidPersistedState = useCallback((): boolean => {
    if (!isStateLoaded || !persistedState) return false;
    
    const now = Date.now();
    const isExpired = now - persistedState.cachedAt > CACHE_DURATION;
    
    return !isExpired && persistedState.devolucoes.length > 0;
  }, [isStateLoaded, persistedState]);

  // Salvar dados após busca bem-sucedida
  const saveDataCache = useCallback((
    devolucoes: any[],
    selectedAccount: string,
    dateRange: { from: Date; to: Date },
    currentPage: number,
    itemsPerPage: number,
    visibleColumns: string[]
  ) => {
    saveState({
      devolucoes,
      selectedAccount,
      dateRange,
      currentPage,
      itemsPerPage,
      visibleColumns
    });
  }, [saveState]);

  return {
    persistedState,
    isStateLoaded,
    saveState,
    saveDataCache,
    clearPersistedState,
    hasValidPersistedState
  };
}
