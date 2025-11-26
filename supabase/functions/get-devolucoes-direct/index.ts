/**
 * 🔥 GET DEVOLUCOES DIRECT - BUSCA DIRETO DA API ML
 * Copia EXATA do padrão de ml-claims-fetch que FUNCIONA
 * NÃO usa cache do banco - SEMPRE busca fresco da API
 * ✅ APLICA MAPEAMENTO COMPLETO usando mappers consolidados
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { fetchWithRetry } from '../_shared/retryUtils.ts';
import { logger } from '../_shared/logger.ts';
import { validateAndFetch, ML_ENDPOINTS } from '../_shared/mlEndpointValidator.ts';

// ✅ Importar serviços de enriquecimento FASE 2
import { fetchShipmentHistory, fetchMultipleShipmentHistories } from './services/ShipmentHistoryService.ts';
import { fetchShippingCosts, fetchMultipleShippingCosts, fetchReturnCost } from './services/ShippingCostsService.ts';
import { fetchReturnArrivalDate } from './services/ReturnArrivalDateService.ts';

// ✅ Importar função de mapeamento completo
import { mapDevolucaoCompleta } from './mapeamento.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { 
      integration_account_id,      // ✅ Single account (retrocompatibilidade)
      integration_account_ids,      // 🆕 Multiple accounts (nova feature)
      date_from, 
      date_to
    } = await req.json();

    // 🔄 Normalizar para array sempre (simplifica lógica)
    const accountIds = integration_account_ids 
      ? (Array.isArray(integration_account_ids) ? integration_account_ids : [integration_account_ids])
      : (integration_account_id ? [integration_account_id] : []);

    // ✅ Validar se temos ao menos uma conta
    if (accountIds.length === 0 || accountIds.some(id => !id)) {
      throw new Error('Nenhuma conta válida fornecida. Envie integration_account_id ou integration_account_ids.');
    }

    logger.progress(`[get-devolucoes-direct] Iniciando busca para ${accountIds.length} conta(s)`);
    logger.debug('Parâmetros:', { accountIds, date_from, date_to });

    // ✅ SERVICE CLIENT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // 🔄 FUNÇÃO HELPER: Processar uma conta individual
    const processAccount = async (accountId: string) => {
      logger.progress(`📥 [Conta ${accountId.slice(0, 8)}] Iniciando processamento...`);

      // Buscar dados da conta
      const { data: account, error: accountError } = await supabase
        .from('integration_accounts')
        .select('account_identifier, name')
        .eq('id', accountId)
        .eq('is_active', true)
        .single();

      if (accountError || !account) {
        logger.error(`❌ [Conta ${accountId.slice(0, 8)}] Erro:`, accountError);
        throw new Error(`Conta não encontrada: ${accountError?.message}`);
      }

      const sellerId = account.account_identifier;
      const accountName = account.name || `Conta ${sellerId}`;

      // Buscar token
      const { data: secretRow, error: secretError } = await supabase
        .from('integration_secrets')
        .select('simple_tokens, use_simple')
        .eq('integration_account_id', accountId)
        .eq('provider', 'mercadolivre')
        .maybeSingle();

      if (secretError || !secretRow) {
        throw new Error(`Token não encontrado para conta ${accountId.slice(0, 8)}`);
      }

      let accessToken = '';
      if (secretRow?.use_simple && secretRow?.simple_tokens) {
        try {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
          }
        } catch (err) {
          throw new Error(`Erro ao descriptografar token: ${err}`);
        }
      }

      if (!accessToken) {
        throw new Error('Token ML indisponível. Reconecte a integração.');
      }

      // ✅ BUSCAR CLAIMS DA API ML COM PAGINAÇÃO
      let allClaims: any[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          player_role: 'respondent',
          player_user_id: sellerId.toString(),
          limit: limit.toString(),
          offset: offset.toString(),
          sort: 'date_created:desc'
        });

        const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
        
        logger.progress(`📡 [${accountId.slice(0, 8)}] Página offset=${offset}...`);

        const claimsRes = await fetchWithRetry(claimsUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }, { maxRetries: 3, retryDelay: 1000, retryOnStatus: [429, 500, 502, 503, 504] });

        if (!claimsRes.ok) {
          const errorText = await claimsRes.text();
          logger.error(`❌ [${accountId.slice(0, 8)}] API error:`, errorText);
          throw new Error(`ML API error: ${claimsRes.status}`);
        }

        const claimsData = await claimsRes.json();
        const claims = claimsData.data || [];
        
        logger.info(`✅ [${accountId.slice(0, 8)}] Página offset=${offset}: ${claims.length} claims`);

        if (claims.length === 0) {
          hasMore = false;
        } else {
          allClaims.push(...claims);
          offset += limit;
          
          if (claims.length < limit) {
            hasMore = false;
          }
        }
      }

      logger.progress(`✅ [${accountId.slice(0, 8)}] Total: ${allClaims.length} claims`);
      let claims = allClaims;

      // Filtrar por data
      if (date_from || date_to) {
        const dateFromObj = date_from ? new Date(date_from) : null;
        const dateToObj = date_to ? new Date(date_to) : null;

        claims = claims.filter((claim: any) => {
          const claimDate = new Date(claim.date_created);
          if (dateFromObj && claimDate < dateFromObj) return false;
          if (dateToObj && claimDate > dateToObj) return false;
          return true;
        });

        logger.info(`📅 [${accountId.slice(0, 8)}] Após filtro: ${claims.length} claims`);
      }

      // ⚡ ENRIQUECIMENTO MÍNIMO E RÁPIDO (sem delays pesados)
      logger.progress(`⚡ [${accountId.slice(0, 8)}] Processando ${claims.length} claims rapidamente...`);
      
      // Buscar apenas order_data básico em paralelo controlado (batch de 10)
      const BATCH_SIZE = 10; // Aumentado para 10 (mais rápido)
      const allEnrichedClaims: any[] = [];
      
      for (let i = 0; i < claims.length; i += BATCH_SIZE) {
        const batch = claims.slice(i, i + BATCH_SIZE);
        
        const enrichedBatch = await Promise.all(
          batch.map(async (claim: any) => {
            let orderData = null;
            let returnDetailsV2 = null;
            let claimMessages = null;
            let productInfo = null;
            
            // 1️⃣ Buscar order data
            if (claim.resource_id) {
              try {
                const { response: orderRes } = await validateAndFetch(
                  'orders',
                  accessToken,
                  { id: claim.resource_id },
                  { retryOnFail: false, logResults: false }
                );
                
                if (orderRes?.ok) {
                  orderData = await orderRes.json();
                }
              } catch (err) {
                // Silencioso
              }
            }
            
            // 2️⃣ Buscar return_details_v2 (CRÍTICO para status, datas, tracking)
            if (claim.id) {
              try {
                const { response: returnRes } = await validateAndFetch(
                  'claim_returns',
                  accessToken,
                  { claim_id: claim.id },
                  { retryOnFail: false, logResults: false }
                );
                
                if (returnRes?.ok) {
                  returnDetailsV2 = await returnRes.json();
                }
              } catch (err) {
                // Silencioso
              }
            }
            
            // 3️⃣ Buscar messages (CRÍTICO para última msg, evidências)
            if (claim.id) {
              try {
                const { response: messagesRes } = await validateAndFetch(
                  'claim_messages',
                  accessToken,
                  { claim_id: claim.id },
                  { retryOnFail: false, logResults: false }
                );
                
                if (messagesRes?.ok) {
                  claimMessages = await messagesRes.json();
                }
              } catch (err) {
                // Silencioso
              }
            }
            
            // 4️⃣ Buscar product_info (CRÍTICO para imagem/detalhes produto)
            const itemId = orderData?.order_items?.[0]?.item?.id;
            if (itemId) {
              try {
                const { response: productRes } = await validateAndFetch(
                  'items',
                  accessToken,
                  { id: itemId },
                  { retryOnFail: false, logResults: false }
                );
                
                if (productRes?.ok) {
                  productInfo = await productRes.json();
                }
              } catch (err) {
                // Silencioso
              }
            }
            
            return {
              ...claim,
              order_data: orderData,
              return_details_v2: returnDetailsV2,
              claim_messages: claimMessages,
              product_info: productInfo,
              // Campos opcionais (não essenciais)
              shipment_data: null,
              review_details: null,
              billing_info: null,
              seller_reputation_data: null,
              shipment_history_enriched: null,
              shipping_costs_enriched: null,
              return_cost_enriched: null,
              change_details: null,
              attachments: null
            };
          })
        );
        
        allEnrichedClaims.push(...enrichedBatch);
      }
      
      logger.progress(`✅ [${accountId.slice(0, 8)}] ${allEnrichedClaims.length} claims processados`);

      // Mapear dados
      const mappedClaims = allEnrichedClaims.map((claim: any) => {
        const item = {
          id: claim.id,
          order_id: claim.resource_id,
          date_created: claim.date_created,
          amount: claim.seller_amount || null,
          reason: claim.reason?.description || null,
          claim_details: claim,
          order_data: claim.order_data,
          claim_messages: claim.claim_messages,
          return_details_v2: claim.return_details_v2,
          resource_data: {
            title: claim.order_data?.order_items?.[0]?.item?.title || null,
            sku: claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
            quantity: claim.order_data?.order_items?.[0]?.quantity || null
          },
          product_info: claim.product_info,
          shipment_data: claim.shipment_data,
          resolution: claim.resolution
        };

        return mapDevolucaoCompleta(item, accountId, accountName, null);
      }).filter(Boolean);

      logger.progress(`✅ [${accountId.slice(0, 8)}] ${mappedClaims.length} claims mapeados`);
      
      return mappedClaims;
    }; // Fim processAccount

    // 🚀 AGREGAÇÃO PARALELA DE MÚLTIPLAS CONTAS
    logger.progress(`🔄 Processando ${accountIds.length} conta(s) em PARALELO...`);
    
    const accountResults = await Promise.all(
      accountIds.map(accountId => 
        processAccount(accountId).catch(err => {
          logger.error(`❌ Conta ${accountId.slice(0, 8)} falhou:`, err);
          return []; // Retornar vazio em caso de erro
        })
      )
    );

    // Agregar todos os resultados
    const allMappedClaims = accountResults.flat();
    
    logger.progress(`🎉 TOTAL AGREGADO: ${allMappedClaims.length} devoluções de ${accountIds.length} conta(s)`);

    // ✅ RETORNAR DADOS AGREGADOS
    return new Response(
      JSON.stringify({
        success: true,
        data: allMappedClaims,
        total: allMappedClaims.length,
        accounts_processed: accountIds.length,
        date_range: { from: date_from, to: date_to }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    logger.error('Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
