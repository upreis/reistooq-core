/**
 * 🔄 USE VENDAS DATA
 * Hook HÍBRIDO: consulta ml_orders cache primeiro, fallback para API ML
 */

import { useEffect, useRef } from 'react';
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

  // 🔧 FASE 1: Passar offset e limit para paginação server-side
  const { data, error } = await supabase.functions.invoke('unified-ml-orders', {
    body: {
      integration_account_ids: [params.integrationAccountId],
      date_from: params.dateFrom,
      date_to: params.dateTo,
      force_refresh: false,
      offset: params.offset, // 🔧 FASE 1: Paginação
      limit: params.limit    // 🔧 FASE 1: Paginação
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

  // 🎯 Ref para evitar múltiplas buscas
  const hasFetchedFromAPI = useRef(false);

  // 🚀 ESTRATÉGIA HÍBRIDA: Consultar cache primeiro (sempre ativo se há contas)
  const cacheQuery = useMLOrdersFromCache({
    integrationAccountIds: selectedAccountIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: selectedAccountIds.length > 0 // 🔧 CORREÇÃO: Sempre consultar cache se há contas
  });

  // 🔧 CORREÇÃO: Se cache retornou dados válidos E não está loading, usar cache
  const useCacheData = !cacheQuery.isLoading && cacheQuery.data && !cacheQuery.data.cache_expired;

  // ✅ FALLBACK: Buscar de API ML quando:
  // 1. Cache expirou/vazio E cache terminou loading E há contas
  // 2. OU usuário clicou buscar manualmente (shouldFetch)
  const cacheExpired = !cacheQuery.isLoading && (cacheQuery.data?.cache_expired || !cacheQuery.data);
  const shouldFetchFromAPI = selectedAccountIds.length > 0 && 
    !cacheQuery.isLoading && 
    (cacheExpired || shouldFetch); // 🔧 CORREÇÃO: Buscar automaticamente se cache expirou

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

  // 🎯 COMBO 2.1: Fetch com SWR
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      console.log('🔄 [SWR] Executando fetch de API ML...');
      // ✅ Buscar de TODAS as contas selecionadas com paginação
      const allOrders: any[] = [];
      let totalFromAllAccounts = 0;
      
      for (const accountId of selectedAccountIds) {
        const result = await fetchVendasFromML({
          integrationAccountId: accountId,
          search: filters.search,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
          limit: pagination.itemsPerPage
        });
        
        allOrders.push(...result.orders);
        totalFromAllAccounts += result.total; // 🔧 FASE 1: Somar total real de todas as contas
      }
      
      console.log('✅ [SWR] Total pedidos:', allOrders.length, '- Total disponível:', totalFromAllAccounts);
      
      return {
        orders: allOrders,
        total: totalFromAllAccounts, // 🔧 FASE 1: Total REAL para paginação funcionar
        packs: {},
        shippings: {}
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      dedupingInterval: 30000
    }
  );

  // 🔍 DEBUG: Log do estado de busca
  useEffect(() => {
    console.log('🔍 [useVendasData] Estado de busca:', {
      shouldFetch,
      shouldFetchFromAPI,
      cacheExpired,
      cacheLoading: cacheQuery.isLoading,
      hasCacheData: !!cacheQuery.data,
      swrKeyExists: !!swrKey,
      hasFetchedFromAPI: hasFetchedFromAPI.current,
      selectedAccountIds: selectedAccountIds.length
    });
  }, [shouldFetch, shouldFetchFromAPI, cacheExpired, cacheQuery.isLoading, cacheQuery.data, swrKey, selectedAccountIds.length]);

  // 🎯 COMBO 2.1: Disparar busca automática quando cache expirou
  useEffect(() => {
    if (shouldFetchFromAPI && swrKey && !hasFetchedFromAPI.current && !isLoading) {
      console.log('🚀 [useVendasData] Cache expirado, disparando busca da API...', { swrKey });
      hasFetchedFromAPI.current = true;
      mutate();
    }
  }, [shouldFetchFromAPI, swrKey, isLoading, mutate]);

  // Reset flag quando contas ou shouldFetch mudam
  useEffect(() => {
    hasFetchedFromAPI.current = false;
  }, [selectedAccountIds.join(','), filters.dateFrom, filters.dateTo]);

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
