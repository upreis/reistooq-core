/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS
 * ✅ SOLUÇÃO RADICAL: URL é a ÚNICA fonte de verdade (sem estado local)
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentReclamacoesState } from './usePersistentReclamacoesState';

export interface ReclamacoesFilters {
  periodo: string;
  status: string;
  type: string;
  stage: string;
  selectedAccounts: string[];
  currentPage: number;
  itemsPerPage: number;
}

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
 * Hook unificado - URL é a única fonte de verdade
 */
export function useReclamacoesFiltersUnified() {
  const persistentCache = usePersistentReclamacoesState();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ Ler filtros DIRETO da URL (useMemo, não useState)
  const filters = useMemo<ReclamacoesFilters>(() => {
    const periodo = searchParams.get('periodo') || DEFAULT_FILTERS.periodo;
    const status = searchParams.get('status') || DEFAULT_FILTERS.status;
    const type = searchParams.get('type') || DEFAULT_FILTERS.type;
    const stage = searchParams.get('stage') || DEFAULT_FILTERS.stage;
    
    const accounts = searchParams.get('accounts');
    const selectedAccounts = accounts 
      ? accounts.split(',').filter(id => id.trim().length > 0)
      : DEFAULT_FILTERS.selectedAccounts;
    
    const page = searchParams.get('page');
    const currentPage = page ? parseInt(page, 10) : DEFAULT_FILTERS.currentPage;
    
    const limit = searchParams.get('limit');
    const itemsPerPage = limit ? parseInt(limit, 10) : DEFAULT_FILTERS.itemsPerPage;
    
    return {
      periodo,
      status,
      type,
      stage,
      selectedAccounts,
      currentPage,
      itemsPerPage
    };
  }, [searchParams]);

  // ✅ Atualizar um filtro = atualizar URL diretamente
  const updateFilter = useCallback(<K extends keyof ReclamacoesFilters>(
    key: K,
    value: ReclamacoesFilters[K]
  ) => {
    console.log(`🎯 [RECLAMACOES] updateFilter: ${key} =`, value);
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      if (key === 'selectedAccounts' && Array.isArray(value)) {
        if (value.length > 0) {
          newParams.set('accounts', value.join(','));
        } else {
          newParams.delete('accounts');
        }
      } else if (key === 'currentPage') {
        newParams.set('page', String(value));
      } else if (key === 'itemsPerPage') {
        newParams.set('limit', String(value));
      } else {
        newParams.set(key, String(value));
      }
      
      // Se mudou filtro (não paginação), resetar página
      if (key !== 'currentPage' && key !== 'itemsPerPage') {
        newParams.set('page', '1');
      }
      
      console.log('📋 Nova URL:', newParams.toString());
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // ✅ Atualizar múltiplos filtros de uma vez
  const updateFilters = useCallback((newFilters: Partial<ReclamacoesFilters>) => {
    console.log('🎯 Múltiplos filtros atualizados:', newFilters);
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (key === 'selectedAccounts' && Array.isArray(value)) {
          if (value.length > 0) {
            newParams.set('accounts', value.join(','));
          } else {
            newParams.delete('accounts');
          }
        } else if (key === 'currentPage') {
          newParams.set('page', String(value));
        } else if (key === 'itemsPerPage') {
          newParams.set('limit', String(value));
        } else {
          newParams.set(key, String(value));
        }
      });
      
      // Se mudou algum filtro (não paginação), resetar página
      const hasNonPaginationChange = Object.keys(newFilters).some(
        key => key !== 'currentPage' && key !== 'itemsPerPage'
      );
      
      if (hasNonPaginationChange) {
        newParams.set('page', '1');
      }
      
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // ✅ Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetando todos os filtros');
    setSearchParams({
      periodo: DEFAULT_FILTERS.periodo,
      status: DEFAULT_FILTERS.status,
      type: DEFAULT_FILTERS.type,
      stage: DEFAULT_FILTERS.stage,
      page: '1',
      limit: '50'
    }, { replace: true });
  }, [setSearchParams]);

  // ✅ Resetar apenas filtros de busca
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 Resetando filtros de busca');
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('periodo', DEFAULT_FILTERS.periodo);
      newParams.set('status', DEFAULT_FILTERS.status);
      newParams.set('type', DEFAULT_FILTERS.type);
      newParams.set('stage', DEFAULT_FILTERS.stage);
      newParams.set('page', '1');
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // ✅ Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.periodo !== DEFAULT_FILTERS.periodo ||
      filters.status !== DEFAULT_FILTERS.status ||
      filters.type !== DEFAULT_FILTERS.type ||
      filters.stage !== DEFAULT_FILTERS.stage
    );
  }, [filters]);

  // ✅ Contar filtros ativos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.periodo !== DEFAULT_FILTERS.periodo) count++;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.type !== DEFAULT_FILTERS.type) count++;
    if (filters.stage !== DEFAULT_FILTERS.stage) count++;
    return count;
  }, [filters]);

  // Helpers legados (compatibilidade)
  const parseFiltersFromUrl = () => filters;
  const encodeFiltersToUrl = () => searchParams;

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
