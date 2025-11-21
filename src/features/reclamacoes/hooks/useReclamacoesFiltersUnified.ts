/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS
 * ✅ SOLUÇÃO RADICAL: URL é a ÚNICA fonte de verdade (sem estado local)
 * ✅ PERSISTÊNCIA: Salva filtros em localStorage antes de navegar
 */

import { useCallback, useMemo, useEffect } from 'react';
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

const FILTERS_STORAGE_KEY = 'reclamacoes_last_filters';

/**
 * Hook unificado - URL é a única fonte de verdade + localStorage para persistência
 */
export function useReclamacoesFiltersUnified() {
  const persistentCache = usePersistentReclamacoesState();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ RESTAURAR filtros do localStorage na primeira montagem
  useEffect(() => {
    // Só restaurar se URL está vazia (primeira visita ou volta de outra página)
    const hasUrlFilters = searchParams.toString().length > 0;
    
    if (!hasUrlFilters) {
      try {
        const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
          const savedFilters = JSON.parse(saved);
          console.log('📦 Restaurando filtros salvos:', savedFilters);
          
          const params = new URLSearchParams();
          if (savedFilters.periodo) params.set('periodo', savedFilters.periodo);
          if (savedFilters.status) params.set('status', savedFilters.status);
          if (savedFilters.type) params.set('type', savedFilters.type);
          if (savedFilters.stage) params.set('stage', savedFilters.stage);
          if (savedFilters.accounts) params.set('accounts', savedFilters.accounts);
          if (savedFilters.page) params.set('page', savedFilters.page);
          if (savedFilters.limit) params.set('limit', savedFilters.limit);
          
          setSearchParams(params, { replace: true });
        }
      } catch (error) {
        console.warn('❌ Erro ao restaurar filtros:', error);
      }
    }
  }, []); // Só roda na montagem inicial
  
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

  // ✅ SALVAR filtros no localStorage sempre que mudarem
  useEffect(() => {
    try {
      const filtersToSave = {
        periodo: filters.periodo,
        status: filters.status,
        type: filters.type,
        stage: filters.stage,
        accounts: filters.selectedAccounts.join(','),
        page: filters.currentPage.toString(),
        limit: filters.itemsPerPage.toString()
      };
      
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
      console.log('💾 Filtros salvos no localStorage:', filtersToSave);
    } catch (error) {
      console.warn('❌ Erro ao salvar filtros:', error);
    }
  }, [filters]);

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
