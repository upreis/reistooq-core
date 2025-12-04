/**
 * 🔄 USE VENDAS DATA - OPÇÃO A
 * Busca direta da API ML (como /pedidos)
 * Sem CRON job, sem cache table - paginação frontend
 */

import { useEffect, useRef } from 'react';
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

  console.log('🌐 [useVendasData] Buscando orders da API ML:', params);

  // Buscar diretamente via unified-orders (como /pedidos)
  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: {
      integration_account_id: params.integrationAccountId,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      offset: params.offset,
      limit: params.limit
    }
  });

  if (error) {
    console.error('❌ [useVendasData] Erro ao buscar orders:', error);
    throw error;
  }

  console.log('✅ [useVendasData] Resposta unified-orders:', {
    results: data?.results?.length || 0,
    paging: data?.paging
  });

  // unified-orders retorna { results, paging }
  const orders = data?.results || [];
  const total = data?.paging?.total || orders.length;
  
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

  // ✅ OPÇÃO A: Buscar diretamente da API quando usuário clica "Aplicar Filtros"
  const shouldFetchFromAPI = shouldFetch && selectedAccountIds.length > 0;

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

  // 🎯 Fetch com SWR
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      console.log('🔄 [SWR] Executando fetch de API ML...');
      
      // ✅ Buscar de TODAS as contas selecionadas
      const allOrders: any[] = [];
      let totalGlobal = 0;
      
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
        totalGlobal += result.total;
      }
      
      return {
        orders: allOrders,
        total: totalGlobal,
        packs: {},
        shippings: {}
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      dedupingInterval: 30000 // Cache de 30s no SWR
    }
  );

  // 🔍 DEBUG: Log do estado de busca
  useEffect(() => {
    console.log('🔍 [useVendasData] Estado de busca:', {
      shouldFetch,
      shouldFetchFromAPI,
      swrKeyExists: !!swrKey,
      selectedAccountIds: selectedAccountIds.length
    });
  }, [shouldFetch, shouldFetchFromAPI, swrKey, selectedAccountIds.length]);

  // Reset flag quando contas ou shouldFetch mudam
  useEffect(() => {
    hasFetchedFromAPI.current = false;
  }, [selectedAccountIds.join(','), filters.dateFrom, filters.dateTo]);

  // 🔧 Atualizar store com dados
  useEffect(() => {
    setLoading(isLoading);

    if (data) {
      console.log('✅ Atualizando store com dados da API ML:', data.orders.length);
      setOrders(data.orders, data.total);
      setPacks(data.packs);
      setShippings(data.shippings);
    }

    if (error) {
      setError(error.message);
    }
  }, [data, isLoading, error, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading,
    error,
    refetch: mutate
  };
};
