/**
 * 📦 VENDAS COM ENVIO - Hook de Dados
 * 🚀 COMBO 2.1: Usa mesma infraestrutura de /vendas-canceladas (ml_orders + unified-ml-orders)
 * Filtra por shipping_status: ready_to_ship, pending, handling
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { QUERY_KEY_BASE, STALE_TIME_MS, GC_TIME_MS } from '../config';
import type { VendaComEnvio } from '../types';

// Status que indicam "com envio pendente"
const SHIPPING_STATUS_WITH_PENDING = ['ready_to_ship', 'pending', 'handling'];

interface UseVendasComEnvioDataOptions {
  accounts: Array<{ id: string; nome_conta: string }>;
}

export function useVendasComEnvioData({ accounts }: UseVendasComEnvioDataOptions) {
  const hasFetchedFromAPIRef = useRef(false);
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

  // Função de fetch - usa ml_orders (mesma tabela de /vendas-canceladas)
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

    console.log('[useVendasComEnvioData] Buscando vendas de ml_orders:', {
      accounts: accountsToUse.length,
      periodo: appliedFilters.periodo,
      dateFrom: dateFromISO,
      dateTo: dateToISO,
      shippingStatus: SHIPPING_STATUS_WITH_PENDING,
    });

    // Paginação
    const offset = (appliedFilters.currentPage - 1) * appliedFilters.itemsPerPage;
    
    // Determinar status a filtrar
    const statusToFilter = appliedFilters.shippingStatus !== 'all' 
      ? [appliedFilters.shippingStatus] 
      : SHIPPING_STATUS_WITH_PENDING;

    // 🔧 BUSCAR DE ml_orders (mesma tabela de /vendas-canceladas)
    // Usando fetch direto para evitar erro TypeScript de type instantiation
    const { data, error: queryError, count } = await (supabase
      .from('ml_orders')
      .select('*', { count: 'exact' }) as any)
      .in('integration_account_id', accountsToUse)
      .gte('order_date', dateFromISO)
      .lte('order_date', dateToISO)
      .in('shipping_status', statusToFilter)
      .order('order_date', { ascending: false })
      .range(offset, offset + appliedFilters.itemsPerPage - 1);

    if (queryError) {
      console.error('[useVendasComEnvioData] Erro na query:', queryError);
      throw new Error(queryError.message);
    }

    console.log('[useVendasComEnvioData] Dados brutos:', data?.length, 'registros');

    // Mapear dados de ml_orders para VendaComEnvio
    const orders: VendaComEnvio[] = (data || []).map((row: any) => {
      // ml_orders armazena order_data como JSONB com dados completos do ML
      const orderData = row.order_data || {};
      const shipping = orderData.shipping || {};
      const buyer = orderData.buyer || {};
      const items = orderData.order_items || [];

      return {
        id: row.id,
        order_id: row.order_id?.toString() || orderData.id?.toString() || '',
        integration_account_id: row.integration_account_id,
        organization_id: row.organization_id,
        account_name: row.account_name || null,
        
        // Status
        order_status: row.order_status || orderData.status || 'unknown',
        shipping_status: row.shipping_status || shipping.status || 'unknown',
        payment_status: orderData.payments?.[0]?.status || 'unknown',
        
        // Datas
        date_created: row.order_date || orderData.date_created || '',
        date_closed: orderData.date_closed || null,
        shipping_deadline: shipping.lead_time?.shipping_deadline || null,
        
        // Comprador
        buyer_id: buyer.id || null,
        buyer_nickname: buyer.nickname || null,
        buyer_name: [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || null,
        
        // Valores
        total_amount: row.total_amount || orderData.total_amount || 0,
        currency_id: orderData.currency_id || 'BRL',
        
        // Envio
        shipment_id: shipping.id?.toString() || null,
        logistic_type: shipping.logistic_type || null,
        tracking_number: shipping.tracking_number || null,
        carrier: shipping.carrier_info?.name || null,
        
        // Itens
        items: items.map((item: any) => ({
          id: item.item?.id || '',
          title: item.item?.title || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          sku: item.item?.seller_sku || null,
          variation_id: item.item?.variation_id?.toString() || null,
          variation_attributes: (item.item?.variation_attributes || []).map((attr: any) => ({
            name: attr.name,
            value: attr.value_name
          }))
        })),
        items_count: items.length,
        items_quantity: items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        
        // Dados completos
        order_data: orderData,
        
        // Metadados
        last_synced_at: row.last_synced_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    });

    console.log('[useVendasComEnvioData] Vendas mapeadas:', orders.length, 'de', count);

    return { orders, total: count || 0 };
  }, [appliedFilters, accounts]);

  // React Query com Combo 2.1 (busca manual)
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
      console.log('[useVendasComEnvioData] Dados recebidos, salvando no store:', query.data.orders.length);
      setVendas(query.data.orders, query.data.total);
      setHasFetchedFromAPI(true);
      setShouldFetch(false);
      setDataSource('api');
      hasFetchedFromAPIRef.current = true;
    }
  }, [query.data, shouldFetch, setVendas, setHasFetchedFromAPI, setShouldFetch, setDataSource]);

  // Refetch manual
  const refetch = useCallback(() => {
    setShouldFetch(true);
  }, [setShouldFetch]);

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