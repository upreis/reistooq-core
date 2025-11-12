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
import { fetchShippingCosts, fetchMultipleShippingCosts, fetchReturnCost } from './services/ShippingCostsService.ts';

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
    
    // 🆕 FASE 2: Cache de reputação do vendedor (evitar chamadas repetidas)
    const sellerReputationCache = new Map<string, any>();
    
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
          logger.debug(`💬 Buscando messages para claim ${claim.id}`);
          
          const messagesRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (messagesRes.ok) {
            messagesData = await messagesRes.json();
            
            logger.debug(`💬 MESSAGES ENRIQUECIDAS para claim ${claim.id}:`, JSON.stringify({
              total_messages: messagesData?.length || 0,
              has_messages: (messagesData?.length || 0) > 0
            }));
          }
        } catch (err) {
          logger.error(`❌ Erro ao buscar messages (claim ${claim.id}):`, err);
        }

        // 3. Buscar return
        let returnData = null;
        try {
          logger.debug(`📋 Buscando return details para claim ${claim.id}`);
          
          const returnRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (returnRes.ok) {
            returnData = await returnRes.json();
            
            logger.debug(`📋 RETURN ENRIQUECIDO para claim ${claim.id}:`, JSON.stringify({
              return_id: returnData?.id,
              status: returnData?.status,
              has_estimated_delivery: !!returnData?.estimated_delivery_date
            }));
          } else {
            logger.debug(`⚠️ Claim ${claim.id} sem return details`);
          }
        } catch (err) {
          logger.error(`❌ Erro ao buscar return (claim ${claim.id}):`, err);
        }

        // 4. Buscar reviews (se return existe e tem reviews)
        let reviewsData = null;
        if (returnData?.id && returnData?.related_entities?.includes('reviews')) {
          try {
            logger.debug(`🔍 Buscando review para return ${returnData.id} (claim ${claim.id})`);
            
            const reviewsRes = await fetchWithRetry(
              `https://api.mercadolibre.com/post-purchase/v1/returns/${returnData.id}/reviews`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (reviewsRes.ok) {
              reviewsData = await reviewsRes.json();
              
              logger.debug(`🔍 REVIEW ENRIQUECIDO para claim ${claim.id}:`, JSON.stringify({
                status: reviewsData?.status,
                method: reviewsData?.method
              }));
            }
          } catch (err) {
            logger.error(`❌ Erro ao buscar review (claim ${claim.id}):`, err);
          }
        }

        // 5. ✅ BUSCAR DADOS DO PRODUTO (thumbnail, imagem, etc.)
        let productData = null;
        const itemId = orderData?.order_items?.[0]?.item?.id;
        if (itemId) {
          try {
            logger.debug(`📦 Buscando product info para item ${itemId} (claim ${claim.id})`);
            
            const productRes = await fetchWithRetry(
              `https://api.mercadolibre.com/items/${itemId}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (productRes.ok) {
              const itemData = await productRes.json();
              
              // Extrair SKU (priorizar seller_custom_field, fallback para attributes)
              let sku = itemData.seller_custom_field || null;
              if (!sku && itemData.attributes) {
                const skuAttr = itemData.attributes.find((a: any) => 
                  a.id === 'SELLER_SKU' || a.name?.toLowerCase().includes('sku')
                );
                sku = skuAttr?.value_name || null;
              }
              
              productData = {
                id: itemData.id,
                title: itemData.title,
                price: itemData.price,
                currency_id: itemData.currency_id,
                thumbnail: itemData.thumbnail || itemData.pictures?.[0]?.url || null,
                permalink: itemData.permalink,
                sku: sku,
                condition: itemData.condition,
                available_quantity: itemData.available_quantity,
                sold_quantity: itemData.sold_quantity,
                variation_id: orderData?.order_items?.[0]?.variation_id || null,
                category_id: itemData.category_id || null,
              };
              
              logger.debug(`📦 PRODUTO ENRIQUECIDO para claim ${claim.id}:`, JSON.stringify({
                title: productData.title?.substring(0, 50),
                sku: productData.sku,
                has_thumbnail: !!productData.thumbnail,
                price: productData.price
              }));
            }
          } catch (err) {
            logger.error(`❌ Erro ao buscar product info (claim ${claim.id}):`, err);
          }
        } else {
          logger.debug(`⚠️ Claim ${claim.id} sem item ID para buscar produto`);
        }

        // 6. 🆕 FASE 1: BUSCAR BILLING INFO (CPF/CNPJ do comprador)
        let billingData = null;
        const orderId = claim.resource_id;
        if (orderId) {
          try {
            logger.debug(`💳 Buscando billing info para order ${orderId} (claim ${claim.id})`);
            
            const billingRes = await fetchWithRetry(
              `https://api.mercadolibre.com/orders/${orderId}/billing_info`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            
            if (billingRes.ok) {
              const contentType = billingRes.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const text = await billingRes.text();
                if (text && text.trim().length > 0) {
                  billingData = JSON.parse(text);
                  logger.debug(`💳 BILLING ENRIQUECIDO para claim ${claim.id}:`, JSON.stringify({
                    doc_type: billingData.doc_type,
                    has_doc_number: !!billingData.doc_number
                  }));
                } else {
                  logger.warn(`💳 ⚠️ Billing info retornou resposta vazia (claim ${claim.id})`);
                }
              } else {
                logger.warn(`💳 ⚠️ Billing info não é JSON (claim ${claim.id})`);
              }
            } else if (billingRes.status === 404) {
              logger.debug(`💳 ℹ️ Billing info não disponível para order ${orderId} (claim ${claim.id})`);
            }
          } catch (err) {
            logger.error(`❌ Erro ao buscar billing info (claim ${claim.id}):`, err);
          }
        } else {
          logger.debug(`⚠️ Claim ${claim.id} sem order ID para buscar billing`);
        }

        // 7. 🆕 FASE 2: BUSCAR SELLER REPUTATION (com cache)
        let sellerReputationData = null;
        const sellerId = claim.players?.seller?.id;
        if (sellerId) {
          // Verificar cache primeiro
          if (sellerReputationCache.has(sellerId)) {
            sellerReputationData = sellerReputationCache.get(sellerId);
            logger.debug(`♻️ Reputação do vendedor ${sellerId} obtida do cache (claim ${claim.id})`);
          } else {
            try {
              logger.debug(`⭐ Buscando seller reputation para seller ${sellerId} (claim ${claim.id})`);
              
              const sellerRes = await fetchWithRetry(
                `https://api.mercadolibre.com/users/${sellerId}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } },
                { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
              );
              if (sellerRes.ok) {
                const sellerFullData = await sellerRes.json();
                sellerReputationData = {
                  seller_reputation: sellerFullData.seller_reputation,
                  power_seller_status: sellerFullData.power_seller_status,
                  mercado_lider_status: sellerFullData.tags?.includes('mercadolider') || false,
                  user_type: sellerFullData.user_type,
                  tags: sellerFullData.tags
                };
                // Armazenar no cache
                sellerReputationCache.set(sellerId, sellerReputationData);
                
                logger.debug(`⭐ REPUTAÇÃO ENRIQUECIDA para claim ${claim.id}:`, JSON.stringify({
                  power_seller: sellerReputationData.power_seller_status,
                  mercado_lider: sellerReputationData.mercado_lider_status
                }));
              }
            } catch (err) {
              logger.error(`❌ Erro ao buscar seller reputation (claim ${claim.id}):`, err);
            }
          }
        } else {
          logger.debug(`⚠️ Claim ${claim.id} sem seller ID para buscar reputação`);
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
        
        // 💰 FASE 2: Buscar custo real de devolução via /charges/return-cost
        let returnCostData = null;
        try {
          console.log(`💰 === CUSTO DEVOLUÇÃO FASE 2 ===`);
          console.log(`💰 Buscando custo para claim ${claim.id}`);
          
          returnCostData = await fetchReturnCost(claim.id, accessToken);
          
          if (returnCostData) {
            console.log(`💰 ✅ CUSTO ENCONTRADO claim ${claim.id}:`, {
              amount: returnCostData.amount,
              currency: returnCostData.currency_id,
              amount_usd: returnCostData.amount_usd || 'N/A'
            });
          } else {
            console.log(`💰 ⚠️ Sem custo de devolução para claim ${claim.id} (endpoint retornou null)`);
          }
        } catch (err) {
          console.error(`💰 ❌ Erro ao buscar custo de devolução (claim ${claim.id}):`, err);
        }
        console.log(`💰 =========================`);
        
        // Buscar históricos e custos se houver shipments
        if (shipmentIds.length > 0) {
          try {
            logger.debug(`🚚 Buscando custos para shipments: ${shipmentIds.join(', ')} (claim ${claim.id})`);
            
            const [historyMap, costsMap] = await Promise.all([
              fetchMultipleShipmentHistories(shipmentIds, accessToken),
              fetchMultipleShippingCosts(shipmentIds, accessToken)
            ]);
            
            logger.debug(`💰 Custos retornados: ${costsMap.size} shipments com dados (claim ${claim.id})`);
            
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
            
            // 🐛 DEBUG: Log detalhado dos custos
            const originalCosts = costsMap.get(shipmentIds[0]);
            if (originalCosts) {
              logger.debug(`💰 CUSTOS SHIPMENT ${shipmentIds[0]}:`, JSON.stringify({
                total_cost: originalCosts.total_cost,
                net_cost: originalCosts.net_cost,
                responsavel: originalCosts.responsavel_custo,
                has_breakdown: !!originalCosts.cost_breakdown
              }));
            } else {
              logger.warn(`⚠️ SEM CUSTOS para shipment ${shipmentIds[0]} (claim ${claim.id})`);
            }
          } catch (err) {
            logger.error(`❌ Erro ao buscar histórico/custos shipment (claim ${claim.id}):`, err);
          }
        } else {
          logger.debug(`⚠️ Claim ${claim.id} sem shipments para enriquecer custos`);
        }

        // 8. 🆕 BUSCAR CHANGE DETAILS (se for troca)
        let changeDetailsData = null;
        if (claim.stage === 'change' || claim.type === 'change') {
          try {
            const changeRes = await fetchWithRetry(
              `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/change_details`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (changeRes.ok) {
              changeDetailsData = await changeRes.json();
              logger.debug(`✅ Change details obtido para claim ${claim.id}`);
            }
          } catch (err) {
            logger.debug(`⚠️ Change details não disponível para claim ${claim.id}`);
          }
        }

        // 9. 🆕 BUSCAR ATTACHMENTS (anexos/evidências)
        let attachmentsData = null;
        try {
          const attachmentsRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/attachments`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (attachmentsRes.ok) {
            attachmentsData = await attachmentsRes.json();
            logger.debug(`✅ ${attachmentsData?.length || 0} anexos obtidos para claim ${claim.id}`);
          }
        } catch (err) {
          logger.debug(`⚠️ Attachments não disponível para claim ${claim.id}`);
        }

        return {
          ...claim,
          order_data: orderData,
          claim_messages: messagesData,
          return_details_v2: returnData,
          review_details: reviewsData,
          product_info: productData, // ✅ ADICIONAR product_info enriquecido
          billing_info: billingData, // ✅ FASE 1: Dados fiscais do comprador (CPF/CNPJ)
          seller_reputation_data: sellerReputationData, // ✅ FASE 2: Reputação do vendedor (power_seller, mercado_lider)
          shipment_history_enriched: shipmentHistoryData,
          shipping_costs_enriched: shippingCostsData,
          return_cost_enriched: returnCostData, // 💰 Custo real de devolução via /charges/return-cost
          change_details: changeDetailsData, // 🆕 Detalhes de troca
          attachments: attachmentsData // 🆕 Anexos/evidências
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
    
    // 🐛 DEBUG: Log COMPLETO do primeiro claim para diagnóstico
    if (allEnrichedClaims.length > 0) {
      const firstClaim = allEnrichedClaims[0];
      const claimDebug = JSON.stringify(firstClaim, null, 2);
      // Limitar a 8000 caracteres para não estourar logs
      logger.debug('🔍 CLAIM COMPLETO (primeiros 8000 chars):', claimDebug.substring(0, 8000));
      
      // Estrutura específica que os mappers esperam
      logger.debug('🔍 ESTRUTURA PARA MAPPERS:', JSON.stringify({
        id: firstClaim.id,
        resource_id: firstClaim.resource_id,
        seller_amount: firstClaim.seller_amount,
        resolution: firstClaim.resolution,
        return_details_v2: firstClaim.return_details_v2,
        order_data_structure: firstClaim.order_data ? {
          total_amount: firstClaim.order_data.total_amount,
          currency_id: firstClaim.order_data.currency_id,
          payments: firstClaim.order_data.payments,
          order_items: firstClaim.order_data.order_items?.map((item: any) => ({
            item_id: item.item?.id,
            unit_price: item.unit_price,
            quantity: item.quantity,
          })),
        } : null,
        claim_messages_count: firstClaim.claim_messages?.messages?.length || 0,
        product_info: firstClaim.product_info,
        billing_info: firstClaim.billing_info,
      }, null, 2));
    }
    
    const mappedClaims = allEnrichedClaims.map((claim: any) => {
      try {
        // ✅ DEBUG: Log estrutura do primeiro claim enriquecido
        if (allEnrichedClaims.indexOf(claim) === 0) {
          logger.debug('🔍 PRIMEIRO CLAIM ENRIQUECIDO:', JSON.stringify({
            id: claim.id,
            resource_id: claim.resource_id,
            seller_amount: claim.seller_amount,
            stage: claim.stage,
            type: claim.type,
            status: claim.status,
            has_order_data: !!claim.order_data,
            has_return_details_v2: !!claim.return_details_v2,
            has_claim_messages: !!claim.claim_messages,
            has_product_info: !!claim.product_info,
            has_billing_info: !!claim.billing_info,
            order_data_keys: claim.order_data ? Object.keys(claim.order_data) : [],
            return_v2_keys: claim.return_details_v2 ? Object.keys(claim.return_details_v2) : [],
          }, null, 2));
        }
        
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
          },
          
          // ✅ CRÍTICO: Passar product_info enriquecido para o mapeamento
          product_info: claim.product_info,
          
          // ✅ BILLING INFO (CPF/CNPJ)
          billing_info: claim.billing_info,
          
          // ✅ SELLER REPUTATION (Power Seller, Mercado Líder)
          seller_reputation_data: claim.seller_reputation_data,
          
          // ✅ SHIPMENT & COSTS enriquecidos
          shipment_history_enriched: claim.shipment_history_enriched,
          shipping_costs_enriched: claim.shipping_costs_enriched,
          
          // 🆕 CHANGE DETAILS (para trocas)
          change_details: claim.change_details,
          
          // 🆕 ATTACHMENTS (anexos/evidências)
          attachments: claim.attachments
        };

        return mapDevolucaoCompleta(item, integration_account_id, accountName, null);
      } catch (err) {
        logger.error('Erro ao mapear claim:', claim.id, err);
        return null;
      }
    }).filter(Boolean);

    logger.progress(`✅ ${mappedClaims.length} claims mapeados com sucesso`);
    
    // 🐛 DEBUG: Log primeiro claim completo para verificar estrutura
    if (mappedClaims.length > 0) {
      console.log('[DEBUG BACKEND] ===== ESTRUTURA DADOS MAPEADOS =====');
      console.log('[DEBUG BACKEND] comprador_nome_completo:', mappedClaims[0].comprador_nome_completo);
      console.log('[DEBUG BACKEND] comprador_nickname:', mappedClaims[0].comprador_nickname);
      console.log('[DEBUG BACKEND] product_info:', mappedClaims[0].product_info ? 'EXISTS' : 'NULL');
      console.log('[DEBUG BACKEND] valor_reembolso_total:', mappedClaims[0].valor_reembolso_total);
      console.log('[DEBUG BACKEND] status_dinheiro:', mappedClaims[0].status_dinheiro);
      console.log('[DEBUG BACKEND] estimated_delivery_date:', mappedClaims[0].estimated_delivery_date);
      console.log('[DEBUG BACKEND] qualidade_comunicacao:', mappedClaims[0].qualidade_comunicacao);
    }

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
