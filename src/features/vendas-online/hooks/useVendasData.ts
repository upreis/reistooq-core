/**
 * 🔄 USE VENDAS DATA
 * Hook simplificado: usa useMLOrdersFromCache que já tem cache + API fallback
 * 
 * PADRÃO COMBO 2.1 (igual /reclamacoes):
 * - Single hook with enabled parameter
 * - Cache-first com API fallback automático
 * - NÃO sincroniza com store (a página faz isso)
 */

import { useEffect } from 'react';
import { useVendasStore } from '../store/vendasStore';
import { useMLOrdersFromCache } from './useMLOrdersFromCache';

export const useVendasData = (shouldFetch: boolean = false, selectedAccountIds: string[] = []) => {
  const {
    filters,
    setLoading,
    setError
  } = useVendasStore();

  // 🚀 COMBO 2.1: Hook unificado (cache + API fallback)
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useMLOrdersFromCache({
    integrationAccountIds: selectedAccountIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: shouldFetch && selectedAccountIds.length > 0
  });

  // ✅ SIMPLIFICADO (igual /reclamacoes): Apenas sincronizar loading/error
  // A PÁGINA é responsável por chamar setOrders (com enriquecimento de account_name)
  useEffect(() => {
    setLoading(isLoading || isFetching);

    if (error) {
      setError(error.message);
    }
  }, [isLoading, isFetching, error, setLoading, setError]);

  return {
    data,
    isLoading: isLoading || isFetching,
    error,
    refetch
  };
};
