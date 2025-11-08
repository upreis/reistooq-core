/**
 * 💾 PERSISTÊNCIA DE ESTADO - DEVOLUÇÕES
 * Salva e restaura estado ao navegar entre páginas
 */

import { useState, useEffect, useCallback } from 'react';
import { MLReturn, DevolucaoFilters } from '../types/devolucao.types';

const STORAGE_KEY = 'devolucoes_persistent_state';
const STORAGE_VERSION = 1;

interface PersistedDevolucaoState {
  version: number;
  devolucoes: MLReturn[];
  total: number;
  currentPage: number;
  filters: DevolucaoFilters;
  integrationAccountId: string;
  timestamp: number;
  quickFilter?: string;
}

export function usePersistentDevolucaoState() {
  const [persistedState, setPersistedState] = useState<PersistedDevolucaoState | null>(null);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Limpar cache antigo ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Sempre limpar dados antigos para evitar mostrar cache desatualizado
        // que causava o bug de mostrar 25 devoluções quando havia 90 novas
        console.log('🗑️ Limpando cache antigo de devoluções');
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
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
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPersistedState(updated);
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
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
    clearPersistedState,
    hasValidPersistedState,
  };
}
