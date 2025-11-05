/**
 * 💾 HOOK DE CACHE DE DADOS DA PÁGINA PEDIDOS
 * Mantém APENAS dados carregados (orders, pagination) para evitar re-fetch
 * 
 * ⚠️ IMPORTANTE: NÃO gerencia filtros (isso é feito por usePedidosFiltersSync via URL)
 * 
 * RESPONSABILIDADES:
 * - ✅ Cache de dados (orders, total, currentPage)
 * - ✅ Integration account ID
 * - ✅ Quick filter selecionado
 * - ❌ NÃO gerencia filtros aplicados (URL params fazem isso)
 * 
 * ✅ MELHORIAS: Debounce para persistência + Validação de integridade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface PersistentPedidosState {
  // ⚠️ DEPRECATED: filters não deve ser usado (URL params gerenciam filtros)
  filters?: any; // Mantido apenas para compatibilidade com estados antigos
  
  // ✅ DADOS DE CACHE
  orders: any[];
  total: number;
  currentPage: number;
  integrationAccountId: string;
  quickFilter: string;
  
  // ✅ TIMESTAMPS
  cachedAt: number; // timestamp do cache dos dados
}

const STORAGE_KEY = 'pedidos_persistent_state';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milliseconds

export function usePersistentPedidosState() {
  const [persistedState, setPersistedState] = useState<PersistentPedidosState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // ✅ VALIDAÇÃO DE INTEGRIDADE DOS DADOS
  const validatePersistedState = useCallback((state: PersistentPedidosState): boolean => {
    if (!state.orders || !Array.isArray(state.orders)) return false;
    if (typeof state.total !== 'number') return false;
    if (typeof state.currentPage !== 'number') return false;
    if (typeof state.integrationAccountId !== 'string') return false;
    if (typeof state.quickFilter !== 'string') return false;
    if (typeof state.cachedAt !== 'number') return false;
    return true;
  }, []);

  // Carregar estado persistido na inicialização
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: PersistentPedidosState = JSON.parse(saved);
          
          // ✅ VALIDAR INTEGRIDADE DOS DADOS PRIMEIRO
          if (!validatePersistedState(parsed)) {
            console.log('🗑️ Estado com integridade comprometida, removendo:', parsed);
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // ✅ LIMPAR FILTROS ANTIGOS (não são mais usados)
          if (parsed.filters) {
            console.log('🗑️ Removendo filtros antigos do cache (agora gerenciados por URL)');
            delete parsed.filters;
          }
          
          // Verificar se o cache ainda é válido (não expirou)
          const now = Date.now();
          const isExpired = now - parsed.cachedAt > CACHE_DURATION;
          
          if (!isExpired) {
            console.log('🔄 Cache de dados carregado:', {
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
  }, [validatePersistedState]);

  // Salvar estado atual (função interna sem debounce)
  const saveStateImmediate = useCallback((state: Partial<PersistentPedidosState>) => {
    try {
      const currentState = persistedState || {
        orders: [],
        total: 0,
        currentPage: 1,
        integrationAccountId: '',
        quickFilter: 'all',
        cachedAt: 0
      };

      // ✅ CORREÇÃO: Reduzir dados salvos para evitar QuotaExceededError
      // Não salvar array completo de orders, apenas metadados essenciais
      const newState: PersistentPedidosState = {
        ...currentState,
        ...state,
        // ⚠️ OTIMIZAÇÃO: Não salvar orders completos (muito pesado)
        orders: [], // Sempre vazio para economizar espaço
        cachedAt: Date.now() // Sempre atualizar timestamp do cache
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setPersistedState(newState);
      
      console.log('💾 Cache de dados salvo:', {
        total: newState.total,
        page: newState.currentPage
      });
    } catch (error) {
      console.warn('⚠️ Erro ao salvar estado (localStorage cheio):', error);
    }
  }, [persistedState]);

  // ✅ DEBOUNCE PARA SALVAR ESTADO - Evitar muitas escritas no localStorage
  const debouncedSaveState = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (state: Partial<PersistentPedidosState>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveStateImmediate(state);
      }, 1000); // Salvar após 1s de inatividade
    };
  }, [saveStateImmediate]);

  // Salvar estado atual (com debounce)
  const saveState = useCallback((state: Partial<PersistentPedidosState>) => {
    debouncedSaveState(state);
  }, [debouncedSaveState]);

  // ⚠️ DEPRECATED: Filtros não são mais salvos aqui (URL params gerenciam)
  // Mantido apenas para compatibilidade com código legado
  const saveAppliedFilters = useCallback((_filters: any) => {
    console.warn('⚠️ saveAppliedFilters está deprecated - filtros gerenciados por URL params');
    // Não faz nada - filtros gerenciados por usePedidosFiltersSync
  }, []);

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

  // Limpar cache de dados
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      console.log('🗑️ Cache de dados removido');
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, []);

  // Verificar se existe estado válido para restaurar
  const hasValidPersistedState = useCallback(() => {
    return Boolean(persistedState && persistedState.orders.length > 0);
  }, [persistedState]);

  // ⚠️ DEPRECATED: Filtros não são mais comparados aqui (URL params gerenciam)
  // Mantido apenas para compatibilidade com código legado
  const shouldRefreshData = useCallback((_currentFilters: any) => {
    console.warn('⚠️ shouldRefreshData está deprecated - filtros gerenciados por URL params');
    return true; // Sempre retorna true para forçar refresh baseado em URL
  }, []);

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