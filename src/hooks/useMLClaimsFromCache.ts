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

      // ✅ PASSO 1: Buscar do CACHE ml_claims (sincronizado via CRON)
      // ✅ CORREÇÃO AUDITORIA: Removido filtro gte('last_synced_at') que causava 0 claims
      // React Query gerencia staleness via staleTime, não precisamos filtrar por timestamp
      console.log('📦 [CACHE] Buscando de ml_claims...');
      
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
        .order('date_created', { ascending: false });

      // ✅ VERIFICAR SE CACHE TEM DADOS ÚTEIS (order_items com SKU, etc.)
      // O cache ml_claims tem dados em claim_data.raw - usar isso como indicador de dados válidos
      const cacheHasUsefulData = cachedClaims?.some(claim => {
        const claimData = claim.claim_data as any;
        const rawData = claimData?.raw || claimData || {};
        const orderItem = rawData?.order_data?.order_items?.[0]?.item;
        // Verificar se tem dados de produto
        const hasOrderItems = orderItem?.seller_sku || orderItem?.title;
        const hasPackItems = rawData?.pack_items?.[0]?.seller_sku || rawData?.pack_data?.items?.[0]?.seller_sku;
        // Ou dados básicos do claim
        const hasBasicData = rawData?.dados_claim?.id || rawData?.order_data?.id;
        return hasOrderItems || hasPackItems || hasBasicData;
      });

      // Se cache válido E TEM DADOS ÚTEIS, usar cache
      if (!cacheError && cachedClaims && cachedClaims.length > 0 && cacheHasUsefulData) {
        console.log(`✅ [CACHE HIT] ${cachedClaims.length} claims do cache COM dados úteis (pack_items)`);
        
        // ✅ Mapear dados completos incluindo claim_data enriquecido
        const devolucoes = cachedClaims.map(claim => {
          const claimData = claim.claim_data as any;
          
          // ✅ ESTRUTURA CORRETA: dados estão em claim_data.raw
          const rawData = claimData?.raw || claimData || {};
          const dadosClaim = rawData?.dados_claim || {};
          const orderData = rawData?.order_data || {};
          
          // ✅ PRODUTO - dados vêm de order_items[0].item OU pack_items[0]
          const orderItem = orderData?.order_items?.[0] || {};
          const itemData = orderItem?.item || {};
          const packItem = rawData?.pack_items?.[0] || rawData?.pack_data?.items?.[0] || {};
          
          const compatibilityFields = {
            // Datas
            order_date_created: orderData.date_created || dadosClaim.date_created,
            date_created: dadosClaim.date_created || claim.date_created,
            date_closed: dadosClaim.date_closed || orderData.date_closed || claim.date_closed,
            last_updated: dadosClaim.last_updated || claim.last_updated,
            
            // ✅ PRODUTO - dados vêm de order_items[0].item
            order_item_quantity: orderItem.quantity || packItem.quantity || 1,
            order_item_seller_sku: itemData.seller_sku || packItem.seller_sku || '',
            order_item_title: itemData.title || packItem.title || '',
            order_item_unit_price: orderItem.unit_price || orderItem.full_unit_price || packItem.unit_price || 0,
            
            // Financeiro
            order_total: orderData.paid_amount || orderData.total_amount || 0,
            amount_value: claim.total_amount || claim.refund_amount || 0,
            amount_currency: orderData.currency_id || 'BRL',
            
            // Razões - buscar de reason dentro de dados_claim
            reason_id: dadosClaim.reason?.id || claim.reason_id,
            reason_name: dadosClaim.reason?.name || dadosClaim.reason?.description || '',
            reason_detail: dadosClaim.reason?.detail || '',
            reason_category: dadosClaim.reason?.category || '',
            
            // Resolução
            resolution_benefited: dadosClaim.resolution?.benefited || '',
            resolution_reason: dadosClaim.resolution?.reason || '',
            resolution_date: dadosClaim.date_closed || claim.date_closed,
            
            // Recurso
            resource: dadosClaim.type || 'claim',
            resource_id: String(dadosClaim.id || claim.claim_id),
            
            // Comprador
            buyer_id: orderData.buyer?.id || claim.buyer_id,
            buyer_nickname: orderData.buyer?.nickname || claim.buyer_nickname,
            buyer_name: `${orderData.buyer?.first_name || ''} ${orderData.buyer?.last_name || ''}`.trim(),
            
            // Status
            status: dadosClaim.status || claim.status,
            stage: dadosClaim.stage || claim.stage,
            fulfilled: dadosClaim.fulfilled,
            
            // Metadados adicionais
            site_id: orderData.context?.site || 'MLB',
            order_id: String(orderData.id || claim.order_id),
            pack_id: orderData.pack_id ? String(orderData.pack_id) : null,
            
            // Shipping
            shipping_id: orderData.shipping?.id,
            tracking_number: orderData.shipping?.tracking_number || '',
          };
          
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
            
            // ✅ CRITICAL: spread claim_data DIRETAMENTE (dados enriquecidos)
            ...(claimData || {}),
            
            // ✅ ALIASES: sobrescrever com campos de compatibilidade para colunas da tabela
            ...compatibilityFields,
            
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

      // ❌ CACHE MISS ou SEM DADOS ÚTEIS
      console.log('⚠️ [CACHE MISS] Cache vazio, expirado ou sem dados úteis, chamando API...');

      // ✅ PASSO 2: FALLBACK para get-devolucoes-direct (API fresca COM ENRIQUECIMENTO COMPLETO)
      console.log('📡 [API] Chamando get-devolucoes-direct para dados enriquecidos (reason_name, reason_detail, etc.)...');
      
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
