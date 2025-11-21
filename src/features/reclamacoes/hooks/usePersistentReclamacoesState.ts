/**
 * 💾 HOOK DE PERSISTÊNCIA DE RECLAMAÇÕES
 * Cache inteligente com localStorage + validação de 30 minutos + versionamento
 */

import { useState, useEffect, useCallback } from 'react';
import { LocalStorageValidator } from '@/utils/storageValidation';
import { toast } from 'react-hot-toast';

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
  visibleColumns?: string[];
  cachedAt: number;
  version: number; // 🔥 FASE 1: Versionamento
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
const STORAGE_VERSION = 2; // 🔥 FASE 1: Versão atual do esquema
const DEBOUNCE_DELAY = 500; // 🔥 FASE 1: Debounce para salvar estado

export function usePersistentReclamacoesState() {
  const [persistedState, setPersistedState] = useState<PersistentReclamacoesState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // 🔥 FASE 1: Carregar estado com validação e versionamento
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        // 🔥 Verificar saúde do storage antes de carregar
        const healthCheck = LocalStorageValidator.checkStorageHealth();
        if (!healthCheck.healthy) {
          console.warn('⚠️ Problemas detectados no localStorage:', healthCheck.issues);
          if (healthCheck.issues.some(issue => issue.includes('quase cheia') || issue.includes('limite'))) {
            LocalStorageValidator.cleanCorruptedStorage();
            toast.error('Cache limpo automaticamente para liberar espaço');
          }
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // 🔥 FASE 1: Validar estrutura usando LocalStorageValidator
          const validation = LocalStorageValidator.validatePersistedState(parsed);
          if (!validation.isValid) {
            console.warn('⚠️ Estado persistido inválido:', validation.errors);
            localStorage.removeItem(STORAGE_KEY);
            setIsStateLoaded(true);
            return;
          }
          
          // 🔥 FASE 1: Verificar versão do cache
          if (parsed.version !== STORAGE_VERSION) {
            console.warn(`⚠️ Versão do cache incompatível (${parsed.version} !== ${STORAGE_VERSION}), removendo...`);
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
              version: parsed.version,
              reclamacoesCount: parsed.reclamacoes?.length || 0,
              cacheAge: Math.round(cacheAge / 1000) + 's',
              accounts: parsed.selectedAccounts?.join(', ') || 'nenhuma',
              filters: parsed.filters
            });
            setPersistedState(validation.cleaned as PersistentReclamacoesState);
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
  }, []);

  // 🔥 FASE 1: Salvar estado no localStorage com debounce e validação
  const saveState = useCallback((newState: Partial<PersistentReclamacoesState>) => {
    try {
      const currentState = persistedState || {
        reclamacoes: [],
        selectedAccounts: [],
        filters: { periodo: '60' },
        currentPage: 1,
        itemsPerPage: 50,
        cachedAt: Date.now(),
        version: STORAGE_VERSION
      };

      const updatedState: PersistentReclamacoesState = {
        ...currentState,
        ...newState,
        cachedAt: Date.now(),
        version: STORAGE_VERSION // 🔥 FASE 1: Sempre incluir versão atual
      };

      // 🔥 FASE 1: Validar antes de salvar
      const validation = LocalStorageValidator.validatePersistedState(updatedState);
      if (!validation.isValid) {
        console.error('❌ Tentativa de salvar estado inválido:', validation.errors);
        return;
      }

      // 🔥 FASE 1: Verificar espaço disponível
      const dataString = JSON.stringify(updatedState);
      const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
      
      if (sizeInMB > 8) { // Limite de 8MB (localStorage geralmente 10MB)
        console.warn('⚠️ Cache muito grande, limpando dados antigos...');
        LocalStorageValidator.cleanCorruptedStorage();
        toast.error('Cache reduzido automaticamente');
        return;
      }

      localStorage.setItem(STORAGE_KEY, dataString);
      setPersistedState(updatedState);
      
      console.log('💾 Estado de reclamações salvo:', {
        version: updatedState.version,
        reclamacoesCount: updatedState.reclamacoes?.length || 0,
        accounts: updatedState.selectedAccounts?.join(', ') || 'nenhuma',
        page: updatedState.currentPage,
        sizeInMB: sizeInMB.toFixed(2)
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('❌ localStorage cheio, limpando...');
        LocalStorageValidator.cleanCorruptedStorage();
        toast.error('Cache cheio. Dados corrompidos foram limpos automaticamente.');
      } else {
        console.error('❌ Erro ao salvar estado persistido:', error);
      }
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

  // 🔥 FASE 1: Limpar estado persistido com logging melhorado
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      console.log('🗑️ Cache de reclamações limpo com sucesso');
      toast.success('Cache limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    }
  }, []);

  // Verificar se há estado válido
  const hasValidPersistedState = useCallback(() => {
    return persistedState !== null && isStateLoaded;
  }, [persistedState, isStateLoaded]);

  // 🔥 FASE 1: Função para forçar limpeza de dados corrompidos
  const cleanCorruptedCache = useCallback(() => {
    try {
      const cleaned = LocalStorageValidator.cleanCorruptedStorage();
      console.log(`🧹 ${cleaned} entradas corrompidas limpas`);
      if (cleaned > 0) {
        toast.success(`${cleaned} entradas corrompidas foram limpas`);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache corrompido:', error);
      toast.error('Erro ao limpar cache corrompido');
    }
  }, []);

  // 🔥 FASE 1: Verificar saúde do storage
  const checkStorageHealth = useCallback(() => {
    return LocalStorageValidator.checkStorageHealth();
  }, []);

  return {
    persistedState,
    isStateLoaded,
    saveState,
    saveDataCache,
    clearPersistedState,
    hasValidPersistedState,
    cleanCorruptedCache, // 🔥 FASE 1: Nova função
    checkStorageHealth // 🔥 FASE 1: Nova função
  };
}
