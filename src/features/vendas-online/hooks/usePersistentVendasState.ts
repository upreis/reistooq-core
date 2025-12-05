/**
 * 💾 PERSISTENT VENDAS STATE
 * 🎯 FASE 1: Cache Validation e Versionamento
 * 
 * Features:
 * - Versionamento de cache com cleanup automático
 * - LocalStorageValidator com health checks
 * - Debounce (500ms) em persistência
 * - Validação de integridade e estrutura
 */

import { useCallback, useEffect, useState, useRef } from 'react'; // 🎯 MÉDIO 6
import { MLOrder, VendasFilters } from '../types/vendas.types';
import { LocalStorageValidator } from '@/utils/storageValidation';

interface PersistentVendasState {
  vendas: MLOrder[];
  selectedAccounts: string[];
  filters: {
    search: string;
    periodo: string;
  };
  currentPage: number;
  itemsPerPage: number;
  visibleColumns?: string[];
  cachedAt: number;
  version: number; // 🎯 FASE 1: Versionamento
}

const STORAGE_KEY = 'vendas_online_persistent_state';
const STORAGE_VERSION = 1; // 🎯 FASE 1: Versão atual do schema
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// 🎯 FASE 1: Validar estrutura do estado persistido
const validatePersistedState = (state: any): state is PersistentVendasState => {
  if (!state || typeof state !== 'object') return false;
  
  return (
    Array.isArray(state.vendas) &&
    Array.isArray(state.selectedAccounts) &&
    typeof state.filters === 'object' &&
    typeof state.currentPage === 'number' &&
    typeof state.itemsPerPage === 'number' &&
    typeof state.cachedAt === 'number'
  );
};

