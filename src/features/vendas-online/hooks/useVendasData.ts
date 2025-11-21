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

  // ✅ Usar unified-orders como a página /pedidos faz
  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: {
      integration_account_id: params.integrationAccountId, // ✅ SINGULAR, não array!
      status: params.status,
      search: params.search,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      offset: params.offset,
      limit: params.limit,
      enrich: true,
      include_shipping: true
    }
  });

  if (error) {
    console.error('[useVendasData] Erro ao buscar orders:', error);
    throw error;
  }

  console.log('[useVendasData] Resposta unified-orders:', data?.results?.length || 0);

  // ✅ Adaptar resposta do unified-orders (retorna results, não orders)
  const orders = data?.results || [];
  const total = data?.paging?.total || 0;
  
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

  // ✅ CONTROLE MANUAL: só buscar quando shouldFetch = true E há contas selecionadas
  const swrKey = shouldFetch && selectedAccountIds.length > 0
    ? [
        'vendas-ml',
        selectedAccountIds.join(','), // ✅ Múltiplas contas
        filters.search,
        filters.status.join(','),
        filters.dateFrom,
        filters.dateTo,
        pagination.currentPage,
        pagination.itemsPerPage
      ]
    : null;

  // Fetch com SWR (NÃO automático, depende de shouldFetch)
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      // ✅ Buscar de TODAS as contas selecionadas (similar a /reclamacoes)
      const allOrders: any[] = [];
      
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
      }
      
      return {
        orders: allOrders,
        total: allOrders.length,
        packs: {},
        shippings: {}
      };
    },
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
    refetch: mutate // Usar refetch para busca manual
  };
};
