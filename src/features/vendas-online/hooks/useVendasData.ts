/**
 * 🔄 USE VENDAS DATA
 * Hook para buscar dados de vendas do Mercado Livre
 */

import { useEffect } from 'react';
import useSWR from 'swr';
import { useVendasStore } from '../store/vendasStore';
import { supabase } from '@/integrations/supabase/client';
import { MLOrder } from '../types/vendas.types';

interface FetchVendasParams {
  integrationAccountId: string;
  search?: string;
  status?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  offset: number;
  limit: number;
}

const fetchVendasFromML = async (params: FetchVendasParams) => {
  if (!params.integrationAccountId) {
    throw new Error('Integration Account ID é obrigatório');
  }

  console.log('[useVendasData] Buscando orders do ML:', params);

  const { data, error } = await supabase.functions.invoke('ml-vendas-unified', {
    body: {
      action: 'fetch_orders',
      params: {
        integration_account_id: params.integrationAccountId,
        search: params.search || '',
        status: params.status || [],
        date_from: params.dateFrom,
        date_to: params.dateTo,
        offset: params.offset,
        limit: params.limit
      }
    }
  });

  if (error) {
    console.error('[useVendasData] Erro ao buscar orders:', error);
    throw error;
  }

  console.log('[useVendasData] Orders recebidas:', data?.orders?.length || 0);

  return {
    orders: (data?.orders || []) as MLOrder[],
    total: data?.total || 0,
    packs: data?.packs || {},
    shippings: data?.shippings || {}
  };
};

export const useVendasData = () => {
  const {
    filters,
    pagination,
    setOrders,
    setPacks,
    setShippings,
    setLoading,
    setError
  } = useVendasStore();

  // Construir chave SWR baseada nos filtros
  const swrKey = filters.integrationAccountId
    ? [
        'vendas-ml',
        filters.integrationAccountId,
        filters.search,
        filters.status.join(','),
        filters.dateFrom,
        filters.dateTo,
        pagination.currentPage,
        pagination.itemsPerPage
      ]
    : null;

  // Fetch com SWR (cache automático)
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => fetchVendasFromML({
      integrationAccountId: filters.integrationAccountId,
      search: filters.search,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
      limit: pagination.itemsPerPage
    }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000 // Cache de 30s
    }
  );

  // Atualizar store quando dados chegarem
  useEffect(() => {
    if (data) {
      setOrders(data.orders, data.total);
      setPacks(data.packs);
      setShippings(data.shippings);
    }
  }, [data, setOrders, setPacks, setShippings]);

  // Gerenciar loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Gerenciar error state
  useEffect(() => {
    setError(error ? error.message : null);
  }, [error, setError]);

  return {
    data,
    isLoading,
    error,
    refresh: mutate
  };
};
