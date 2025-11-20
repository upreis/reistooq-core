/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS
 * FASE 2: Gerenciamento centralizado com sincronização URL + localStorage
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReclamacoesFiltersSync, ReclamacoesFilters } from './useReclamacoesFiltersSync';
import { usePersistentReclamacoesState } from './usePersistentReclamacoesState';

const DEFAULT_FILTERS: ReclamacoesFilters = {
  periodo: '60',
  status: '',
  type: '',
  stage: '',
  selectedAccounts: [],
  currentPage: 1,
  itemsPerPage: 50
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 */
export function useReclamacoesFiltersUnified() {
  const persistentCache = usePersistentReclamacoesState();
  const [searchParams] = useSearchParams();
  
  // Estado dos filtros - iniciar com defaults
  const [filters, setFilters] = useState<ReclamacoesFilters>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔥 CORREÇÃO: Restaurar filtros priorizando Cache quando SEM URL params
  useEffect(() => {
    if (persistentCache.isStateLoaded && !isInitialized) {
      // 1. Parsear filtros da URL
      const urlFilters: Partial<ReclamacoesFilters> = {};
      let hasUrlParams = false;
      
      const periodo = searchParams.get('periodo');
      if (periodo) {
        urlFilters.periodo = periodo;
        hasUrlParams = true;
      }
      
      const status = searchParams.get('status');
      if (status) {
        urlFilters.status = status;
        hasUrlParams = true;
      }
      
      const type = searchParams.get('type');
      if (type) {
        urlFilters.type = type;
        hasUrlParams = true;
      }
      
      const stage = searchParams.get('stage');
      if (stage) {
        urlFilters.stage = stage;
        hasUrlParams = true;
      }
      
      const accounts = searchParams.get('accounts');
      if (accounts) {
        urlFilters.selectedAccounts = accounts.split(',');
        hasUrlParams = true;
      }
      
      const page = searchParams.get('page');
      if (page) {
        urlFilters.currentPage = parseInt(page, 10);
        hasUrlParams = true;
      }
      
      const limit = searchParams.get('limit');
      if (limit) {
        urlFilters.itemsPerPage = parseInt(limit, 10);
        hasUrlParams = true;
      }
      
      // 2. Carregar filtros do cache
      const cachedFilters = persistentCache.persistedState ? {
        periodo: persistentCache.persistedState.filters.periodo,
        status: persistentCache.persistedState.filters.status,
        type: persistentCache.persistedState.filters.type,
        stage: persistentCache.persistedState.filters.stage,
        selectedAccounts: persistentCache.persistedState.selectedAccounts,
        currentPage: persistentCache.persistedState.currentPage,
        itemsPerPage: persistentCache.persistedState.itemsPerPage
      } : {};
      
      // 3. Lógica de merge inteligente:
      //    - Se TEM URL params → usar URL (compartilhamento de link)
      //    - Se NÃO TEM URL params → usar CACHE (retorno à página)
      let mergedFilters: ReclamacoesFilters;
      
      if (hasUrlParams) {
        // URL tem prioridade quando presente
        mergedFilters = {
          ...DEFAULT_FILTERS,
          ...cachedFilters,
          ...urlFilters
        };
        console.log('🔗 Restaurando filtros da URL (link compartilhado):', urlFilters);
      } else {
        // Cache tem prioridade quando não há URL params
        mergedFilters = {
          ...DEFAULT_FILTERS,
          ...cachedFilters
        };
        console.log('💾 Restaurando filtros do cache (última busca aplicada):', cachedFilters);
      }
      
      console.log('🔄 Filtros finais restaurados:', mergedFilters);
      
      setFilters(mergedFilters);
      setIsInitialized(true);
    }
  }, [persistentCache.isStateLoaded, isInitialized, searchParams]);

  // Sincronizar com URL (apenas atualizar URL quando filtros mudarem, não carregar da URL)
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useReclamacoesFiltersSync(
    filters,
    () => {} // Não fazer nada quando URL mudar - restauração já foi feita acima
  );

  // Atualizar um filtro específico
  const updateFilter = useCallback(<K extends keyof ReclamacoesFilters>(
    key: K,
    value: ReclamacoesFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Se mudou o filtro (não paginação), resetar para página 1
      if (key !== 'currentPage' && key !== 'itemsPerPage') {
        newFilters.currentPage = 1;
      }
      
      console.log(`🎯 Filtro atualizado: ${key} =`, value);
      return newFilters;
    });
  }, []);

  // Atualizar múltiplos filtros de uma vez
  const updateFilters = useCallback((newFilters: Partial<ReclamacoesFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Se mudou algum filtro (não paginação), resetar para página 1
      const hasNonPaginationChange = Object.keys(newFilters).some(
        key => key !== 'currentPage' && key !== 'itemsPerPage'
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
      status: DEFAULT_FILTERS.status,
      type: DEFAULT_FILTERS.type,
      stage: DEFAULT_FILTERS.stage,
      currentPage: 1
    }));
  }, []);

  // Verificar se há filtros ativos (além dos defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.periodo !== DEFAULT_FILTERS.periodo ||
      filters.status !== DEFAULT_FILTERS.status ||
      filters.type !== DEFAULT_FILTERS.type ||
      filters.stage !== DEFAULT_FILTERS.stage
    );
  }, [filters]);

  // Contar quantos filtros estão ativos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.periodo !== DEFAULT_FILTERS.periodo) count++;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.type !== DEFAULT_FILTERS.type) count++;
    if (filters.stage !== DEFAULT_FILTERS.stage) count++;
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
