import { makeServiceClient, makeClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";
import { fetchShopeeOrders } from "./shopee-integration.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

// ============= INLINE: mapShipmentCostsData =============
// (não pode importar de outro folder em edge functions)
function mapShipmentCostsData(costsData: any) {
  if (!costsData) return null;

  const receiverDiscounts = costsData.receiver?.discounts || [];
  const senderCharges = costsData.senders?.[0]?.charges || {};
  
  const totalReceiverDiscounts = Array.isArray(receiverDiscounts)
    ? receiverDiscounts.reduce(
        (sum: number, d: any) => sum + (Number(d.promoted_amount) || 0),
        0
      )
    : 0;

  return {
    gross_amount: costsData.gross_amount || 0,
    receiver: {
      cost: costsData.receiver?.cost || 0,
      discounts: receiverDiscounts,
      total_discount_amount: totalReceiverDiscounts,
      loyal_discount_amount: receiverDiscounts.find((d: any) => d.type === 'loyal')?.promoted_amount || 0,
      loyal_discount_rate: receiverDiscounts.find((d: any) => d.type === 'loyal')?.rate || 0
    },
    sender: {
      cost: costsData.senders?.[0]?.cost || 0,
      charge_flex: senderCharges.charge_flex || 0,
      charges: senderCharges
    },
    order_cost: costsData.gross_amount || 0,
    special_discount: totalReceiverDiscounts,
    net_cost: (costsData.gross_amount || 0) - totalReceiverDiscounts,
    raw_data: costsData
  };
}

// ============= SISTEMA BLINDADO ML TOKEN REFRESH =============

// Função para refresh preventivo de tokens com backoff exponencial
async function refreshIfNeeded(supabase: any, tokens: any, cid: string, authHeader: string | null, retryCount = 0) {
  const { access_token, refresh_token, expires_at, account_id } = tokens;
  
  if (!expires_at) return { access_token };
  
  const expiryTime = new Date(expires_at).getTime();
  const now = Date.now();
  const timeToExpiry = expiryTime - now;
  
  // Se expira em menos de 5 minutos, fazer refresh preventivo
  if (timeToExpiry < 5 * 60 * 1000) {
    console.log(`[unified-orders:${cid}] ⚠️ Token expira em ${Math.round(timeToExpiry/1000/60)} min - refresh preventivo`);
    
    try {
      const { data: refreshData } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id: account_id },
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      
      if (refreshData?.success && refreshData?.access_token) {
        console.log(`[unified-orders:${cid}] ✅ Refresh preventivo bem-sucedido`);
        return { access_token: refreshData.access_token };
      }
    } catch (e) {
      console.warn(`[unified-orders:${cid}] ⚠️ Erro no refresh preventivo (tentativa ${retryCount + 1}):`, e instanceof Error ? e.message : String(e));
      
      // Retry com backoff exponencial (máximo 3 tentativas)
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[unified-orders:${cid}] 🔄 Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshIfNeeded(supabase, tokens, cid, authHeader, retryCount + 1);
      }
    }
  }
  
  return { access_token };
}

