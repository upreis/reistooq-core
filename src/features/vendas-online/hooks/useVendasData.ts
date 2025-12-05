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

  // 🎯 Ref para evitar múltiplas buscas
  const hasFetchedFromAPI = useRef(false);

  // 🚀 ESTRATÉGIA HÍBRIDA: Consultar cache primeiro (sempre ativo se há contas)
  const cacheQuery = useMLOrdersFromCache({
    integrationAccountIds: selectedAccountIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    enabled: selectedAccountIds.length > 0 // 🔧 CORREÇÃO: Sempre consultar cache se há contas
  });

  // 🔧 FASE 3 FIX: Cache tem dados? (mesmo expirado, usar como fallback visual)
  const cacheHasData = !cacheQuery.isLoading && cacheQuery.data && cacheQuery.data.orders && cacheQuery.data.orders.length > 0;
  const cacheExpired = !cacheQuery.isLoading && (cacheQuery.data?.cache_expired || !cacheQuery.data);

  // ✅ FALLBACK: Buscar de API ML quando:
  // 1. Cache expirou/vazio E cache terminou loading E há contas
  // 2. OU usuário clicou buscar manualmente (shouldFetch) - PRIORIDADE MÁXIMA
  const shouldFetchFromAPI = selectedAccountIds.length > 0 && 
    (shouldFetch || (!cacheQuery.isLoading && cacheExpired));

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
      
      // 🔧 FASE 1 FIX: Uma única chamada para unified-ml-orders
      // A paginação é feita no backend sobre dataset consolidado de TODAS as contas
      const result = await fetchVendasFromML({
        integrationAccountId: selectedAccountIds.join(','), // Passar todas as contas
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
      revalidateOnMount: true,
      dedupingInterval: 5000, // 🔧 FASE 1: Reduzido para permitir paginação mais responsiva
      keepPreviousData: true // 🔧 FASE 1: Manter dados anteriores durante loading
    }
  );

  // 🔍 DEBUG: Log do estado de busca
  useEffect(() => {
    console.log('🔍 [useVendasData] Estado de busca:', {
      shouldFetch,
      shouldFetchFromAPI,
      cacheExpired,
      cacheHasData,
      cacheLoading: cacheQuery.isLoading,
      cacheOrdersCount: cacheQuery.data?.orders?.length || 0,
      swrKeyExists: !!swrKey,
      swrLoading: isLoading,
      swrDataCount: data?.orders?.length || 0,
      selectedAccountIds: selectedAccountIds.length
    });
  }, [shouldFetch, shouldFetchFromAPI, cacheExpired, cacheHasData, cacheQuery.isLoading, cacheQuery.data, swrKey, isLoading, data, selectedAccountIds.length]);

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

  // 🔧 FASE 3 FIX: Consolidar updates - PRIORIZAR dados da API, FALLBACK para cache (mesmo expirado)
  useEffect(() => {
    // Atualizar loading state - loading apenas se não temos dados de nenhuma fonte
    const hasAnyData = (data?.orders?.length > 0) || cacheHasData;
    const isStillLoading = isLoading || cacheQuery.isLoading;
    setLoading(isStillLoading && !hasAnyData);

    // 🔧 FASE 3 FIX: Prioridade de dados:
    // 1. API retornou dados → SEMPRE usar
    // 2. Cache tem dados (mesmo expirado) → usar como fallback visual enquanto API carrega
    if (data && data.orders && data.orders.length > 0) {
      console.log('✅ [useVendasData] Usando dados da API ML:', {
        orders: data.orders.length,
        total: data.total
      });
      setOrders(data.orders, data.total);
      setPacks(data.packs || {});
      setShippings(data.shippings || {});
    } 
    // 🔧 FASE 3 FIX: Fallback para cache MESMO EXPIRADO (melhor UX - mostrar dados antigos enquanto atualiza)
    else if (cacheHasData && cacheQuery.data) {
      console.log('✅ [useVendasData] Usando dados do CACHE ml_orders (fallback):', {
        orders: cacheQuery.data.orders.length,
        total: cacheQuery.data.total,
        expired: cacheQuery.data.cache_expired
      });
      setOrders(cacheQuery.data.orders, cacheQuery.data.total);
      setPacks({});
      setShippings({});
    }

    // Atualizar error state
    if (error) {
      console.error('❌ [useVendasData] Erro:', error);
      setError(error.message);
    }
  }, [cacheHasData, cacheQuery.data, cacheQuery.isLoading, data, isLoading, error, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading,
    error,
    refetch: mutate // Usar refetch para busca manual
  };
};
