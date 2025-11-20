/**
 * 💾 PERSISTENT VENDAS STATE
 * Hook para persistir e restaurar estado de vendas no localStorage
 */

import { useCallback, useEffect, useState } from 'react';
import { MLOrder, VendasFilters } from '../types/vendas.types';

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
}

const STORAGE_KEY = 'vendas_online_persistent_state';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const usePersistentVendasState = () => {
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [persistedState, setPersistedState] = useState<PersistentVendasState | null>(null);

  // Carregar estado do localStorage na montagem
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PersistentVendasState = JSON.parse(stored);
        
        // Verificar se cache expirou
        const now = Date.now();
        const cacheAge = now - parsed.cachedAt;
        
        if (cacheAge < CACHE_DURATION) {
          console.log('📦 Cache restaurado:', {
            vendas: parsed.vendas.length,
            contas: parsed.selectedAccounts.length,
            idade: Math.round(cacheAge / 1000) + 's'
          });
          setPersistedState(parsed);
        } else {
          console.log('⏰ Cache expirado, limpando...');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsStateLoaded(true);
    }
  }, []);

  // Salvar estado completo
  const saveState = useCallback((state: Omit<PersistentVendasState, 'cachedAt'>) => {
    try {
      const stateToSave: PersistentVendasState = {
        ...state,
        cachedAt: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('💾 Estado salvo:', {
        vendas: state.vendas.length,
        contas: state.selectedAccounts.length
      });
    } catch (error) {
      console.error('❌ Erro ao salvar estado:', error);
    }
  }, []);

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
  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
    console.log('🗑️ Cache limpo');
  }, []);

  return {
    isStateLoaded,
    persistedState,
    saveDataCache,
    clearCache
  };
};
