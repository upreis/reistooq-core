/**
 * 💾 HOOK DE PERSISTÊNCIA DE RECLAMAÇÕES
 * Cache inteligente com localStorage + validação de 30 minutos + versionamento
 */

import { useState, useEffect, useCallback } from 'react';
import { LocalStorageValidator } from '@/utils/storageValidation';
import { toast } from 'react-hot-toast';

// ✅ PADRÃO /PEDIDOS: Cache apenas para DADOS, filtros na URL
interface PersistentReclamacoesState {
  reclamacoes: any[];
  total: number;
  currentPage: number;
  cachedAt: number;
  version: number;
}

// ✅ PADRÃO /PEDIDOS: Validação simplificada apenas para dados
function validatePersistedState(state: any): state is PersistentReclamacoesState {
  return (
    state &&
    typeof state === 'object' &&
    Array.isArray(state.reclamacoes) &&
    typeof state.total === 'number' &&
    typeof state.currentPage === 'number' &&
    typeof state.cachedAt === 'number' &&
    typeof state.version === 'number'
  );
}

const STORAGE_KEY = 'reclamacoes_persistent_state';
const CACHE_DURATION = 5 * 60 * 1000; // ✅ PADRÃO /PEDIDOS: 5 minutos
const STORAGE_VERSION = 3; // ✅ Nova versão (padrão /pedidos)
const DEBOUNCE_DELAY = 500;

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
            console.log('✅ Cache carregado:', {
              version: parsed.version,
              total: parsed.total,
              cacheAge: Math.round(cacheAge / 1000) + 's'
            });
            setPersistedState(validation.cleaned as PersistentReclamacoesState);
          } else {
            console.log('⏰ Cache expirado (>5min), removendo...');
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

  // ✅ PADRÃO /PEDIDOS: Salvar apenas dados
  const saveState = useCallback((newState: Partial<PersistentReclamacoesState>) => {
    try {
      const currentState = persistedState || {
        reclamacoes: [],
        total: 0,
        currentPage: 1,
        cachedAt: Date.now(),
        version: STORAGE_VERSION
      };

      const updatedState: PersistentReclamacoesState = {
        ...currentState,
        ...newState,
        cachedAt: Date.now(),
        version: STORAGE_VERSION
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
      
      console.log('💾 Cache salvo:', {
        version: updatedState.version,
        total: updatedState.total,
        page: updatedState.currentPage
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

  // ✅ PADRÃO /PEDIDOS: Salvar apenas dados (sem filtros)
  const saveDataCache = useCallback((
    reclamacoes: any[],
    total: number,
    currentPage: number
  ) => {
    saveState({
      reclamacoes,
      total,
      currentPage
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
