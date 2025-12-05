/**
 * 🔄 USE VENDAS DATA
 * Hook HÍBRIDO: consulta ml_orders cache primeiro, fallback para API ML
 */

import { useEffect } from 'react';
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

  console.log('🌐 [useVendasData] Buscando orders da API ML:', params);

  // 🔧 FASE 1 FIX: Passar TODAS as contas como array
  // O backend consolida e faz paginação sobre dataset unificado
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
    console.error('❌ [useVendasData] Erro ao buscar orders:', error);
    throw error;
  }

  console.log('✅ [useVendasData] Resposta unified-ml-orders:', {
    count: data?.orders?.length || 0,
    total: data?.total || data?.paging?.total || 0
  });

  // ✅ unified-ml-orders retorna orders diretamente
  const orders = data?.orders || [];
  const total = data?.total || data?.paging?.total || 0; // 🔧 FASE 1: Total real para paginação
  
  // Extrair packs e shippings dos orders
  const packs: Record<string, any> = {};
  const shippings: Record<string, any> = {};
  
  orders.forEach((order: any) => {
    if (order.pack_id && !packs[order.pack_id]) {
      packs[order.pack_id] = {
        id: order.pack_id,
        orders: []
      };
    }
    if (order.pack_id) {
      packs[order.pack_id].orders.push(order.id);
    }
    
    if (order.shipping?.id && !shippings[order.shipping.id]) {
      shippings[order.shipping.id] = order.shipping;
    }
  });

  return {
    orders: orders as MLOrder[],
    total,
    packs,
    shippings
  };
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

  // 🚀 COMBO 2.1: Cache query só ativo durante busca manual OU para restaurar dados na montagem
  // NÃO consultar cache toda vez que filtros mudam - apenas quando shouldFetch é true
  const cacheQuery = useMLOrdersFromCache({
    integrationAccountIds: selectedAccountIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: shouldFetch && selectedAccountIds.length > 0 // 🔧 CORREÇÃO: Controlado por shouldFetch
  });

  // 🔧 CORREÇÃO: Se cache retornou dados válidos E não está loading, usar cache
  const useCacheData = !cacheQuery.isLoading && cacheQuery.data && !cacheQuery.data.cache_expired;

  // ✅ COMBO 2.1: Buscar de API ML APENAS quando usuário clica "Aplicar Filtros" (shouldFetch=true)
  // NÃO buscar automaticamente - busca é MANUAL OBRIGATÓRIA
  const shouldFetchFromAPI = shouldFetch && selectedAccountIds.length > 0 && !cacheQuery.isLoading;

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

  // 🎯 COMBO 2.1: Fetch com SWR - APENAS quando shouldFetch é true
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      console.log('🔄 [SWR] Executando fetch de API ML (busca manual)...');
      
      const result = await fetchVendasFromML({
        integrationAccountId: selectedAccountIds.join(','),
        search: filters.search,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage
      });
      
      console.log('✅ [SWR] Total pedidos:', result.orders.length, '- Total disponível:', result.total);
      
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
      revalidateOnMount: false, // 🔧 COMBO 2.1: NÃO buscar automaticamente no mount
      dedupingInterval: 5000,
      keepPreviousData: true
    }
  );

  // 🔍 DEBUG: Log do estado de busca
  useEffect(() => {
    console.log('🔍 [useVendasData] Estado de busca:', {
      shouldFetch,
      shouldFetchFromAPI,
      cacheLoading: cacheQuery.isLoading,
      hasCacheData: !!cacheQuery.data,
      swrKeyExists: !!swrKey,
      selectedAccountIds: selectedAccountIds.length
    });
  }, [shouldFetch, shouldFetchFromAPI, cacheQuery.isLoading, cacheQuery.data, swrKey, selectedAccountIds.length]);

  // 🔧 Consolidar updates em único useEffect para evitar flicker
  useEffect(() => {
    // Atualizar loading state
    setLoading(cacheQuery.isLoading || isLoading);

    // Atualizar dados: priorizar cache válido, fallback para API
    if (useCacheData && cacheQuery.data) {
      console.log('✅ Usando dados do CACHE ml_orders');
      setOrders(cacheQuery.data.orders, cacheQuery.data.total);
      setPacks({});
      setShippings({});
    } else if (data && !cacheQuery.isLoading) {
      console.log('✅ Usando dados da API ML (cache expirado)');
      setOrders(data.orders, data.total);
      setPacks(data.packs);
      setShippings(data.shippings);
    }

    // Atualizar error state
    if (error) {
      setError(error.message);
    }
  }, [useCacheData, cacheQuery.data, cacheQuery.isLoading, data, isLoading, error, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading,
    error,
    refetch: mutate // Usar refetch para busca manual
  };
};
