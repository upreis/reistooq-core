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
          
          // ✅ ESTRUTURA CORRETA: dados estão DIRETAMENTE em claim_data (não em .raw)
          // Ex: claimData.pack_items, claimData.comprador_nome_completo, etc.
          
          // ✅ PRODUTO - dados vêm de pack_items[0] OU pack_data.items[0] DIRETAMENTE
          const packItem = claimData?.pack_items?.[0] || claimData?.pack_data?.items?.[0] || {};
          
          // Fallback para dados de product_info se não tiver pack_items
          const productInfo = claimData?.product_info || {};
          
          const compatibilityFields = {
            // Datas - usar dados diretos de claimData
            order_date_created: claimData?.data_venda_original || claimData?.data_criacao,
            date_created: claimData?.data_criacao_claim || claimData?.data_criacao || claim.date_created,
            date_closed: claimData?.data_fechamento_claim || claimData?.data_fechamento_devolucao || claim.date_closed,
            last_updated: claimData?.data_ultima_atualizacao_return || claim.last_updated,
            
            // ✅ PRODUTO - dados vêm de pack_items DIRETAMENTE
            order_item_quantity: packItem.quantity || 1,
            order_item_seller_sku: packItem.seller_sku || productInfo.seller_custom_field || '',
            order_item_title: packItem.title || productInfo.title || '',
            order_item_unit_price: packItem.unit_price || 0,
            
            // Financeiro - dados diretos
            order_total: claimData?.valor_total || claimData?.valor_original_produto || 0,
            amount_value: claim.total_amount || claim.refund_amount || claimData?.valor_reembolso || 0,
            amount_currency: claimData?.moeda_reembolso || 'BRL',
            
            // Razões - dados diretos
            reason_id: claimData?.motivo_id || claim.reason_id,
            reason_name: claimData?.motivo_nome || claimData?.reason_name || '',
            reason_detail: claimData?.motivo_detalhe || claimData?.reason_detail || '',
            reason_category: claimData?.motivo_categoria || claimData?.reason_category || '',
            
            // Resolução - dados diretos
            resolution_benefited: claimData?.resolucao_beneficiado || claimData?.resolution_benefited || '',
            resolution_reason: claimData?.resolucao_motivo || claimData?.resolution_reason || '',
            resolution_date: claimData?.data_fechamento_claim || claim.date_closed,
            
            // Recurso
            resource: claimData?.tipo_devolucao || 'claim',
            resource_id: String(claimData?.claim_id || claim.claim_id),
            
            // Comprador - dados diretos
            buyer_id: claimData?.comprador_id || claim.buyer_id,
            buyer_nickname: claimData?.comprador_nickname || claim.buyer_nickname,
            buyer_name: claimData?.comprador_nome_completo || '',
            
            // Status - dados diretos
            status: claimData?.status_claim || claim.status,
            stage: claimData?.claim_stage || claim.stage,
            fulfilled: claimData?.fulfilled,
            
            // Metadados adicionais
            site_id: claimData?.marketplace_origem || 'MLB',
            order_id: String(claimData?.order_id || claim.order_id),
            pack_id: claimData?.pack_id ? String(claimData.pack_id) : null,
            
            // Shipping - dados diretos
            shipping_id: claimData?.shipment_id,
            tracking_number: claimData?.codigo_rastreamento || '',
            
            // ✅ EXTRA: campos que estavam faltando
            empresa: claimData?.account_name || '',
            tipo_claim: claimData?.tipo_claim || '',
            metodo_reembolso: claimData?.metodo_reembolso || '',
            impacto_reputacao: claimData?.impacto_reputacao || '',
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
            // Isso traz TODOS os 65+ campos do enriquecimento
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
