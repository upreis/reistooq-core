/**
 * 📦 VENDAS COM ENVIO - Hook de Dados
 * 🚀 COMBO 2.1: Usa Edge Function get-vendas-comenvio + tabela ml_vendas_comenvio
 * ✅ Padrão idêntico a /reclamacoes (useMLClaimsFromCache)
 * ✅ Cache local para restauração instantânea
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { useVendasComEnvioLocalCache } from './useVendasComEnvioLocalCache';
import { QUERY_KEY_BASE, STALE_TIME_MS, GC_TIME_MS } from '../config';
import type { VendaComEnvio } from '../types';

interface UseVendasComEnvioDataOptions {
  accounts: Array<{ id: string; nome_conta: string }>;
}

export function useVendasComEnvioData({ accounts }: UseVendasComEnvioDataOptions) {
  const hasFetchedFromAPIRef = useRef(false);
  const previousFiltersRef = useRef<string | null>(null);
  const hasRestoredFromCacheRef = useRef(false);
  
  // 🚀 COMBO 2.1: Hook de cache local
  const localCache = useVendasComEnvioLocalCache();
  
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

  // 🚀 COMBO 2.1: Restaurar do cache local no mount (uma vez)
  useEffect(() => {
    if (hasRestoredFromCacheRef.current) return;
    if (vendas.length > 0) return; // Já tem dados
    
    const cachedData = localCache.getValidCacheData(appliedFilters);
    if (cachedData && cachedData.data.length > 0) {
      console.log('[useVendasComEnvioData] 🔄 Restaurando do cache local:', cachedData.data.length, 'vendas');
      setVendas(cachedData.data, cachedData.totalCount);
      setDataSource('cache');
      hasRestoredFromCacheRef.current = true;
    }
  }, [appliedFilters, localCache, vendas.length, setVendas, setDataSource]);

  // Construir query key estável
  const queryKey = [
    QUERY_KEY_BASE,
    appliedFilters.startDate?.toISOString() || '',
    appliedFilters.endDate?.toISOString() || '',
    appliedFilters.shippingStatus,
    appliedFilters.currentPage,
    appliedFilters.itemsPerPage,
    appliedFilters.selectedAccounts.slice().sort().join(','),
  ];

  // 🚀 Função de fetch - usa Edge Function get-vendas-comenvio (padrão /reclamacoes)
  const fetchVendas = useCallback(async (): Promise<{ orders: VendaComEnvio[]; total: number }> => {
    // Validar contas
    const accountsToUse = appliedFilters.selectedAccounts.length > 0
      ? appliedFilters.selectedAccounts
      : accounts.map(a => a.id);

    if (accountsToUse.length === 0) {
      console.log('[useVendasComEnvioData] Sem contas para buscar');
      return { orders: [], total: 0 };
    }

    // Usar datas do filtro (timezone São Paulo) - evita bug do toISOString() virar "dia seguinte" em UTC
    const dateFromISO = appliedFilters.startDate
      ? formatInTimeZone(appliedFilters.startDate, 'America/Sao_Paulo', 'yyyy-MM-dd')
      : formatInTimeZone(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'America/Sao_Paulo', 'yyyy-MM-dd');

    const dateToISO = appliedFilters.endDate
      ? formatInTimeZone(appliedFilters.endDate, 'America/Sao_Paulo', 'yyyy-MM-dd')
      : formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');

    console.log('[useVendasComEnvioData] 🚀 Chamando get-vendas-comenvio:', {
      accounts: accountsToUse.length,
      dateFrom: dateFromISO,
      dateTo: dateToISO,
      shippingStatus: appliedFilters.shippingStatus,
    });

    // 🔧 Chamar Edge Function (padrão get-devolucoes-direct)
    // 🔄 NÃO usar force_refresh para permitir uso do cache que tem dados históricos
    const { data: response, error: invokeError } = await supabase.functions.invoke('get-vendas-comenvio', {
      body: {
        integration_account_ids: accountsToUse,
        date_from: dateFromISO,
        date_to: dateToISO,
        shipping_status: appliedFilters.shippingStatus !== 'all' ? appliedFilters.shippingStatus : undefined,
        force_refresh: false, // Usar cache primeiro (tem dados históricos)
      }
    });

    if (invokeError) {
      console.error('[useVendasComEnvioData] ❌ Erro na Edge Function:', invokeError);
      throw new Error(invokeError.message);
    }

    if (!response?.success) {
      console.error('[useVendasComEnvioData] ❌ Edge Function retornou erro:', response?.error);
      throw new Error(response?.error || 'Erro ao buscar vendas');
    }

    const rawData = response?.data || [];
    console.log('[useVendasComEnvioData] ✅ Dados recebidos:', rawData.length, 'registros, source:', response?.source);

    // Mapear dados para VendaComEnvio
    const orders: VendaComEnvio[] = rawData.map((row: any) => {
      // Dados completos do pedido estão em order_data JSONB
      const orderData = row.order_data || {};
      const shipping = orderData.shipping || {};
      const buyer = orderData.buyer || {};
      const items = orderData.order_items || row.items || [];

      return {
        id: row.id || row.order_id,
        order_id: row.order_id || '',
        integration_account_id: row.integration_account_id,
        organization_id: row.organization_id,
        account_name: row.account_name || null,
        
        // Status
        order_status: row.status || row.order_status || orderData.status || 'unknown',
        shipping_status: row.shipping_status || shipping.status || 'unknown',
        payment_status: row.payment_status || orderData.payments?.[0]?.status || 'unknown',
        
        // Datas
        date_created: row.date_created || '',
        date_closed: row.date_closed || null,
        shipping_deadline: row.shipping_deadline || shipping.lead_time?.shipping_deadline || null,
        
        // Comprador
        buyer_id: row.buyer_id || buyer.id || null,
        buyer_nickname: row.buyer_nickname || buyer.nickname || null,
        buyer_name: row.buyer_name || 
          (row.buyer_first_name && row.buyer_last_name
            ? `${row.buyer_first_name} ${row.buyer_last_name}`
            : [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || null),
        
        // Valores
        total_amount: Number(row.total_amount) || orderData.total_amount || 0,
        currency_id: row.currency_id || 'BRL',
        
        // Envio
        shipment_id: row.shipping_id || row.shipment_id || null,
        logistic_type: row.logistic_type || shipping.logistic_type || null,
        tracking_number: row.tracking_number || shipping.tracking_number || null,
        carrier: row.carrier || shipping.carrier_info?.name || null,
        
        // Itens
        items: items.length > 0 
          ? items.map((item: any) => ({
              id: item.item?.id || item.id || '',
              title: item.item?.title || item.title || '',
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
              sku: item.item?.seller_sku || item.sku || null,
              variation_id: item.item?.variation_id?.toString() || item.variation_id || null,
              variation_attributes: (item.item?.variation_attributes || item.variation_attributes || []).map((attr: any) => ({
                name: attr.name,
                value: attr.value_name || attr.value
              }))
            }))
          : [{
              id: row.item_id || '',
              title: row.item_title || '',
              quantity: row.item_quantity || 0,
              unit_price: 0,
              sku: row.item_sku || null,
              variation_id: null,
              variation_attributes: []
            }],
        items_count: row.items_count || items.length || 1,
        items_quantity: row.items_quantity || 
          (items.length > 0 
            ? items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
            : (row.item_quantity || 0)),
        
        // Dados completos
        order_data: orderData,
        
        // Metadados
        last_synced_at: row.last_synced_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    });

    console.log('[useVendasComEnvioData] ✅ Vendas mapeadas (antes filtro):', orders.length);

    // 🔧 FILTRO CRÍTICO: Apenas pedidos cancelados COM código de rastreio
    const filteredOrders = orders.filter(order => {
      const isCancelled = order.order_status === 'cancelled' || 
                          order.shipping_status === 'cancelled';
      const hasTrackingNumber = !!order.tracking_number && order.tracking_number.trim() !== '';
      
      return isCancelled && hasTrackingNumber;
    });

    console.log('[useVendasComEnvioData] ✅ Vendas após filtro (cancelados + rastreio):', filteredOrders.length);

    return { orders: filteredOrders, total: filteredOrders.length };
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

  // Quando dados chegam da API, salvar no store E no cache local
  useEffect(() => {
    if (query.data && shouldFetch) {
      console.log('[useVendasComEnvioData] Dados recebidos, salvando no store:', query.data.orders.length);
      setVendas(query.data.orders, query.data.total);
      setHasFetchedFromAPI(true);
      setShouldFetch(false);
      setDataSource('api');
      hasFetchedFromAPIRef.current = true;
      
      // 🚀 COMBO 2.1: Salvar no cache local para restauração instantânea
      if (query.data.orders.length > 0) {
        localCache.saveToCache(query.data.orders, appliedFilters, query.data.total);
      }
    }
  }, [query.data, shouldFetch, setVendas, setHasFetchedFromAPI, setShouldFetch, setDataSource, appliedFilters, localCache]);

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
    
    // 🚀 COMBO 2.1: Info do cache
    cacheAgeMinutes: localCache.cacheAgeMinutes,
    hasCachedData: localCache.hasCachedData,
    
    // Actions
    refetch,
  };
}