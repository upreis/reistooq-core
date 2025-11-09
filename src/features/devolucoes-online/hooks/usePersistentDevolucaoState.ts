/**
 * 💾 PERSISTÊNCIA DE ESTADO - DEVOLUÇÕES
 * Salva e restaura estado ao navegar entre páginas
 */

import { useState, useEffect, useCallback } from 'react';
import { MLReturn, DevolucaoFilters } from '../types/devolucao.types';

const STORAGE_KEY = 'devolucoes_persistent_state';
const STORAGE_VERSION = 1;
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutos (1 hora)

interface PersistedDevolucaoState {
  version: number;
  devolucoes: MLReturn[];
  total: number;
  currentPage: number;
  filters: DevolucaoFilters;
  integrationAccountId: string;
  timestamp: number;
  quickFilter?: string;
  cachedAt?: string;
}

export function usePersistentDevolucaoState() {
  const [persistedState, setPersistedState] = useState<PersistedDevolucaoState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Carregar estado do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validar versão
        if (parsed.version !== STORAGE_VERSION) {
          console.log('🗑️ Versão de cache antiga, limpando...');
          localStorage.removeItem(STORAGE_KEY);
          setIsStateLoaded(true);
          return;
        }
        
        // Verificar expiração
        const age = Date.now() - parsed.timestamp;
        if (age > CACHE_DURATION) {
          console.log('⏰ Cache expirado, limpando...');
          localStorage.removeItem(STORAGE_KEY);
          setIsStateLoaded(true);
          return;
        }
        
        // Estado válido - carregar
        console.log('✅ Estado válido carregado do cache');
        setPersistedState(parsed);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsStateLoaded(true);
    }
  }, []);

  // Salvar dados das devoluções
  const saveOrdersData = useCallback((devolucoes: MLReturn[], total: number, currentPage: number) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...current,
        version: STORAGE_VERSION,
        devolucoes,
        total,
        currentPage,
        timestamp: Date.now(),
        cachedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPersistedState(updated);
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
    }
  }, []);

  // Salvar ID de conta de integração
  const saveIntegrationAccountId = useCallback((integrationAccountId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...current,
        version: STORAGE_VERSION,
        integrationAccountId,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPersistedState(updated);
    } catch (error) {
      console.error('❌ Erro ao salvar account ID:', error);
    }
  }, []);

  // Salvar filtros aplicados
  const saveAppliedFilters = useCallback((filters: DevolucaoFilters) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...current,
        version: STORAGE_VERSION,
        filters,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPersistedState(updated);
    } catch (error) {
      console.error('❌ Erro ao salvar filtros:', error);
    }
  }, []);

  // Salvar filtro rápido
  const saveQuickFilter = useCallback((quickFilter: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...current,
        version: STORAGE_VERSION,
        quickFilter,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPersistedState(updated);
    } catch (error) {
      console.error('❌ Erro ao salvar filtro rápido:', error);
    }
  }, []);

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
  }, []);

  // Verificar se há estado válido persistido
  const hasValidPersistedState = useCallback(() => {
    return !!(persistedState && persistedState.devolucoes && persistedState.devolucoes.length > 0);
  }, [persistedState]);

  return {
    persistedState,
    isStateLoaded,
    saveOrdersData,
    saveAppliedFilters,
    saveQuickFilter,
    saveIntegrationAccountId,
    clearPersistedState,
    hasValidPersistedState,
  };
}
