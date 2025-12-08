/**
 * 📦 VENDAS COM ENVIO - Hook de Dados
 * Busca dados da API com React Query (Combo 2.1 - busca manual)
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { QUERY_KEY_BASE, STALE_TIME_MS, GC_TIME_MS } from '../config';
import type { VendaComEnvio, VendasComEnvioFilters } from '../types';

interface UseVendasComEnvioDataOptions {
  accounts: Array<{ id: string; nome_conta: string }>;
}

export function useVendasComEnvioData({ accounts }: UseVendasComEnvioDataOptions) {
  const queryClient = useQueryClient();
  const previousFiltersRef = useRef<string | null>(null);
  
  const {
    vendas,
    totalCount,
    appliedFilters,
    shouldFetch,
    hasFetchedFromAPI,
    isLoading,
    isFetching,
    error,
    dataSource,
    setVendas,
    setLoading,
    setFetching,
    setError,
    setShouldFetch,
    setHasFetchedFromAPI,
    setDataSource,
  } = useVendasComEnvioStore();

  // Construir query key estável
  const queryKey = [
    QUERY_KEY_BASE,
    appliedFilters.periodo,
    appliedFilters.shippingStatus,
    appliedFilters.currentPage,
    appliedFilters.itemsPerPage,
    appliedFilters.selectedAccounts.slice().sort().join(','),
  ];

  // Função de fetch
  const fetchVendas = useCallback(async (): Promise<{ orders: VendaComEnvio[]; total: number }> => {
    // Validar contas
    const accountsToUse = appliedFilters.selectedAccounts.length > 0
      ? appliedFilters.selectedAccounts
      : accounts.map(a => a.id);

    if (accountsToUse.length === 0) {
      console.log('[useVendasComEnvioData] Sem contas para buscar');
      return { orders: [], total: 0 };
    }

    // Calcular datas
    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setDate(dateFrom.getDate() - appliedFilters.periodo);

    const dateFromISO = dateFrom.toISOString().split('T')[0];
    const dateToISO = now.toISOString().split('T')[0];

    console.log('[useVendasComEnvioData] Buscando vendas:', {
      accounts: accountsToUse.length,
      periodo: appliedFilters.periodo,
      dateFrom: dateFromISO,
      dateTo: dateToISO,
    });

    // Buscar do Supabase (tabela ml_vendas_comenvio)
    let query = supabase
      .from('ml_vendas_comenvio')
      .select('*', { count: 'exact' })
      .in('integration_account_id', accountsToUse)
      .gte('date_created', dateFromISO)
      .lte('date_created', dateToISO)
      .order('date_created', { ascending: false });

    // Filtro de status
    if (appliedFilters.shippingStatus !== 'all') {
      query = query.eq('shipping_status', appliedFilters.shippingStatus);
    }

    // Paginação
    const offset = (appliedFilters.currentPage - 1) * appliedFilters.itemsPerPage;
    query = query.range(offset, offset + appliedFilters.itemsPerPage - 1);

    const { data, error: queryError, count } = await query;

    if (queryError) {
      console.error('[useVendasComEnvioData] Erro na query:', queryError);
      throw new Error(queryError.message);
    }

    // Mapear dados para o tipo correto
    const orders: VendaComEnvio[] = (data || []).map((row: any) => ({
      id: row.id,
      order_id: row.order_id,
      integration_account_id: row.integration_account_id,
      organization_id: row.organization_id,
      account_name: row.account_name,
      order_status: row.order_status,
      shipping_status: row.shipping_status,
      payment_status: row.payment_status,
      date_created: row.date_created,
      date_closed: row.date_closed,
      shipping_deadline: row.shipping_deadline,
      buyer_id: row.buyer_id,
      buyer_nickname: row.buyer_nickname,
      buyer_name: row.buyer_name,
      total_amount: row.total_amount,
      currency_id: row.currency_id,
      shipment_id: row.shipment_id,
      logistic_type: row.logistic_type,
      tracking_number: row.tracking_number,
      carrier: row.carrier,
      items: row.items || [],
      items_count: row.items_count || 0,
      items_quantity: row.items_quantity || 0,
      order_data: row.order_data || {},
      last_synced_at: row.last_synced_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    console.log('[useVendasComEnvioData] Vendas encontradas:', orders.length, 'de', count);

    return { orders, total: count || 0 };
  }, [appliedFilters, accounts]);

  // React Query
  const query = useQuery({
    queryKey,
    queryFn: fetchVendas,
    enabled: shouldFetch,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Sincronizar estado da query com store
  useEffect(() => {
    setFetching(query.isFetching);
  }, [query.isFetching, setFetching]);

  useEffect(() => {
    if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Erro desconhecido');
    }
  }, [query.error, setError]);

  // Quando dados chegam da API, salvar no store
  useEffect(() => {
    if (query.data && shouldFetch) {
      console.log('[useVendasComEnvioData] Dados recebidos, salvando no store');
      setVendas(query.data.orders, query.data.total);
      setHasFetchedFromAPI(true);
      setShouldFetch(false);
      setDataSource('api');
    }
  }, [query.data, shouldFetch, setVendas, setHasFetchedFromAPI, setShouldFetch, setDataSource]);

  // Refetch manual
  const refetch = useCallback(() => {
    setShouldFetch(true);
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BASE] });
  }, [queryClient, setShouldFetch]);

  return {
    // Dados do store (cache-first)
    vendas,
    totalCount,
    
    // Estados
    isLoading: isLoading || query.isLoading,
    isFetching: isFetching || query.isFetching,
    error,
    dataSource,
    
    // Actions
    refetch,
  };
}
