/**
 * 📦 VENDAS COM ENVIO - Hook de Filtros
 * Sincronização de filtros com URL e localStorage
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { DEFAULT_PERIODO, DEFAULT_ITEMS_PER_PAGE } from '../config';
import type { VendasComEnvioFilters, ShippingStatus } from '../types';

export function useVendasComEnvioFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { appliedFilters, setAppliedFilters, setShouldFetch } = useVendasComEnvioStore();
  
  // Estado local para filtros em edição (antes de aplicar)
  const [pendingFilters, setPendingFilters] = useState<VendasComEnvioFilters>(appliedFilters);

  // Sincronizar com URL apenas na inicialização
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const urlPeriodo = searchParams.get('periodo');
    const urlStatus = searchParams.get('status');
    const urlSearch = searchParams.get('q');
    const urlPage = searchParams.get('page');

    if (urlPeriodo || urlStatus || urlSearch || urlPage) {
      const urlFilters: VendasComEnvioFilters = {
        ...appliedFilters,
        periodo: urlPeriodo ? parseInt(urlPeriodo, 10) : appliedFilters.periodo,
        shippingStatus: (urlStatus as ShippingStatus | 'all') || appliedFilters.shippingStatus,
        searchTerm: urlSearch || appliedFilters.searchTerm,
        currentPage: urlPage ? parseInt(urlPage, 10) : appliedFilters.currentPage,
      };
      
      setPendingFilters(urlFilters);
      setAppliedFilters(urlFilters);
    }
  }, [searchParams, appliedFilters, setAppliedFilters]);

  // Atualizar URL quando filtros aplicados mudam (com debounce)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (appliedFilters.periodo !== DEFAULT_PERIODO) {
        params.set('periodo', appliedFilters.periodo.toString());
      }
      if (appliedFilters.shippingStatus !== 'all') {
        params.set('status', appliedFilters.shippingStatus);
      }
      if (appliedFilters.searchTerm) {
        params.set('q', appliedFilters.searchTerm);
      }
      if (appliedFilters.currentPage > 1) {
        params.set('page', appliedFilters.currentPage.toString());
      }

      setSearchParams(params, { replace: true });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [appliedFilters, setSearchParams]);

  // Atualizar filtro pendente individual
  const updatePendingFilter = useCallback(<K extends keyof VendasComEnvioFilters>(
    key: K,
    value: VendasComEnvioFilters[K]
  ) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Aplicar filtros e disparar busca
  const applyFilters = useCallback(() => {
    // Reset página para 1 se filtros mudaram (exceto página)
    const filtersToApply = {
      ...pendingFilters,
      currentPage: 1,
    };
    
    setAppliedFilters(filtersToApply);
    setShouldFetch(true);
  }, [pendingFilters, setAppliedFilters, setShouldFetch]);

  // Mudar página (não precisa clicar em aplicar)
  const changePage = useCallback((page: number) => {
    const newFilters = { ...appliedFilters, currentPage: page };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    setShouldFetch(true);
  }, [appliedFilters, setAppliedFilters, setShouldFetch]);

  // Mudar itens por página
  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    const newFilters = { ...appliedFilters, itemsPerPage, currentPage: 1 };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    setShouldFetch(true);
  }, [appliedFilters, setAppliedFilters, setShouldFetch]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    const defaultFilters: VendasComEnvioFilters = {
      periodo: DEFAULT_PERIODO,
      selectedAccounts: [],
      shippingStatus: 'all',
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    };
    
    setPendingFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, [setAppliedFilters]);

  return {
    // Filtros
    pendingFilters,
    appliedFilters,
    
    // Actions
    updatePendingFilter,
    applyFilters,
    changePage,
    changeItemsPerPage,
    clearFilters,
    
    // Helpers
    hasChanges: JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters),
  };
}
