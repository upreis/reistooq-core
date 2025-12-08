/**
 * 🔄 USE ML ORDERS - UNIFIED HOOK
 * Hook unificado para buscar pedidos do Mercado Livre com cache inteligente
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mlOrdersCache } from '@/lib/ml-cache/frontend-cache';

interface UseMlOrdersParams {
  integration_account_ids: string[];
  date_from?: string;
  date_to?: string;
  enabled?: boolean;
  force_refresh?: boolean;
}

interface MlOrdersResponse {
  success: boolean;
  orders: any[];
  total: number;
  source: 'cache' | 'ml_api';
  cached_at: string;
  expires_at: string;
}

export function useMlOrders({
  integration_account_ids,
  date_from,
  date_to,
  enabled = true,
  force_refresh = false
}: UseMlOrdersParams) {
  const queryClient = useQueryClient();

  // Query key estável
  const queryKey = [
    'ml-orders-unified',
    integration_account_ids.sort().join(','),
    date_from || '',
    date_to || ''
  ];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MlOrdersResponse> => {
      // ✅ CRITICAL: Verificar sessão antes de chamar Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No active session - user must be logged in');
        throw new Error('User must be logged in to fetch orders');
      }
      
      console.log('🔄 useMlOrders - Fetching orders...', {
        accounts: integration_account_ids.length,
        date_from,
        date_to,
        force_refresh,
        hasSession: !!session,
        userId: session.user?.id
      });

      // Se não for force refresh, tentar cache frontend primeiro
      if (!force_refresh) {
        // 1. Tentar memória
        const memoryData = mlOrdersCache.getFromMemory(
          integration_account_ids,
          date_from,
          date_to
        );
        if (memoryData) {
          return {
            success: true,
            orders: memoryData,
            total: memoryData.length,
            source: 'cache',
            cached_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          };
        }

        // 2. Tentar localStorage
        const localStorageData = mlOrdersCache.getFromLocalStorage(
          integration_account_ids,
          date_from,
          date_to
        );
        if (localStorageData) {
          return {
            success: true,
            orders: localStorageData,
            total: localStorageData.length,
            source: 'cache',
            cached_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          };
        }
      }

      // 3. Buscar da Edge Function unified-orders (função compartilhada)
      console.log('📡 Calling unified-orders Edge Function...');
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: {
          integration_account_ids,
          date_from,
          date_to,
          force_refresh
        }
      });

      if (error) {
        console.error('❌ Error fetching ML orders:', error);
        throw error;
      }

      // unified-orders retorna estrutura diferente
      const orders = data?.unified || data?.orders || [];
      const total = data?.paging?.total || orders.length;

      if (!data?.ok && !orders.length) {
        throw new Error(data?.error || 'Failed to fetch ML orders');
      }

      console.log(`✅ Fetched ${orders.length} orders`);

      // Salvar no cache frontend
      if (orders.length > 0) {
        mlOrdersCache.set(
          integration_account_ids,
          orders,
          date_from,
          date_to
        );
      }

      return {
        success: true,
        orders,
        total,
        source: 'ml_api' as const,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };
    },
    enabled: enabled && integration_account_ids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Função para invalidar cache e forçar refresh
  const invalidateCache = () => {
    mlOrdersCache.invalidate(integration_account_ids);
    queryClient.invalidateQueries({ queryKey });
  };

  // Função para limpar cache completamente
  const clearCache = () => {
    mlOrdersCache.clear();
    queryClient.clear();
  };

  return {
    ...query,
    orders: query.data?.orders || [],
    total: query.data?.total || 0,
    source: query.data?.source,
    invalidateCache,
    clearCache
  };
}
