/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções através de Claims do Mercado Livre
 */

import { corsHeaders, makeServiceClient } from '../_shared/client.ts';
import { getErrorMessage } from '../_shared/error-handler.ts';

interface RequestBody {
  accountIds: string[];
  filters?: {
    search?: string;
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

/**
 * 🧑 FASE 1: Buscar dados do comprador da API do ML
 * Função OPCIONAL - se falhar, não quebra o sistema
 */
async function fetchBuyerInfo(buyerId: number, accessToken: string): Promise<any | null> {
  try {
    console.log(`👤 Buscando dados do comprador ${buyerId}...`);
    
    const response = await fetch(`https://api.mercadolibre.com/users/${buyerId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Não foi possível buscar buyer ${buyerId}: ${response.status}`);
      return null;
    }

    const buyerData = await response.json();
    
    console.log(`✅ Buyer ${buyerId} encontrado: ${buyerData.nickname}`);
    
    return {
      id: buyerData.id,
      nickname: buyerData.nickname || 'N/A',
      first_name: buyerData.first_name || null,
      last_name: buyerData.last_name || null,
      email: buyerData.email || null,
      phone: buyerData.phone ? {
        area_code: buyerData.phone.area_code || null,
        number: buyerData.phone.number || null,
        verified: buyerData.phone.verified || false,
      } : null,
      permalink: buyerData.permalink || `https://www.mercadolivre.com.br/perfil/${buyerData.id}`,
      registration_date: buyerData.registration_date || null,
      country_id: buyerData.country_id || null,
      site_id: buyerData.site_id || null,
      buyer_reputation: buyerData.buyer_reputation ? {
        tags: buyerData.buyer_reputation.tags || [],
        canceled_transactions: buyerData.buyer_reputation.canceled_transactions || 0,
      } : null,
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar buyer ${buyerId}:`, error);
    return null;
  }
}

/**
 * 📦 FASE 2: Buscar dados do produto da API do ML
 * Função OPCIONAL - se falhar, não quebra o sistema
 */
async function fetchProductInfo(itemId: string, accessToken: string): Promise<any | null> {
  try {
    console.log(`📦 Buscando dados do produto ${itemId}...`);
    
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Não foi possível buscar item ${itemId}: ${response.status}`);
      return null;
    }

    const itemData = await response.json();
    
    console.log(`✅ Item ${itemId} encontrado: ${itemData.title}`);
    
    // Buscar SKU dos atributos ou seller_custom_field
    let sku = itemData.seller_custom_field || null;
    if (!sku && itemData.attributes) {
      const skuAttr = itemData.attributes.find((attr: any) => 
        attr.id === 'SELLER_SKU' || attr.name === 'SKU'
      );
      sku = skuAttr?.value_name || null;
    }
    
    return {
      id: itemData.id,
      title: itemData.title || 'Produto sem título',
      price: itemData.price || 0,
      currency_id: itemData.currency_id || 'BRL',
      thumbnail: itemData.thumbnail || itemData.pictures?.[0]?.url || null,
      permalink: itemData.permalink || `https://produto.mercadolivre.com.br/${itemData.id}`,
      sku: sku,
      condition: itemData.condition || null,
      available_quantity: itemData.available_quantity || 0,
      sold_quantity: itemData.sold_quantity || 0,
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar item ${itemId}:`, error);
    return null;
  }
}

/**
 * 📍 FASE 5: Buscar dados de tracking do shipment
 * Função OPCIONAL - se falhar, não quebra o sistema
 */
async function fetchShipmentTracking(shipmentId: number, accessToken: string): Promise<any | null> {
  try {
    console.log(`📍 Buscando tracking do shipment ${shipmentId}...`);
    
    // Buscar dados básicos do shipment
    const shipmentResponse = await fetch(`https://api.mercadolibre.com/shipments/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!shipmentResponse.ok) {
      console.warn(`⚠️ Não foi possível buscar shipment ${shipmentId}: ${shipmentResponse.status}`);
      return null;
    }

    const shipmentData = await shipmentResponse.json();
    
    // Extrair informações de tracking
    const trackingNumber = shipmentData.tracking_number || null;
    const currentStatus = shipmentData.status || 'unknown';
    const substatus = shipmentData.substatus?.description || null;
    
    // Histórico de tracking
    const trackingHistory: any[] = [];
    
    if (shipmentData.tracking_method === 'ML' && shipmentData.status_history) {
      // Tracking gerenciado pelo ML
      shipmentData.status_history.forEach((event: any) => {
        trackingHistory.push({
          date: event.date_shipped || event.date_created || new Date().toISOString(),
          status: event.status || 'unknown',
          description: event.status_detail || substatus || 'Status atualizado',
          location: event.receiver_address?.city?.name || null,
          checkpoint: event.checkpoint || null,
        });
      });
    }
    
    // Dados do carrier (transportadora)
    const carrier = shipmentData.shipping_option?.name || 
                    shipmentData.logistic_type || 
                    null;
    
    // Localização atual
    let currentLocation = null;
    if (shipmentData.receiver_address) {
      const addr = shipmentData.receiver_address;
      currentLocation = `${addr.city?.name || ''}, ${addr.state?.name || ''}`.trim();
      if (currentLocation === ',') currentLocation = null;
    }
    
    console.log(`✅ Tracking obtido para shipment ${shipmentId}: ${trackingHistory.length} eventos`);
    
    return {
      shipment_id: shipmentId,
      current_status: currentStatus,
      current_status_description: substatus || currentStatus,
      current_location: currentLocation,
      estimated_delivery: shipmentData.status_history?.estimated_delivery?.date || null,
      tracking_number: trackingNumber,
      carrier: carrier,
      last_update: shipmentData.last_updated || shipmentData.date_created,
      tracking_history: trackingHistory,
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar tracking ${shipmentId}:`, error);
    return null;
  }
}


Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = makeServiceClient();

    // Parse request body
    const body: RequestBody = await req.json();
    const { accountIds, filters = {}, pagination = {} } = body;

    if (!accountIds || accountIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'accountIds é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const offset = pagination.offset || 0;
    const limit = pagination.limit || 50;

    console.log(`🔍 Buscando devoluções para ${accountIds.length} conta(s)`);

    const allReturns: any[] = [];
    let totalReturns = 0;

    for (const accountId of accountIds) {
      try {
        // Buscar tokens DIRETO do banco (como unified-orders faz)
        const { data: secretRow, error: secretError } = await supabase
          .from('integration_secrets')
          .select('simple_tokens, use_simple, access_token')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .maybeSingle();

        if (secretError || !secretRow) {
          console.error(`❌ Erro ao buscar secret para conta ${accountId}:`, secretError?.message);
          continue;
        }

        let accessToken = '';
        
        // Tentar descriptografia simples primeiro
        if (secretRow.use_simple && secretRow.simple_tokens) {
          try {
            const simpleTokensStr = secretRow.simple_tokens as string;
            if (simpleTokensStr.startsWith('SALT2024::')) {
              const base64Data = simpleTokensStr.replace('SALT2024::', '');
              const jsonStr = atob(base64Data);
              const tokensData = JSON.parse(jsonStr);
              accessToken = tokensData.access_token || '';
              console.log(`✅ Token obtido via descriptografia simples para conta ${accountId}`);
            }
          } catch (err) {
            console.error(`❌ Erro descriptografia simples:`, err);
          }
        }
        
        // Fallback para access_token legado
        if (!accessToken && secretRow.access_token) {
          accessToken = secretRow.access_token;
          console.log(`✅ Token obtido via campo legado para conta ${accountId}`);
        }

        if (!accessToken) {
          console.error(`❌ Token ML não encontrado para conta ${accountId}`);
          continue;
        }

        // Buscar seller_id da tabela integration_accounts
        const { data: accountData } = await supabase
          .from('integration_accounts')
          .select('account_identifier')
          .eq('id', accountId)
          .single();

        const sellerId = accountData?.account_identifier;

        if (!sellerId) {
          console.error(`❌ seller_id não encontrado para conta ${accountId}`);
          continue;
        }

        console.log(`🔍 Buscando claims para seller ${sellerId}`);

        // PASSO 1: Buscar claims da API do ML
        const params = new URLSearchParams();
        params.append('player_role', 'respondent');
        params.append('player_user_id', sellerId);
        params.append('limit', '100'); // Aumentado para pegar mais claims
        params.append('offset', '0');
        params.append('sort', 'date_created:desc');
        
        // APLICAR FILTROS DE DATA (date_created)
        if (filters.dateFrom) {
          params.append('date_created_from', `${filters.dateFrom}T00:00:00.000Z`);
          console.log(`📅 Filtro dateFrom aplicado: ${filters.dateFrom}`);
        }
        if (filters.dateTo) {
          params.append('date_created_to', `${filters.dateTo}T23:59:59.999Z`);
          console.log(`📅 Filtro dateTo aplicado: ${filters.dateTo}`);
        }

        const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`;
        console.log(`🌐 Claims URL: ${claimsUrl}`);

        let claimsResponse = await fetch(claimsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        // Se token expirado (401), tentar refresh automático
        if (!claimsResponse.ok && claimsResponse.status === 401) {
          console.log(`🔄 Token expirado para conta ${accountId}, tentando refresh...`);
          
          try {
            // Chamar função de refresh
            const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolibre-token-refresh`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ integration_account_id: accountId }),
            });

            const refreshData = await refreshResponse.json();

            if (refreshResponse.ok && refreshData.success && refreshData.access_token) {
              accessToken = refreshData.access_token;
              console.log(`✅ Token renovado com sucesso para conta ${accountId}`);
              
              // Tentar novamente com o novo token
              claimsResponse = await fetch(claimsUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (!claimsResponse.ok) {
                const errorText = await claimsResponse.text();
                console.error(`❌ Mesmo com token renovado, falhou (${claimsResponse.status}):`, errorText);
                continue;
              }
            } else {
              console.error(`❌ Falha ao renovar token para conta ${accountId}:`, JSON.stringify(refreshData));
              console.error(`   - HTTP Status: ${refreshResponse.status}`);
              console.error(`   - Error Type: ${refreshData.error_type}`);
              console.error(`   - Message: ${refreshData.error || refreshData.message}`);
              
              // Se é erro de reconexão necessária, pular esta conta
              if (refreshData.error_type === 'reconnect_required') {
                console.warn(`⚠️ Conta ${accountId} precisa ser reconectada no OAuth`);
              }
              continue;
            }
          } catch (refreshError) {
            console.error(`❌ Erro ao tentar refresh para conta ${accountId}:`, refreshError);
            continue;
          }
        }

        const claimsData = await claimsResponse.json();
        console.log(`✅ ML retornou ${claimsData.data?.length || 0} claims totais`);

        // PASSO 2: Para CADA claim, tentar buscar devolução
        // (já que related_entities vem undefined na API de busca)
        if (claimsData.data && Array.isArray(claimsData.data)) {
          console.log(`📦 Verificando devoluções em ${claimsData.data.length} claims...`);

          // Processar cada claim para verificar se tem devolução
          for (const claim of claimsData.data) {
            try {
              const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`;
              
              const returnResponse = await fetch(returnUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              // Se retornou 200, o claim TEM devolução
              if (returnResponse.ok) {
                const returnData = await returnResponse.json();
                
                // LOG COMPLETO para análise (apenas primeira devolução para não poluir)
                if (allReturns.length === 0) {
                  console.log(`\n📋 ESTRUTURA COMPLETA DA API /returns:`, JSON.stringify(returnData, null, 2));
                  console.log(`\n🔑 CAMPOS DISPONÍVEIS:`, Object.keys(returnData));
                }
                
                console.log(`✅ Claim ${claim.id} TEM devolução! ID: ${returnData.id}, Status: ${returnData.status}, reason_id: ${claim.reason_id || 'NULL'}`);
                
                // Mapear TODOS os dados da devolução conforme documentação
                const firstShipment = returnData.shipments?.[0];
                const shippingAddress = firstShipment?.destination?.shipping_address;
                
                // Buscar dados de review se disponível
                let reviewData: any = null;
                if (returnData.related_entities?.includes('reviews')) {
                  try {
                    const reviewUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns/reviews`;
                    const reviewResponse = await fetch(reviewUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (reviewResponse.ok) {
                      reviewData = await reviewResponse.json();
                      console.log(`✅ Review obtida para claim ${claim.id}:`, JSON.stringify(reviewData, null, 2));
                    } else {
                      console.warn(`⚠️ Review não encontrada (${reviewResponse.status}) para claim ${claim.id}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar review do claim ${claim.id}:`, error);
                  }
                } else {
                  console.log(`ℹ️ Claim ${claim.id} não tem reviews (related_entities: ${returnData.related_entities})`);
                }
                
                // Buscar lead time (data estimada) se tiver shipment_id
                let leadTimeData: any = null;
                if (firstShipment?.shipment_id) {
                  try {
                    const leadTimeUrl = `https://api.mercadolibre.com/shipments/${firstShipment.shipment_id}/lead_time`;
                    const leadTimeResponse = await fetch(leadTimeUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'x-format-new': 'true',
                      },
                    });
                    
                    if (leadTimeResponse.ok) {
                      leadTimeData = await leadTimeResponse.json();
                      console.log(`✅ Lead time obtido para shipment ${firstShipment.shipment_id}:`, JSON.stringify(leadTimeData, null, 2));
                    } else {
                      console.warn(`⚠️ Lead time não disponível (${leadTimeResponse.status}) para shipment ${firstShipment.shipment_id}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar lead time do shipment ${firstShipment.shipment_id}:`, error);
                  }
                } else {
                  console.log(`ℹ️ Return ${returnData.id} não tem shipment_id válido`);
                }
                
                // ✅ FASE 1, 2, 3 & 5: Buscar dados do pedido para obter buyer_id, item_id, dados financeiros e tracking
                let orderData: any = null;
                let buyerInfo: any = null;
                let productInfo: any = null;
                let financialInfo: any = null;
                let trackingInfo: any = null;
                
                if (returnData.resource_type === 'order' && returnData.resource_id) {
                  try {
                    console.log(`📦 Buscando dados do pedido ${returnData.resource_id}...`);
                    
                    const orderResponse = await fetch(
                      `https://api.mercadolibre.com/orders/${returnData.resource_id}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json',
                        },
                      }
                    );
                    
                    if (orderResponse.ok) {
                      orderData = await orderResponse.json();
                      console.log(`✅ Pedido ${returnData.resource_id} obtido! Buyer ID: ${orderData.buyer?.id || 'N/A'}`);
                      
                      // FASE 1: Se temos buyer_id, buscar dados do comprador
                      if (orderData.buyer?.id) {
                        buyerInfo = await fetchBuyerInfo(orderData.buyer.id, accessToken);
                      }
                      
                      // FASE 2: Se temos item_id, buscar dados do produto
                      const firstOrderItem = returnData.orders?.[0];
                      if (firstOrderItem?.item_id) {
                        productInfo = await fetchProductInfo(firstOrderItem.item_id, accessToken);
                      }
                      
                      // ✅ FASE 3: Extrair dados financeiros do pedido
                      if (orderData) {
                        const payments = orderData.payments || [];
                        const firstPayment = payments[0] || {};
                        
                        // Calcular valor total pago
                        const totalPaid = payments.reduce((sum: number, payment: any) => {
                          return sum + (payment.total_paid_amount || 0);
                        }, 0);
                        
                        // Valor que será reembolsado (pode variar conforme status da devolução)
                        let refundAmount = 0;
                        if (returnData.status_money === 'refunded') {
                          refundAmount = totalPaid; // Já foi reembolsado
                        } else if (returnData.status_money === 'retained') {
                          refundAmount = totalPaid; // Será reembolsado após entrega
                        }
                        
                        financialInfo = {
                          total_amount: orderData.total_amount || 0,
                          paid_amount: totalPaid,
                          currency_id: orderData.currency_id || 'BRL',
                          refund_amount: refundAmount,
                          payment_status: firstPayment.status || null,
                          payment_method: firstPayment.payment_method_id || null,
                          payment_type: firstPayment.payment_type_id || null,
                          shipping_cost: orderData.shipping?.cost || 0,
                        };
                        
                        console.log(`💰 Dados financeiros extraídos: Total ${financialInfo.total_amount} ${financialInfo.currency_id}`);
                      }
                    } else {
                      console.warn(`⚠️ Não foi possível buscar pedido ${returnData.resource_id}: ${orderResponse.status}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar dados do pedido ${returnData.resource_id}:`, error);
                    // Continua mesmo se falhar - não quebra o sistema
                  }
                }
                
                // ✅ FASE 5: Buscar tracking do shipment se disponível
                if (firstShipment?.shipment_id) {
                  trackingInfo = await fetchShipmentTracking(firstShipment.shipment_id, accessToken);
                }

                // Extrair dados da primeira review se existir
                const firstReview = reviewData?.resource_reviews?.[0];
                
                allReturns.push({
                  // ID da conta de integração para identificar a origem
                  integration_account_id: accountId,
                  
                  // Campos principais
                  id: returnData.id,
                  claim_id: returnData.claim_id,
                  order_id: returnData.resource_id,
                  status: { id: returnData.status, description: returnData.status },
                  status_money: { id: returnData.status_money, description: returnData.status_money },
                  subtype: { id: returnData.subtype, description: returnData.subtype },
                  
                  // Dados do primeiro shipment
                  shipment_id: firstShipment?.shipment_id || null,
                  shipment_status: firstShipment?.status || '-',
                  tracking_number: firstShipment?.tracking_number || null,
                  shipment_destination: firstShipment?.destination?.name || null,
                  shipment_type: firstShipment?.type || null,
                  
                  // Datas
                  date_created: returnData.date_created,
                  date_closed: returnData.date_closed,
                  last_updated: returnData.last_updated,
                  refund_at: returnData.refund_at,
                  
                  // Recursos
                  resource_id: returnData.resource_id,
                  resource_type: returnData.resource_type,
                  
                  // Endereço de destino
                  destination_address: shippingAddress?.address_line || null,
                  destination_city: shippingAddress?.city?.name || null,
                  destination_state: shippingAddress?.state?.name || null,
                  destination_zip: shippingAddress?.zip_code || null,
                  destination_neighborhood: shippingAddress?.neighborhood?.name || null,
                  destination_country: shippingAddress?.country?.name || null,
                  destination_comment: shippingAddress?.comment || null,
                  destination_street_name: shippingAddress?.street_name || null,
                  destination_street_number: shippingAddress?.street_number || null,
                  
                  // Motivo da devolução - NÃO vem na API de returns, precisa buscar do claim
                  reason_id: claim.reason_id || null,
                  
                  // Dados de revisão (quando related_entities inclui "reviews")
                  review_method: firstReview?.method || null,
                  review_stage: firstReview?.stage || null,
                  review_status: firstReview?.status || null,
                  product_condition: firstReview?.product_condition || null,
                  product_destination: firstReview?.product_destination || null,
                  benefited: firstReview?.benefited || null,
                  seller_status: firstReview?.seller_status || null,
                  
                  // Dados de previsão de entrega (lead time)
                  estimated_delivery_date: leadTimeData?.estimated_delivery_time?.date || null,
                  estimated_delivery_from: leadTimeData?.estimated_delivery_time?.shipping || leadTimeData?.estimated_delivery_time?.time_frame?.from || null,
                  estimated_delivery_to: leadTimeData?.estimated_delivery_time?.handling ? 
                    (leadTimeData.estimated_delivery_time.shipping || 0) + (leadTimeData.estimated_delivery_time.handling || 0) :
                    leadTimeData?.estimated_delivery_time?.time_frame?.to || null,
                  estimated_delivery_limit: leadTimeData?.estimated_delivery_limit?.date || null,
                  has_delay: leadTimeData?.delay && leadTimeData.delay.length > 0 ? true : false,
                  
                  // Arrays completos
                  orders: returnData.orders || [],
                  shipments: returnData.shipments || [],
                  related_entities: returnData.related_entities || [],
                  
                  // Outros
                  intermediate_check: returnData.intermediate_check,
                  
                  // ✅ FASE 1: Dados do comprador enriquecidos
                  buyer_info: buyerInfo,
                  
                  // ✅ FASE 2: Dados do produto enriquecidos
                  product_info: productInfo,
                  
                  // ✅ FASE 3: Dados financeiros enriquecidos
                  financial_info: financialInfo,
                  
                  // ✅ FASE 5: Dados de tracking enriquecidos
                  tracking_info: trackingInfo,

                  // Order info (legacy)
                  order: orderData ? {
                    id: orderData.id,
                    date_created: orderData.date_created,
                    seller_id: orderData.seller?.id || null,
                    buyer_id: orderData.buyer?.id || null,
                  } : null,
                  resource: returnData.resource_type,
                });
              } else if (returnResponse.status === 404) {
                // 404 = claim não tem devolução (normal)
                // Não loga para não poluir
              } else {
                // Outro erro
                const errorText = await returnResponse.text();
                console.warn(`⚠️ Erro ${returnResponse.status} ao verificar devolução do claim ${claim.id}:`, errorText.substring(0, 150));
              }
            } catch (error) {
              console.error(`❌ Erro ao processar claim ${claim.id}:`, error);
            }
          }

          console.log(`\n📦 TOTAL: ${allReturns.length} devoluções encontradas de ${claimsData.data.length} claims`);
          totalReturns = allReturns.length;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar conta ${accountId}:`, error);
        continue;
      }
    }

    // Aplicar filtro de busca local se necessário
    let filteredReturns = allReturns;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReturns = allReturns.filter((ret) =>
        ret.id?.toString().includes(searchLower) ||
        ret.claim_id?.toString().includes(searchLower) ||
        ret.order_id?.toString().includes(searchLower)
      );
    }

    console.log(`📦 Retornando ${filteredReturns.length} devoluções de ${totalReturns} claims totais`);

    return new Response(
      JSON.stringify({
        returns: filteredReturns,
        total: filteredReturns.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
