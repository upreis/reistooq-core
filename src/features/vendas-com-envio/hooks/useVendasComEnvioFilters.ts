/**
 * 📦 VENDAS COM ENVIO - Hook de Filtros (Legado)
 * @deprecated Use useVendasComEnvioFiltersUnified instead
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import type { VendasComEnvioFilters } from '../types';

const getDefaultFilters = (): VendasComEnvioFilters => ({
  startDate: startOfDay(subDays(new Date(), 6)),
  endDate: endOfDay(new Date()),
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
});

export function useVendasComEnvioFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  
  const { appliedFilters, setAppliedFilters, setShouldFetch } = useVendasComEnvioStore();
  const [pendingFilters, setPendingFilters] = useState<VendasComEnvioFilters>(appliedFilters);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
  }, [searchParams, appliedFilters, setAppliedFilters]);

  const updatePendingFilter = useCallback(<K extends keyof VendasComEnvioFilters>(
    key: K,
    value: VendasComEnvioFilters[K]
  ) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    const filtersToApply = { ...pendingFilters, currentPage: 1 };
    setAppliedFilters(filtersToApply);
    setShouldFetch(true);
  }, [pendingFilters, setAppliedFilters, setShouldFetch]);

  const changePage = useCallback((page: number) => {
    const newFilters = { ...appliedFilters, currentPage: page };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    setShouldFetch(true);
  }, [appliedFilters, setAppliedFilters, setShouldFetch]);

  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    const newFilters = { ...appliedFilters, itemsPerPage, currentPage: 1 };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    setShouldFetch(true);
  }, [appliedFilters, setAppliedFilters, setShouldFetch]);

  const clearFilters = useCallback(() => {
    const defaultFilters = getDefaultFilters();
    setPendingFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, [setAppliedFilters]);

  return {
    pendingFilters,
    appliedFilters,
    updatePendingFilter,
    applyFilters,
    changePage,
    changeItemsPerPage,
    clearFilters,
    hasChanges: JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters),
  };
}
