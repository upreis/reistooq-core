/**
 * 🚀 USE ML ORDERS FROM CACHE - COMBO 2.1
 * Hook para consultar ml_orders table (cache via CRON sync)
 * 
 * ✅ COMBO 2.1:
 * - CRON job sincroniza TODOS os pedidos a cada 1 hora
 * - Frontend lê DIRETAMENTE de ml_orders table (instantâneo)
 * - Sem filtro de threshold - pega todos os dados sincronizados
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
}

export const useMLOrdersFromCache = ({
  integrationAccountIds,
  dateFrom,
  dateTo,
  enabled = false // 🎯 COMBO 2.1: Default FALSE - só busca após clique manual
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

      // Validação
      if (!integrationAccountIds || integrationAccountIds.length === 0) {
        console.log('⚠️ [useMLOrdersFromCache] Nenhuma conta selecionada');
        return { orders: [], total: 0, source: 'cache' };
      }

      // Query direta na ml_orders - sem filtro de threshold!
      // CRON job já sincronizou todos os pedidos, apenas filtrar por data/conta
      let query = supabase
        .from('ml_orders')
        .select('*')
        .in('integration_account_id', integrationAccountIds)
        .order('date_created', { ascending: false });

      // Aplicar filtros de data
      if (dateFrom) {
        query = query.gte('order_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('order_date', dateTo);
      }

      const { data: cachedOrders, error } = await query;

      if (error) {
        console.error('❌ [useMLOrdersFromCache] Erro ao buscar ml_orders:', error);
        return { orders: [], total: 0, source: 'cache' };
      }

      if (cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ [useMLOrdersFromCache] ${cachedOrders.length} pedidos encontrados`);
        
        const orders = cachedOrders.map(row => row.order_data as unknown as MLOrder);
        
        return {
          orders,
          total: orders.length,
          source: 'cache',
          last_synced_at: cachedOrders[0].last_synced_at || undefined
        };
      }

      console.log('⚠️ [useMLOrdersFromCache] Nenhum pedido encontrado no período');
      return { orders: [], total: 0, source: 'cache' };
    },
    enabled: enabled && integrationAccountIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1
  });
};
