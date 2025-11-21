/**
 * 🎯 HOOK DE FILTROS - PADRÃO /PEDIDOS
 * ✅ Cópia EXATA do padrão comprovadamente funcional
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
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

export function useReclamacoesFiltersUnified() {
  const persistentCache = usePersistentReclamacoesState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ReclamacoesFilters>(DEFAULT_FILTERS);

  // ✅ Carregar filtros da URL na montagem (UMA VEZ)
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl();
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Array vazio = roda só na montagem

  // ✅ Sincronizar filtros para URL quando mudarem
  useEffect(() => {
    const urlParams = encodeFiltersToUrl();
    setSearchParams(urlParams, { replace: true });
  }, [filters, setSearchParams]);

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

  // Atualizar múltiplos filtros
  const updateFilters = useCallback((newFilters: Partial<ReclamacoesFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      const hasNonPaginationChange = Object.keys(newFilters).some(
        key => key !== 'currentPage' && key !== 'itemsPerPage'
      );
      
      if (hasNonPaginationChange) {
        updated.currentPage = 1;
      }
      
      return updated;
    });
  }, []);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca
  const resetSearchFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      periodo: DEFAULT_FILTERS.periodo,
      status: DEFAULT_FILTERS.status,
      type: DEFAULT_FILTERS.type,
      stage: DEFAULT_FILTERS.stage,
      currentPage: 1
    }));
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.periodo !== DEFAULT_FILTERS.periodo ||
      filters.status !== DEFAULT_FILTERS.status ||
      filters.type !== DEFAULT_FILTERS.type ||
      filters.stage !== DEFAULT_FILTERS.stage
    );
  }, [filters]);

  // Contar filtros ativos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.periodo !== DEFAULT_FILTERS.periodo) count++;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.type !== DEFAULT_FILTERS.type) count++;
    if (filters.stage !== DEFAULT_FILTERS.stage) count++;
    return count;
  }, [filters]);

  // Helpers que usam closures
  const parseFiltersFromUrl = useCallback(() => {
    return parseFiltersFromUrlHelper(searchParams);
  }, [searchParams]);
  
  const encodeFiltersToUrl = useCallback(() => {
    return encodeFiltersToUrlHelper(filters);
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

// ===== HELPER FUNCTIONS =====
function parseFiltersFromUrlHelper(searchParams: URLSearchParams): Partial<ReclamacoesFilters> {
  const filters: Partial<ReclamacoesFilters> = {};

  const periodo = searchParams.get('periodo');
  if (periodo) filters.periodo = periodo;

  const status = searchParams.get('status');
  if (status) filters.status = status;

  const type = searchParams.get('type');
  if (type) filters.type = type;

  const stage = searchParams.get('stage');
  if (stage) filters.stage = stage;

  const accounts = searchParams.get('accounts');
  if (accounts) {
    filters.selectedAccounts = accounts.split(',').filter(id => id.trim().length > 0);
  }

  const page = searchParams.get('page');
  if (page) {
    const parsed = parseInt(page, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      filters.currentPage = parsed;
    }
  }

  const limit = searchParams.get('limit');
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed)) {
      filters.itemsPerPage = parsed;
    }
  }

  return filters;
}

function encodeFiltersToUrlHelper(filters: ReclamacoesFilters): URLSearchParams {
  const params = new URLSearchParams();

  // ✅ Adicionar TODOS os filtros (sem omitir padrões)
  params.set('periodo', filters.periodo);
  params.set('status', filters.status);
  params.set('type', filters.type);
  params.set('stage', filters.stage);
  params.set('page', filters.currentPage.toString());
  params.set('limit', filters.itemsPerPage.toString());

  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }

  return params;
}
