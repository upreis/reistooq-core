/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - VENDAS ONLINE
 * 🎯 FASE 2: Gerenciamento centralizado com sincronização URL + localStorage
 */

import { useState, useCallback, useMemo } from 'react';
import { useVendasFiltersSync, VendasFilters } from './useVendasFiltersSync';
import { usePersistentVendasState } from './usePersistentVendasState';

const DEFAULT_FILTERS: VendasFilters = {
  periodo: '60',
  selectedAccounts: [],
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 */
export function useVendasFiltersUnified() {
  const persistentCache = usePersistentVendasState();
  
  // Estado dos filtros
  const [filters, setFilters] = useState<VendasFilters>(() => {
    // Prioridade: URL > Cache > Default
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      return {
        periodo: persistentCache.persistedState.filters.periodo || DEFAULT_FILTERS.periodo,
        selectedAccounts: persistentCache.persistedState.selectedAccounts || DEFAULT_FILTERS.selectedAccounts,
        searchTerm: persistentCache.persistedState.filters.search || DEFAULT_FILTERS.searchTerm,
        currentPage: persistentCache.persistedState.currentPage || DEFAULT_FILTERS.currentPage,
        itemsPerPage: persistentCache.persistedState.itemsPerPage || DEFAULT_FILTERS.itemsPerPage
      };
    }
    return DEFAULT_FILTERS;
  });

  // Sincronizar com URL
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useVendasFiltersSync(
    filters,
    (urlFilters) => {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  );

  // Atualizar um filtro específico
  const updateFilter = useCallback(<K extends keyof VendasFilters>(
    key: K,
    value: VendasFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Se mudou o filtro (não paginação), resetar para página 1
      if (key !== 'currentPage' && key !== 'itemsPerPage') {
        newFilters.currentPage = 1;
      }
      
      console.log(`🎯 [VENDAS FILTERS] Filtro atualizado: ${key} =`, value);
      return newFilters;
    });
  }, []);

  // Atualizar múltiplos filtros de uma vez
  const updateFilters = useCallback((newFilters: Partial<VendasFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Se mudou algum filtro (não paginação), resetar para página 1
      const hasNonPaginationChange = Object.keys(newFilters).some(
        key => key !== 'currentPage' && key !== 'itemsPerPage'
      );
      
      if (hasNonPaginationChange) {
        updated.currentPage = 1;
      }
      
      console.log('🎯 [VENDAS FILTERS] Múltiplos filtros atualizados:', newFilters);
      return updated;
    });
  }, []);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 [VENDAS FILTERS] Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca (manter contas e paginação)
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 [VENDAS FILTERS] Resetando filtros de busca');
    setFilters(prev => ({
      ...prev,
      periodo: DEFAULT_FILTERS.periodo,
      searchTerm: DEFAULT_FILTERS.searchTerm,
      currentPage: 1
    }));
  }, []);

  // Verificar se há filtros ativos (além dos defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.periodo !== DEFAULT_FILTERS.periodo ||
      filters.searchTerm !== DEFAULT_FILTERS.searchTerm ||
      filters.selectedAccounts.length > 0
    );
  }, [filters]);

  // Contar quantos filtros estão ativos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.periodo !== DEFAULT_FILTERS.periodo) count++;
    if (filters.searchTerm !== DEFAULT_FILTERS.searchTerm) count++;
    if (filters.selectedAccounts.length > 0) count++;
    return count;
  }, [filters]);

  return {
    // Estado
    filters,
    
    // Ações
    updateFilter,
    updateFilters,
    resetFilters,
    resetSearchFilters,
    
    // Computados
    hasActiveFilters,
    activeFilterCount,
    
    // Helpers
    parseFiltersFromUrl,
    encodeFiltersToUrl,
    
    // Cache management
    persistentCache
  };
}
