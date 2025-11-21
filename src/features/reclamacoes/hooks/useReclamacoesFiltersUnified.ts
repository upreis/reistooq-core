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

  // 🔥 CORREÇÃO FINAL: Lógica simplificada e robusta
  useEffect(() => {
    if (persistentCache.isStateLoaded && !isInitialized) {
      // 1. Parsear filtros da URL
      const urlFilters: Partial<ReclamacoesFilters> = {};
      let hasUrlParams = false; // ✅ Detecta se há filtros de BUSCA na URL (não accounts)
      
      const periodo = searchParams.get('periodo');
      if (periodo) {
        urlFilters.periodo = periodo;
        hasUrlParams = true; // ✅ Período é filtro de busca
      }
      
      const status = searchParams.get('status');
      if (status) {
        urlFilters.status = status;
        hasUrlParams = true; // ✅ Status é filtro de busca
      }
      
      const type = searchParams.get('type');
      if (type) {
        urlFilters.type = type;
        hasUrlParams = true; // ✅ Type é filtro de busca
      }
      
      const stage = searchParams.get('stage');
      if (stage) {
        urlFilters.stage = stage;
        hasUrlParams = true; // ✅ Stage é filtro de busca
      }
      
      // ✅ Accounts/page/limit SÓ são usados se hasUrlParams=true (link compartilhado)
      const accounts = searchParams.get('accounts');
      if (accounts) {
        // 🔥 CORREÇÃO: Filtrar strings vazias (ex: "?accounts=,,," → não criar array inválido)
        const accountsList = accounts.split(',').filter(id => id.trim().length > 0);
        if (accountsList.length > 0) {
          urlFilters.selectedAccounts = accountsList;
        }
      }
      
      const page = searchParams.get('page');
      if (page) {
        const parsedPage = parseInt(page, 10);
        // 🔥 CORREÇÃO: Páginas começam em 1 (não 0), validar número inteiro positivo
        if (!isNaN(parsedPage) && parsedPage >= 1) {
          urlFilters.currentPage = parsedPage;
        }
      }
      
      const limit = searchParams.get('limit');
      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        // 🔥 CORREÇÃO: Limitar items por página entre 25 e 100 (valores razoáveis)
        if (!isNaN(parsedLimit) && parsedLimit >= 25 && parsedLimit <= 100) {
          urlFilters.itemsPerPage = parsedLimit;
        }
      }
      
      // 2. Carregar filtros do cache com SAFE ACCESS
      const cachedFilters: Partial<ReclamacoesFilters> = {};
      
      // 🔥 CORREÇÃO ERRO 4: Validar persistedState antes de acessar qualquer propriedade
      if (persistentCache.persistedState) {
        const state = persistentCache.persistedState;
        
        // ✅ CORREÇÃO CRÍTICA: Validar EXISTÊNCIA (!== undefined) ao invés de truthy
        // Strings vazias ('') são valores VÁLIDOS e devem ser restauradas do cache
        if (state.filters) {
          const filters = state.filters;
          
          if (filters.periodo !== undefined) cachedFilters.periodo = filters.periodo;
          if (filters.status !== undefined) cachedFilters.status = filters.status;
          if (filters.type !== undefined) cachedFilters.type = filters.type;
          if (filters.stage !== undefined) cachedFilters.stage = filters.stage;
        }
        
        // Outros campos do estado (fora de filters)
        // 🔥 CORREÇÃO: Validar que array não está vazio (evitar busca sem contas)
        if (state.selectedAccounts && state.selectedAccounts.length > 0) {
          cachedFilters.selectedAccounts = state.selectedAccounts;
        }
        // 🔥 CORREÇÃO: Validar range válido para página (>= 1)
        if (typeof state.currentPage === 'number' && state.currentPage >= 1) {
          cachedFilters.currentPage = state.currentPage;
        }
        // 🔥 CORREÇÃO: Validar range válido para items por página (25-100)
        if (typeof state.itemsPerPage === 'number' && state.itemsPerPage >= 25 && state.itemsPerPage <= 100) {
          cachedFilters.itemsPerPage = state.itemsPerPage;
        }
      }
      
      // 3. Lógica SIMPLIFICADA:
      //    - Link compartilhado (TEM filtros de busca na URL) → usar URL completa
      //    - Retorno à página (SEM filtros de busca na URL) → usar CACHE completo
      let mergedFilters: ReclamacoesFilters;
      
      if (hasUrlParams) {
        // ✅ Link compartilhado: URL tem prioridade TOTAL
        mergedFilters = {
          ...DEFAULT_FILTERS,
          ...urlFilters
        };
        console.log('🔗 Link compartilhado detectado - usando APENAS URL:', {
          urlFilters,
          ignorandoCache: true
        });
      } else {
        // ✅ Retorno à página: CACHE tem prioridade TOTAL (ignora URL)
        mergedFilters = {
          ...DEFAULT_FILTERS,
          ...cachedFilters
        };
        console.log('💾 Retorno à página - usando APENAS CACHE:', {
          cachedFilters,
          ignorandoURL: true
        });
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