async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  if (!orders?.length) return orders;

  console.log(`[unified-orders:${cid}] Enriquecendo ${orders.length} pedidos com dados completos`);
  
  // Cache para reputação por seller_id
  const sellerReputationCache = new Map<string, any>();
  
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      try {
        let enrichedOrder = { ...order };

        // 1. Enriquecer com dados detalhados da order
        try {
          const orderResp = await fetch(
            `https://api.mercadolibre.com/orders/${order.id}`,
            { 
              headers: { 
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'  // Header recomendado pela documentação
              } 
            }
          );

          if (orderResp.ok) {
            const orderData = await orderResp.json();
            enrichedOrder = {
              ...enrichedOrder,
              ...orderData,
              detailed_order: orderData,
              enriched: true
            };
          }
        } catch (error) {
          console.warn(`[unified-orders:${cid}] Erro ao buscar order ${order.id}:`, error);
        }
        
        // 1.5 Buscar reputação do seller (com cache)
        const sellerId = enrichedOrder.seller?.id || order.seller?.id;
        console.log(`[unified-orders:${cid}] 🏅 Seller ID encontrado:`, sellerId);
        
        if (sellerId && !sellerReputationCache.has(sellerId.toString())) {
          try {
            console.log(`[unified-orders:${cid}] 🔍 Buscando reputação para seller ${sellerId}...`);
            // ✅ FIX: Usar endpoint /users/{id} ao invés de /users/{id}/seller_reputation
            const reputationResp = await fetch(
              `https://api.mercadolibre.com/users/${sellerId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            );
            
            console.log(`[unified-orders:${cid}] 🏅 API User status:`, reputationResp.status);
            
            if (reputationResp.ok) {
              const userData = await reputationResp.json();
              // Extrair seller_reputation do objeto user
              const sellerReputation = userData.seller_reputation || null;
              sellerReputationCache.set(sellerId.toString(), sellerReputation);
              console.log(`[unified-orders:${cid}] ✅ Reputação obtida para seller ${sellerId}:`, {
                power_seller_status: sellerReputation?.power_seller_status,
                level_id: sellerReputation?.level_id
              });
            } else {
              const errorText = await reputationResp.text();
              console.warn(`[unified-orders:${cid}] ⚠️ Erro na API de usuário:`, reputationResp.status, errorText);
              sellerReputationCache.set(sellerId.toString(), null);
            }
          } catch (repError) {
            console.warn(`[unified-orders:${cid}] ⚠️ Exceção ao buscar dados do seller ${sellerId}:`, repError);
            sellerReputationCache.set(sellerId.toString(), null);
          }
        }
        
        // Adicionar reputação ao enrichedOrder
        if (sellerId) {
          const reputation = sellerReputationCache.get(sellerId.toString());
          console.log(`[unified-orders:${cid}] 🏅 Aplicando reputação para seller ${sellerId}:`, reputation);
          if (reputation) {
            enrichedOrder.seller_reputation = reputation;
          }
        }

        // 1.6 🆕 Buscar CPF/CNPJ do comprador via billing_info
        if (order.id) {
          try {
            console.log(`[unified-orders:${cid}] 📋 Buscando billing_info para pedido ${order.id}...`);
            const billingResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/billing_info`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-version': '2'  // ⚠️ CRÍTICO: Header obrigatório para billing_info
                }
              }
            );

            if (billingResp.ok) {
              const billingData = await billingResp.json();
              const documentType = billingData?.buyer?.billing_info?.identification?.type || null;
              const documentNumber = billingData?.buyer?.billing_info?.identification?.number || null;
              
              enrichedOrder.buyer_document_type = documentType;  // "CPF" ou "CNPJ"
              enrichedOrder.buyer_document_number = documentNumber;  // Número sem formatação
              enrichedOrder.billing_info = billingData;  // Dados completos do billing
              
              console.log(`[unified-orders:${cid}] ✅ CPF/CNPJ obtido para pedido ${order.id}:`, {
                type: documentType,
                number: documentNumber ? `${documentNumber.substring(0, 3)}***` : null
              });
            } else {
              console.warn(`[unified-orders:${cid}] ⚠️ Billing info não disponível para pedido ${order.id}: ${billingResp.status}`);
            }
          } catch (billingError) {
            console.warn(`[unified-orders:${cid}] ⚠️ Erro ao buscar billing_info do pedido ${order.id}:`, billingError);
          }
        }

        // 2. Enriquecer com dados de shipment
        if (order.shipping?.id) {
          try {
            const shippingResp = await fetch(
              `https://api.mercadolibre.com/shipments/${order.shipping.id}`,
              { 
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'  // Header obrigatório para shipments
                } 
              }
            );

            if (shippingResp.ok) {
              const shippingData = await shippingResp.json();

              // 2.a Buscar status_history do shipment
              let statusHistory = null;
              try {
                const historyResp = await fetch(
                  `https://api.mercadolibre.com/shipments/${order.shipping.id}/history`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'x-format-new': 'true'
                    }
                  }
                );

                if (historyResp.ok) {
                  statusHistory = await historyResp.json();
                  console.log(`[unified-orders:${cid}] ✅ status_history obtido para shipment ${order.shipping.id}`);
                }
              } catch (histErr) {
                console.warn(`[unified-orders:${cid}] Aviso ao buscar status_history do shipment ${order.shipping.id}:`, histErr);
              }

              // 2.b Endpoints adicionais: custos e SLA (executar em paralelo)
              // IMPORTANTE: /costs PRECISA do header x-format-new para retornar cost_components.special_discount
              try {
                const [costsResp, slaResp] = await Promise.all([
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'x-format-new': 'true'  // ⚠️ CRÍTICO para special_discount
                    }
                  }),
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/sla`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'x-format-new': 'true'
                    }
                  })
                ]);

                if (costsResp?.ok) {
                  const costsData = await costsResp.json();
                  (shippingData as any).costs = costsData;
                  console.log(`[unified-orders:${cid}] ➕ costs anexado ao shipment ${order.shipping.id}`);
                }
                if (slaResp?.ok) {
                  const slaData = await slaResp.json();
                  (shippingData as any).sla = slaData;
                  console.log(`[unified-orders:${cid}] ➕ sla anexado ao shipment ${order.shipping.id}`);
                }
              } catch (extraErr) {
                console.warn(`[unified-orders:${cid}] Aviso ao buscar costs/sla do shipment ${order.shipping.id}:`, extraErr);
              }

              enrichedOrder.shipping = {
                ...enrichedOrder.shipping,
                ...shippingData,
                status_history: statusHistory,
                detailed_shipping: shippingData,
                shipping_enriched: true
              };
            }
          } catch (error) {
            console.warn(`[unified-orders:${cid}] Erro ao enriquecer shipping ${order.shipping?.id}:`, error);
          }
        }

        // 3. Enriquecer dados de pack (status)
        if (order.pack_id) {
          try {
            const packResp = await fetch(
              `https://api.mercadolibre.com/packs/${order.pack_id}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (packResp.ok) {
              const packData = await packResp.json();
              (enrichedOrder as any).pack_data = packData;
              const pStatus = (packData?.status?.status) ?? packData?.status ?? null;
              const pDetail = (packData?.status?.detail) ?? packData?.status_detail ?? null;
              (enrichedOrder as any).pack_status = pStatus ?? null;
              (enrichedOrder as any).pack_status_detail = pDetail ?? null;
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar pack ${order.pack_id}:`, (err as any)?.message || err);
          }
        }

        // 4. Enriquecer com informações de cancelamento (cancel_detail)
        if (order.status === 'cancelled' && order.id) {
          try {
            const cancelResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/cancel_detail`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (cancelResp.ok) {
              const cancelData = await cancelResp.json();
              (enrichedOrder as any).cancel_detail = cancelData;
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar cancel_detail ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 5. Descontos já incluídos no objeto principal da order (conforme análise do usuário)
        // Não fazemos chamada separada, apenas extraímos do objeto principal
        if (order.discounts || enrichedOrder.discounts) {
          (enrichedOrder as any).discounts = order.discounts || enrichedOrder.discounts;
          console.log(`[unified-orders:${cid}] ✅ Descontos extraídos do objeto principal ${order.id}`);
        }

        // 6. Mediações já incluídas no objeto principal da order (conforme análise do usuário)
        // Não fazemos chamada separada, apenas extraímos do campo order.mediations
        if (order.mediations || enrichedOrder.mediations) {
          (enrichedOrder as any).mediations = order.mediations || enrichedOrder.mediations;
          console.log(`[unified-orders:${cid}] ✅ Mediações extraídas do objeto principal ${order.id}`);
        }

        // 7. Returns são acessados via claim_id (conforme análise do usuário)
        // Implementado na seção de claims abaixo

        // TESTE: Verificar se token tem acesso à Claims API
        try {
          const testResp = await fetch(
            `https://api.mercadolibre.com/post-purchase/v1/claims/search?limit=1`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'
              }
            }
          );
          console.log(`[unified-orders:${cid}] 🔑 Claims API test status: ${testResp.status}`);
          if (!testResp.ok) {
            const errorText = await testResp.text();
            console.log(`[unified-orders:${cid}] ❌ Claims API error: ${errorText}`);
          }
        } catch (err) {
          console.log(`[unified-orders:${cid}] ❌ Claims API connection error:`, err);
        }

        // 8. Buscar Claims relacionadas ao pedido (IMPLEMENTAÇÃO CORRIGIDA)
        if (order.id) {
          try {
            console.log(`[unified-orders:${cid}] 🔍 Buscando claims para pedido ${order.id}`);
            const claimsResp = await fetch(
              `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${order.id}&resource=order`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            
            console.log(`[unified-orders:${cid}] 🔍 Claims search executado para pedido ${order.id} - Status: ${claimsResp.status}`);
            
            if (claimsResp.ok) {
              const claimsData = await claimsResp.json();
              (enrichedOrder as any).claims = claimsData;
              
              if (claimsData.results?.length > 0) {
                console.log(`[unified-orders:${cid}] ✅ Encontrados ${claimsData.results.length} claims para pedido ${order.id}`);
                
                // Para cada claim, verificar se tem devoluções
                for (const claim of claimsData.results) {
                  if (claim.related_entities && claim.related_entities.includes('return')) {
                    console.log(`[unified-orders:${cid}] 🔄 Claim ${claim.id} tem devoluções associadas`);
                    await enrichWithReturnDetails(enrichedOrder, claim.id, accessToken, cid);
                  }
                }
              } else {
                console.log(`[unified-orders:${cid}] ℹ️ Nenhum claim encontrado para pedido ${order.id}`);
              }
            } else {
              console.warn(`[unified-orders:${cid}] ⚠️ Claims API retornou status ${claimsResp.status} para pedido ${order.id}`);
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] ❌ Erro ao buscar claims ${order.id}:`, err);
          }
        }

        // 9. Enriquecer com dados dos produtos detalhados (order_items + product info)
        if (order.order_items?.length) {
          try {
            const itemsWithDetails = await Promise.all(
              order.order_items.map(async (item: any) => {
                let enhancedItem = { ...item };
                
                // Buscar detalhes do item/listing
                if (item.item?.id) {
                  try {
                    const itemResp = await fetch(
                      `https://api.mercadolibre.com/items/${item.item.id}`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (itemResp.ok) {
                      const itemData = await itemResp.json();
                      enhancedItem.item_details = itemData;
                    }
                  } catch (error) {
                    console.warn(`[unified-orders:${cid}] Erro ao buscar item ${item.item.id}:`, error);
                  }
                }

                // Buscar informações do produto através do product_id
                if (item.item?.product_id) {
                  try {
                    const productResp = await fetch(
                      `https://api.mercadolibre.com/products/${item.item.product_id}`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (productResp.ok) {
                      const productData = await productResp.json();
                      enhancedItem.product_details = productData;
                    }
                  } catch (error) {
                    console.warn(`[unified-orders:${cid}] Erro ao buscar product ${item.item.product_id}:`, error);
                  }
                }

                return enhancedItem;
              })
            );
            enrichedOrder.order_items = itemsWithDetails;
          } catch (error) {
            console.warn(`[unified-orders:${cid}] Erro ao enriquecer items:`, error);
          }
        }

        return enrichedOrder;
      } catch (error) {
        console.warn(`[unified-orders:${cid}] Erro geral no enriquecimento da order ${order.id}:`, error);
        return order;
      }
    })
  );

  console.log(`[unified-orders:${cid}] Enriquecimento completo concluído`);
  return enrichedOrders;
}