export const usePersistentVendasState = () => {
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [persistedState, setPersistedState] = useState<PersistentVendasState | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null); // 🎯 MÉDIO 6: useRef ao invés de useState

  // 🎯 FASE 1: Carregar estado com validação robusta
  useEffect(() => {
    try {
      console.log('🔍 [VENDAS CACHE] Iniciando validação de cache...');
      
      // Health check do localStorage
      const health = LocalStorageValidator.checkStorageHealth();
      if (!health.healthy) {
        console.warn('⚠️ [VENDAS CACHE] Problemas de storage detectados:', health.issues);
        
        // ✅ CORREÇÃO: Se localStorage está quase cheio, fazer limpeza automática
        if (health.issues.includes('localStorage está quase cheio')) {
          console.log('🧹 [VENDAS CACHE] Iniciando limpeza automática de caches antigos...');
          const oldCachesCleaned = LocalStorageValidator.cleanupOldCaches();
          
          // Se ainda está cheio após limpeza de expirados, fazer limpeza emergencial
          const healthAfter = LocalStorageValidator.checkStorageHealth();
          if (!healthAfter.healthy && healthAfter.issues.includes('localStorage está quase cheio')) {
            LocalStorageValidator.emergencyCleanup();
          }
        }
      }
      
      // Limpar entradas corrompidas
      const cleaned = LocalStorageValidator.cleanCorruptedStorage([STORAGE_KEY]);
      if (cleaned > 0) {
        console.log(`🧹 [VENDAS CACHE] ${cleaned} entradas corrompidas removidas`);
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('📭 [VENDAS CACHE] Nenhum cache encontrado');
        setIsStateLoaded(true);
        return;
      }
      
      const parsed: PersistentVendasState = JSON.parse(stored);
      
      // 🎯 FASE 1: Validação de versão
      if (parsed.version !== STORAGE_VERSION) {
        console.log(`🔄 [VENDAS CACHE] Versão desatualizada (${parsed.version} → ${STORAGE_VERSION}), limpando...`);
        localStorage.removeItem(STORAGE_KEY);
        setIsStateLoaded(true);
        return;
      }
      
      // 🎯 FASE 1: Validação de estrutura
      if (!validatePersistedState(parsed)) {
        console.warn('❌ [VENDAS CACHE] Estrutura inválida, limpando...');
        localStorage.removeItem(STORAGE_KEY);
        setIsStateLoaded(true);
        return;
      }
      
      // Verificar expiração
      const now = Date.now();
      const cacheAge = now - parsed.cachedAt;
      
      if (cacheAge >= CACHE_DURATION) {
        console.log('⏰ [VENDAS CACHE] Cache expirado, limpando...');
        localStorage.removeItem(STORAGE_KEY);
        setIsStateLoaded(true);
        return;
      }
      
      console.log('✅ [VENDAS CACHE] Cache válido restaurado:', {
        vendas: parsed.vendas.length,
        contas: parsed.selectedAccounts.length,
        idade: Math.round(cacheAge / 1000) + 's',
        version: parsed.version
      });
      
      setPersistedState(parsed);
    } catch (error) {
      console.error('❌ [VENDAS CACHE] Erro ao carregar cache:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsStateLoaded(true);
    }
  }, []);

  // 🎯 FASE 1: Salvar estado com debounce e validação
  const saveStateDebounced = useCallback((state: Omit<PersistentVendasState, 'cachedAt' | 'version'>) => {
    try {
      const stateToSave: PersistentVendasState = {
        ...state,
        cachedAt: Date.now(),
        version: STORAGE_VERSION
      };
      
      // Validar antes de salvar
      if (!validatePersistedState(stateToSave)) {
        console.error('❌ [VENDAS CACHE] Tentativa de salvar estado inválido');
        return;
      }
      
      // Verificar quota do localStorage
      try {
        const serialized = JSON.stringify(stateToSave);
        const sizeKB = new Blob([serialized]).size / 1024;
        
        if (sizeKB > 2048) { // Limite de 2MB
          console.warn('⚠️ [VENDAS CACHE] Cache muito grande (${sizeKB.toFixed(1)}KB), limpando vendas antigas...');
          // Manter apenas últimas 100 vendas
          stateToSave.vendas = stateToSave.vendas.slice(0, 100);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        console.log('💾 [VENDAS CACHE] Estado salvo:', {
          vendas: state.vendas.length,
          contas: state.selectedAccounts.length,
          size: sizeKB.toFixed(1) + 'KB',
          version: STORAGE_VERSION
        });
      } catch (quotaError: any) {
        if (quotaError.name === 'QuotaExceededError') {
          console.error('💥 [VENDAS CACHE] Quota excedida, limpando cache antigo...');
          localStorage.removeItem(STORAGE_KEY);
        } else {
          throw quotaError;
        }
      }
    } catch (error) {
      console.error('❌ [VENDAS CACHE] Erro ao salvar estado:', error);
    }
  }, []);
  
  // 🎯 MÉDIO 6: Debounce usando useRef (não causa re-renders)
  const saveState = useCallback((state: Omit<PersistentVendasState, 'cachedAt' | 'version'>) => {
    // Cancelar timer anterior
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Agendar save com debounce de 500ms
    saveTimerRef.current = setTimeout(() => {
      saveStateDebounced(state);
    }, 500);
  }, [saveStateDebounced]);

  // Salvar cache de dados após busca bem-sucedida
  const saveDataCache = useCallback((
    vendas: MLOrder[],
    selectedAccounts: string[],
    filters: any,
    currentPage: number,
    itemsPerPage: number,
    visibleColumns?: string[]
  ) => {
    saveState({
      vendas,
      selectedAccounts,
      filters,
      currentPage,
      itemsPerPage,
      visibleColumns
    });
  }, [saveState]);

  // Limpar cache
  const clearPersistedState = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ [VENDAS CACHE] Cache limpo');
  }, []);
  
  // 🎯 FASE 1: Health check do storage
  const hasValidPersistedState = useCallback(() => {
    return persistedState !== null && validatePersistedState(persistedState);
  }, [persistedState]);
  
  // 🎯 FASE 1: Limpar cache corrompido manualmente
  const cleanCorruptedCache = useCallback(() => {
    return LocalStorageValidator.cleanCorruptedStorage([STORAGE_KEY]);
  }, []);
  
  // 🎯 FASE 1: Health check do localStorage
  const checkStorageHealth = useCallback(() => {
    return LocalStorageValidator.checkStorageHealth();
  }, []);

  return {
    isStateLoaded,
    persistedState,
    saveDataCache,
    clearPersistedState, // Renomeado de clearCache
    hasValidPersistedState,
    cleanCorruptedCache,
    checkStorageHealth
  };
};
