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
import { enrichClaimsWithArrivalDates } from './services/ReturnArrivalDateService.ts';

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
      // ✅ BUSCAR TODAS AS DEVOLUÇÕES sem filtro de status
      // Permite filtrar por status client-side depois
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
        // 🔍 DEBUG CRÍTICO: Verificar se claim.shipping existe na resposta do endpoint /claims
        console.log(`🔍 CLAIM SHIPPING (claim ${claim.id}):`, JSON.stringify({
          has_shipping: !!claim.shipping,
          shipping_keys: claim.shipping ? Object.keys(claim.shipping) : [],
          logistic_type: claim.shipping?.logistic?.type,
          logistic_type_flat: claim.shipping?.logistic_type,
          shipping_sample: claim.shipping ? JSON.stringify(claim.shipping).substring(0, 200) : null
        }));
        
        // 1. Buscar ordem (order_data) e shipment para logistic_type
        let orderData = null;
        let shipmentData = null;
        
        if (claim.resource_id) {
          try {
            // ✅ Usar validador automático para orders
            const { response: orderRes, endpointUsed: orderEndpoint, fallbackUsed: orderFallback } = await validateAndFetch(
              'orders',
              accessToken,
              { id: claim.resource_id },
              { retryOnFail: true, logResults: true }
            );
            
            if (orderRes?.ok) {
              orderData = await orderRes.json();
              
              // 🔍 DEBUG: Estrutura completa de orderData
              console.log(`📦 ORDER DATA (claim ${claim.id}):`, JSON.stringify({
                has_shipping: !!orderData?.shipping,
                shipping_id: orderData?.shipping?.id,
                has_payments: !!orderData?.payments,
                payments_length: orderData?.payments?.length,
                first_payment_exists: !!orderData?.payments?.[0],
                endpoint_used: orderEndpoint,
                fallback_used: orderFallback
              }));
              
              // 🔧 SOLUÇÃO ALTERNATIVA: Buscar logistic_type do endpoint /shipments/{id}
              if (orderData?.shipping?.id) {
                try {
                  console.log(`🚚 Buscando shipment ${orderData.shipping.id} para logistic_type`);
                  
                  // ✅ Usar validador automático para shipments
                  const { response: shipmentRes, endpointUsed: shipmentEndpoint, fallbackUsed: shipmentFallback } = await validateAndFetch(
                    'shipments',
                    accessToken,
                    { id: orderData.shipping.id.toString() },
                    { retryOnFail: true, logResults: true }
                  );
                  
                  if (shipmentRes?.ok) {
                    shipmentData = await shipmentRes.json();
                    
                    console.log(`🚚 SHIPMENT DATA (claim ${claim.id}):`, JSON.stringify({
                      shipment_id: shipmentData.id,
                      logistic_type: shipmentData.logistic_type,
                      shipping_option: shipmentData.shipping_option,
                      status: shipmentData.status,
                      endpoint_used: shipmentEndpoint,
                      fallback_used: shipmentFallback
                    }));
                    
                    if (shipmentFallback) {
                      logger.warn(`⚠️ Shipment endpoint usando fallback: ${shipmentEndpoint}`);
                    }
                  } else {
                    console.log(`⚠️ Shipment fetch failed: ${shipmentRes?.status}`);
                  }
                } catch (err) {
                  console.log(`❌ Erro ao buscar shipment:`, err);
                }
              }
              
              // 🔧 DEBUG: Validar payments para custo_envio_original
              if (orderData?.payments?.[0]) {
                console.log(`💰 PAYMENT DATA (claim ${claim.id}):`, JSON.stringify({
                  payment_id: orderData.payments[0].id,
                  shipping_cost: orderData.payments[0].shipping_cost,
                  transaction_amount: orderData.payments[0].transaction_amount,
                  taxes_amount: orderData.payments[0].taxes_amount
                }));
              }
              
              if (orderFallback) {
                logger.warn(`⚠️ Order endpoint usando fallback: ${orderEndpoint}`);
              }
            } else {
              console.log(`⚠️ ORDER fetch retornou status ${orderRes?.status} para claim ${claim.id} - tipo_logistica e custo_envio_original ficarão NULL`);
            }
          } catch (err) {
            console.log(`❌ ERRO ao buscar order ${claim.resource_id} (claim ${claim.id}): campos logísticos ficarão NULL -`, err);
          }
        }

        // 2. Buscar mensagens com validação automática
        let messagesData = null;
        try {
          logger.debug(`💬 Buscando messages para claim ${claim.id}`);
          
          // ✅ Usar validador automático de endpoints
          const { response: messagesRes, endpointUsed, fallbackUsed } = await validateAndFetch(
            'claimMessages',
            accessToken,
            { id: claim.id.toString() },
            { retryOnFail: true, logResults: true }
          );
          
          if (messagesRes?.ok) {
            messagesData = await messagesRes.json();
            
            logger.debug(`💬 MESSAGES ENRIQUECIDAS para claim ${claim.id}:`, JSON.stringify({
              total_messages: messagesData?.length || 0,
              has_messages: (messagesData?.length || 0) > 0,
              endpoint_used: endpointUsed,
              fallback_used: fallbackUsed
            }));
            
            // ⚠️ Alertar se fallback foi usado
            if (fallbackUsed) {
              logger.warn(`⚠️ ATENÇÃO: Endpoint primário ${ML_ENDPOINTS.claimMessages.primary} falhou!`);
              logger.warn(`   Usando fallback: ${endpointUsed}`);
              logger.warn(`   Considere atualizar o código para usar o endpoint correto.`);
            }
          }
        } catch (err) {
          logger.error(`❌ Erro ao buscar messages (claim ${claim.id}):`, err);
        }

        // 3. Buscar return com validação automática
        let returnData = null;
        try {
          logger.debug(`📋 Buscando return details para claim ${claim.id}`);
          
          // ✅ Usar validador automático para return details
          const { response: returnRes, endpointUsed: returnEndpoint, fallbackUsed: returnFallback } = await validateAndFetch(
            'returnDetailsV2',
            accessToken,
            { id: claim.id.toString() },
            { retryOnFail: true, logResults: true }
          );
          
          if (returnRes?.ok) {
            returnData = await returnRes.json();
            
            // 🐛 DEBUG CRÍTICO: Ver TODOS os campos do returnData
            console.log(`📋 RETURN COMPLETO para claim ${claim.id}:`, JSON.stringify({
              return_id: returnData?.id,
              status: returnData?.status,
              subtype: returnData?.subtype,
              refund_at: returnData?.refund_at,
              status_money: returnData?.status_money,
              shipments_count: returnData?.shipments?.length || 0,
              first_shipment_status: returnData?.shipments?.[0]?.status,
              first_shipment_type: returnData?.shipments?.[0]?.type,
              has_estimated_delivery: !!returnData?.estimated_delivery_date,
              has_date_closed: !!returnData?.date_closed,
              related_entities: returnData?.related_entities,
              endpoint_used: returnEndpoint,
              fallback_used: returnFallback
            }));
            
            if (returnFallback) {
              logger.warn(`⚠️ Return endpoint usando fallback: ${returnEndpoint}`);
            }
          } else {
            logger.debug(`⚠️ Claim ${claim.id} sem return details (status: ${returnRes?.status})`);
          }
        } catch (err) {
          logger.error(`❌ Erro ao buscar return (claim ${claim.id}):`, err);
        }

        // 4. Buscar reviews com validação automática (se return existe e tem reviews)
        let reviewsData = null;
        if (returnData?.id && returnData?.related_entities?.includes('reviews')) {
          try {
            logger.debug(`🔍 Buscando review para return ${returnData.id} (claim ${claim.id})`);
            
            // ✅ Usar validador automático para reviews
            const { response: reviewsRes, endpointUsed: reviewEndpoint, fallbackUsed: reviewFallback } = await validateAndFetch(
              'reviews',
              accessToken,
              { id: returnData.id.toString() },
              { retryOnFail: true, logResults: true }
            );
            
            if (reviewsRes?.ok) {
              reviewsData = await reviewsRes.json();
              
              logger.debug(`🔍 REVIEW ENRIQUECIDO para claim ${claim.id}:`, JSON.stringify({
                status: reviewsData?.status,
                method: reviewsData?.method,
                endpoint_used: reviewEndpoint,
                fallback_used: reviewFallback
              }));
              
              if (reviewFallback) {
                logger.warn(`⚠️ Review endpoint usando fallback: ${reviewEndpoint}`);
              }
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
        
        // 🐛 DEBUG: Log de shipment IDs encontrados
        logger.info(`📦 SHIPMENT IDS (claim ${claim.id}):`, JSON.stringify({
          total: shipmentIds.length,
          order_shipping_id: orderData?.shipping?.id || null,
          return_shipment_id: returnData?.shipments?.[0]?.shipment_id || null,
          has_order_data: !!orderData,
          has_return_data: !!returnData,
          has_return_shipments: !!returnData?.shipments,
          return_shipments_count: returnData?.shipments?.length || 0
        }));
        
        // 💰 FASE 2: Buscar custo real de devolução via /charges/return-cost
        let returnCostData = null;
        try {
          logger.debug(`💰 Buscando return cost para claim ${claim.id}`);
          
          returnCostData = await fetchReturnCost(claim.id, accessToken);
          
          if (returnCostData) {
            logger.info(`💰 ✅ CUSTO DEVOLUÇÃO encontrado (claim ${claim.id}):`, JSON.stringify({
              amount: returnCostData.amount,
              currency: returnCostData.currency_id,
              amount_usd: returnCostData.amount_usd || null
            }));
          } else {
            logger.warn(`💰 ⚠️ SEM CUSTO DEVOLUÇÃO (claim ${claim.id}) - API retornou null`);
          }
        } catch (err) {
          logger.error(`💰 ❌ ERRO ao buscar custo devolução (claim ${claim.id}):`, err);
        }
        
        // Buscar históricos e custos se houver shipments
        if (shipmentIds.length > 0) {
          try {
            logger.info(`🚚 [FASE 1+2+3] Buscando histórico/custos para ${shipmentIds.length} shipments (claim ${claim.id}): ${shipmentIds.join(', ')}`);
            
            const [historyMap, costsMap] = await Promise.all([
              fetchMultipleShipmentHistories(shipmentIds, accessToken),
              fetchMultipleShippingCosts(shipmentIds, accessToken)
            ]);
            
            logger.info(`📊 RESULTADO enriquecimento (claim ${claim.id}):`, JSON.stringify({
              shipments_count: shipmentIds.length,
              history_found: historyMap.size,
              costs_found: costsMap.size,
              has_carrier_data: Array.from(historyMap.values()).some(h => h.carrier_name),
              has_shipping_method: Array.from(historyMap.values()).some(h => h.shipping_method_name),
              has_status_history: Array.from(historyMap.values()).some(h => h.status_history && h.status_history.length > 0)
            }));
            
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
          shipment_data: shipmentData, // 🔧 SOLUÇÃO ALTERNATIVA: Dados do shipment para logistic_type
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

    // 🎯 BUSCAR DATAS DE CHEGADA DAS DEVOLUÇÕES
    logger.progress('📅 ========== INICIANDO BUSCA DE DATAS DE CHEGADA ==========');
    logger.progress(`📅 Total de claims a processar: ${allEnrichedClaims.length}`);
    logger.progress(`📅 AccessToken disponível: ${!!accessToken}`);
    
    const claimsWithArrivalDates = await enrichClaimsWithArrivalDates(allEnrichedClaims, accessToken);
    
    logger.progress(`✅ ${claimsWithArrivalDates.length} claims retornados do enriquecimento`);
    
    // Verificar quantos têm data_chegada_produto
    const withDate = claimsWithArrivalDates.filter(c => c.data_chegada_produto).length;
    logger.progress(`📊 Claims com data_chegada_produto: ${withDate}/${claimsWithArrivalDates.length}`);

    // ✅ CORREÇÃO 2: MAPEAR DADOS CORRETAMENTE
    logger.progress('🗺️ Mapeando dados...');
    logger.progress(`📊 Total de claims a mapear: ${claimsWithArrivalDates.length}`);
    
    const mappedClaims = claimsWithArrivalDates.map((claim: any) => {
      try {
        // ✅ DEBUG: Log estrutura do primeiro claim enriquecido
        if (claimsWithArrivalDates.indexOf(claim) === 0) {
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
          id: claim.id, // ✅ CRÍTICO: ID do claim para ReturnArrivalDateService
          order_id: claim.resource_id, // resource_id é o order_id
          date_created: claim.date_created, // Data de criação do claim
          amount: claim.seller_amount || null,
          reason: claim.reason?.description || null, // Motivo da devolução
          
          // ✅ ADICIONAR data_chegada_produto se veio do enrichment
          data_chegada_produto: claim.data_chegada_produto || null,
          
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
          
          // 🚚 SHIPMENT DATA (logistic_type da venda original)
          shipment_data: claim.shipment_data,
          
          // ⚖️ RESOLUTION DATA (dados de resolução do claim)
          resolution: claim.resolution,
          
          // 🆕 CHANGE DETAILS (para trocas)
          change_details: claim.change_details,
          
          // 🐛 DEBUG: Log da resolution
          ...(claim.resolution && console.log('⚖️ [Resolution Debug] Claim', claim.id, '- Resolution:', JSON.stringify(claim.resolution)) && {}),
          
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
      console.log('[DEBUG BACKEND] data_chegada_produto:', mappedClaims[0].data_chegada_produto || 'NULL'); // ✅ Verificar data de chegada
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
