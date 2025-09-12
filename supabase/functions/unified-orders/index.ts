import { makeClient, makeUserClient, makeServiceClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

// ============= SISTEMA BLINDADO ML TOKEN REFRESH =============

// Função para refresh preventivo de tokens
async function refreshIfNeeded(supabase: any, tokens: any, cid: string, authHeader: string | null) {
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
      console.warn(`[unified-orders:${cid}] ⚠️ Erro no refresh preventivo:`, e.message);
    }
  }
  
  return { access_token };
}

async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  if (!orders?.length) return orders;

  console.log(`[unified-orders:${cid}] Enriquecendo ${orders.length} pedidos com dados completos`);
  
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

              // 2.a Endpoints adicionais: custos e SLA (executar em paralelo)
              try {
                const [costsResp, slaResp] = await Promise.all([
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'x-format-new': 'true'
                    }
                  }),
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/sla`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`
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

        // 5. Enriquecer com descontos aplicados
        if (order.id) {
          try {
            const discountsResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/discounts`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (discountsResp.ok) {
              const discountsData = await discountsResp.json();
              (enrichedOrder as any).discounts = discountsData;
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar discounts ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 6. Enriquecer com mediações
        if (order.id) {
          try {
            const mediationsResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/mediations`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (mediationsResp.ok) {
              const mediationsData = await mediationsResp.json();
              (enrichedOrder as any).mediations = mediationsData;
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar mediations ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 7. Enriquecer com dados de devoluções (returns)
        if (order.id) {
          try {
            const returnsResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/returns`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (returnsResp.ok) {
              const returnsData = await returnsResp.json();
              (enrichedOrder as any).returns = returnsData;
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar returns ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 8. Enriquecer com dados dos produtos detalhados (order_items + product info)
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

function transformMLOrders(orders: any[], integration_account_id: string, accountName?: string, cid?: string) {
  return orders.map(order => {
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
    
    // Informações de endereço mais detalhadas
    const address = detailedShipping.receiver_address || shipping.receiver_address || {};
    
    // Extrair dados de stock multi-origem
    const stockData = orderItems.flatMap((item: any) => item.stock || []);
    const storeIds = stockData.map((s: any) => s.store_id).filter(Boolean).join(', ');
    const networkNodeIds = stockData.map((s: any) => s.network_node_id).filter(Boolean).join(', ');
    
    // Tags do pedido
    const orderTags = (order.tags || []).join(', ');
    
    // Dados financeiros detalhados
    const marketplaceFees = payments.map((p: any) => p.marketplace_fee || 0).reduce((a, b) => a + b, 0);
    const refundedAmount = payments.map((p: any) => p.transaction_amount_refunded || 0).reduce((a, b) => a + b, 0);
    const overpaidAmount = payments.map((p: any) => p.overpaid_amount || 0).reduce((a, b) => a + b, 0);
    
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
      empresa: accountName || 'Mercado Livre',
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
      
      // ===== DADOS DE DEVOLUÇÕES =====
      return_status: order.returns?.length ? order.returns[0]?.status : null,
      return_id: order.returns?.length ? order.returns[0]?.id : null,
      return_date: order.returns?.length ? order.returns[0]?.date_created : null,
      return_reason: order.returns?.length ? order.returns[0]?.reason : null,
      refund_date: order.returns?.length ? order.returns[0]?.refund?.date : null,
      
      // Valores financeiros detalhados
      frete_pago_cliente: fretePagoCliente,
      receita_flex: receitaFlex,
      desconto_cupom: order.coupon?.amount || 0,
      taxa_marketplace: order.marketplace_fee || 0,
      custo_envio_seller: custoEnvioSeller,
      
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
      // "Combinados": reutilizamos as colunas para retornar custos (costs) e SLA conforme solicitado
      modo_envio_combinado: (detailedShipping?.costs
        ? `gross:${detailedShipping.costs?.gross_amount ?? ''}; receiver:${detailedShipping.costs?.receiver?.cost ?? ''}; sender:${Array.isArray(detailedShipping.costs?.senders) && detailedShipping.costs.senders[0]?.cost != null ? detailedShipping.costs.senders[0].cost : ''}`
        : (detailedShipping?.logistic?.mode || shipping?.mode || null)),
      metodo_envio_combinado: (detailedShipping?.sla
        ? `${detailedShipping?.shipping_method?.name || shipping?.shipping_method?.name || '—'} | SLA:${detailedShipping.sla?.status ?? ''}${detailedShipping.sla?.expected_date ? ' até ' + detailedShipping.sla.expected_date : ''}`
        : (detailedShipping?.shipping_method?.name || shipping?.shipping_method?.name || null)),
      
      // Endereço completo
      rua: address.street_name || null,
      numero: address.street_number || null,
      bairro: address.neighborhood?.name || null,
      cep: address.zip_code || null,

      // 🆕 NOVOS CAMPOS DA DOCUMENTAÇÃO DE PACKS - Análise posterior
      
      // 🔹 TAGS DO PEDIDO (removido para evitar duplicação - já mapeado acima)
      conditions: orderItems.map((item: any) => item.item?.condition).filter(Boolean).join(', ') || null,
      global_prices: orderItems.map((item: any) => item.global_price).filter((p) => p != null).join(', ') || null,
      net_weights: orderItems.map((item: any) => item.item?.net_weight).filter((w) => w != null).join(', ') || null,
      manufacturing_days_total: orderItems.map((item: any) => item.manufacturing_days).filter((d) => d != null).reduce((a, b) => a + b, 0) || null,
      sale_fees_total: orderItems.map((item: any) => item.sale_fee || 0).reduce((a, b) => a + b, 0),
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
      }
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
  const userClient = makeUserClient(req);
  const serviceClient = makeServiceClient();
  const cid = crypto.randomUUID().slice(0, 8);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return fail('Missing Authorization header', 401, null, cid);
    }

    const body = await req.json();
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
      return fail('integration_account_id é obrigatório', 400, null, cid);
    }

    // ✅ 1. Busca account com validação de usuário (RLS ativo)
    const { data: accountData, error: accountError } = await userClient
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .single();

    if (accountError) {
      console.error(`[unified-orders:${cid}] FALHA: Busca account`, accountError);
      return fail('Integration account not found', 404, accountError, cid);
    }

    // ✅ 2. SISTEMA BLINDADO: Busca integration_secrets com SERVICE CLIENT (bypass RLS)
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
    
    // ✅ 3. Primeiro: tentar nova estrutura simples
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const isSimpleStr = typeof secretRow.simple_tokens === 'string';
        const simpleTokensLength = isSimpleStr ? (secretRow.simple_tokens as string).length : 0;
        const simpleTokensPreview = isSimpleStr ? (secretRow.simple_tokens as string).substring(0, 50) + '...' : 'not-string';
        console.log(`[unified-orders:${cid}] 🔓 Tentando criptografia simples - dados:`, {
          simpleTokensType: typeof secretRow.simple_tokens,
          simpleTokensLength,
          simpleTokensPreview
        });
        const { data: decryptedData, error: decryptError } = await serviceClient
          .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });

        console.log(`[unified-orders:${cid}] 🔓 Resultado decrypt_simple:`, {
          hasError: !!decryptError,
          errorMsg: decryptError?.message,
          hasData: !!decryptedData,
          dataType: typeof decryptedData,
          dataLength: decryptedData ? decryptedData.length : 0
        });

        if (decryptError) {
          console.error(`[unified-orders:${cid}] ❌ Erro descriptografia simples:`, decryptError);
        } else if (decryptedData) {
          try {
            const parsedPayload = JSON.parse(decryptedData);
            accessToken = parsedPayload.access_token || '';
            refreshToken = parsedPayload.refresh_token || '';
            expiresAt = parsedPayload.expires_at || '';
            console.log(`[unified-orders:${cid}] ✅ Descriptografia simples bem-sucedida - tokens extraídos:`, {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasExpiresAt: !!expiresAt,
              accessTokenLength: accessToken.length,
              refreshTokenLength: refreshToken.length
            });
          } catch (parseErr) {
            console.error(`[unified-orders:${cid}] ❌ Erro parsing JSON após decrypt_simple:`, parseErr);
          }
        }
      } catch (err) {
        console.error(`[unified-orders:${cid}] ❌ ERRO: Falha descriptografia simples`, err);
      }
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
      } catch (e) { console.warn(`[unified-orders:${cid}] ❌ Fallback 1 (bytea) falhou:`, e.message); }

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
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 2 (buffer) falhou:`, e.message); }
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
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 3 (uint8array) falhou:`, e.message); }
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
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 4 (string) falhou:`, e.message); }
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
          console.error(`[unified-orders:${cid}] ❌ JSON inválido após decriptação via ${fallbackUsed}:`, e.message);
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
      
      // Verificar se secrets estão configurados (sistema blindado exige)
      if (!CRYPTO_KEY || CRYPTO_KEY.length < 32) {
        console.error(`[unified-orders:${cid}] ❌ CRITICO: APP_ENCRYPTION_KEY ausente ou inválido`);
        return fail("APP_ENCRYPTION_KEY not configured", 500, { 
          error_type: 'config_missing',
          required_secret: 'APP_ENCRYPTION_KEY'
        }, cid);
      }

      try {
        const { clientId, clientSecret } = getMlConfig();
        if (!clientId || !clientSecret) {
          console.error(`[unified-orders:${cid}] ❌ CRITICO: ML_CLIENT_ID ou ML_CLIENT_SECRET ausentes`);
          return fail("ML secrets not configured", 500, { 
            error_type: 'config_missing',
            required_secrets: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET']
          }, cid);
        }
      } catch (e) {
        console.error(`[unified-orders:${cid}] ❌ CRITICO: Erro ao verificar ML secrets:`, e.message);
        return fail("ML configuration error", 500, { 
          error_type: 'config_error',
          message: e.message
        }, cid);
      }

      return fail("no_tokens", 401, { 
        error_type: 'no_tokens',
        message: 'Conta requer reconexão OAuth - todos os fallbacks de decriptação falharam',
        account_id: integration_account_id,
        payloadLen: secretRow?.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'unknown') : 'null',
        keyFp: keyFingerprint
      }, cid);
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
      return fail('Seller ID not found in account_identifier', 400, null, cid);
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
      return fail(`ML API Error: ${mlResponse.status}`, mlResponse.status, { 
        error: errorText,
        url: mlUrl.toString()
      }, cid);
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

    // Transformar para formato unificado
    const transformedOrders = transformMLOrders(filteredOrders, integration_account_id, accountData?.name, cid);

    return ok({
      // Compatibilidade: retornar tanto 'results' (raw ML enriquecido) quanto 'pedidos' (formato unificado)
      results: enrichedOrders,
      pedidos: transformedOrders,
      paging: mlData?.paging ?? { total: transformedOrders.length, limit: safeLimit, offset: offset || 0 },
      total: (mlData?.paging?.total ?? transformedOrders.length),
      url: mlUrl.toString(),
      provider: 'mercadolivre',
      account_id: integration_account_id,
      seller_id: seller
    }, cid);

  } catch (error) {
    console.error(`[unified-orders:${cid}] Unexpected error:`, error);
    return fail(String(error?.message ?? error), 500, null, cid);
  }
});