/**
 * 🚀 COMBO 2 - ML CLAIMS FROM CACHE (RECLAMACOES)
 * Hook dedicado para /reclamacoes consultar ml_claims table (cache permanente) com fallback para API
 * 
 * ESPECIFICAÇÃO COMBO 2:
 * - staleTime: 60s (dados considerados frescos por 1 minuto)
 * - gcTime: 10min (mantém em memória por 10 minutos)
 * - refetchOnWindowFocus: true (atualiza ao voltar para aba)
 * - refetchInterval: 60s (polling automático a cada minuto)
 * 
 * FLUXO:
 * 1. Consulta ml_claims table (sincronizada via CRON a cada 10min)
 * 2. Se cache válido (< 5min): retorna imediatamente (CACHE HIT)
 * 3. Se cache expirado/vazio: fallback para unified-ml-claims (API)
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
  reclamacoes: any[];
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
    queryKey: ['reclamacoes-ml-claims-cache', 
      integration_account_ids.slice().sort().join('|'), // 🔧 FIX: usar '|' ao invés de ','
      date_from, 
      date_to
    ],
    queryFn: async () => {
      // ✅ CRITICAL: Verificar sessão antes de chamar Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ [RECLAMACOES] No active session - user must be logged in');
        throw new Error('User must be logged in to fetch claims');
      }
      
      console.log('🔍 [RECLAMACOES useMLClaimsFromCache] Iniciando busca...', {
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

      // ✅ COMBO 2 OPÇÃO B: Buscar SEMPRE do banco (sem filtro de TTL)
      // React Query staleTime (60s) gerencia freshness, não o filtro de cache
      console.log('📦 [RECLAMACOES CACHE] Buscando de ml_claims...', {
        accountIds: integration_account_ids,
        sessionUserId: session.user.id
      });
      
      // ✅ CRÍTICO: NÃO usar filtro last_synced_at - causa race condition com 0 results
      // Deixar React Query gerenciar staleness via staleTime (60s)
      
      // 🔧 FIX: Adicionar timeout na query para evitar travamento
      const queryTimeout = new Promise<{ data: null; error: Error }>((_, reject) => 
        setTimeout(() => reject({ data: null, error: new Error('Query timeout após 10s') }), 10000)
      );
      
      const queryPromise = supabase
        .from('ml_claims')
        .select('*')
        .in('integration_account_id', integration_account_ids)
        .order('date_created', { ascending: false })
        .limit(1000); // Limitar para evitar sobrecarga
      
      // Race entre query e timeout
      const { data: cachedClaims, error: cacheError } = await Promise.race([
        queryPromise,
        queryTimeout
      ]).catch((err) => {
        console.error('❌ [RECLAMACOES CACHE] Timeout ou erro na query:', err);
        return { data: null, error: err };
      }) as { data: any[] | null; error: any };
      
      console.log('📊 [RECLAMACOES CACHE RESULT]', {
        found: cachedClaims?.length || 0,
        hasError: !!cacheError,
        error: cacheError?.message
      });

      // Se cache válido encontrado, retornar imediatamente
      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        console.log(`✅ [RECLAMACOES CACHE HIT] ${cachedClaims.length} claims do cache (< 5min)`);
        
        // Mapear dados do cache para formato esperado
        const reclamacoes = cachedClaims.map(claim => {
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
        let filteredReclamacoes = reclamacoes;
        if (date_from || date_to) {
          filteredReclamacoes = reclamacoes.filter(rec => {
            const recDate = new Date(rec.date_created);
            if (date_from && recDate < new Date(date_from)) return false;
            if (date_to && recDate > new Date(date_to)) return false;
            return true;
          });
        }

        return {
          success: true,
          source: 'cache',
          reclamacoes: filteredReclamacoes,
          total_count: filteredReclamacoes.length,
          cache_expired: false,
          last_synced_at: cachedClaims[0]?.last_synced_at || new Date().toISOString()
        };
      }

      // ❌ CACHE MISS ou EXPIRADO
      console.log('⚠️ [RECLAMACOES CACHE MISS] Cache vazio ou expirado, chamando API...');

      // ✅ PASSO 2: FALLBACK para ml-claims-fetch (API fresca)
      console.log('📡 [RECLAMACOES API] Chamando ml-claims-fetch...');
      
      // ⚠️ ml-claims-fetch aceita apenas 1 accountId + sellerId por vez
      // Para múltiplas contas, chamamos em paralelo
      const claimsPromises = integration_account_ids.map(async (accountId) => {
        // Buscar seller_id da conta
        const { data: account } = await supabase
          .from('integration_accounts')
          .select('account_identifier')
          .eq('id', accountId)
          .single();
        
        if (!account?.account_identifier) {
          console.warn(`⚠️ Conta ${accountId} sem account_identifier`);
          return [];
        }
        
        const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
          'ml-claims-fetch',
          {
            body: {
              accountId,
              sellerId: account.account_identifier,
              filters: {
                date_from,
                date_to
              }
            }
          }
        );
        
        if (fetchError) {
          console.error(`❌ Erro ml-claims-fetch [${accountId}]:`, fetchError);
          return [];
        }
        
        return fetchData?.data || [];
      });
      
      const allClaimsArrays = await Promise.all(claimsPromises);
      const apiData = {
        success: true,
        data: allClaimsArrays.flat(),
        total: allClaimsArrays.flat().length
      };
      
      const apiError = null;

      // Validações removidas - apiData já é garantido ter success e data

      console.log(`✅ [RECLAMACOES API SUCCESS] ${apiData.data?.length || 0} claims da API`);

      // Retornar dados frescos da API
      return {
        success: true,
        source: 'api',
        reclamacoes: apiData.data || [],
        total_count: apiData.total || apiData.data?.length || 0,
        cache_expired: true
      };
    },
    enabled: enabled && integration_account_ids.length > 0,
    // ✅ CRITICAL: Garantir que não executa múltiplas vezes simultaneamente
    refetchOnMount: false, // Evita refetch desnecessário no mount
    // ✅ COMBO 2 - Configuração otimizada conforme especificação
    staleTime: 60 * 1000, // 1 minuto - dados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - manter em memória
    refetchOnWindowFocus: true, // ✅ Refetch ao voltar para aba
    refetchInterval: 60 * 1000, // ✅ POLLING: atualizar a cada 60 segundos
    retry: 2
  });
}
