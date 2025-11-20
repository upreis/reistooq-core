/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS
 * FASE 2: Gerenciamento centralizado com sincronização URL + localStorage
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDevolucoesFiltersSync, DevolucoesFilters } from './useDevolucoesFiltersSync';
import { usePersistentDevolucoesStateV2 } from './usePersistentDevolucoesStateV2';

const DEFAULT_FILTERS: DevolucoesFilters = {
  periodo: '60',
  selectedAccounts: [],
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50,
  activeTab: 'ativas'
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 */
export function useDevolucoesFiltersUnified() {
  const persistentCache = usePersistentDevolucoesStateV2();
  const [searchParams] = useSearchParams();
  
  // ✅ CORREÇÃO CRÍTICA 2: Inicializar com DEFAULT, deixar useEffect carregar URL/cache
  const [filters, setFilters] = useState<DevolucoesFilters>(DEFAULT_FILTERS);

  // Sincronizar com URL (useEffect interno do hook vai aplicar filtros da URL automaticamente)
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useDevolucoesFiltersSync(
    filters,
    (urlFilters) => {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  );
  
  // ✅ CORREÇÃO: Carregar do cache APENAS se não houver URL params
  useEffect(() => {
    // Só carrega cache se URL não tem parâmetros E cache está carregado
    const hasUrlParams = searchParams.toString().length > 0;
    
    if (!hasUrlParams && persistentCache.isStateLoaded && persistentCache.persistedState) {
      console.log('📦 Restaurando filtros do cache (sem URL params)');
      setFilters(prev => ({
        ...prev,
        periodo: persistentCache.persistedState!.periodo || DEFAULT_FILTERS.periodo,
        selectedAccounts: persistentCache.persistedState!.selectedAccounts || DEFAULT_FILTERS.selectedAccounts,
        currentPage: persistentCache.persistedState!.currentPage || DEFAULT_FILTERS.currentPage,
        itemsPerPage: persistentCache.persistedState!.itemsPerPage || DEFAULT_FILTERS.itemsPerPage,
      }));
    }
  }, [persistentCache.isStateLoaded, searchParams]);

  // Atualizar um filtro específico
  const updateFilter = useCallback(<K extends keyof DevolucoesFilters>(
    key: K,
    value: DevolucoesFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Se mudou o filtro (não paginação ou tab), resetar para página 1
      if (key !== 'currentPage' && key !== 'itemsPerPage' && key !== 'activeTab') {
        newFilters.currentPage = 1;
      }
      
      console.log(`🎯 Filtro atualizado: ${key} =`, value);
      return newFilters;
    });
  }, []);

  // Atualizar múltiplos filtros de uma vez
  const updateFilters = useCallback((newFilters: Partial<DevolucoesFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Se mudou algum filtro (não paginação ou tab), resetar para página 1
      const hasNonPaginationChange = Object.keys(newFilters).some(
        key => key !== 'currentPage' && key !== 'itemsPerPage' && key !== 'activeTab'
      );
      
      if (hasNonPaginationChange) {
        updated.currentPage = 1;
      }
      
      console.log('🎯 Múltiplos filtros atualizados:', newFilters);
      return updated;
    });
  }, []);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca (manter contas e paginação)
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 Resetando filtros de busca');
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
