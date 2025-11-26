/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - DEVOLUÇÕES
 * FASE 2.2: Usando utilities compartilhadas de @/core/filters
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDevolucoesFiltersSync, DevolucoesFilters } from './useDevolucoesFiltersSync';
import { usePersistentDevolucoesStateV2 } from './usePersistentDevolucoesStateV2';
import {
  updateSingleFilter,
  updateMultipleFilters,
  resetSearchFilters as resetSearchFiltersUtil,
  hasActiveFilters as hasActiveFiltersUtil,
  countActiveFilters as countActiveFiltersUtil,
} from '@/core/filters';

const DEFAULT_FILTERS: DevolucoesFilters = {
  periodo: '7',
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
  
  // ✅ CORREÇÃO 2: Carregar do cache APENAS se não houver URL params (SEM searchParams dependency)
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
  }, [persistentCache.isStateLoaded]); // 🔥 REMOVIDO searchParams para evitar loop

  // 🔧 Helper para identificar keys de paginação/tab
  const isPaginationKey = useCallback((key: keyof DevolucoesFilters) => {
    return key === 'currentPage' || key === 'itemsPerPage' || key === 'activeTab';
  }, []);

  // Atualizar um filtro específico usando utility compartilhada
  const updateFilter = useCallback(<K extends keyof DevolucoesFilters>(
    key: K,
    value: DevolucoesFilters[K]
  ) => {
    setFilters(prev => 
      updateSingleFilter(prev, key, value, isPaginationKey)
    );
    console.log(`🎯 Filtro atualizado: ${key} =`, value);
  }, [isPaginationKey]);

  // Atualizar múltiplos filtros de uma vez usando utility compartilhada
  const updateFilters = useCallback((newFilters: Partial<DevolucoesFilters>) => {
    setFilters(prev => 
      updateMultipleFilters(prev, newFilters, isPaginationKey)
    );
    console.log('🎯 Múltiplos filtros atualizados:', newFilters);
  }, [isPaginationKey]);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca usando utility compartilhada
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 Resetando filtros de busca');
    const searchKeys: (keyof DevolucoesFilters)[] = ['periodo', 'searchTerm'];
    setFilters(prev => ({
      ...prev,
      ...resetSearchFiltersUtil(DEFAULT_FILTERS, searchKeys)
    }));
  }, []);

  // Verificar se há filtros ativos usando utility compartilhada
  const hasActiveFilters = useMemo(() => {
    const excludeKeys: (keyof DevolucoesFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage', 'activeTab'];
    return hasActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  // Contar quantos filtros estão ativos usando utility compartilhada
  const activeFilterCount = useMemo(() => {
    const excludeKeys: (keyof DevolucoesFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage', 'activeTab'];
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
