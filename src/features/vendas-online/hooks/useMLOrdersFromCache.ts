/**
 * 🚀 USE ML ORDERS FROM CACHE
 * Hook unificado para consultar ml_orders table (cache) com fallback para API
 * 
 * PADRÃO COMBO 2.1 (igual useMLClaimsFromCache):
 * - Consulta cache primeiro
 * - Se cache MISS/expirado, chama Edge Function unified-ml-orders
 * - enabled: boolean para controle manual de busca
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
  packs?: Record<string, any>;
  shippings?: Record<string, any>;
}

export const useMLOrdersFromCache = ({
  integrationAccountIds,
  dateFrom,
  dateTo,
  enabled = false
}: UseMLOrdersFromCacheParams) => {
  
  return useQuery({
    queryKey: [
      'ml-orders-cache',
      integrationAccountIds.slice().sort().join(','),
      dateFrom || '',
      dateTo || ''
    ],
    queryFn: async (): Promise<CachedOrdersResponse> => {
      // ✅ VALIDAÇÃO: Verificar sessão
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ [useMLOrdersFromCache] Usuário não autenticado');
        throw new Error('Usuário deve estar logado para buscar vendas');
      }

      // ✅ VALIDAÇÃO: Verificar contas
      if (!integrationAccountIds || integrationAccountIds.length === 0) {
        throw new Error('Nenhuma conta selecionada');
      }

      // ========== STEP 1: CONSULTAR CACHE ml_orders_cache (tem dados enriquecidos) ==========
      
      // Primeiro tentar ml_orders_cache (dados mais recentes e enriquecidos)
      let query = supabase
        .from('ml_orders_cache')
        .select('*')
        .in('integration_account_id', integrationAccountIds)
        .gt('ttl_expires_at', new Date().toISOString())
        .order('cached_at', { ascending: false });

      const { data: cachedOrders, error: cacheError } = await query;

      // ✅ CACHE HIT: Se tem dados válidos no cache enriquecido, retornar
      if (!cacheError && cachedOrders && cachedOrders.length > 0) {
        // Filtrar por data se necessário
        let orders = cachedOrders.map(row => row.order_data as unknown as MLOrder);
        
        if (dateFrom || dateTo) {
          orders = orders.filter((order: any) => {
            const orderDate = new Date(order.date_created || order.data_criacao);
            if (dateFrom && orderDate < new Date(dateFrom)) return false;
            if (dateTo && orderDate > new Date(dateTo)) return false;
            return true;
          });
        }
        
        // Construir packs e shippings
        const packs: Record<string, any> = {};
        const shippings: Record<string, any> = {};
        
        orders.forEach((order: any) => {
          if (order.pack_id && !packs[order.pack_id]) {
            packs[order.pack_id] = { id: order.pack_id, orders: [] };
          }
          if (order.pack_id) {
            packs[order.pack_id].orders.push(order.id);
          }
          if (order.shipping?.id && !shippings[order.shipping.id]) {
            shippings[order.shipping.id] = order.shipping;
          }
        });
        
        return {
          orders,
          total: orders.length,
          source: 'cache',
          last_synced_at: cachedOrders[0].cached_at || undefined,
          cache_expired: false,
          packs,
          shippings
        };
      }

      // ========== STEP 2: CACHE MISS - FALLBACK PARA API ==========
      
      const { data: apiData, error: apiError } = await supabase.functions.invoke(
        'unified-ml-orders',
        {
          body: {
            integration_account_ids: integrationAccountIds,
            date_from: dateFrom,
            date_to: dateTo,
            force_refresh: false,
            offset: 0,
            limit: 500
          }
        }
      );

      if (apiError) {
        console.error('❌ [API ERROR]', apiError);
        throw new Error(`Erro ao buscar vendas: ${apiError.message}`);
      }

      if (!apiData) {
        console.error('❌ [API] Resposta vazia');
        throw new Error('Resposta vazia da API');
      }

      const orders = apiData.orders || [];
      const total = apiData.total || apiData.paging?.total || orders.length;
      
      // Construir packs e shippings
      const packs: Record<string, any> = {};
      const shippings: Record<string, any> = {};
      
      orders.forEach((order: any) => {
        if (order.pack_id && !packs[order.pack_id]) {
          packs[order.pack_id] = { id: order.pack_id, orders: [] };
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
        source: 'api',
        cache_expired: true,
        packs,
        shippings
      };
    },
    enabled: enabled && integrationAccountIds.length > 0,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 2
  });
};
