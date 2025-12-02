/**
 * 🚀 COMBO 2 - ML CLAIMS FROM CACHE
 * Hook unificado para consultar ml_claims table (cache permanente) com fallback para API
 * 
 * ESPECIFICAÇÃO COMBO 2:
 * - staleTime: 60s (dados considerados frescos por 1 minuto)
 * - gcTime: 10min (mantém em memória por 10 minutos)
 * - refetchOnWindowFocus: true (atualiza ao voltar para aba)
 * - refetchInterval: 60s (polling automático a cada minuto)
 * 
 * 🎯 SIMPLIFICAÇÃO FASE 2:
 * - ml_claims agora é cache permanente (sem TTL no banco)
 * - React Query gerencia staleness (staleTime: 60s)
 * - ml_claims_cache deletada (duplicação removida)
 * 
 * FLUXO:
 * 1. Consulta ml_claims table (sincronizada via CRON a cada 10min)
 * 2. Se cache válido (< 5min): retorna imediatamente (CACHE HIT)
 * 3. Se cache expirado/vazio: fallback para get-devolucoes-direct (API)
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
  last_synced_at?: string;
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
    // ✅ CORREÇÃO AUDITORIA 1: slice() evita mutação do array original
    queryKey: ['ml-claims-cache', integration_account_ids.slice().sort().join(','), date_from, date_to],
    queryFn: async () => {
      // ✅ CRITICAL: Verificar sessão antes de chamar Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No active session - user must be logged in');
        throw new Error('User must be logged in to fetch claims');
      }
      
      console.log('🔍 [useMLClaimsFromCache] Iniciando busca...', {
        accounts: integration_account_ids.length,
        date_from,
        date_to,
        hasSession: !!session,
        userId: session.user?.id
      });
      
      // Validação de contas
      if (!integration_account_ids || integration_account_ids.length === 0) {
        throw new Error('Nenhuma conta selecionada');
      }

      // ✅ PASSO 1: Tentar buscar do CACHE primeiro
      console.log('📦 [CACHE] Tentando buscar de ml_claims...');
      
      const cacheExpiresAt = new Date();
      cacheExpiresAt.setMinutes(cacheExpiresAt.getMinutes() - CACHE_TTL_MINUTES);
      
      // ✅ SELECT claim_data JSONB para ter dados enriquecidos completos
      const { data: cachedClaims, error: cacheError } = await supabase
        .from('ml_claims')
        .select(`
          id, claim_id, order_id, return_id, status, stage, reason_id,
          date_created, date_closed, last_updated, total_amount, refund_amount,
          currency_id, buyer_id, buyer_nickname, integration_account_id, last_synced_at,
          claim_data
        `)
        .in('integration_account_id', integration_account_ids)
        .gte('last_synced_at', cacheExpiresAt.toISOString()) // Cache válido (< 5 min)
        .order('date_created', { ascending: false });

      // Se cache válido encontrado, retornar imediatamente
      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        console.log(`✅ [CACHE HIT] ${cachedClaims.length} claims do cache (< 5min)`);
        
        // ✅ Mapear dados completos incluindo claim_data enriquecido
        const devolucoes = cachedClaims.map(claim => {
          const claimData = claim.claim_data as any;
          
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
            
            // ✅ CRITICAL: claim_data com enriquecimento completo (65 colunas)
            ...(claimData?.unified || {}),
            
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
          cache_expired: false,
          last_synced_at: cachedClaims[0]?.last_synced_at || new Date().toISOString()
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

      console.log(`✅ [API SUCCESS] ${apiData.data?.length || 0} claims da API`);

      // Retornar dados frescos da API
      return {
        success: true,
        source: 'api',
        devolucoes: apiData.data || [],
        total_count: apiData.total || apiData.data?.length || 0,
        cache_expired: true
      };
    },
    enabled: enabled && integration_account_ids.length > 0,
    // ✅ CORREÇÃO EGRESS 3: Reduzir polling de 60s para 5 minutos
    staleTime: 5 * 60 * 1000, // 5 minutos - reduzir refetches
    gcTime: 15 * 60 * 1000, // 15 minutos - manter em memória por mais tempo
    refetchOnWindowFocus: false, // ❌ DESATIVAR: evita refetch ao voltar para aba
    refetchInterval: 5 * 60 * 1000, // ✅ POLLING: atualizar a cada 5 minutos (60x menos requests)
    retry: 2
  });
}