// NOVAS FUNÇÕES PARA IMPLEMENTAÇÃO CORRETA DE DEVOLUÇÕES

// Função para enriquecer com detalhes de devolução via Claims API
async function enrichWithReturnDetails(order: any, claimId: string, accessToken: string, cid: string) {
  try {
    // Buscar detalhes da devolução via Claims
    const returnResp = await fetch(
      `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-format-new': 'true'
        }
      }
    );

    if (returnResp.ok) {
      const returnData = await returnResp.json();
      if (!order.detailed_returns) order.detailed_returns = [];
      order.detailed_returns.push(returnData);
      
      console.log(`[unified-orders:${cid}] ✅ Devoluções detalhadas obtidas para claim ${claimId}`);

      // Se tem reviews, buscar também
      if (returnData.results?.length) {
        for (const returnItem of returnData.results) {
          if (returnItem.related_entities && returnItem.related_entities.includes('reviews')) {
            await enrichWithReturnReviews(order, returnItem.id, accessToken, cid);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[unified-orders:${cid}] Erro ao buscar detalhes da devolução ${claimId}:`, err);
  }
}

// Função para enriquecer com reviews de devolução - ATUALIZADA conforme análise do usuário
async function enrichWithReturnReviews(order: any, returnData: any, accessToken: string, cid: string) {
  try {
    // Reviews estão incluídos nos dados de return (conforme análise do usuário)
    // Não fazemos chamada separada, apenas extraímos do objeto
    if (returnData.reviews || returnData.result?.reviews) {
      if (!order.return_reviews) order.return_reviews = [];
      order.return_reviews.push(returnData.reviews || returnData.result.reviews);
      
      console.log(`[unified-orders:${cid}] ✅ Reviews extraídas dos dados de return`);
    }
  } catch (err) {
    console.warn(`[unified-orders:${cid}] Erro ao extrair reviews da devolução:`, err);
  }
}

