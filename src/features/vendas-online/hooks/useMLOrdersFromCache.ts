/**
 * 🚀 USE ML ORDERS FROM CACHE
 * Hook para consultar ml_orders table primeiro (cache instantâneo)
 * Fallback para API ML se cache expirado
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MLOrder } from '../types/vendas.types';

interface UseMLOrdersFromCacheParams {
  integrationAccountIds: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  enabled?: boolean;
}

interface CachedOrdersResponse {
  orders: MLOrder[];
  total: number;
  source: 'cache' | 'api';
  last_synced_at?: string;
  cache_expired: boolean;
}

export const useMLOrdersFromCache = ({
  integrationAccountIds,
  dateFrom,
  dateTo,
  enabled = true
}: UseMLOrdersFromCacheParams) => {
  
  return useQuery({
    queryKey: [
      'ml-orders-cache',
      integrationAccountIds.sort().join(','),
      dateFrom || '',
      dateTo || ''
    ],
    queryFn: async (): Promise<CachedOrdersResponse> => {
      console.log('🔍 [useMLOrdersFromCache] Buscando de ml_orders table...', {
        accounts: integrationAccountIds.length,
        dateFrom,
        dateTo
      });

      // STEP 1: Consultar ml_orders table
      const now = new Date();
      const cacheThresholdMinutes = 10; // Cache válido por 10 minutos
      const cacheThreshold = new Date(now.getTime() - cacheThresholdMinutes * 60 * 1000).toISOString();
      
      let query = supabase
        .from('ml_orders')
        .select('*')
        .in('integration_account_id', integrationAccountIds)
        .gt('last_synced_at', cacheThreshold) // Apenas registros sincronizados recentemente
        .order('last_synced_at', { ascending: false });

      // Aplicar filtros de data se fornecidos
      if (dateFrom) {
        query = query.gte('date_created', dateFrom);
      }
      if (dateTo) {
        query = query.lte('date_created', dateTo);
      }

      const { data: cachedOrders, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar ml_orders:', error);
        return {
          orders: [],
          total: 0,
          source: 'api',
          cache_expired: true
        };
      }

      // STEP 2: Se tem dados válidos no cache, retornar
      if (cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ [useMLOrdersFromCache] Cache HIT: ${cachedOrders.length} orders encontrados`);
        
        const orders = cachedOrders.map(row => row.order_data as unknown as MLOrder);
        
        return {
          orders,
          total: orders.length,
          source: 'cache',
          last_synced_at: cachedOrders[0].last_synced_at || undefined,
          cache_expired: false
        };
      }

      // STEP 3: Cache MISS ou expirado
      console.log('⚠️ [useMLOrdersFromCache] Cache MISS ou expirado');
      return {
        orders: [],
        total: 0,
        source: 'api',
        cache_expired: true
      };
    },
    enabled: enabled && integrationAccountIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1
  });
};
