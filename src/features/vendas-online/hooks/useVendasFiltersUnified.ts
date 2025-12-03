/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - VENDAS CANCELADAS
 * FASE 2.2: Usando utilities compartilhadas de @/core/filters
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVendasFiltersSync, VendasFilters } from './useVendasFiltersSync';
import { usePersistentVendasState } from './usePersistentVendasState';
import {
  updateSingleFilter,
  updateMultipleFilters,
  resetSearchFilters as resetSearchFiltersUtil,
  hasActiveFilters as hasActiveFiltersUtil,
  countActiveFilters as countActiveFiltersUtil,
} from '@/core/filters';

const DEFAULT_FILTERS: VendasFilters = {
  periodo: '7', // 🔥 CORREÇÃO: Alterado de '60' para '7' (padrão: Últimos 7 dias)
  selectedAccounts: [],
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 */
export function useVendasFiltersUnified() {
  const [searchParams] = useSearchParams(); // 🎯 CRÍTICO 2: Ler URL primeiro
  const persistentCache = usePersistentVendasState();
  
  // Estado dos filtros
  const [filters, setFilters] = useState<VendasFilters>(() => {
    // 🎯 CRÍTICO 2: Prioridade corrigida: URL > Cache > Default
    const urlPeriodo = searchParams.get('periodo');
    const urlAccounts = searchParams.get('contas');
    const urlSearch = searchParams.get('busca');
    const urlPage = searchParams.get('pagina');
    const urlItemsPerPage = searchParams.get('itensPorPagina');
    
    const cached = persistentCache.persistedState;
    
    return {
      periodo: urlPeriodo || cached?.filters.periodo || DEFAULT_FILTERS.periodo,
      selectedAccounts: urlAccounts ? urlAccounts.split(',') : (cached?.selectedAccounts || DEFAULT_FILTERS.selectedAccounts),
      searchTerm: urlSearch || cached?.filters.search || DEFAULT_FILTERS.searchTerm,
      currentPage: urlPage ? parseInt(urlPage) : (cached?.currentPage || DEFAULT_FILTERS.currentPage),
      itemsPerPage: urlItemsPerPage ? parseInt(urlItemsPerPage) : (cached?.itemsPerPage || DEFAULT_FILTERS.itemsPerPage),
    };
  });

  // 🔧 CORREÇÃO: Sincronizar filtros quando cache é carregado (após mount)
  // Problema: useState inicializa ANTES do cache carregar (async), então sempre usa default
  // Solução: Quando cache carrega, verificar se tem dados salvos e restaurar
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      
      // Verificar se cache tem período diferente do atual (indica última busca do usuário)
      if (cached.filters?.periodo && cached.filters.periodo !== filters.periodo) {
        console.log('🔄 [VENDAS FILTERS] Restaurando período do cache:', cached.filters.periodo);
        setFilters(prev => ({
          ...prev,
          periodo: cached.filters.periodo,
          searchTerm: cached.filters.search || prev.searchTerm,
        }));
      }
      
      // Restaurar contas se cache tem contas e estado atual está vazio
      if (cached.selectedAccounts?.length > 0 && filters.selectedAccounts.length === 0) {
        console.log('🔄 [VENDAS FILTERS] Restaurando contas do cache:', cached.selectedAccounts.length);
        setFilters(prev => ({
          ...prev,
          selectedAccounts: cached.selectedAccounts,
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistentCache.isStateLoaded]); // Executar apenas quando cache terminar de carregar

  // Sincronizar com URL
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useVendasFiltersSync(
    filters,
    (urlFilters) => {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  );

  // 🔧 Helper para identificar keys de paginação
  const isPaginationKey = useCallback((key: keyof VendasFilters) => {
    return key === 'currentPage' || key === 'itemsPerPage';
  }, []);

  // Atualizar um filtro específico usando utility compartilhada
  const updateFilter = useCallback(<K extends keyof VendasFilters>(
    key: K,
    value: VendasFilters[K]
  ) => {
    setFilters(prev => 
      updateSingleFilter(prev, key, value, isPaginationKey)
    );
    console.log(`🎯 [VENDAS FILTERS] Filtro atualizado: ${key} =`, value);
  }, [isPaginationKey]);

  // Atualizar múltiplos filtros de uma vez usando utility compartilhada
  const updateFilters = useCallback((newFilters: Partial<VendasFilters>) => {
    setFilters(prev => 
      updateMultipleFilters(prev, newFilters, isPaginationKey)
    );
    console.log('🎯 [VENDAS FILTERS] Múltiplos filtros atualizados:', newFilters);
  }, [isPaginationKey]);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 [VENDAS FILTERS] Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca usando utility compartilhada
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 [VENDAS FILTERS] Resetando filtros de busca');
    const searchKeys: (keyof VendasFilters)[] = ['periodo', 'searchTerm'];
    setFilters(prev => ({
      ...prev,
      ...resetSearchFiltersUtil(DEFAULT_FILTERS, searchKeys)
    }));
  }, []);

  // Verificar se há filtros ativos usando utility compartilhada
  const hasActiveFilters = useMemo(() => {
    const excludeKeys: (keyof VendasFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return hasActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  // Contar quantos filtros estão ativos usando utility compartilhada
  const activeFilterCount = useMemo(() => {
    const excludeKeys: (keyof VendasFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return countActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
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