function transformMLOrders(orders: any[], integration_account_id: string, accountName?: string, cid?: string) {
  // 📍 DEBUG: Log do accountName para verificar mapeamento
  if (orders.length > 0) {
    console.log(`📦 [transformMLOrders:${cid}] AccountName recebido:`, accountName);
    console.log(`📦 [transformMLOrders:${cid}] Total de pedidos:`, orders.length);
  }
  
  return orders.map((order, index) => {
    const buyer = order.buyer || {};
    const seller = order.seller || {};
    const shipping = order.shipping || {};
    const payments = order.payments || [];
    const firstPayment = payments[0] || {};
    const detailedOrder = order.detailed_order || order;
    const detailedShipping = shipping.detailed_shipping || shipping;
    const orderItems = order.order_items || [];
    const packData = order.pack_data || {};
    const context = order.context || {};
    const feedback = order.feedback || {};
    
    // 📍 LOCAL DE ESTOQUE: Detectar marketplace e tipo logístico para mapeamento
    const logisticTypeRaw = detailedShipping?.logistic?.type || shipping?.logistic?.type || shipping?.logistic_type || detailedShipping?.logistic_type;
    const marketplace_origem = 'Mercado Livre'; // Para Shopee e outras plataformas, ajustar no futuro
    
    // 📍 DEBUG: Log dos primeiros 3 pedidos para verificar dados de mapeamento
    if (index < 3) {
      console.log(`📦 [transformMLOrders:${cid}] Pedido #${index}:`, {
        numero: order.id,
        empresa: accountName || 'Mercado Livre',
        marketplace_origem,
        tipo_logistico_raw: logisticTypeRaw
      });
    }
    
    // 🔍 DEBUG PROFUNDO: Log IMEDIATO da estrutura costs (ANTES de qualquer processamento)
    if (String(order.id) === '2000013656902262') {
      console.log(`[unified-orders:${cid}] 🔍 PEDIDO ${order.id} - Análise shipping.costs:`);
      console.log(`[unified-orders:${cid}]   Type of shipping.costs:`, typeof shipping?.costs);
      console.log(`[unified-orders:${cid}]   shipping.costs keys:`, shipping?.costs ? Object.keys(shipping.costs) : 'N/A');
      console.log(`[unified-orders:${cid}]   shipping.costs object:`, shipping?.costs);
      console.log(`[unified-orders:${cid}] 🔍 PEDIDO ${order.id} - Análise detailedShipping.costs:`);
      console.log(`[unified-orders:${cid}]   Type of detailedShipping.costs:`, typeof detailedShipping?.costs);
      console.log(`[unified-orders:${cid}]   detailedShipping.costs keys:`, detailedShipping?.costs ? Object.keys(detailedShipping.costs) : 'N/A');
      console.log(`[unified-orders:${cid}]   detailedShipping.costs object:`, detailedShipping?.costs);
    }

    // Cálculos de quantidades e valores
    const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const productTitles = orderItems.map((item: any) => 
      item.item_details?.title || item.item?.title || item.title
    ).filter(Boolean).join(', ');
    const skus = orderItems.map((item: any) => 
      item.item_details?.seller_custom_field || item.item?.seller_custom_field || item.seller_sku
    ).filter(Boolean).join(', ');

    // Debug das colunas problemáticas
    console.log(`[unified-orders:${cid}] 🐛 Debug colunas para pedido ${order.id}:`, {
      pickup_id: shipping.pickup_id,
      manufacturing_ending_date: order.manufacturing_ending_date,
      comment: order.buyer_comment || order.comment,
      tags: order.tags,
      pack_id: order.pack_id
    });

    // Valores de frete e receitas
    const fretePagoCliente = shipping.cost || 0;
    const receitaFlex = shipping.seller_cost_benefit || 0;
    const custoEnvioSeller = shipping.base_cost || 0;
    
    // 🆕 NOVOS CAMPOS FLEX (baseado na estrutura real da API)
    // shipping.costs vem do /shipments/{id}/costs com estrutura:
    // { receiver: { cost, discounts: [{ promoted_amount }] }, gross_amount, senders: [{ charges: { charge_flex } }] }
    
    const costs = shipping?.costs || detailedShipping?.costs;
    
    // 🔍 DEBUG CRÍTICO: Investigar de onde vem R$ 31,80
    const shipmentId = shipping?.id || detailedShipping?.id;
    const grossAmountRaw = costs?.gross_amount;
    
    // Verificar se há duplicação por múltiplos items/shipments
    const orderItemsCount = order.order_items?.length || 0;
    const allShipmentsCount = order.shipping?.length || 0;
    
    console.log(`[unified-orders:${cid}] 🚨 DEBUG GROSS_AMOUNT - Pedido ${order.id}:`, {
      cliente: shipping?.destination?.receiver_name || detailedShipping?.destination?.receiver_name,
      shipment_id: shipmentId,
      gross_amount_raw: grossAmountRaw,
      order_items_count: orderItemsCount,
      all_shipments_count: allShipmentsCount,
      receiver_discounts: costs?.receiver?.discounts,
      costs_structure: {
        gross_amount: costs?.gross_amount,
        receiver_cost: costs?.receiver?.cost,
        senders_cost: costs?.senders?.[0]?.cost,
        has_multiple_senders: costs?.senders?.length > 1
      },
      is_exact_double: grossAmountRaw === (costs?.receiver?.discounts?.[0]?.promoted_amount || 0) * 2
    });
    
    // order_cost = gross_amount (valor bruto do envio)
    const flexOrderCost = costs?.gross_amount || 0;
    
    // special_discount = SOMA de TODOS os promoted_amount do receiver
    // (incluindo loyal, ratio e outros tipos de desconto)
    // ✅ VALIDAÇÃO: Garantir que discounts é um array antes de usar reduce
    const receiverDiscounts = costs?.receiver?.discounts;
    const flexSpecialDiscount = Array.isArray(receiverDiscounts)
      ? receiverDiscounts.reduce((sum: number, d: any) => sum + (Number(d.promoted_amount) || 0), 0)
      : 0;
    
    const flexNetCost = flexOrderCost - flexSpecialDiscount;
    
    // Procurar logistic_type em todas as possíveis localizações
    const flexLogisticType = shipping?.logistic?.type || 
                             detailedShipping?.logistic?.type || 
                             shipping?.logistic_type || 
                             detailedShipping?.logistic_type || 
                             null;
    
    // RECEITA FLEX:
    // - Se logistic_type = 'self_service' (Envios Flex) → special_discount
    // - Caso contrário → 0
    const receitaFlexCalculada = flexLogisticType === 'self_service' 
      ? flexSpecialDiscount 
      : 0;
    
    // 🔍 DEBUG FLEX: Log detalhado dos valores calculados
    if (flexOrderCost > 0 || flexSpecialDiscount > 0) {
      console.log(`[unified-orders:${cid}] 💰 FLEX AUDIT - Pedido ${order.id}:`, {
        costs_exists: !!costs,
        receiver_exists: !!costs?.receiver,
        discounts_is_array: Array.isArray(receiverDiscounts),
        discounts_count: receiverDiscounts?.length || 0,
        gross_amount: costs?.gross_amount,
        flexOrderCost,
        flexSpecialDiscount,
        flexNetCost,
        flexLogisticType,
        is_self_service: flexLogisticType === 'self_service',
        receitaFlexCalculada_NOVA: receitaFlexCalculada,
        logic_applied: flexLogisticType === 'self_service' ? 'SPECIAL_DISCOUNT' : 'ORDER_COST'
      });
    }
    
    // 🔍 DEBUG: Valores calculados dos campos Flex
    if (String(order.id) === '2000013656902262') {
      console.log(`[unified-orders:${cid}] 💰 VALORES FLEX CALCULADOS - Pedido ${order.id}:`);
      console.log(`  flexOrderCost (gross_amount):`, flexOrderCost);
      console.log(`  flexSpecialDiscount (loyal promoted_amount):`, flexSpecialDiscount);
      console.log(`  flexNetCost (calculado):`, flexNetCost);
      console.log(`  receitaFlexCalculada:`, receitaFlexCalculada);
    }
    
    // Debug TIPO LOGÍSTICO de TODOS os pedidos - EXPANDIDO
    console.log(`[unified-orders:${cid}] 📦 TIPO LOGÍSTICO Pedido ${order.id}:`, {
      // Valor final usado
      logistic_type_final: flexLogisticType,
      
      // Todas as possíveis fontes (NOVA ORDEM DE PRIORIDADE!)
      sources: {
        'shipping.logistic.type': shipping?.logistic?.type,                  // ← PRIORIDADE 1
        'detailedShipping.logistic.type': detailedShipping?.logistic?.type, // ← PRIORIDADE 2
        'shipping.logistic_type': shipping?.logistic_type,
        'detailedShipping.logistic_type': detailedShipping?.logistic_type,
      },
      
      // Custos (AGORA COM TODAS AS FONTES POSSÍVEIS!)
      costs: {
        order_cost: flexOrderCost,
        special_discount: flexSpecialDiscount,
        net_cost: flexNetCost,
        receita_flex_calculada: receitaFlexCalculada, // ← EXPOR NO DEBUG
        sources: {
          'shipping.costs.order_cost': shipping?.costs?.order_cost,                                            // ← NOVO!
          'detailedShipping.costs.order_cost': detailedShipping?.costs?.order_cost,                           // ← NOVO!
          'shipping.order_cost': shipping?.order_cost,
          'detailedShipping.order_cost': detailedShipping?.order_cost,
          'shipping.costs.cost_components.special_discount': shipping?.costs?.cost_components?.special_discount,        // ← NOVO!
          'detailedShipping.costs.cost_components.special_discount': detailedShipping?.costs?.cost_components?.special_discount, // ← NOVO!
          'shipping.cost_components.special_discount': shipping?.cost_components?.special_discount,
          'detailedShipping.cost_components.special_discount': detailedShipping?.cost_components?.special_discount,
        }
      },
      
      // Flags de enriquecimento
      enrichment: {
        has_detailed_shipping: !!shipping?.detailed_shipping,
        has_costs: !!shipping?.costs,
        shipping_enriched: shipping?.shipping_enriched,
        shipping_keys: Object.keys(shipping || {}),
        detailedShipping_keys: Object.keys(detailedShipping || {})
      }
    });
    
    // Informações de endereço mais detalhadas
    const address = detailedShipping.receiver_address || shipping.receiver_address || {};
    
    // Extrair dados de stock multi-origem
    const stockData = orderItems.flatMap((item: any) => item.stock || []);
    const storeIds = stockData.map((s: any) => s.store_id).filter(Boolean).join(', ');
    const networkNodeIds = stockData.map((s: any) => s.network_node_id).filter(Boolean).join(', ');
    
    // Tags do pedido
    const orderTags = (order.tags || []).join(', ');
    
    // Dados financeiros detalhados
    const marketplaceFees = payments.map((p: any) => p.marketplace_fee || 0).reduce((a: number, b: number) => a + b, 0);
    const refundedAmount = payments.map((p: any) => p.transaction_amount_refunded || 0).reduce((a: number, b: number) => a + b, 0);
    const overpaidAmount = payments.map((p: any) => p.overpaid_amount || 0).reduce((a: number, b: number) => a + b, 0);
    
    return {
      id: order.id?.toString() || '',
      numero: order.id?.toString() || '',
      nome_cliente: buyer.nickname || buyer.first_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || null,
      cpf_cnpj: buyer.identification?.number || null,
      data_pedido: order.date_created || null,
      data_prevista: shipping.date_first_printed || order.date_closed || null,
      situacao: order.status || null,
      valor_total: order.total_amount || 0,
      valor_frete: fretePagoCliente,
      valor_desconto: order.coupon?.amount || 0,
      numero_ecommerce: order.pack_id?.toString() || null,
      numero_venda: order.id?.toString() || null,
      empresa: accountName || seller.nickname || seller.id?.toString() || 'Mercado Livre',
      marketplace: 'mercadolivre',
      cidade: address.city?.name || null,
      uf: address.state?.id || null,
      codigo_rastreamento: shipping.tracking_number || null,
      url_rastreamento: shipping.tracking_method === 'custom' ? null : 
        shipping.tracking_number ? `https://www.mercadolivre.com.br/gz/tracking/${shipping.tracking_number}` : null,
      obs: order.buyer_comment || null,
      obs_interna: null,
      integration_account_id,
      created_at: order.date_created || new Date().toISOString(),
      updated_at: order.last_updated || order.date_created || new Date().toISOString(),
      
      // ✅ Campos existentes enriquecidos
      // Dados básicos do pedido
      last_updated: order.last_updated || order.date_created,
      paid_amount: firstPayment.total_paid_amount || order.paid_amount || 0,
      valor_liquido_vendedor: (order.total_amount || 0) - (shipping.cost || 0) - (order.marketplace_fee || 0),
      date_created: order.date_created,
      pack_id: order.pack_id?.toString() || null,
      pickup_id: shipping.pickup_id || shipping.id || null,
      manufacturing_ending_date: order.manufacturing_ending_date || null,
      comment: order.buyer_comment || order.comment || orderItems.find((item: any) => item.comment)?.comment || null,
      tags: Array.isArray(order.tags)
        ? order.tags
        : (typeof order.tags === 'string'
            ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []),
      pack_status: order.pack_status ?? order.pack_data?.status ?? null,
      pack_status_detail: order.pack_status_detail ?? order.pack_data?.status_detail ?? order.pack_data?.status?.detail ?? null,
      
      // Informações de cancelamento
      cancel_reason: order.cancel_detail?.reason || null,
      cancel_responsible: order.cancel_detail?.responsible || null,
      cancel_date: order.cancel_detail?.cancel_date || null,
      
      // Descontos aplicados
      discounts_applied: order.discounts?.length ? order.discounts.map((d: any) => `${d.type}:${d.amount}`).join(', ') : null,
      
      // Mediações
      mediations_tags: order.mediations?.length ? order.mediations.map((m: any) => m.mediation_tags).flat().join(', ') : null,
      
      // Informações dos produtos
      skus_produtos: skus || 'Sem SKU',
      quantidade_total: totalQuantity,
      titulo_produto: productTitles || 'Produto sem título',
      
      // 📍 LOCAL DE ESTOQUE: Dados para mapeamento automático
      marketplace_origem,
      tipo_logistico_raw: logisticTypeRaw,
      tipo_logistico: flexLogisticType || logisticTypeRaw || null,
      
      // ===== DADOS DE DEVOLUÇÕES (CLAIMS API + ORDERS API) =====
      // Priorizar dados detalhados da Claims API se disponíveis
      return_status: (() => {
        // 1. Dados mais detalhados via Claims API
        if (order.detailed_returns?.length) {
          const latestReturn = order.detailed_returns[0]?.results?.[0];
          return latestReturn?.status || null;
        }
        // 2. Fallback para dados básicos da Orders API
        if (order.returns?.length) {
          return order.returns[0]?.status;
        }
        return null;
      })(),
      
      return_id: (() => {
        if (order.detailed_returns?.length) {
          const latestReturn = order.detailed_returns[0]?.results?.[0];
          return latestReturn?.id || null;
        }
        if (order.returns?.length) {
          return order.returns[0]?.id;
        }
        return null;
      })(),
      
      return_date: (() => {
        if (order.detailed_returns?.length) {
          const latestReturn = order.detailed_returns[0]?.results?.[0];
          return latestReturn?.date_created || null;
        }
        if (order.returns?.length) {
          return order.returns[0]?.date_created;
        }
        return null;
      })(),
      
      return_reason: (() => {
        if (order.detailed_returns?.length) {
          const latestReturn = order.detailed_returns[0]?.results?.[0];
          return latestReturn?.reason || null;
        }
        if (order.returns?.length) {
          return order.returns[0]?.reason;
        }
        return null;
      })(),
      
      refund_date: (() => {
        if (order.detailed_returns?.length) {
          const latestReturn = order.detailed_returns[0]?.results?.[0];
          return latestReturn?.refund?.date || null;
        }
        if (order.returns?.length) {
          return order.returns[0]?.refund?.date;
        }
        return null;
      })(),
      
      // ===== CAMPOS ESPECÍFICOS DE DEVOLUÇÕES VIA CLAIMS API =====
      return_status_money: order.detailed_returns?.length ? order.detailed_returns[0]?.status_money : null,
      return_shipment_status: order.detailed_returns?.length ? 
        (order.detailed_returns[0]?.shipments?.length ? order.detailed_returns[0].shipments[0].status : null) : null,
      return_intermediate_check: order.detailed_returns?.length ? order.detailed_returns[0]?.intermediate_check : null,
      return_claim_id: order.claims?.results?.length ? order.claims.results[0]?.id : null,
      return_has_reviews: order.return_reviews?.length > 0,
      return_subtype: order.detailed_returns?.length ? order.detailed_returns[0]?.subtype : null,
      return_refund_at: order.detailed_returns?.length ? order.detailed_returns[0]?.refund_at : null,
      
      // Contadores para referência
      claims_count: order.claims?.results?.length || 0,
      detailed_returns_count: order.detailed_returns?.length || 0,
      return_reviews_count: order.return_reviews?.length || 0,
      
      // Valores financeiros detalhados
      frete_pago_cliente: fretePagoCliente,
      receita_flex: receitaFlexCalculada, // ← Valor que o seller RECEBE do ML
      
      // Desconto Cupom: NÃO usar special_discount (é desconto do comprador, não cupom do seller)
      // Se houver cupons reais, virão de outro campo do order
      desconto_cupom: 0, // TODO: Mapear de order.coupon se existir
      
      taxa_marketplace: order.marketplace_fee || 0,
      custo_envio_seller: custoEnvioSeller,
      
      // 🆕 FLEX: Campos de análise detalhada
      flex_order_cost: flexOrderCost,              // = gross_amount (bruto)
      flex_special_discount: flexSpecialDiscount,  // = desconto loyal do COMPRADOR
      flex_net_cost: flexNetCost,                  // = order_cost - special_discount
      flex_logistic_type: flexLogisticType,
      
      // Informações de pagamento
      metodo_pagamento: firstPayment.payment_method_id || null,
      status_pagamento: firstPayment.status || null,
      tipo_pagamento: firstPayment.payment_type_id || null,
      
      // Informações de envio detalhadas
      status_envio: shipping.status || null,
      logistic_mode: detailedShipping?.logistic?.mode || shipping?.logistic?.mode || shipping?.mode || null,
      tipo_logistico: detailedShipping?.logistic?.type || shipping?.logistic?.type || shipping?.logistic_type || null,
      tipo_metodo_envio: detailedShipping?.shipping_method?.type || shipping?.shipping_method?.type || null,
      tipo_entrega: shipping?.delivery_type || null,
      substatus: shipping?.substatus || detailedShipping?.status_detail || null,
      
      // 🆕 REPUTAÇÃO DO VENDEDOR
      power_seller_status: order.seller_reputation?.power_seller_status || null,
      level_id: order.seller_reputation?.level_id || null,
      
      // 🔍 DEBUG REPUTAÇÃO
      seller_reputation_debug: order.seller_reputation ? {
        has_data: true,
        power_seller: order.seller_reputation.power_seller_status,
        level: order.seller_reputation.level_id
      } : { has_data: false },
      
      // "Combinados": reutilizamos as colunas para retornar custos (costs) e SLA conforme solicitado
      modo_envio_combinado: (detailedShipping?.costs
        ? `gross:${detailedShipping.costs?.gross_amount ?? ''}; receiver:${detailedShipping.costs?.receiver?.cost ?? ''}; sender:${Array.isArray(detailedShipping.costs?.senders) && detailedShipping.costs.senders[0]?.cost != null ? detailedShipping.costs.senders[0].cost : ''}`
        : (detailedShipping?.logistic?.mode || shipping?.mode || null)),
      metodo_envio_combinado: (detailedShipping?.sla
        ? `${detailedShipping?.shipping_method?.name || shipping?.shipping_method?.name || '—'} | SLA:${detailedShipping.sla?.status ?? ''}${detailedShipping.sla?.expected_date ? ' até ' + detailedShipping.sla.expected_date : ''}`
        : (detailedShipping?.shipping_method?.name || shipping?.shipping_method?.name || null)),
      
      // Endereço completo
      rua: address.street_name || null,
      numero_endereco: address.street_number || null,
      bairro: address.neighborhood?.name || null,
      cep: address.zip_code || null,

      // 🆕 NOVOS CAMPOS DA DOCUMENTAÇÃO DE PACKS - Análise posterior
      
      // 🔹 TAGS DO PEDIDO (removido para evitar duplicação - já mapeado acima)
      conditions: orderItems.map((item: any) => item.item?.condition).filter(Boolean).join(', ') || null,
      global_prices: orderItems.map((item: any) => item.global_price).filter((p: any) => p != null).join(', ') || null,
      net_weights: orderItems.map((item: any) => item.item?.net_weight).filter((w: any) => w != null).join(', ') || null,
      manufacturing_days_total: orderItems.map((item: any) => item.manufacturing_days).filter((d: any) => d != null).reduce((a: number, b: number) => a + b, 0) || null,
      sale_fees_total: orderItems.map((item: any) => item.sale_fee || 0).reduce((a: number, b: number) => a + b, 0),
      listing_type_ids: orderItems.map((item: any) => item.listing_type_id).filter(Boolean).join(', ') || null,
      
      // 🆕 Dados de produtos detalhados
      product_names: orderItems.map((item: any) => item.product_details?.name).filter(Boolean).join(', ') || null,
      product_brands: orderItems.map((item: any) => item.product_details?.brand).filter(Boolean).join(', ') || null,
      product_models: orderItems.map((item: any) => item.product_details?.model).filter(Boolean).join(', ') || null,
      product_gtin: orderItems.map((item: any) => item.product_details?.gtin).filter(Boolean).join(', ') || null,
      
      // Dados completos para fallback
      raw: order,
      unified: {
        order_items: orderItems,
        shipping: detailedShipping,
        buyer: buyer,
        seller: seller,
        payments: payments,
        pack_data: packData,
        context: context,
        feedback: feedback
      },
      
      // 💰 DADOS COSTS MAPEADOS (salvos em JSONB)
      dados_costs: costs ? mapShipmentCostsData(costs) : null
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  // Criar dois clients: serviço (bypass RLS) e usuário (contexto org)
  const userClient = makeClient(req.headers.get("Authorization"));
  const serviceClient = makeServiceClient();
  const cid = crypto.randomUUID().slice(0, 8);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return fail('Missing Authorization header', 401);
    }

    let body = await req.json();
    
    // ✅ VALIDAÇÃO CORRIGIDA: Garantir integration_account_id
    const validateRequest = (requestBody: any) => {
      // Se integration_account_id estiver ausente, tentar alternativas
      if (!requestBody.integration_account_id && !requestBody.integration_account_ids) {
        // Buscar da URL ou headers como fallback
        const url = new URL(req.url);
        const accountId = url.searchParams.get('integration_account_id');
        if (accountId) {
          requestBody.integration_account_id = accountId;
        } else {
          throw new Error('integration_account_id é obrigatório');
        }
      }
      return requestBody;
    };

    // Aplicar validação
    try {
      body = validateRequest(body);
    } catch (error) {
      console.error(`[unified-orders:${cid}] ❌ Validação falhou:`, error instanceof Error ? error.message : String(error));
      return fail(error instanceof Error ? error.message : String(error), 400);
    }
    
    if (Deno.env.get("DEBUG_ENABLED") === "true") {
      console.log(`[unified-orders:${cid}] 🚨 DEBUG BODY COMPLETO:`, JSON.stringify(body, null, 2));
    }
    
    const {
      integration_account_id,
      status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit,
      offset
    } = body;

    console.log(`[unified-orders:${cid}] DEBUG START - Filtros detalhados:`, {
      integration_account_id,
      filtros_geograficos: { cidade, uf },
      filtros_valor: { valorMin, valorMax },
      filtros_busca: { q, search },
      filtros_data: { date_from, date_to },
      filtros_status: { status }
    });

    console.log(`[unified-orders:${cid}] filters`, {
      integration_account_id,
      status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit: limit || 25,
      offset: offset || 0
    });

    if (!integration_account_id) {
      console.error(`[unified-orders:${cid}] ❌ integration_account_id ausente no body`);
      return fail('integration_account_id é obrigatório. Verifique se uma conta ML está selecionada.', 400);
    }

    // ✅ 1. Busca account com validação de usuário (RLS ativo)
    const { data: accountData, error: accountError } = await userClient
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError) {
      console.error(`[unified-orders:${cid}] FALHA: Busca account`, accountError);
      return fail('Integration account not found', 404);
    }

    // 🛡️ NOVO: Detecção segura de provider
    const provider = accountData.provider || 'mercadolivre';
    console.log(`[unified-orders:${cid}] 🔍 Provider detectado: ${provider}`);

    // 🛒 ROTEAMENTO SHOPEE (ISOLADO - NÃO AFETA ML)
    if (provider === 'shopee') {
      console.log(`[unified-orders:${cid}] 🛒 ROTA SHOPEE - buscando credenciais`);
      
      const { data: shopeeSecrets, error: shopeeSecretError } = await serviceClient
        .from('integration_secrets')
        .select('partner_id, partner_key, shop_id, access_token, simple_tokens, secret_enc')
        .eq('integration_account_id', integration_account_id)
        .eq('provider', 'shopee')
        .maybeSingle();

      if (shopeeSecretError || !shopeeSecrets) {
        console.error(`[unified-orders:${cid}] 🛒 Shopee credentials not found:`, shopeeSecretError);
        return fail('Shopee credentials not found', 404);
      }

      try {
        // 🛒 Descriptografar credenciais Shopee se necessário
        let shopeeCredentials = shopeeSecrets;
        if (shopeeSecrets.secret_enc) {
          console.log(`[unified-orders:${cid}] 🛒 Descriptografando credenciais Shopee`);
          // TODO: Implementar descriptografia quando necessário
        }

        // 🛒 Buscar pedidos Shopee (ISOLADO)
        const shopeeResult = await fetchShopeeOrders(body, accountData, shopeeCredentials, cid);
        
        console.log(`[unified-orders:${cid}] 🛒 Shopee resultado:`, {
          total: shopeeResult.total,
          pedidos: shopeeResult.pedidos?.length || 0
        });
        
        return ok({
          ...shopeeResult,
          provider: 'shopee',
          account_id: integration_account_id
        });
        
      } catch (shopeeError) {
        console.error(`[unified-orders:${cid}] 🛒 Erro Shopee:`, shopeeError);
        return fail(`Shopee error: ${shopeeError instanceof Error ? shopeeError.message : String(shopeeError)}`, 500);
      }
    }

    // 🛡️ CONTINUAR COM LÓGICA ML EXISTENTE (INALTERADA)
    console.log(`[unified-orders:${cid}] 🛒 ROTA ML - continuando fluxo original`);

    // ✅ 2. SISTEMA BLINDADO: Busca integration_secrets com SERVICE CLIENT (bypass RLS) - SOMENTE ML
    const { data: secretRow, error: secretError } = await serviceClient
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    // Log com fingerprint da chave para debug
    const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
    
    console.log(`[unified-orders:${cid}] keyFp ${keyFingerprint}`);
    console.log(`[unified-orders:${cid}] 🔍 SECRET SEARCH DEBUG:`, {
      secretError: secretError?.message,
      hasRow: !!secretRow,
      secretRowType: typeof secretRow,
      secretRowKeys: secretRow ? Object.keys(secretRow) : null,
      hasSimpleTokens: !!secretRow?.simple_tokens,
      simpleTokensType: typeof secretRow?.simple_tokens,
      simpleTokensLength: secretRow?.simple_tokens ? secretRow.simple_tokens.length : 0,
      useSimple: secretRow?.use_simple,
      hasSecretEnc: !!secretRow?.secret_enc,
      secretEncType: typeof secretRow?.secret_enc,
      secretEncLength: secretRow?.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'non-string') : 0,
      hasLegacyTokens: !!(secretRow?.access_token || secretRow?.refresh_token),
      keyFp: keyFingerprint,
      accountId: integration_account_id
    });

    let accessToken = '';
    let refreshToken = '';
    let expiresAt = '';
    
    // ✅ 3. Primeiro: tentar nova estrutura simples com descriptografia direta
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        console.log(`[unified-orders:${cid}] 🔓 Descriptografia direta - tamanho:`, simpleTokensStr.length);
        
        // Remover prefixo SALT2024:: e descriptografar base64
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          console.log(`[unified-orders:${cid}] 🔓 Base64 extraído, tamanho: ${base64Data.length}`);
          
          try {
            // Decodificar base64 para JSON
            const jsonStr = atob(base64Data);
            console.log(`[unified-orders:${cid}] 🔓 JSON decodificado: ${jsonStr.substring(0, 100)}...`);
            
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
            refreshToken = tokensData.refresh_token || '';
            expiresAt = tokensData.expires_at || '';
            
            console.log(`[unified-orders:${cid}] ✅ Descriptografia direta bem-sucedida:`, {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasExpiresAt: !!expiresAt,
              accessTokenLength: accessToken.length,
              refreshTokenLength: refreshToken.length
            });
          } catch (parseError) {
            console.error(`[unified-orders:${cid}] ❌ Erro ao parsear JSON:`, parseError);
          }
        } else {
          console.warn(`[unified-orders:${cid}] ⚠️ simple_tokens sem prefixo SALT2024::`);
        }
      } catch (err) {
        console.error(`[unified-orders:${cid}] ❌ Erro descriptografia direta:`, err instanceof Error ? err.message : String(err));
      }
    } else {
      console.log(`[unified-orders:${cid}] ⚠️ Não usando descriptografia simples:`, {
        hasSecretRow: !!secretRow,
        useSimple: secretRow?.use_simple,
        hasSimpleTokens: !!secretRow?.simple_tokens
      });
    }
    
    // ✅ 4. SISTEMA BLINDADO: 4 Fallbacks sequenciais de decriptação
    if (!accessToken && !refreshToken && secretRow?.secret_enc) {
      console.log(`[unified-orders:${cid}] 🔓 Iniciando sistema blindado de decriptação - dados:`, {
        secretEncType: typeof secretRow.secret_enc,
        secretEncConstructor: secretRow.secret_enc?.constructor?.name,
        secretEncLength: secretRow.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'non-string') : 0,
        secretEncPreview: typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.substring(0, 100) + '...' : 'not-string'
      });
      
      let decrypted = null;
      let fallbackUsed = '';
      
      // FALLBACK 1: Bytea PostgreSQL (\x format)
      try {
        let raw = secretRow.secret_enc as any;
        if (typeof raw === 'string' && raw.startsWith('\\x')) {
          console.log(`[unified-orders:${cid}] 🔓 Tentando FALLBACK 1: Bytea PostgreSQL`);
          const hexString = raw.slice(2);
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
          const b64String = new TextDecoder().decode(bytes);
          decrypted = await decryptAESGCM(b64String);
          fallbackUsed = 'bytea';
          console.log(`[unified-orders:${cid}] ✅ FALLBACK 1 bem-sucedido`);
        }
      } catch (e) { console.warn(`[unified-orders:${cid}] ❌ Fallback 1 (bytea) falhou:`, e instanceof Error ? e.message : String(e)); }

      // FALLBACK 2: Buffer objects (Node.js)
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw && typeof raw === 'object' && (raw as any).type === 'Buffer' && Array.isArray((raw as any).data)) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 2: Buffer Node.js`);
            const b64String = new TextDecoder().decode(Uint8Array.from((raw as any).data));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'buffer';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 2 (buffer) falhou:`, e instanceof Error ? e.message : String(e)); }
      }

      // FALLBACK 3: Uint8Array direct
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw instanceof Uint8Array || (raw && typeof raw === 'object' && typeof (raw as ArrayBuffer).byteLength === 'number')) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 3: Uint8Array`);
            const b64String = raw instanceof Uint8Array ? 
              new TextDecoder().decode(raw) : 
              new TextDecoder().decode(new Uint8Array(raw as ArrayBuffer));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'uint8array';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 3 (uint8array) falhou:`, e instanceof Error ? e.message : String(e)); }
      }

      // FALLBACK 4: String simples + validação de integridade
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          const payload = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
          if (payload) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 4: String simples`);
            // Validação de integridade: deve parecer com base64
            if (payload.match(/^[A-Za-z0-9+/]+=*$/)) {
              decrypted = await decryptAESGCM(payload);
              fallbackUsed = 'string';
            } else {
              console.warn(`[unified-orders:${cid}] Payload não parece base64 válido, ignorando`);
            }
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 4 (string) falhou:`, e instanceof Error ? e.message : String(e)); }
      }

      // Processar resultado da decriptação
      if (decrypted && decrypted.trim()) {
        try {
          const secretData = JSON.parse(decrypted);
          accessToken = secretData.access_token || '';
          refreshToken = secretData.refresh_token || '';
          expiresAt = secretData.expires_at || '';
          console.log(`[unified-orders:${cid}] ✅ Decriptação bem-sucedida via ${fallbackUsed.toUpperCase()} - tokens extraídos:`, {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasExpiresAt: !!expiresAt,
            accessTokenLength: accessToken.length,
            refreshTokenLength: refreshToken.length,
            fallbackUsed
          });
        } catch (e) {
          console.error(`[unified-orders:${cid}] ❌ JSON inválido após decriptação via ${fallbackUsed}:`, e instanceof Error ? e.message : String(e));
        }
      } else {
        console.error(`[unified-orders:${cid}] ❌ TODOS os 4 fallbacks falharam! - estado:`, {
          decrypted: decrypted ? `"${decrypted.substring(0, 50)}..."` : 'null/empty',
          decryptedLength: decrypted ? decrypted.length : 0,
          fallbackUsed: fallbackUsed || 'none'
        });
      }
    }

    // ✅ 5. VALIDAÇÃO DE SECRETS OBRIGATÓRIA (Sistema Blindado)
    if (!accessToken && !refreshToken) {
      // Validação crítica de secrets antes de prosseguir
      const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
      console.error(`[unified-orders:${cid}] 🔒 NO_TOKENS detectado - keyFp: ${keyFingerprint}`);
      console.error(`[unified-orders:${cid}] ⚠️ Detalhes da conta ML:`, {
        accountId: integration_account_id,
        hasSecretRow: !!secretRow,
        hasSimpleTokens: !!secretRow?.simple_tokens,
        hasSecretEnc: !!secretRow?.secret_enc,
        useSimple: secretRow?.use_simple
      });
      
      // 🆕 SOLUÇÃO: Retornar erro informativo que orienta o usuário a reconectar
      return fail(
        `Os tokens de acesso ao Mercado Livre expiraram ou estão corrompidos para a conta ${accountData.name || integration_account_id}. ` +
        `Por favor, vá em Integrações e reconecte esta conta.`,
        401
      );
    }

    // ✅ 6. VERIFICAÇÃO DE EXPIRAÇÃO (Sistema Blindado)
    const refreshResult = await refreshIfNeeded(serviceClient, { 
      access_token: accessToken, 
      refresh_token: refreshToken, 
      expires_at: expiresAt, 
      account_id: integration_account_id 
    }, cid, authHeader);
    const finalAccessToken = refreshResult.access_token || accessToken;

    // ✅ 7. Buscar pedidos no Mercado Livre
    const seller = accountData.account_identifier;
    if (!seller) {
      return fail('Seller ID not found in account_identifier', 400);
    }

    console.log(`[unified-orders:${cid}] Buscando pedidos ML para seller ${seller}`);

    // Construir URL com filtros corretos para ML API
    const mlUrl = new URL('https://api.mercadolibre.com/orders/search');
    mlUrl.searchParams.set('seller', seller);
    mlUrl.searchParams.set('sort', 'date_desc');
    // Garantir que o limite não exceda o máximo permitido pelo ML (≤ 51)
    const safeLimit = Math.min(limit || 25, 50);
    mlUrl.searchParams.set('limit', String(safeLimit));
    mlUrl.searchParams.set('offset', String(offset || 0));

    // Mapeamento de status - não enviar status customizados para ML API
    // Filtros de status locais serão aplicados após buscar os dados
    const validMLStatuses = ['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'not_delivered', 'cancelled'];
    
    if (status && validMLStatuses.includes(status)) {
      mlUrl.searchParams.set('order.status', status);
    }

    // Filtros de data - ML exige formato ISO completo
    if (date_from) {
      try {
        const dateFromISO = new Date(date_from + 'T00:00:00.000Z').toISOString();
        mlUrl.searchParams.set('order.date_created.from', dateFromISO);
      } catch (e) {
        console.warn(`[unified-orders:${cid}] Data from inválida: ${date_from}`, e);
      }
    }
    if (date_to) {
      try {
        const dateToISO = new Date(date_to + 'T23:59:59.999Z').toISOString();
        mlUrl.searchParams.set('order.date_created.to', dateToISO);
      } catch (e) {
        console.warn(`[unified-orders:${cid}] Data to inválida: ${date_to}`, e);
      }
    }

    console.log(`[unified-orders:${cid}] ML API URL:`, mlUrl.toString());

    const mlResponse = await fetch(mlUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${finalAccessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`[unified-orders:${cid}] ML API Error ${mlResponse.status}:`, errorText);
      return fail(`ML API Error: ${mlResponse.status}`, mlResponse.status);
    }

    const mlData = await mlResponse.json();
    const orders = mlData.results || [];

    console.log(`[unified-orders:${cid}] ML retornou ${orders.length} pedidos`);

    // Enriquecer com dados de shipping se necessário
    const enrichedOrders = await enrichOrdersWithShipping(orders, finalAccessToken, cid);

    // Aplicar filtros locais que ML não suporta
    let filteredOrders = enrichedOrders;

    // Filtros de status (para status customizados que ML não suporta)
    if (status && !['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'not_delivered', 'cancelled'].includes(status)) {
      filteredOrders = filteredOrders.filter(order => {
        const orderStatus = order.status;
        const shippingStatus = order.shipping?.status;
        
        // Mapeamento de status customizados
        switch (status) {
          case 'Pendente':
          case 'Aguardando':
            return ['confirmed', 'payment_required', 'payment_in_process'].includes(orderStatus);
          case 'Pago':
          case 'Aprovado':
            return orderStatus === 'paid';
          case 'Entregue':
            return orderStatus === 'delivered' || shippingStatus === 'delivered';
          case 'Cancelado':
            return orderStatus === 'cancelled';
          case 'Enviado':
            return orderStatus === 'shipped' || shippingStatus === 'shipped';
          case 'Devolvido':
          case 'Reembolsado':
            return shippingStatus === 'not_delivered' || orderStatus === 'cancelled';
          default:
            return orderStatus === status || shippingStatus === status;
        }
      });
    }

    // Filtros de valor
    if (valorMin !== undefined || valorMax !== undefined) {
      filteredOrders = filteredOrders.filter(order => {
        const valor = order.total_amount || 0;
        if (valorMin !== undefined && valor < valorMin) return false;
        if (valorMax !== undefined && valor > valorMax) return false;
        return true;
      });
    }

    // Filtros geográficos
    if (cidade || uf) {
      filteredOrders = filteredOrders.filter(order => {
        const orderCidade = order.shipping?.receiver_address?.city?.name || '';
        const orderUf = order.shipping?.receiver_address?.state?.id || '';
        
        if (cidade && !orderCidade.toLowerCase().includes(cidade.toLowerCase())) return false;
        if (uf && orderUf.toLowerCase() !== uf.toLowerCase()) return false;
        return true;
      });
    }

    // Filtros de busca
    if (search || q) {
      const searchTerm = (search || q || '').toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const buyer = order.buyer || {};
        const searchableText = [
          order.id?.toString(),
          buyer.nickname,
          buyer.first_name,
          buyer.identification?.number
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }

    console.log(`[unified-orders:${cid}] Após filtros locais: ${filteredOrders.length} pedidos`);

    // 📍 DEBUG: Verificar accountData antes da transformação
    console.log(`📦 [unified-orders:${cid}] AccountData ANTES da transformação:`, {
      hasAccountData: !!accountData,
      accountId: accountData?.id,
      accountName: accountData?.name,
      accountProvider: accountData?.provider,
      integration_account_id
    });

    // Transformar para formato unificado
    const transformedOrders = transformMLOrders(filteredOrders, integration_account_id, accountData?.name, cid);

    // 📍 DEBUG: Verificar primeiros 3 pedidos transformados
    console.log(`📦 [unified-orders:${cid}] Primeiros 3 pedidos transformados:`, 
      transformedOrders.slice(0, 3).map(p => ({
        numero: p.numero,
        empresa: p.empresa,
        marketplace_origem: p.marketplace_origem,
        tipo_logistico: p.tipo_logistico,
        tipo_logistico_raw: p.tipo_logistico_raw
      }))
    );

    return ok({
      // ⚠️ DEBUG TEMPORÁRIO: Incluir no response para debug no browser
      _debug_account: {
        hasAccountData: !!accountData,
        accountName: accountData?.name,
        primeiros3: transformedOrders.slice(0, 3).map(p => ({
          numero: p.numero,
          empresa: p.empresa,
          marketplace_origem: p.marketplace_origem,
          tipo_logistico: p.tipo_logistico
        }))
      },
      // Compatibilidade: retornar tanto 'results' (raw ML enriquecido) quanto 'pedidos' (formato unificado)
      results: enrichedOrders,
      pedidos: transformedOrders,
      paging: mlData?.paging ?? { total: transformedOrders.length, limit: safeLimit, offset: offset || 0 },
      total: (mlData?.paging?.total ?? transformedOrders.length),
      url: mlUrl.toString(),
      provider: 'mercadolivre',
      account_id: integration_account_id,
      seller_id: seller
    });

  } catch (error) {
    console.error(`[unified-orders:${cid}] Unexpected error:`, error);
    return fail(error instanceof Error ? error.message : String(error), 500);
  }
});