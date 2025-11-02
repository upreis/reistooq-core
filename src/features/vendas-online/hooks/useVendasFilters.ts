/**
 * 🔍 USE VENDAS FILTERS
 * Hook para gerenciar filtros de vendas
 */

import { useCallback } from 'react';
import { useVendasStore } from '../store/vendasStore';
import { VendasFilters } from '../types/vendas.types';

export const useVendasFilters = () => {
  const filters = useVendasStore(state => state.filters);
  const updateFilters = useVendasStore(state => state.updateFilters);
  const resetFilters = useVendasStore(state => state.resetFilters);
  
  // Setters individuais
  const setSearch = useCallback((search: string) => {
    updateFilters({ search });
  }, [updateFilters]);
  
  const setStatus = useCallback((status: string[]) => {
    updateFilters({ status });
  }, [updateFilters]);
  
  const setDateRange = useCallback((dateFrom: string | null, dateTo: string | null) => {
    updateFilters({ dateFrom, dateTo });
  }, [updateFilters]);
  
  const setIntegrationAccountId = useCallback((integrationAccountId: string) => {
    updateFilters({ integrationAccountId });
  }, [updateFilters]);
  
  const setHasPack = useCallback((hasPack: boolean | null) => {
    updateFilters({ hasPack });
  }, [updateFilters]);
  
  const setHasShipping = useCallback((hasShipping: boolean | null) => {
    updateFilters({ hasShipping });
  }, [updateFilters]);
  
  const setPaymentStatus = useCallback((paymentStatus: string[]) => {
    updateFilters({ paymentStatus });
  }, [updateFilters]);
  
  // Verificar se tem filtros ativos
  const hasActiveFilters = useCallback(() => {
    return (
      filters.search !== '' ||
      filters.status.length > 0 ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.hasPack !== null ||
      filters.hasShipping !== null ||
      filters.paymentStatus.length > 0
    );
  }, [filters]);
  
  return {
    filters,
    setSearch,
    setStatus,
    setDateRange,
    setIntegrationAccountId,
    setHasPack,
    setHasShipping,
    setPaymentStatus,
    resetFilters,
    hasActiveFilters
  };
};
