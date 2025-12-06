/**
 * 🚀 USE ML ORDERS FROM CACHE
 * Hook unificado para consultar ml_orders_cache table (cache permanente)
 * 
 * PADRÃO COMBO 2.1 (IGUAL /reclamacoes useMLClaimsFromCache):
 * - Consulta APENAS cache primeiro (ml_orders_cache)
 * - React Query gerencia staleness (staleTime: 60s)
 * - NÃO faz fallback para API que pode falhar
 * 
 * 🔧 CORREÇÃO: Remover fallback para Edge Function que está falhando
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
    // ✅ CORREÇÃO: queryKey estável com slice().sort() igual /reclamacoes
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

      console.log('🔍 [useMLOrdersFromCache] Buscando do cache ml_orders_cache...', {
        accounts: integrationAccountIds.length,
        dateFrom,
        dateTo
      });

      // ========== PASSO 1: BUSCAR DO CACHE ml_orders_cache ==========
      // ✅ PADRÃO /reclamacoes: buscar direto do cache sincronizado via CRON
      const { data: cachedOrders, error: cacheError } = await supabase
        .from('ml_orders_cache')
        .select('*')
        .in('integration_account_id', integrationAccountIds)
        .order('cached_at', { ascending: false });

      if (cacheError) {
        console.error('❌ [CACHE ERROR]', cacheError);
        throw new Error(`Erro ao buscar cache: ${cacheError.message}`);
      }

      // ✅ CACHE HIT: Se tem dados no cache, usar independente de TTL
      // React Query gerencia staleness via staleTime, não precisamos verificar TTL
      if (cachedOrders && cachedOrders.length > 0) {
        console.log(`✅ [CACHE HIT] ${cachedOrders.length} orders do cache`);
        
        // Mapear dados do cache
        let orders = cachedOrders.map(row => row.order_data as unknown as MLOrder);
        
        // Aplicar filtro de data localmente
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
          last_synced_at: cachedOrders[0]?.cached_at || undefined,
          cache_expired: false,
          packs,
          shippings
        };
      }

      // ========== CACHE MISS: Retornar vazio ==========
      // ✅ PADRÃO /reclamacoes: não fazer fallback para API que pode falhar
      // O CRON job é responsável por popular o cache
      console.log('⚠️ [CACHE MISS] Nenhum dado no cache ml_orders_cache');
      console.log('💡 Aguarde o CRON job sincronizar os dados ou verifique a integração ML');

      return {
        orders: [],
        total: 0,
        source: 'cache',
        cache_expired: true,
        packs: {},
        shippings: {}
      };
    },
    enabled: enabled && integrationAccountIds.length > 0,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // 5 minutos polling
    retry: 2
  });
};