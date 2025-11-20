/**
 * 💾 HOOK DE CACHE DE DADOS V2 - PÁGINA DEVOLUÇÕES DE VENDA
 * FASE 1: Cache Validation e Versionamento baseado em /pedidos reference
 * 
 * MELHORIAS:
 * - ✅ LocalStorageValidator com validação robusta
 * - ✅ Versionamento com limpeza automática
 * - ✅ Health checks de storage
 * - ✅ Debounce para persistência (500ms)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalStorageValidator } from '@/utils/storageValidation';

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'devolucoes_venda_persistent_state';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

interface PersistentDevolucoesState {
  // DADOS DE CACHE
  devolucoes: any[];
  selectedAccounts: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  
  // PAGINAÇÃO
  currentPage: number;
  itemsPerPage: number;
  
  // COLUNAS VISÍVEIS
  visibleColumns: string[];
  
  // FILTROS
  periodo: string;
  
  // VERSIONAMENTO E TIMESTAMPS
  version: number;
  cachedAt: number;
}

export function usePersistentDevolucoesStateV2() {
  const [persistedState, setPersistedState] = useState<PersistentDevolucoesState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // VALIDAÇÃO CUSTOMIZADA PARA DEVOLUÇÕES
  const validateDevolucoesState = useCallback((state: any): boolean => {
    if (!state || typeof state !== 'object') return false;
    
    // Validar estrutura básica
    if (!Array.isArray(state.devolucoes)) return false;
    if (!Array.isArray(state.selectedAccounts)) return false;
    if (!state.dateRange || !state.dateRange.from || !state.dateRange.to) return false;
    if (typeof state.currentPage !== 'number' || state.currentPage < 1) return false;
    if (typeof state.itemsPerPage !== 'number') return false;
    if (!Array.isArray(state.visibleColumns)) return false;
    if (typeof state.periodo !== 'string') return false;
    if (typeof state.cachedAt !== 'number') return false;
    
    // Validar versão
    if (typeof state.version !== 'number') return false;
    if (state.version !== STORAGE_VERSION) {
      console.log(`🗑️ Versão desatualizada: ${state.version} → ${STORAGE_VERSION}, removendo cache`);
      return false;
    }
    
    return true;
  }, []);

  // CARREGAR ESTADO PERSISTIDO NA INICIALIZAÇÃO
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        // Health check antes de carregar
        const health = LocalStorageValidator.checkStorageHealth();
        if (!health.healthy) {
          console.warn('⚠️ [Storage Health] Problemas detectados:', health.issues);
        }
        
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: PersistentDevolucoesState = JSON.parse(saved);
          
          // Converter strings de data de volta para Date objects
          if (parsed.dateRange) {
            parsed.dateRange.from = new Date(parsed.dateRange.from);
            parsed.dateRange.to = new Date(parsed.dateRange.to);
          }
          
          // VALIDAR INTEGRIDADE DOS DADOS
          if (!validateDevolucoesState(parsed)) {
            console.log('🗑️ Estado com integridade comprometida, removendo');
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // Verificar se o cache ainda é válido (30 minutos)
          const now = Date.now();
          const cacheAge = now - parsed.cachedAt;
          const isExpired = cacheAge > CACHE_DURATION;
          
          if (!isExpired) {
            console.log('🔄 Cache de devoluções carregado (v' + parsed.version + '):', {
              devolucoesCount: parsed.devolucoes.length,
              cacheAge: Math.round(cacheAge / 1000) + 's',
              accounts: parsed.selectedAccounts.join(', '),
              dateRange: `${parsed.dateRange.from.toLocaleDateString()} - ${parsed.dateRange.to.toLocaleDateString()}`
            });
            setPersistedState(parsed);
          } else {
            console.log('⏰ Cache expirado (>30min), removendo...');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('❌ Erro ao carregar estado persistido:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadPersistedState();
  }, [validateDevolucoesState]);

  // SALVAR ESTADO ATUAL (COM DEBOUNCE)
  const saveState = useCallback((state: Partial<PersistentDevolucoesState>) => {
    // Cancelar timer anterior
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Debounce de 500ms
    saveTimerRef.current = setTimeout(() => {
      try {
        const currentState = persistedState || {
          devolucoes: [],
          selectedAccounts: [],
          dateRange: {
            from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            to: new Date()
          },
          currentPage: 1,
          itemsPerPage: 50,
          visibleColumns: [],
          periodo: '60',
          version: STORAGE_VERSION,
          cachedAt: 0
        };

        const newState: PersistentDevolucoesState = {
          ...currentState,
          ...state,
          version: STORAGE_VERSION,
          cachedAt: Date.now()
        };

        // Validar antes de salvar
        if (!validateDevolucoesState(newState)) {
          console.warn('⚠️ Estado inválido, não será persistido');
          return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        setPersistedState(newState);
        
        console.log('💾 Estado de devoluções salvo (v' + STORAGE_VERSION + '):', {
          devolucoesCount: newState.devolucoes.length,
          accounts: newState.selectedAccounts.join(', '),
          page: newState.currentPage
        });
      } catch (error) {
        console.warn('❌ Erro ao salvar estado:', error);
      }
    }, 500); // Debounce de 500ms
  }, [persistedState, validateDevolucoesState]);

  // LIMPAR ESTADO PERSISTIDO
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ Estado de devoluções removido');
  }, []);

  // VERIFICAR SE EXISTE ESTADO VÁLIDO
  const hasValidPersistedState = useCallback((): boolean => {
    if (!isStateLoaded || !persistedState) return false;
    return persistedState.devolucoes.length > 0;
  }, [isStateLoaded, persistedState]);

  // SALVAR DADOS APÓS BUSCA BEM-SUCEDIDA
  const saveDataCache = useCallback((
    devolucoes: any[],
    selectedAccounts: string[],
    dateRange: { from: Date; to: Date },
    currentPage: number,
    itemsPerPage: number,
    visibleColumns: string[],
    periodo: string
  ) => {
    saveState({
      devolucoes,
      selectedAccounts,
      dateRange,
      currentPage,
      itemsPerPage,
      visibleColumns,
      periodo
    });
  }, [saveState]);

  // CLEANUP DO TIMER NO UNMOUNT
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    persistedState,
    isStateLoaded,
    saveState,
    saveDataCache,
    clearPersistedState,
    hasValidPersistedState
  };
}
