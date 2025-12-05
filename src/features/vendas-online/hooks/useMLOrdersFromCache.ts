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

      console.log('🔍 [useMLOrdersFromCache] Iniciando busca...', {
        accounts: integrationAccountIds.length,
        dateFrom,
        dateTo
      });

      // ✅ VALIDAÇÃO: Verificar contas
      if (!integrationAccountIds || integrationAccountIds.length === 0) {
        throw new Error('Nenhuma conta selecionada');
      }

      // ========== STEP 1: CONSULTAR CACHE ml_orders ==========
      const now = new Date();
      const cacheThresholdMinutes = 15;
      const cacheThreshold = new Date(now.getTime() - cacheThresholdMinutes * 60 * 1000).toISOString();
      
      console.log('📦 [CACHE] Buscando de ml_orders...');
      
      let query = supabase
        .from('ml_orders')
        .select('*')
        .in('integration_account_id', integrationAccountIds)
        .gt('last_synced_at', cacheThreshold)
        .order('last_synced_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('order_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('order_date', dateTo);
      }

      const { data: cachedOrders, error: cacheError } = await query;

      // ✅ CACHE HIT: Se tem dados válidos no cache, retornar
      if (!cacheError && cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ [CACHE HIT] ${cachedOrders.length} orders do cache`);
        
        const orders = cachedOrders.map(row => row.order_data as unknown as MLOrder);
        
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
          last_synced_at: cachedOrders[0].last_synced_at || undefined,
          cache_expired: false,
          packs,
          shippings
        };
      }

      // ========== STEP 2: CACHE MISS - FALLBACK PARA API ==========
      console.log('⚠️ [CACHE MISS] Cache vazio ou expirado, chamando API...');
      console.log('📡 [API] Chamando unified-ml-orders...');
      
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
      
      console.log(`✅ [API] ${orders.length} orders retornados da API`);
      
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
