/**
 * 🔄 USE VENDAS DATA
 * Hook HÍBRIDO: consulta ml_orders cache primeiro, fallback para API ML
 */

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useVendasStore } from '../store/vendasStore';
import { supabase } from '@/integrations/supabase/client';
import { MLOrder } from '../types/vendas.types';
import { useMLOrdersFromCache } from './useMLOrdersFromCache';

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

  // 🔧 FASE 1 FIX: Passar TODAS as contas como array
  const accountIds = params.integrationAccountId.includes(',') 
    ? params.integrationAccountId.split(',')
    : [params.integrationAccountId];

  const { data, error } = await supabase.functions.invoke('unified-ml-orders', {
    body: {
      integration_account_ids: accountIds,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      force_refresh: false,
      offset: params.offset,
      limit: params.limit
    }
  });

  if (error) {
    throw error;
  }

  const orders = data?.orders || [];
  const total = data?.total || data?.paging?.total || 0;
  
  const packs: Record<string, any> = {};
  const shippings: Record<string, any> = {};
  
  orders.forEach((order: any) => {
    if (order.pack_id && !packs[order.pack_id]) {
      packs[order.pack_id] = { id: order.pack_id, orders: [] };
    }
    if (order.pack_id) {
      packs[order.pack_id].orders.push(order.id);
    }
    if (order.shipping?.id && !shippings[order.shipping.id]) {
      shippings[order.shipping.id] = order.shipping;
    }
  });

  return { orders: orders as MLOrder[], total, packs, shippings };
};

export const useVendasData = (shouldFetch: boolean = false, selectedAccountIds: string[] = []) => {
  const {
    filters,
    pagination,
    setOrders,
    setPacks,
    setShippings,
    setLoading,
    setError
  } = useVendasStore();

  // 🚀 COMBO 2.1: Cache query - SEMPRE habilitado quando há contas
  const cacheQuery = useMLOrdersFromCache({
    integrationAccountIds: selectedAccountIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: shouldFetch && selectedAccountIds.length > 0
  });

  // 🔧 Determinar se cache é válido e tem dados
  const cacheHasValidData = useMemo(() => {
    return !cacheQuery.isLoading && 
           cacheQuery.data && 
           !cacheQuery.data.cache_expired && 
           cacheQuery.data.orders.length > 0;
  }, [cacheQuery.isLoading, cacheQuery.data]);

  // 🔧 Buscar da API apenas se: shouldFetch=true E cache não tem dados válidos E cache terminou de carregar
  const shouldFetchFromAPI = useMemo(() => {
    if (!shouldFetch || selectedAccountIds.length === 0) return false;
    if (cacheQuery.isLoading) return false; // Aguardar cache terminar
    if (cacheHasValidData) return false; // Cache válido, não precisa API
    return true; // Cache miss ou expirado
  }, [shouldFetch, selectedAccountIds.length, cacheQuery.isLoading, cacheHasValidData]);

  const swrKey = shouldFetchFromAPI
    ? [
        'vendas-ml-api',
        selectedAccountIds.join(','),
        filters.search,
        filters.status.join(','),
        filters.dateFrom,
        filters.dateTo,
        pagination.currentPage,
        pagination.itemsPerPage
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      console.log('🔥 [useVendasData] Buscando dados da API ML...');
      const result = await fetchVendasFromML({
        integrationAccountId: selectedAccountIds.join(','),
        search: filters.search,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage
      });
      
      console.log('✅ [useVendasData] API retornou:', result.orders.length, 'pedidos');
      return {
        orders: result.orders,
        total: result.total,
        packs: result.packs,
        shippings: result.shippings
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      keepPreviousData: true
    }
  );

  // 🔧 Consolidar updates em único useEffect
  useEffect(() => {
    setLoading(cacheQuery.isLoading || isLoading);

    // Priorizar cache válido
    if (cacheHasValidData && cacheQuery.data) {
      setOrders(cacheQuery.data.orders, cacheQuery.data.total);
      setPacks({});
      setShippings({});
    } else if (data && !cacheQuery.isLoading) {
      setOrders(data.orders, data.total);
      setPacks(data.packs);
      setShippings(data.shippings);
    }

    if (error) {
      setError(error.message);
    }
  }, [cacheHasValidData, cacheQuery.data, cacheQuery.isLoading, data, isLoading, error, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading: cacheQuery.isLoading || isLoading,
    error,
    refetch: mutate
  };
};
