/**
 * 🔄 HOOK - ML Claims com Cache-First Strategy
 * Implementa Combo 2: prioriza cache ml_claims, fallback para API
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseMLClaimsFromCacheParams {
  integration_account_ids: string[];
  date_from?: string;
  date_to?: string;
  enabled?: boolean;
}

interface CachedClaimsResponse {
  success: boolean;
  source: 'cache' | 'api';
  devolucoes: any[];
  total_count: number;
  cache_expired?: boolean;
  error?: string;
}

const CACHE_TTL_MINUTES = 5; // Cache válido por 5 minutos

export function useMLClaimsFromCache({
  integration_account_ids,
  date_from,
  date_to,
  enabled = true
}: UseMLClaimsFromCacheParams) {
  
  return useQuery<CachedClaimsResponse>({
    queryKey: ['ml-claims-cache', integration_account_ids, date_from, date_to],
    queryFn: async () => {
      console.log('🔍 [useMLClaimsFromCache] Iniciando busca...');
      
      // Validação de contas
      if (!integration_account_ids || integration_account_ids.length === 0) {
        throw new Error('Nenhuma conta selecionada');
      }

      // ✅ PASSO 1: Tentar buscar do CACHE primeiro
      console.log('📦 [CACHE] Tentando buscar de ml_claims...');
      
      const cacheExpiresAt = new Date();
      cacheExpiresAt.setMinutes(cacheExpiresAt.getMinutes() - CACHE_TTL_MINUTES);
      
      const { data: cachedClaims, error: cacheError } = await supabase
        .from('ml_claims')
        .select('*')
        .in('integration_account_id', integration_account_ids)
        .gte('last_synced_at', cacheExpiresAt.toISOString()) // Cache válido (< 5 min)
        .order('date_created', { ascending: false });

      // Se cache válido encontrado, retornar imediatamente
      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        console.log(`✅ [CACHE HIT] ${cachedClaims.length} claims do cache (< 5min)`);
        
        // Mapear dados do cache para formato esperado
        const devolucoes = cachedClaims.map(claim => {
          // Parse claim_data JSONB com validação
          const claimDataObj = typeof claim.claim_data === 'object' && claim.claim_data !== null
            ? claim.claim_data
            : {};
          
          return {
            // Dados básicos do cache
            id: claim.id,
            claim_id: claim.claim_id,
            order_id: claim.order_id,
            return_id: claim.return_id,
            status: claim.status,
            stage: claim.stage,
            reason_id: claim.reason_id,
            date_created: claim.date_created,
            date_closed: claim.date_closed,
            last_updated: claim.last_updated,
            total_amount: claim.total_amount,
            refund_amount: claim.refund_amount,
            currency_id: claim.currency_id,
            buyer_id: claim.buyer_id,
            buyer_nickname: claim.buyer_nickname,
            
            // Dados completos enriquecidos do JSONB
            ...claimDataObj,
            
            // Metadata
            integration_account_id: claim.integration_account_id,
            last_synced_at: claim.last_synced_at,
            _cache_source: 'ml_claims'
          };
        });

        // Aplicar filtro de data localmente se especificado
        let filteredDevolucoes = devolucoes;
        if (date_from || date_to) {
          filteredDevolucoes = devolucoes.filter(dev => {
            const devDate = new Date(dev.date_created);
            if (date_from && devDate < new Date(date_from)) return false;
            if (date_to && devDate > new Date(date_to)) return false;
            return true;
          });
        }

        return {
          success: true,
          source: 'cache',
          devolucoes: filteredDevolucoes,
          total_count: filteredDevolucoes.length,
          cache_expired: false
        };
      }

      // ❌ CACHE MISS ou EXPIRADO
      console.log('⚠️ [CACHE MISS] Cache vazio ou expirado, chamando API...');

      // ✅ PASSO 2: FALLBACK para get-devolucoes-direct (API fresca)
      console.log('📡 [API] Chamando get-devolucoes-direct...');
      
      const { data: apiData, error: apiError } = await supabase.functions.invoke(
        'get-devolucoes-direct',
        {
          body: {
            integration_account_ids,
            date_from,
            date_to
          }
        }
      );

      if (apiError) {
        console.error('❌ [API ERROR]', apiError);
        throw new Error(`Erro ao buscar claims: ${apiError.message}`);
      }

      if (!apiData?.success) {
        throw new Error(apiData?.error || 'Erro desconhecido ao buscar claims');
      }

      console.log(`✅ [API SUCCESS] ${apiData.devolucoes?.length || 0} claims da API`);

      // Retornar dados frescos da API
      return {
        success: true,
        source: 'api',
        devolucoes: apiData.devolucoes || [],
        total_count: apiData.total_count || apiData.devolucoes?.length || 0,
        cache_expired: true
      };
    },
    enabled: enabled && integration_account_ids.length > 0,
    staleTime: CACHE_TTL_MINUTES * 60 * 1000, // React Query considera stale após 5min
    gcTime: 10 * 60 * 1000, // Garbage collect após 10min
    refetchOnWindowFocus: false,
    retry: 2
  });
}
