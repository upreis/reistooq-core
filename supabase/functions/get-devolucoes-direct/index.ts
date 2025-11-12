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

// ✅ Importar serviços de enriquecimento FASE 2
import { fetchShipmentHistory, fetchMultipleShipmentHistories } from './services/ShipmentHistoryService.ts';
import { fetchShippingCosts, fetchMultipleShippingCosts } from './services/ShippingCostsService.ts';

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
      integration_account_id, 
      date_from, 
      date_to 
    } = await req.json();

    logger.progress(`[get-devolucoes-direct] Iniciando sincronização para conta ${integration_account_id}`);
    logger.debug('Parâmetros:', { integration_account_id, date_from, date_to });

    // ✅ Buscar dados da conta com SERVICE CLIENT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('account_identifier')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      logger.error('Account error:', accountError);
      throw new Error(`Conta ML não encontrada: ${accountError?.message || 'No account data'}`);
    }

    const sellerId = account.account_identifier;
    const accountName = `Conta ${sellerId}`; // Nome padrão baseado no ID

    // ✅ Buscar integration_secrets DIRETO do banco (igual unified-orders)
    const { data: secretRow, error: secretError } = await supabase
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretError || !secretRow) {
      logger.error('Erro ao buscar secrets:', secretError);
      throw new Error('Token ML não encontrado. Reconecte a integração.');
    }

    let accessToken = '';
    
    // ✅ Descriptografar usando método EXATO de unified-orders
    // Primeiro: tentar nova estrutura simples
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        logger.debug('Descriptografando simple_tokens');
        
        // Remover prefixo SALT2024:: e descriptografar base64
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          accessToken = tokensData.access_token || '';
          logger.info('✅ Token descriptografado com sucesso');
        }
      } catch (err) {
        logger.error('Erro descriptografia simples:', err);
      }
    }

    if (!accessToken) {
      throw new Error('Token ML não disponível. Reconecte a integração.');
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
      
      logger.progress(`📡 Buscando página offset=${offset} da API ML...`);

      // ✅ CORREÇÃO 3: Usar fetchWithRetry para tratar 429 automaticamente
      const claimsRes = await fetchWithRetry(claimsUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }, { maxRetries: 3, retryDelay: 1000, retryOnStatus: [429, 500, 502, 503, 504] });

      if (!claimsRes.ok) {
        const errorText = await claimsRes.text();
        logger.error('Erro ML API:', errorText);
        throw new Error(`ML API error: ${claimsRes.status}`);
      }

      const claimsData = await claimsRes.json();
      const claims = claimsData.data || [];
      
      logger.info(`✅ Página offset=${offset}: ${claims.length} claims`);

      if (claims.length === 0) {
        hasMore = false;
      } else {
        allClaims.push(...claims);
        offset += limit;
        
        // Se retornou menos que o limite, não há mais páginas
        if (claims.length < limit) {
          hasMore = false;
        }
      }
    }

    logger.progress(`✅ Total de ${allClaims.length} claims buscados da API ML`);
    let claims = allClaims;

    // ✅ FILTRAR POR DATA CLIENT-SIDE (igual ml-claims-fetch)
    if (date_from || date_to) {
      const dateFromObj = date_from ? new Date(date_from) : null;
      const dateToObj = date_to ? new Date(date_to) : null;

      claims = claims.filter((claim: any) => {
        const claimDate = new Date(claim.date_created);
        if (dateFromObj && claimDate < dateFromObj) return false;
        if (dateToObj && claimDate > dateToObj) return false;
        return true;
      });

      console.log(`[get-devolucoes-direct] Após filtro de data: ${claims.length} claims`);
    }

    // ✅ CORREÇÃO 1: BATCH PARALELO 5x5 (Performance: 40s → ~10s)
    logger.progress('🔄 Iniciando enriquecimento de dados em lotes paralelos...');
    
    const allEnrichedClaims: any[] = [];
    const BATCH_SIZE = 5; // Processar 5 claims em paralelo
    const DELAY_BETWEEN_BATCHES = 200; // 200ms entre batches
    
    // Função para enriquecer um único claim
    const enrichClaim = async (claim: any) => {
      try {
        // 1. Buscar ordem (order_data)
        let orderData = null;
        if (claim.resource_id) {
          try {
            const orderRes = await fetchWithRetry(
              `https://api.mercadolibre.com/orders/${claim.resource_id}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (orderRes.ok) {
              orderData = await orderRes.json();
            }
          } catch (err) {
            // Ignorar 404 (order deletada)
          }
        }

        // 2. Buscar mensagens
        let messagesData = null;
        try {
          const messagesRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (messagesRes.ok) {
            messagesData = await messagesRes.json();
          }
        } catch (err) {
          // Ignorar erro
        }

        // 3. Buscar return
        let returnData = null;
        try {
          const returnRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (returnRes.ok) {
            returnData = await returnRes.json();
          }
        } catch (err) {
          // Return pode não existir
        }

        // 4. Buscar reviews (se return existe e tem reviews)
        let reviewsData = null;
        if (returnData?.id && returnData?.related_entities?.includes('reviews')) {
          try {
            const reviewsRes = await fetchWithRetry(
              `https://api.mercadolibre.com/post-purchase/v1/returns/${returnData.id}/reviews`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (reviewsRes.ok) {
              reviewsData = await reviewsRes.json();
            }
          } catch (err) {
            // Ignorar erro
          }
        }

        // 🆕 FASE 2: Buscar histórico de rastreamento detalhado
        let shipmentHistoryData = null;
        let shippingCostsData = null;
        
        // Extrair shipment IDs (original e devolução)
        const shipmentIds: number[] = [];
        
        // Shipment original do pedido
        if (orderData?.shipping?.id) {
          shipmentIds.push(orderData.shipping.id);
        }
        
        // Shipment de devolução
        if (returnData?.shipments?.[0]?.shipment_id) {
          shipmentIds.push(returnData.shipments[0].shipment_id);
        }
        
        // Buscar históricos e custos se houver shipments
        if (shipmentIds.length > 0) {
          try {
            const [historyMap, costsMap] = await Promise.all([
              fetchMultipleShipmentHistories(shipmentIds, accessToken),
              fetchMultipleShippingCosts(shipmentIds, accessToken)
            ]);
            
            // Consolidar dados em estrutura única
            shipmentHistoryData = {
              original_shipment: historyMap.get(shipmentIds[0]) || null,
              return_shipment: shipmentIds[1] ? historyMap.get(shipmentIds[1]) || null : null
            };
            
            shippingCostsData = {
              original_costs: costsMap.get(shipmentIds[0]) || null,
              return_costs: shipmentIds[1] ? costsMap.get(shipmentIds[1]) || null : null,
              total_logistics_cost: (
                (costsMap.get(shipmentIds[0])?.net_cost || 0) +
                (costsMap.get(shipmentIds[1])?.net_cost || 0)
              )
            };
          } catch (err) {
            logger.warn(`Erro ao buscar histórico/custos shipment:`, err);
          }
        }

        return {
          ...claim,
          order_data: orderData,
          claim_messages: messagesData,
          return_details_v2: returnData,
          review_details: reviewsData,
          shipment_history_enriched: shipmentHistoryData,
          shipping_costs_enriched: shippingCostsData
        };
      } catch (err) {
        console.error(`❌ Erro ao enriquecer claim ${claim.id}:`, err);
        return claim; // Retornar claim original em caso de erro
      }
    };

    // Processar em batches de 5 claims paralelos
    for (let i = 0; i < claims.length; i += BATCH_SIZE) {
      const batch = claims.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(claims.length / BATCH_SIZE);
      
      // ✅ FASE 2: Log de progresso em tempo real
      logger.progress(`📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} claims)...`);
      
      // Processar batch em paralelo
      const enrichedBatch = await Promise.all(batch.map(enrichClaim));
      allEnrichedClaims.push(...enrichedBatch);
      
      // Delay entre batches para evitar rate limit
      if (i + BATCH_SIZE < claims.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    logger.progress(`✅ ${allEnrichedClaims.length} claims enriquecidos com sucesso`);

    // ✅ CORREÇÃO 2: MAPEAR DADOS CORRETAMENTE
    logger.progress('🗺️ Mapeando dados...');
    const mappedClaims = allEnrichedClaims.map((claim: any) => {
      try {
        // ✅ ESTRUTURA CORRETA para os mappers
        const item = {
          // Campos de nível superior que os mappers esperam
          order_id: claim.resource_id, // resource_id é o order_id
          date_created: claim.date_created, // Data de criação do claim
          amount: claim.seller_amount || null,
          reason: claim.reason?.description || null, // Motivo da devolução
          
          // Dados do claim (contém status, stage, resolution, etc.)
          claim_details: claim,
          
          // Dados completos da ordem (buscado de /orders/{id})
          order_data: claim.order_data,
          
          // Mensagens do claim
          claim_messages: claim.claim_messages,
          
          // Dados do return v2
          return_details_v2: claim.return_details_v2,
          
          // Reviews do return
          review_details: claim.review_details,
          
          // resource_data para título/sku do produto
          resource_data: {
            title: claim.order_data?.order_items?.[0]?.item?.title || null,
            sku: claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
            quantity: claim.order_data?.order_items?.[0]?.quantity || null
          }
        };

        return mapDevolucaoCompleta(item, integration_account_id, accountName, null);
      } catch (err) {
        logger.error('Erro ao mapear claim:', claim.id, err);
        return null;
      }
    }).filter(Boolean);

    logger.progress(`✅ ${mappedClaims.length} claims mapeados com sucesso`);

    // ✅ RETORNAR DADOS MAPEADOS
    return new Response(
      JSON.stringify({
        success: true,
        data: mappedClaims,
        total: mappedClaims.length,
        integration_account_id,
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
