/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções através de Claims do Mercado Livre
 * 
 * FASE 2: Implementa salvamento automático de dados enriquecidos via UPSERT
 */

import { corsHeaders, makeServiceClient } from '../_shared/client.ts';
import { getErrorMessage } from '../_shared/error-handler.ts';
import { calculateDeadlines, type LeadTimeData, type ClaimData, type Deadlines } from './utils/deadlineCalculator.ts';

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
                
                // ✅ FIX CRÍTICO: Declarar TODAS as variáveis no INÍCIO para evitar escopo local
                let availableActions: any = null;
                let shippingCosts: any = null;
                let fulfillmentInfo: any = null;
                let leadTimeData: any = null;
                let orderData: any = null;
                let buyerInfo: any = null;
                let productInfo: any = null;
                let financialInfo: any = null;
                let trackingInfo: any = null;
                let communicationInfo: any = null;
                let deadlines: any = null;
                
                // Mapear TODOS os dados da devolução conforme documentação
                const firstShipment = returnData.shipments?.[0];
                const shippingAddress = firstShipment?.destination?.shipping_address;
                
                // ✅ FASE 10: Buscar dados avançados de review com anexos e quantidades
                let reviewData: any = null;
                let reviewReasons: any[] = [];
                
                if (returnData.related_entities?.includes('reviews')) {
                  try {
                    // 1️⃣ Buscar razões disponíveis para o vendedor
                    console.log(`📋 Buscando razões de review disponíveis...`);
                    const reasonsUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/reasons`;
                    const reasonsResponse = await fetch(reasonsUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (reasonsResponse.ok) {
                      const reasonsData = await reasonsResponse.json();
                      reviewReasons = reasonsData.reasons || [];
                      console.log(`✅ ${reviewReasons.length} razões de review obtidas`);
                    } else {
                      console.warn(`⚠️ Razões de review não disponíveis (${reasonsResponse.status})`);
                    }
                    
                    // 2️⃣ Buscar dados completos da review com anexos
                    const reviewUrl = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnData.id}/reviews`;
                    const reviewResponse = await fetch(reviewUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (reviewResponse.ok) {
                      reviewData = await reviewResponse.json();
                      console.log(`✅ Review detalhada obtida para return ${returnData.id}:`, JSON.stringify(reviewData, null, 2));
                      
                      // Log de anexos encontrados
                      const firstReviewDetail = reviewData?.reviews?.[0]?.resource_reviews?.[0];
                      if (firstReviewDetail?.attachments?.length > 0) {
                        console.log(`📎 ${firstReviewDetail.attachments.length} anexos encontrados na review`);
                      }
                      if (firstReviewDetail?.missing_quantity) {
                        console.log(`⚠️ Quantidade faltante: ${firstReviewDetail.missing_quantity}`);
                      }
                      if (firstReviewDetail?.damaged_quantity) {
                        console.log(`💔 Quantidade danificada: ${firstReviewDetail.damaged_quantity}`);
                      }
                      if (firstReviewDetail?.meli_decision) {
                        console.log(`⚖️ Decisão MELI encontrada: ${firstReviewDetail.meli_decision.benefited || 'N/A'}`);
                      }
                    } else {
                      console.warn(`⚠️ Review não encontrada (${reviewResponse.status}) para return ${returnData.id}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar review do return ${returnData.id}:`, error);
                  }
                } else {
                  console.log(`ℹ️ Return ${returnData.id} não tem reviews (related_entities: ${returnData.related_entities})`);
                }
                
                // Buscar lead time (data estimada) se tiver shipment_id
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
                }
                
                // ✅ FASE 11: Buscar ações disponíveis do vendedor
                try {
                  console.log(`🎬 Buscando ações disponíveis para claim ${claim.id}...`);
                  const claimDetailUrl = `https://api.mercadolibre.com/claims/${claim.id}`;
                  const claimDetailResponse = await fetch(claimDetailUrl, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (claimDetailResponse.ok) {
                    const claimDetail = await claimDetailResponse.json();
                    
                    if (claimDetail.available_actions) {
                      availableActions = {
                        can_review_ok: claimDetail.available_actions.can_review_ok || false,
                        can_review_fail: claimDetail.available_actions.can_review_fail || false,
                        can_print_label: claimDetail.available_actions.can_print_label || false,
                        can_appeal: claimDetail.available_actions.can_appeal || false,
                        can_refund: claimDetail.available_actions.can_refund || false,
                        can_ship: claimDetail.available_actions.can_ship || false,
                        actions_last_updated: new Date().toISOString(),
                      };
                      
                      console.log(`✅ Ações disponíveis para claim ${claim.id}:`, availableActions);
                    } else {
                      console.log(`ℹ️ Claim ${claim.id} não possui ações disponíveis`);
                    }
                  } else {
                    console.warn(`⚠️ Não foi possível buscar detalhes do claim ${claim.id}: ${claimDetailResponse.status}`);
                  }
                } catch (error) {
                  console.warn(`⚠️ Erro ao buscar ações do claim ${claim.id}:`, getErrorMessage(error));
                }
                
                // ✅ FASE 12: Buscar custos detalhados de logística
                if (firstShipment?.shipment_id) {
                  try {
                    console.log(`💰 Buscando custos de logística para shipment ${firstShipment.shipment_id}...`);
                    const costsUrl = `https://api.mercadolibre.com/shipments/${firstShipment.shipment_id}/costs`;
                    const costsResponse = await fetch(costsUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (costsResponse.ok) {
                      const costsData = await costsResponse.json();
                      console.log(`✅ Custos obtidos para shipment ${firstShipment.shipment_id}:`, JSON.stringify(costsData, null, 2));
                      
                      // Extrair valores principais
                      const forwardShipping = costsData.forward_shipping || costsData.shipping?.forward;
                      const returnShipping = costsData.return_shipping || costsData.shipping?.return;
                      
                      shippingCosts = {
                        custo_envio_ida: forwardShipping?.amount || null,
                        custo_envio_retorno: returnShipping?.amount || null,
                        custo_total_logistica: (forwardShipping?.amount || 0) + (returnShipping?.amount || 0),
                        currency_id: costsData.currency_id || forwardShipping?.currency_id || 'BRL',
                        breakdown: {
                          forward_shipping: forwardShipping ? {
                            amount: forwardShipping.amount,
                            currency_id: forwardShipping.currency_id || 'BRL',
                            description: forwardShipping.description || 'Frete original do pedido',
                          } : undefined,
                          return_shipping: returnShipping ? {
                            amount: returnShipping.amount,
                            currency_id: returnShipping.currency_id || 'BRL',
                            description: returnShipping.description || 'Frete da devolução',
                          } : undefined,
                          handling_fee: costsData.handling_fee ? {
                            amount: costsData.handling_fee.amount,
                            currency_id: costsData.handling_fee.currency_id || 'BRL',
                            description: costsData.handling_fee.description,
                          } : undefined,
                          storage_fee: costsData.storage_fee ? {
                            amount: costsData.storage_fee.amount,
                            currency_id: costsData.storage_fee.currency_id || 'BRL',
                            description: costsData.storage_fee.description,
                          } : undefined,
                          insurance: costsData.insurance ? {
                            amount: costsData.insurance.amount,
                            currency_id: costsData.insurance.currency_id || 'BRL',
                            description: costsData.insurance.description,
                          } : undefined,
                          other_costs: costsData.other_costs || [],
                        },
                        costs_last_updated: new Date().toISOString(),
                      };
                      
                      console.log(`💰 Custos mapeados:`, shippingCosts);
                    } else {
                      console.warn(`⚠️ Custos não disponíveis (${costsResponse.status}) para shipment ${firstShipment.shipment_id}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar custos do shipment ${firstShipment.shipment_id}:`, getErrorMessage(error));
                  }
                } else {
                  console.log(`ℹ️ Return ${returnData.id} não tem shipment_id para buscar custos`);
                }
                
                // ✅ FASE 13: Buscar informações de fulfillment
                if (firstShipment?.shipment_id) {
                  try {
                    console.log(`📦 Buscando informações de fulfillment para shipment ${firstShipment.shipment_id}...`);
                    const shipmentUrl = `https://api.mercadolibre.com/shipments/${firstShipment.shipment_id}`;
                    const shipmentResponse = await fetch(shipmentUrl, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (shipmentResponse.ok) {
                      const shipmentData = await shipmentResponse.json();
                      console.log(`✅ Detalhes do shipment ${firstShipment.shipment_id} obtidos:`, JSON.stringify(shipmentData, null, 2));
                      
                      // Mapear tipo de logística
                      const logisticType = shipmentData.logistic_type || shipmentData.shipping_option?.logistic_type;
                      const tipoLogistica = logisticType === 'fulfillment' ? 'FULL' : 
                                           logisticType === 'xd_drop_off' ? 'FLEX' :
                                           logisticType === 'cross_docking' ? 'CROSS_DOCKING' :
                                           logisticType === 'drop_off' ? 'COLETA' :
                                           logisticType === 'drop_shipping' ? 'DROP_SHIPPING' :
                                           'FBM';
                      
                      fulfillmentInfo = {
                        tipo_logistica: tipoLogistica,
                        warehouse_id: shipmentData.sender_address?.warehouse_id || null,
                        warehouse_nome: shipmentData.sender_address?.warehouse_name || null,
                        centro_distribuicao: shipmentData.sender_address?.distribution_center_name || null,
                        destino_retorno: shipmentData.return_details?.address?.address_line || null,
                        endereco_retorno: shipmentData.return_details?.address ? {
                          rua: shipmentData.return_details.address.street_name,
                          numero: shipmentData.return_details.address.street_number,
                          cidade: shipmentData.return_details.address.city?.name,
                          estado: shipmentData.return_details.address.state?.name,
                          cep: shipmentData.return_details.address.zip_code,
                          pais: shipmentData.return_details.address.country?.name,
                        } : null,
                        status_reingresso: shipmentData.return_details?.status || 
                                           (shipmentData.substatus === 'returned_to_seller' ? 'received' : 
                                            shipmentData.substatus === 'ready_to_ship' ? 'processing' :
                                            'pending'),
                        data_reingresso: shipmentData.return_details?.date_delivered || null,
                        fulfillment_last_updated: new Date().toISOString(),
                      };
                      
                      console.log(`📦 Fulfillment Info mapeado:`, fulfillmentInfo);
                    } else {
                      console.warn(`⚠️ Detalhes do shipment não disponíveis (${shipmentResponse.status}) para shipment ${firstShipment.shipment_id}`);
                    }
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar fulfillment do shipment ${firstShipment.shipment_id}:`, getErrorMessage(error));
                  }
                } else {
                  console.log(`ℹ️ Return ${returnData.id} não tem shipment_id para buscar fulfillment`);
                }
                
                
                // ✅ FASE 1, 2, 3 & 5: Buscar dados do pedido para obter buyer_id, item_id, dados financeiros e tracking
                
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
                
                // ✅ FASE 14: Calcular deadlines (prazos) usando dados de lead time e claim
                let deadlines: Deadlines | null = null;
                try {
                  console.log(`📅 Calculando deadlines para return ${returnData.id}...`);
                  
                  deadlines = calculateDeadlines(
                    returnData,
                    leadTimeData as LeadTimeData | null,
                    claim as ClaimData | null
                  );
                  
                  console.log(`✅ Deadlines calculados:`, JSON.stringify(deadlines, null, 2));
                  
                  // Log de alertas críticos
                  if (deadlines.is_shipment_critical) {
                    console.warn(`🚨 ALERTA: Prazo de envio CRÍTICO! ${deadlines.hours_to_shipment}h restantes`);
                  }
                  if (deadlines.is_review_critical) {
                    console.warn(`🚨 ALERTA: Prazo de review CRÍTICO! ${deadlines.hours_to_review}h restantes`);
                  }
                } catch (error) {
                  console.error(`❌ Erro ao calcular deadlines para return ${returnData.id}:`, getErrorMessage(error));
                }
                
                // ✅ FASE 10: Extrair dados completos da review incluindo anexos e quantidades
                const firstReviewContainer = reviewData?.reviews?.[0];
                const firstReview = firstReviewContainer?.resource_reviews?.[0];
                
                // ✅ FASE 10: Processar anexos/evidências
                const reviewAttachments = firstReview?.attachments?.map((att: any, idx: number) => ({
                  id: att.id || att.attachment_id || `att-${returnData.id}-${idx}`,
                  url: att.url || att.attachment_url || '',
                  type: att.type || att.content_type || 'unknown',
                  filename: att.filename || att.name || `anexo-${idx + 1}`,
                  description: att.description || null,
                })) || [];
                
                // ✅ FASE 10: Buscar descrição da razão de falha do vendedor
                const sellerReasonId = firstReview?.seller_reason;
                const sellerReasonDescription = sellerReasonId 
                  ? reviewReasons.find((r: any) => r.id === sellerReasonId)?.detail 
                  : null;
                
                // ✅ FASE 10: Processar decisão do MELI (se existir)
                const meliResolution = firstReview?.meli_decision ? {
                  date: firstReview.meli_decision.date || new Date().toISOString(),
                  reason: firstReview.meli_decision.reason || null,
                  final_benefited: firstReview.meli_decision.benefited || firstReview.benefited || null,
                  comments: firstReview.meli_decision.comments || null,
                  decided_by: firstReview.meli_decision.decided_by || 'MELI',
                } : null;
                
                // ✅ FASE 6+10: Montar dados de revisão e qualidade COMPLETOS
                const reviewInfo = {
                  has_review: !!reviewData || returnData.related_entities?.includes('reviews') || false,
                  review_method: firstReviewContainer?.method || null,
                  review_stage: firstReview?.stage || null,
                  review_status: firstReview?.status || null,
                  product_condition: firstReview?.product_condition || null,
                  product_destination: firstReview?.product_destination || null,
                  benefited: firstReview?.benefited || null,
                  seller_status: firstReview?.seller_status || null,
                  is_intermediate_check: returnData.intermediate_check || false,
                  
                  // ✅ FASE 10: Dados avançados da revisão do vendedor
                  seller_reason_id: sellerReasonId || null,
                  seller_reason_description: sellerReasonDescription,
                  seller_message: firstReview?.seller_message || firstReview?.message || null,
                  seller_attachments: reviewAttachments,
                  missing_quantity: firstReview?.missing_quantity || 0,
                  damaged_quantity: firstReview?.damaged_quantity || 0,
                  meli_resolution: meliResolution,
                  seller_evaluation_status: firstReview?.seller_status || null,
                  seller_evaluation_deadline: firstReviewContainer?.last_updated || null,
                  available_reasons: reviewReasons,
                };
                
                // ✅ FASE 7: Montar dados de comunicação e mensagens do claim
                try {
                  const messagesUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`;
                  const messagesResponse = await fetch(messagesUrl, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    const messages = messagesData.messages || [];
                    
                    // 🐛 FIX 1: Evitar IDs duplicados usando timestamp único
                    let uniqueIdCounter = 0;
                    
                    // Processar mensagens
                    const processedMessages = messages.map((msg: any) => {
                      uniqueIdCounter++;
                      return {
                        id: msg.id || `msg-${claim.id}-${uniqueIdCounter}-${Date.now()}`,
                        date: msg.date_created || msg.date || new Date().toISOString(),
                        sender_role: msg.sender_role || 'mediator',
                        message: msg.text || msg.message || '',
                        status: msg.status || null,
                        attachments: msg.attachments?.map((att: any, attIdx: number) => ({
                          id: att.id || `att-${claim.id}-${uniqueIdCounter}-${attIdx}-${Date.now()}`,
                          url: att.url || '',
                          type: att.type || 'file',
                          filename: att.filename || null,
                        })) || [],
                      };
                    });
                    
                    // Calcular métricas de qualidade
                    const moderatedCount = messages.filter((m: any) => m.status === 'moderated' || m.status === 'rejected').length;
                    const totalMessages = messages.length;
                    const cleanPercentage = totalMessages > 0 ? ((totalMessages - moderatedCount) / totalMessages) * 100 : 100;
                    
                    let quality = null;
                    if (totalMessages > 0) {
                      if (cleanPercentage >= 90) quality = 'excellent';
                      else if (cleanPercentage >= 70) quality = 'good';
                      else if (cleanPercentage >= 50) quality = 'moderate';
                      else quality = 'poor';
                    }
                    
                    // 🐛 FIX 2: Garantir que moderationStatus seja sempre string válida
                    let moderationStatus: 'clean' | 'moderated' | 'rejected' = 'clean';
                    if (messages.some((m: any) => m.status === 'rejected')) moderationStatus = 'rejected';
                    else if (messages.some((m: any) => m.status === 'moderated')) moderationStatus = 'moderated';
                    
                    // 🐛 FIX 3: Ordenar mensagens por data antes de pegar a última
                    const sortedMessages = [...messages].sort((a: any, b: any) => {
                      const dateA = new Date(a.date_created || a.date || 0).getTime();
                      const dateB = new Date(b.date_created || b.date || 0).getTime();
                      return dateA - dateB;
                    });
                    
                    const lastMessage = sortedMessages[sortedMessages.length - 1];
                    const hasAttachments = messages.some((m: any) => m.attachments && m.attachments.length > 0);
                    
                    communicationInfo = {
                      total_messages: totalMessages,
                      total_interactions: messages.filter((m: any) => m.sender_role !== 'mediator').length,
                      last_message_date: lastMessage?.date_created || lastMessage?.date || null,
                      last_message_sender: lastMessage?.sender_role || null,
                      communication_quality: quality,
                      moderation_status: moderationStatus,
                      has_attachments: hasAttachments,
                      messages: processedMessages.slice(-10).reverse(), // 🐛 FIX 4: Reverter para mostrar mais recentes primeiro
                    };
                    
                    console.log(`💬 Comunicação do claim ${claim.id}: ${totalMessages} mensagens, qualidade: ${quality}`);
                  } else if (messagesResponse.status === 404) {
                    // 🐛 FIX 5: 404 é normal (claim sem mensagens), não logar como warning
                    console.log(`ℹ️ Claim ${claim.id} não tem mensagens`);
                  } else {
                    console.warn(`⚠️ Mensagens não disponíveis para claim ${claim.id}: ${messagesResponse.status}`);
                  }
                } catch (error) {
                  // 🐛 FIX 6: Melhorar tratamento de erro com detalhes
                  console.warn(`⚠️ Erro ao buscar mensagens do claim ${claim.id}:`, getErrorMessage(error));
                }

                // ✅ FASE 8: Montar objeto completo enriquecido
                const enrichedReturn = {
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
                  
                  // ✅ FASE 6: Dados de revisão e qualidade enriquecidos
                  review_info: reviewInfo,
                  
                  // ✅ FASE 7: Dados de comunicação e mensagens enriquecidos
                  communication_info: communicationInfo,
                  
                  // ✅ FASE 11: Ações disponíveis do vendedor
                  available_actions: availableActions,
                  
                  // ✅ FASE 12: Custos detalhados de logística
                  shipping_costs: shippingCosts,
                  
                  // ✅ FASE 13: Fulfillment Info
                  fulfillment_info: fulfillmentInfo,
                  
                  // ✅ FASE 14: Deadlines (prazos)
                  deadlines: deadlines,

                  // Order info (legacy)
                  order: orderData ? {
                    id: orderData.id,
                    date_created: orderData.date_created,
                    seller_id: orderData.seller?.id || null,
                    buyer_id: orderData.buyer?.id || null,
                  } : null,
                  resource: returnData.resource_type,
                };
                
                // Adicionar ao array de retornos
                allReturns.push(enrichedReturn);
                
                // ✅ FASE 15: UPSERT - Salvar dados enriquecidos no banco
                try {
                  console.log(`💾 Salvando dados enriquecidos no banco para order ${returnData.resource_id}...`);
                  
                  // 🐛 DEBUG: Validar dados antes do UPSERT
                  console.log(`🔍 VALIDAÇÃO PRÉ-UPSERT:`, {
                    reviewInfo: reviewInfo ? 'PREENCHIDO' : 'VAZIO',
                    communicationInfo: communicationInfo ? 'PREENCHIDO' : 'VAZIO',
                    deadlines: deadlines ? 'PREENCHIDO' : 'VAZIO',
                    availableActions: availableActions ? 'PREENCHIDO' : 'VAZIO',
                    shippingCosts: shippingCosts ? 'PREENCHIDO' : 'VAZIO',
                    fulfillmentInfo: fulfillmentInfo ? 'PREENCHIDO' : 'VAZIO',
                  });
                  
                  const { error: upsertError } = await supabase
                    .from('devolucoes_avancadas')
                    .upsert({
                      // Chaves primárias
                      order_id: returnData.resource_id,
                      integration_account_id: accountId,
                      
                      // Campos básicos
                      return_id: returnData.id,
                      claim_id: claim.id,
                      status_devolucao: returnData.status,
                      data_criacao: returnData.date_created,
                      data_fechamento_devolucao: returnData.date_closed,
                      data_ultima_movimentacao: returnData.last_updated,
                      
                      // ✅ NOVOS CAMPOS JSONB - Dados enriquecidos da AUDITORIA
                      dados_review: reviewInfo || {},
                      dados_comunicacao: communicationInfo || {},
                      dados_deadlines: deadlines || {},
                      dados_acoes_disponiveis: availableActions || {},
                      dados_custos_logistica: shippingCosts || {},
                      dados_fulfillment: fulfillmentInfo || {},
                      dados_lead_time: leadTimeData || {},
                      dados_available_actions: availableActions || {},
                      dados_shipping_costs: shippingCosts || {},
                      dados_refund_info: financialInfo || {},
                      dados_product_condition: firstReview ? {
                        condition: firstReview.product_condition,
                        benefited: firstReview.benefited,
                        seller_status: firstReview.seller_status,
                        product_destination: firstReview.product_destination,
                      } : {},
                      
                      // Timestamps
                      updated_at: new Date().toISOString(),
                      ultima_sincronizacao: new Date().toISOString(),
                    }, {
                      onConflict: 'order_id,integration_account_id'
                    });
                  
                  if (upsertError) {
                    console.error(`❌ Erro ao salvar dados enriquecidos para order ${returnData.resource_id}:`, upsertError);
                  } else {
                    console.log(`✅ Dados enriquecidos salvos no banco para order ${returnData.resource_id}`);
                  }
                } catch (dbError) {
                  console.error(`❌ Erro de banco ao salvar order ${returnData.resource_id}:`, getErrorMessage(dbError));
                  // Não quebra a execução - continua retornando dados
                }
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

    // ✅ CRITICAL FIX: Buscar dados do BANCO (com JSONB) ao invés de retornar dados direto da API
    console.log(`\n🔍 Buscando ${allReturns.length} devoluções do banco com dados JSONB enriquecidos...`);
    
    let filteredReturns: any[] = [];
    
    const orderIds = allReturns.map(r => r.order_id);
    const accountIdsSet = Array.from(new Set(allReturns.map(r => r.integration_account_id as string)));
    
    const { data: dbReturns, error: selectError } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .in('order_id', orderIds)
      .in('integration_account_id', accountIdsSet);
    
    if (selectError) {
      console.error('❌ Erro ao buscar devoluções do banco:', selectError);
      // Fallback: retornar dados da API se SELECT falhar
      filteredReturns = allReturns;
    } else {
      console.log(`✅ ${dbReturns.length} devoluções encontradas no banco com dados JSONB`);
      // Retornar dados do banco (com campos JSONB)
      filteredReturns = dbReturns;
    }

    // Aplicar filtro de busca local se necessário
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReturns = filteredReturns.filter((ret: any) =>
        ret.order_id?.toString().includes(searchLower) ||
        ret.claim_id?.toString().includes(searchLower) ||
        ret.id?.toString().includes(searchLower)
      );
    }

    console.log(`📦 Retornando ${filteredReturns.length} devoluções de ${totalReturns} claims totais COM DADOS JSONB`);

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
