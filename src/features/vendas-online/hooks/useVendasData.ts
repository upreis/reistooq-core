/**
 * 🔄 USE VENDAS DATA
 * Hook simplificado: usa useMLOrdersFromCache que já tem cache + API fallback
 * 
 * PADRÃO COMBO 2.1 (igual /reclamacoes):
 * - Single hook with enabled parameter
 * - Cache-first com API fallback automático
 * - Sem mistura de React Query + SWR
 */

import { useEffect } from 'react';
import { useVendasStore } from '../store/vendasStore';
import { useMLOrdersFromCache } from './useMLOrdersFromCache';

export const useVendasData = (shouldFetch: boolean = false, selectedAccountIds: string[] = []) => {
  const {
    filters,
    setOrders,
    setPacks,
    setShippings,
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

  // Sincronizar estado com store
  useEffect(() => {
    setLoading(isLoading || isFetching);

    if (data) {
      console.log(`📊 [useVendasData] Dados recebidos: ${data.orders.length} orders (fonte: ${data.source})`);
      setOrders(data.orders, data.total);
      setPacks(data.packs || {});
      setShippings(data.shippings || {});
    }

    if (error) {
      console.error('❌ [useVendasData] Erro:', error);
      setError(error.message);
    }
  }, [data, isLoading, isFetching, error, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading: isLoading || isFetching,
    error,
    refetch
  };
};
