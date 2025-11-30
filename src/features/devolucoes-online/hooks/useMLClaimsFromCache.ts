/**
 * 🚀 USE ML CLAIMS FROM CACHE
 * Hook para consultar ml_claims table primeiro (cache instantâneo)
 * Fallback para API ML se cache expirado
 * 
 * COMBO 2 - FASE C para /devolucoesdevenda
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseMLClaimsFromCacheParams {
  integrationAccountIds: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  enabled?: boolean;
}

interface CachedClaimsResponse {
  claims: any[];
  total: number;
  source: 'cache' | 'api';
  last_synced_at?: string;
  cache_expired: boolean;
}

export const useMLClaimsFromCache = ({
  integrationAccountIds,
  dateFrom,
  dateTo,
  enabled = true
}: UseMLClaimsFromCacheParams) => {
  
  return useQuery({
    queryKey: [
      'ml-claims-cache',
      integrationAccountIds.sort().join(','),
      dateFrom || '',
      dateTo || ''
    ],
    queryFn: async (): Promise<CachedClaimsResponse> => {
      console.log('🔍 [useMLClaimsFromCache] Buscando de ml_claims table...', {
        accounts: integrationAccountIds.length,
        dateFrom,
        dateTo
      });

      // STEP 1: Consultar ml_claims table
      const now = new Date();
      const cacheThresholdMinutes = 15; // Sincronizado com CRON de 10min + margem
      const cacheThreshold = new Date(now.getTime() - cacheThresholdMinutes * 60 * 1000).toISOString();
      
      let query = supabase
        .from('ml_claims')
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

      const { data: cachedClaims, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar ml_claims:', error);
        return {
          claims: [],
          total: 0,
          source: 'api',
          cache_expired: true
        };
      }

      // STEP 2: Se tem dados válidos no cache, retornar
      if (cachedClaims && cachedClaims.length > 0) {
        console.log(`✅ [useMLClaimsFromCache] Cache HIT: ${cachedClaims.length} claims encontrados`);
        
        const claims = cachedClaims.map(row => row.claim_data);
        
        return {
          claims,
          total: claims.length,
          source: 'cache',
          last_synced_at: cachedClaims[0].last_synced_at || undefined,
          cache_expired: false
        };
      }

      // STEP 3: Cache MISS ou expirado
      console.log('⚠️ [useMLClaimsFromCache] Cache MISS ou expirado');
      return {
        claims: [],
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
