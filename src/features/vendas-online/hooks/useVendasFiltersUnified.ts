/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - VENDAS CANCELADAS
 * FASE 2.2: Usando utilities compartilhadas de @/core/filters
 * 🔧 CORRIGIDO: Alinhado com padrão de /reclamacoes
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  periodo: '7',
  selectedAccounts: [],
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 * 🔧 CORRIGIDO: Seguindo padrão de /reclamacoes
 */
export function useVendasFiltersUnified() {
  const persistentCache = usePersistentVendasState();
  const [searchParams] = useSearchParams();
  
  // Estado dos filtros - iniciar com defaults
  const [filters, setFilters] = useState<VendasFilters>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstRender = useRef(true); // 🔧 CORREÇÃO: Rastrear primeira renderização
  const isRestoringFromUrl = useRef(false); // 🔧 CORREÇÃO: Flag para evitar loop

  // 🔧 CORREÇÃO: Restaurar filtros com prioridade URL > Cache > Defaults (igual /reclamacoes)
  useEffect(() => {
    if (!persistentCache.isStateLoaded) return;
    
    isRestoringFromUrl.current = true;
    
    // 1. Parsear filtros da URL PRIMEIRO
    const urlFilters: Partial<VendasFilters> = {};
    
    // 🔧 CORREÇÃO CRÍTICA: Verificar se cache tem período diferente do default
    const cachedPeriodo = persistentCache.persistedState?.filters?.periodo;
    const urlPeriodo = searchParams.get('periodo');
    
    const cacheHasCustomPeriodo = cachedPeriodo && cachedPeriodo !== DEFAULT_FILTERS.periodo;
    const urlHasDefaultPeriodo = urlPeriodo === DEFAULT_FILTERS.periodo || !urlPeriodo;
    
    const shouldUseUrlPeriodo = urlPeriodo && !urlHasDefaultPeriodo;
    
    if (shouldUseUrlPeriodo) {
      urlFilters.periodo = urlPeriodo;
      console.log('🔗 [URL] Usando período da URL (não-default):', urlPeriodo);
    } else if (cacheHasCustomPeriodo) {
      console.log('📦 [CACHE] Ignorando período default da URL, cache tem:', cachedPeriodo);
    }
    
    const accounts = searchParams.get('contas');
    if (accounts) urlFilters.selectedAccounts = accounts.split(',').filter(Boolean);
    
    const search = searchParams.get('busca');
    if (search) urlFilters.searchTerm = search;
    
    const page = searchParams.get('pagina');
    if (page) urlFilters.currentPage = parseInt(page, 10);
    
    const limit = searchParams.get('itensPorPagina');
    if (limit) urlFilters.itemsPerPage = parseInt(limit, 10);
    
    // 2. Carregar filtros do cache
    const cachedFilters: Partial<VendasFilters> = {};
    const cacheAvailable = !isInitialized && persistentCache.persistedState;
    
    if (cacheAvailable) {
      console.log('📦 [CACHE] Cache disponível, restaurando campos não presentes na URL');
      
      if (!urlFilters.periodo && cachedPeriodo) {
        cachedFilters.periodo = cachedPeriodo;
        console.log('🔄 [CACHE] Restaurando período do cache:', cachedPeriodo);
      }
      if (!urlFilters.searchTerm && persistentCache.persistedState?.filters?.search) {
        cachedFilters.searchTerm = persistentCache.persistedState.filters.search;
      }
      if (!urlFilters.selectedAccounts && persistentCache.persistedState?.selectedAccounts?.length) {
        cachedFilters.selectedAccounts = persistentCache.persistedState.selectedAccounts;
      }
      if (!urlFilters.currentPage && persistentCache.persistedState?.currentPage) {
        cachedFilters.currentPage = persistentCache.persistedState.currentPage;
      }
      if (!urlFilters.itemsPerPage && persistentCache.persistedState?.itemsPerPage) {
        cachedFilters.itemsPerPage = persistentCache.persistedState.itemsPerPage;
      }
    }
    
    // 3. Merge: Defaults → Cache → URL
    const mergedFilters: VendasFilters = {
      ...DEFAULT_FILTERS,
      ...cachedFilters,
      ...urlFilters
    };
    
    console.log('🔄 [FILTROS VENDAS] Restauração completa:', {
      cacheAvailable: !!cacheAvailable,
      urlFilters: Object.keys(urlFilters).length > 0 ? urlFilters : 'nenhum',
      cacheFilters: Object.keys(cachedFilters).length > 0 ? cachedFilters : 'nenhum',
      final: mergedFilters
    });
    
    setFilters(mergedFilters);
    setIsInitialized(true);

    setTimeout(() => {
      isRestoringFromUrl.current = false;
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistentCache.isStateLoaded]);

  // 🔧 CORREÇÃO: Cleanup separado
  useEffect(() => {
    return () => {
      setIsInitialized(false);
      console.log('🧹 [VENDAS FILTERS] Limpando estado ao desmontar');
    };
  }, []);

  // Sincronizar com URL APENAS após inicialização
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useVendasFiltersSync(
    filters,
    () => {},
    isInitialized
  );

  // 🔧 CORREÇÃO: Salvar filtros automaticamente no cache quando mudarem
  useEffect(() => {
    if (!isInitialized || isFirstRender.current) {
      if (isInitialized && isFirstRender.current) {
        isFirstRender.current = false;
      }
      return;
    }

    if (isRestoringFromUrl.current) {
      console.log('⏭️ [VENDAS FILTERS] Ignorando salvamento durante restauração da URL');
      return;
    }
    
    const timer = setTimeout(() => {
      // 🔧 CORREÇÃO: Usar saveDataCache (API correta do hook)
      persistentCache.saveDataCache(
        persistentCache.persistedState?.vendas || [], // Manter vendas existentes
        filters.selectedAccounts,
        {
          periodo: filters.periodo,
          search: filters.searchTerm
        },
        filters.currentPage,
        filters.itemsPerPage
      );
      
      console.log('💾 [VENDAS] Filtros salvos automaticamente:', {
        periodo: filters.periodo,
        search: filters.searchTerm,
        accounts: filters.selectedAccounts.length,
        page: filters.currentPage
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters, isInitialized]);

  // 🔧 Helper para identificar keys de paginação
  const isPaginationKey = useCallback((key: keyof VendasFilters) => {
    return key === 'currentPage' || key === 'itemsPerPage';
  }, []);

  // Atualizar um filtro específico
  const updateFilter = useCallback(<K extends keyof VendasFilters>(
    key: K,
    value: VendasFilters[K]
  ) => {
    setFilters(prev => 
      updateSingleFilter(prev, key, value, isPaginationKey)
    );
    console.log(`🎯 [VENDAS] Filtro atualizado: ${key} =`, value);
  }, [isPaginationKey]);

  // Atualizar múltiplos filtros
  const updateFilters = useCallback((newFilters: Partial<VendasFilters>) => {
    setFilters(prev => 
      updateMultipleFilters(prev, newFilters, isPaginationKey)
    );
    console.log('🎯 [VENDAS] Múltiplos filtros atualizados:', newFilters);
  }, [isPaginationKey]);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 [VENDAS] Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 [VENDAS] Resetando filtros de busca');
    const searchKeys: (keyof VendasFilters)[] = ['periodo', 'searchTerm'];
    setFilters(prev => ({
      ...prev,
      ...resetSearchFiltersUtil(DEFAULT_FILTERS, searchKeys)
    }));
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    const excludeKeys: (keyof VendasFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return hasActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  // Contar filtros ativos
  const activeFilterCount = useMemo(() => {
    const excludeKeys: (keyof VendasFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return countActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    resetSearchFilters,
    hasActiveFilters,
    activeFilterCount,
    parseFiltersFromUrl,
    encodeFiltersToUrl,
    persistentCache
  };
}
