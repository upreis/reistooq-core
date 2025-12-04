/**
 * 🔄 USE VENDAS DATA - OPÇÃO A
 * Busca TODOS os pedidos da API ML com paginação automática
 * Paginação frontend sobre dados completos
 */

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useVendasStore } from '../store/vendasStore';
import { supabase } from '@/integrations/supabase/client';
import { MLOrder } from '../types/vendas.types';

interface FetchVendasParams {
  integrationAccountId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}

const ML_PAGE_SIZE = 50; // Limite da API ML por requisição

/**
 * Busca TODOS os pedidos de uma conta com paginação automática
 */
const fetchAllOrdersFromAccount = async (params: FetchVendasParams): Promise<MLOrder[]> => {
  const allOrders: MLOrder[] = [];
  let offset = 0;
  let hasMore = true;

  console.log(`🌐 [useVendasData] Buscando TODOS orders da conta ${params.integrationAccountId}...`);

  while (hasMore) {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: params.integrationAccountId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        offset,
        limit: ML_PAGE_SIZE
      }
    });

    if (error) {
      console.error('❌ [useVendasData] Erro ao buscar orders:', error);
      throw error;
    }

    const orders = data?.results || [];
    allOrders.push(...orders);

    console.log(`📦 [useVendasData] Página ${Math.floor(offset / ML_PAGE_SIZE) + 1}: ${orders.length} orders (total acumulado: ${allOrders.length})`);

    // Verificar se há mais páginas
    if (orders.length < ML_PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += ML_PAGE_SIZE;
    }
  }

  console.log(`✅ [useVendasData] Total de orders da conta: ${allOrders.length}`);
  return allOrders;
};

const fetchVendasFromML = async (
  accountIds: string[],
  dateFrom?: string | null,
  dateTo?: string | null
) => {
  if (!accountIds.length) {
    throw new Error('Nenhuma conta selecionada');
  }

  console.log('🌐 [useVendasData] Iniciando busca completa de todas contas:', accountIds.length);

  // Buscar de TODAS as contas em paralelo
  const results = await Promise.all(
    accountIds.map(accountId =>
      fetchAllOrdersFromAccount({
        integrationAccountId: accountId,
        dateFrom,
        dateTo
      })
    )
  );

  // Combinar todos os pedidos
  const allOrders = results.flat();

  console.log(`✅ [useVendasData] Total GERAL de orders: ${allOrders.length}`);

  // Extrair packs e shippings dos orders
  const packs: Record<string, any> = {};
  const shippings: Record<string, any> = {};

  allOrders.forEach((order: any) => {
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
    orders: allOrders as MLOrder[],
    total: allOrders.length,
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

  // ✅ Buscar quando shouldFetch=true e há contas selecionadas
  const shouldFetchFromAPI = shouldFetch && selectedAccountIds.length > 0;

  // 🔑 SWR Key - inclui filtros de data para revalidar quando mudarem
  const swrKey = shouldFetchFromAPI
    ? [
        'vendas-ml-api-all',
        selectedAccountIds.sort().join(','),
        filters.dateFrom,
        filters.dateTo
      ]
    : null;

  // 🎯 Fetch com SWR - busca TODOS os dados, paginação é frontend
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      console.log('🔄 [SWR] Executando fetch COMPLETO de API ML...');

      const result = await fetchVendasFromML(
        selectedAccountIds,
        filters.dateFrom,
        filters.dateTo
      );

      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      dedupingInterval: 60000 // Cache de 60s no SWR
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

  // Reset flag quando contas ou filtros de data mudam
  useEffect(() => {
    hasFetchedFromAPI.current = false;
  }, [selectedAccountIds.join(','), filters.dateFrom, filters.dateTo]);

  // 🔧 Atualizar store com dados (paginação frontend)
  useEffect(() => {
    setLoading(isLoading);

    if (data) {
      // Paginação FRONTEND - fatiar os dados completos
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      const paginatedOrders = data.orders.slice(startIndex, endIndex);

      console.log(`✅ Atualizando store - Página ${pagination.currentPage}: ${paginatedOrders.length} de ${data.total} orders`);
      
      // Passar orders da página atual, mas total COMPLETO para paginação correta
      setOrders(paginatedOrders, data.total);
      setPacks(data.packs);
      setShippings(data.shippings);
    }

    if (error) {
      setError(error.message);
    }
  }, [data, isLoading, error, pagination.currentPage, pagination.itemsPerPage, setLoading, setOrders, setPacks, setShippings, setError]);

  return {
    data,
    isLoading,
    error,
    refetch: mutate
  };
};
