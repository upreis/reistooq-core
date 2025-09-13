import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
    });

    const { integration_account_id, date_from, date_to, limit = 50 } = await req.json();

    console.log(`[complete-sales] 🚀 Iniciando busca completa para conta: ${integration_account_id}`);
    const startTime = Date.now();

    // 1. Buscar dados da conta de integração
    const { data: account } = await userClient
      .from('integration_accounts')
      .select('account_identifier, name')
      .eq('id', integration_account_id)
      .single();

    if (!account) {
      throw new Error('Conta de integração não encontrada');
    }

    // 2. Buscar access token
    const { data: secretData } = await supabase.functions.invoke('integrations-get-secret', {
      body: { integration_account_id }
    });

    if (!secretData?.success) {
      throw new Error('Token de acesso não encontrado');
    }

    const accessToken = secretData.access_token;
    const sellerId = account.account_identifier;

    console.log(`[complete-sales] 🔑 Token obtido para seller: ${sellerId}`);

    // 3. Buscar orders básicas do ML
    const ordersUrl = new URL('https://api.mercadolivre.com/orders/search');
    ordersUrl.searchParams.set('seller', sellerId);
    ordersUrl.searchParams.set('sort', 'date_desc');
    ordersUrl.searchParams.set('limit', limit.toString());
    
    if (date_from) {
      ordersUrl.searchParams.set('order.date_created.from', date_from);
    }
    if (date_to) {
      ordersUrl.searchParams.set('order.date_created.to', date_to);
    }

    const ordersResp = await fetch(ordersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-format-new': 'true'
      }
    });

    if (!ordersResp.ok) {
      throw new Error(`Orders API error: ${ordersResp.status} - ${await ordersResp.text()}`);
    }

    const ordersData = await ordersResp.json();
    console.log(`[complete-sales] 📦 Encontradas ${ordersData.results?.length || 0} orders`);

    // 4. Para cada order, buscar TODOS os dados
    const completeSales = [];
    const endpointsAccessedGlobal = new Set<string>();

    for (const order of ordersData.results || []) {
      try {
        const completeSale = await enrichCompleteOrderData(order, accessToken, endpointsAccessedGlobal);
        completeSales.push(completeSale);
      } catch (error) {
        console.error(`[complete-sales] ❌ Erro ao enriquecer order ${order.id}:`, error.message);
        // Continuar com próxima order
      }
    }

    // 5. Salvar na nova tabela
    if (completeSales.length > 0) {
      const { data, error } = await userClient
        .from('vendas_completas')
        .upsert(completeSales, { onConflict: 'order_id' });

      if (error) {
        console.error('[complete-sales] ❌ Erro ao salvar:', error);
        throw error;
      }

      console.log(`[complete-sales] ✅ ${completeSales.length} vendas completas salvas`);
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: completeSales.length,
        duration_ms: duration,
        endpoints_accessed: Array.from(endpointsAccessedGlobal),
        data: completeSales 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[complete-sales] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function enrichCompleteOrderData(order: any, accessToken: string, endpointsAccessed: Set<string>) {
  const startTime = Date.now();
  
  // Estrutura base da venda completa
  const completeSale: any = {
    // SEÇÃO 1: Dados básicos da venda
    order_id: order.id?.toString(),
    order_date_created: order.date_created,
    order_date_closed: order.date_closed,
    order_last_updated: order.last_updated,
    order_status: order.status,
    order_status_detail: order.status_detail,
    order_total_amount: order.total_amount,
    order_paid_amount: order.paid_amount,
    order_currency_id: order.currency_id,
    order_pack_id: order.pack_id?.toString(),
    order_tags: order.tags || [],
    order_manufacturing_ending_date: order.manufacturing_ending_date,
    order_manufacturing_start_date: order.manufacturing_start_date,
    order_expiration_date: order.expiration_date,
    order_fulfilled: order.fulfilled,
    order_mediations: order.mediations,
    order_context: order.context,
    
    // Raw data para backup
    raw_order_data: order
  };

  // BUSCAR DADOS DETALHADOS DE TODOS OS ENDPOINTS EM PARALELO
  await Promise.all([
    enrichWithOrderDetails(completeSale, order, accessToken, endpointsAccessed),
    enrichWithPaymentData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithShipmentData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithClaimsData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithUserData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithItemData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithFeedbackData(completeSale, order, accessToken, endpointsAccessed),
    enrichWithMessagesData(completeSale, order, accessToken, endpointsAccessed)
  ]);

  // Calcular score de completude dos dados
  completeSale.data_completeness_score = calculateCompletenessScore(completeSale);
  completeSale.last_sync = new Date().toISOString();
  completeSale.sync_duration_ms = Date.now() - startTime;
  completeSale.endpoints_accessed = Array.from(endpointsAccessed);

  return completeSale;
}

// SEÇÃO: Detalhes completos da order
async function enrichWithOrderDetails(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    endpointsAccessed.add('/orders/{id}');
    const detailResp = await fetch(`https://api.mercadolivre.com/orders/${order.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (detailResp.ok) {
      const detail = await detailResp.json();
      
      // Mapear dados detalhados
      sale.order_context = detail.context;
      sale.order_mediations = detail.mediations;
      
      // Dados do primeiro item (se existir)
      if (detail.order_items?.length > 0) {
        const item = detail.order_items[0];
        sale.item_id = item.item?.id;
        sale.item_title = item.item?.title;
        sale.item_category_id = item.item?.category_id;
        sale.item_condition = item.item?.condition;
        sale.item_warranty = item.item?.warranty;
        sale.item_variation_id = item.item?.variation_id?.toString();
        sale.item_variation_attributes = item.item?.variation_attributes;
        sale.item_quantity = item.quantity;
        sale.item_unit_price = item.unit_price;
        sale.item_full_unit_price = item.full_unit_price;
        sale.item_sale_fee = item.sale_fee;
        sale.item_listing_type_id = item.item?.listing_type_id;
        sale.item_seller_sku = item.item?.seller_custom_field;
        sale.item_seller_custom_field = item.item?.seller_custom_field;
        sale.item_differential_pricing = item.item?.differential_pricing;
        sale.item_bundle = item.item?.bundle;
        sale.item_picture_urls = item.item?.pictures?.map((p: any) => p.url);
        sale.item_catalog_product_id = item.item?.catalog_product_id;
        sale.item_global_price = item.item?.price;
        sale.item_manufacturing_days = item.item?.attributes?.find((a: any) => a.id === 'MANUFACTURING_TIME')?.value_name;
      }
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar detalhes da order ${order.id}:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'order_details', error: error.message });
  }
}

// SEÇÃO: Dados de pagamento completos
async function enrichWithPaymentData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    if (!order.payments?.length) return;
    
    const payment = order.payments[0]; // Primeiro pagamento
    
    endpointsAccessed.add('/payments/{id}');
    const paymentResp = await fetch(`https://api.mercadolivre.com/payments/${payment.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (paymentResp.ok) {
      const paymentDetail = await paymentResp.json();
      
      sale.payment_id = paymentDetail.id?.toString();
      sale.payment_status = paymentDetail.status;
      sale.payment_status_detail = paymentDetail.status_detail;
      sale.payment_method_id = paymentDetail.payment_method_id;
      sale.payment_payment_type_id = paymentDetail.payment_type_id;
      sale.payment_installments = paymentDetail.installments;
      sale.payment_transaction_amount = paymentDetail.transaction_amount;
      sale.payment_transaction_amount_refunded = paymentDetail.transaction_amount_refunded;
      sale.payment_taxes_amount = paymentDetail.taxes_amount;
      sale.payment_shipping_cost = paymentDetail.shipping_cost;
      sale.payment_date_approved = paymentDetail.date_approved;
      sale.payment_date_created = paymentDetail.date_created;
      sale.payment_date_last_modified = paymentDetail.date_last_modified;
      sale.payment_available_actions = paymentDetail.available_actions;
      sale.payment_card_id = paymentDetail.card?.id;
      sale.payment_card_first_six_digits = paymentDetail.card?.first_six_digits;
      sale.payment_card_last_four_digits = paymentDetail.card?.last_four_digits;
      sale.payment_issuer_id = paymentDetail.issuer_id;
      sale.payment_issuer_name = paymentDetail.issuer?.name;
      sale.payment_atm_transfer_reference = paymentDetail.atm_transfer_reference;
      sale.payment_coupon_amount = paymentDetail.coupon_amount;
      sale.payment_installment_amount = paymentDetail.installment_amount;
      sale.payment_deferred_period = paymentDetail.deferred_period;
      sale.payment_authorization_code = paymentDetail.authorization_code;
      sale.payment_operation_type = paymentDetail.operation_type;
      sale.payment_total_paid_amount = paymentDetail.total_paid_amount;
      sale.payment_overpaid_amount = paymentDetail.overpaid_amount;
      
      sale.raw_payment_data = paymentDetail;
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar dados de pagamento:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'payment_data', error: error.message });
  }
}

// SEÇÃO: Dados de envio completos
async function enrichWithShipmentData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    if (!order.shipping?.id) return;
    
    endpointsAccessed.add('/shipments/{id}');
    const shipmentResp = await fetch(`https://api.mercadolivre.com/shipments/${order.shipping.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (shipmentResp.ok) {
      const shipment = await shipmentResp.json();
      
      sale.shipping_id = shipment.id?.toString();
      sale.shipping_status = shipment.status;
      sale.shipping_substatus = shipment.substatus;
      sale.shipping_mode = shipment.mode;
      sale.shipping_method = shipment.shipping_method_id;
      sale.shipping_cost = shipment.cost;
      sale.shipping_date_created = shipment.date_created;
      sale.shipping_date_shipped = shipment.date_shipped;
      sale.shipping_date_delivered = shipment.date_delivered;
      sale.shipping_date_first_printed = shipment.date_first_printed;
      sale.shipping_tracking_number = shipment.tracking_number;
      sale.shipping_tracking_method = shipment.tracking_method;
      sale.shipping_receiver_address = shipment.receiver_address;
      sale.shipping_sender_address = shipment.sender_address;
      sale.shipping_dimensions = shipment.dimensions;
      sale.shipping_logistic_type = shipment.logistic?.type;
      sale.shipping_estimated_delivery_date = shipment.shipping_option?.estimated_delivery_date;
      sale.shipping_estimated_delivery_time = shipment.shipping_option?.estimated_delivery_time;
      sale.shipping_estimated_handling_limit = shipment.shipping_option?.estimated_handling_limit;
      sale.shipping_gross_amount = shipment.shipping_option?.cost;
      sale.shipping_service_id = shipment.service_id;
      sale.shipping_priority = shipment.shipping_option?.priority;
      sale.shipping_comments = shipment.comments;
      sale.shipping_preferences = shipment.preferences;
      sale.shipping_market_place = shipment.market_place;
      sale.shipping_type = shipment.type;
      sale.shipping_application_id = shipment.application_id;
      sale.shipping_option = shipment.shipping_option;
      sale.shipping_tags = shipment.tags;
      sale.shipping_delay = shipment.delay;
      sale.shipping_handling_time = shipment.handling_time;
      sale.shipping_local_pick_up = shipment.local_pick_up;
      sale.shipping_store_pick_up = shipment.store_pick_up;
      
      sale.raw_shipping_data = shipment;
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar dados de envio:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'shipping_data', error: error.message });
  }
}

// SEÇÃO: Claims, devoluções e trocas
async function enrichWithClaimsData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    // 1. Buscar claims
    endpointsAccessed.add('/post-purchase/v1/claims/search');
    const claimsResp = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${order.id}&resource=order`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (claimsResp.ok) {
      const claimsData = await claimsResp.json();
      
      if (claimsData.data?.length > 0) {
        const claim = claimsData.data[0];
        sale.claim_id = claim.id?.toString();
        sale.claim_status = claim.status;
        sale.claim_stage = claim.stage;
        sale.claim_type = claim.type;
        sale.claim_reason_id = claim.reason_id;
        sale.claim_date_created = claim.date_created;
        sale.claim_last_updated = claim.last_updated;
        sale.claim_related_entities = claim.related_entities;
        sale.claim_resolution = claim.resolution;
        sale.claim_participants = claim.participants;
        
        // 2. Buscar devoluções se existirem
        const returnEntities = claim.related_entities?.filter((e: any) => e.type === 'return') || [];
        if (returnEntities.length > 0) {
          const returnId = returnEntities[0].id;
          
          endpointsAccessed.add('/post-purchase/v1/returns/{id}');
          const returnResp = await fetch(
            `https://api.mercadolivre.com/post-purchase/v1/returns/${returnId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (returnResp.ok) {
            const returnData = await returnResp.json();
            
            sale.return_id = returnData.id?.toString();
            sale.return_status = returnData.status;
            sale.return_status_money = returnData.status_money;
            sale.return_subtype = returnData.subtype;
            sale.return_date_created = returnData.date_created;
            sale.return_refund_at = returnData.refund_at;
            sale.return_shipment_status = returnData.shipment_status;
            sale.return_intermediate_check = returnData.intermediate_check;
            sale.return_tracking_number = returnData.tracking_number;
            sale.return_cause = returnData.cause;
            sale.return_resolution = returnData.resolution;
          }
        }
        
        // 3. Buscar trocas se existirem
        const changeEntities = claim.related_entities?.filter((e: any) => e.type === 'change') || [];
        if (changeEntities.length > 0) {
          const changeId = changeEntities[0].id;
          
          endpointsAccessed.add('/post-purchase/v1/changes/{id}');
          const changeResp = await fetch(
            `https://api.mercadolivre.com/post-purchase/v1/changes/${changeId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (changeResp.ok) {
            const changeData = await changeResp.json();
            
            sale.change_id = changeData.id?.toString();
            sale.change_status = changeData.status;
            sale.change_type = changeData.type;
            sale.change_estimated_exchange_date = changeData.estimated_exchange_date;
            sale.change_new_orders_ids = changeData.new_orders_ids;
            sale.change_date_created = changeData.date_created;
            sale.change_reason = changeData.reason;
            sale.change_tracking_info = changeData.tracking_info;
          }
        }
      }
      
      sale.raw_claims_data = claimsData;
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar claims:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'claims_data', error: error.message });
  }
}

// SEÇÃO: Dados de usuários (comprador e vendedor)
async function enrichWithUserData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    // 1. Dados do comprador
    if (order.buyer?.id) {
      endpointsAccessed.add('/users/{id}');
      const buyerResp = await fetch(`https://api.mercadolivre.com/users/${order.buyer.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (buyerResp.ok) {
        const buyer = await buyerResp.json();
        
        sale.buyer_id = buyer.id?.toString();
        sale.buyer_nickname = buyer.nickname;
        sale.buyer_email = buyer.email;
        sale.buyer_first_name = buyer.first_name;
        sale.buyer_last_name = buyer.last_name;
        sale.buyer_phone = buyer.phone;
        sale.buyer_alternative_phone = buyer.alternative_phone;
        sale.buyer_identification = buyer.identification;
        sale.buyer_address = buyer.address;
        sale.buyer_reputation = buyer.seller_reputation || buyer.buyer_reputation;
        sale.buyer_tags = buyer.tags;
        sale.buyer_billing_info = buyer.billing_info;
      }
    }
    
    // 2. Dados do vendedor
    if (order.seller?.id) {
      endpointsAccessed.add('/users/{seller_id}');
      const sellerResp = await fetch(`https://api.mercadolivre.com/users/${order.seller.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (sellerResp.ok) {
        const seller = await sellerResp.json();
        
        sale.seller_id = seller.id?.toString();
        sale.seller_nickname = seller.nickname;
        sale.seller_email = seller.email;
        sale.seller_first_name = seller.first_name;
        sale.seller_last_name = seller.last_name;
        sale.seller_phone = seller.phone;
        sale.seller_address = seller.address;
        sale.seller_reputation = seller.seller_reputation;
        sale.seller_tags = seller.tags;
        sale.seller_eshop = seller.eshop;
        sale.seller_status = seller.status;
      }
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar dados de usuários:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'user_data', error: error.message });
  }
}

// SEÇÃO: Dados detalhados do item
async function enrichWithItemData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    if (!order.order_items?.length) return;
    
    const item = order.order_items[0].item;
    if (!item?.id) return;
    
    endpointsAccessed.add('/items/{id}');
    const itemResp = await fetch(`https://api.mercadolivre.com/items/${item.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (itemResp.ok) {
      const itemDetail = await itemResp.json();
      
      // Sobrescrever/complementar dados do item com detalhes completos
      sale.item_title = itemDetail.title;
      sale.item_category_id = itemDetail.category_id;
      sale.item_condition = itemDetail.condition;
      sale.item_warranty = itemDetail.warranty;
      sale.item_listing_type_id = itemDetail.listing_type_id;
      sale.item_seller_custom_field = itemDetail.seller_custom_field;
      sale.item_picture_urls = itemDetail.pictures?.map((p: any) => p.url);
      sale.item_catalog_product_id = itemDetail.catalog_product_id;
      
      // Dados adicionais do catálogo
      if (itemDetail.catalog_product_id) {
        endpointsAccessed.add('/catalog_products/{id}');
        const catalogResp = await fetch(
          `https://api.mercadolivre.com/catalog_products/${itemDetail.catalog_product_id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (catalogResp.ok) {
          const catalog = await catalogResp.json();
          sale.item_global_price = catalog.buy_box_winner?.price;
        }
      }
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar dados do item:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'item_data', error: error.message });
  }
}

// SEÇÃO: Dados de feedback
async function enrichWithFeedbackData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    endpointsAccessed.add('/orders/{id}/feedback');
    const feedbackResp = await fetch(`https://api.mercadolivre.com/orders/${order.id}/feedback`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (feedbackResp.ok) {
      const feedbacks = await feedbackResp.json();
      
      // Feedback do comprador
      const buyerFeedback = feedbacks.find((f: any) => f.role === 'buyer');
      if (buyerFeedback) {
        sale.feedback_buyer_id = buyerFeedback.id?.toString();
        sale.feedback_buyer_rating = buyerFeedback.rating;
        sale.feedback_buyer_message = buyerFeedback.message;
        sale.feedback_buyer_date_created = buyerFeedback.date_created;
        sale.feedback_buyer_fulfilled = buyerFeedback.fulfilled;
        sale.feedback_buyer_reply = buyerFeedback.reply;
      }
      
      // Feedback do vendedor
      const sellerFeedback = feedbacks.find((f: any) => f.role === 'seller');
      if (sellerFeedback) {
        sale.feedback_seller_id = sellerFeedback.id?.toString();
        sale.feedback_seller_rating = sellerFeedback.rating;
        sale.feedback_seller_message = sellerFeedback.message;
        sale.feedback_seller_date_created = sellerFeedback.date_created;
        sale.feedback_seller_fulfilled = sellerFeedback.fulfilled;
        sale.feedback_seller_reply = sellerFeedback.reply;
      }
      
      sale.raw_feedback_data = feedbacks;
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar feedback:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'feedback_data', error: error.message });
  }
}

// SEÇÃO: Dados de mensagens
async function enrichWithMessagesData(sale: any, order: any, token: string, endpointsAccessed: Set<string>) {
  try {
    endpointsAccessed.add('/messages/orders/{id}');
    const messagesResp = await fetch(`https://api.mercadolivre.com/messages/orders/${order.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (messagesResp.ok) {
      const messages = await messagesResp.json();
      
      if (messages.results?.length > 0) {
        sale.messages_count = messages.results.length;
        
        // Última mensagem
        const lastMessage = messages.results[0];
        sale.last_message_date = lastMessage.date_created;
        sale.last_message_from = lastMessage.from.user_id;
        
        // Contar mensagens não lidas
        sale.unread_messages_count = messages.results.filter((m: any) => !m.read).length;
        
        // Contar por tipo de usuário
        sale.messages_from_buyer = messages.results.filter((m: any) => 
          m.from.user_id === order.buyer?.id?.toString()
        ).length;
        
        sale.messages_from_seller = messages.results.filter((m: any) => 
          m.from.user_id === order.seller?.id?.toString()
        ).length;
      }
      
      sale.raw_messages_data = messages;
    }
  } catch (error) {
    console.warn(`[complete-sales] ⚠️ Erro ao buscar mensagens:`, error.message);
    sale.sync_errors = sale.sync_errors || [];
    sale.sync_errors.push({ step: 'messages_data', error: error.message });
  }
}

function calculateCompletenessScore(sale: any): number {
  // Lista de campos importantes para calcular completude
  const importantFields = [
    'order_id', 'order_status', 'order_total_amount',
    'item_id', 'item_title', 'item_quantity',
    'payment_id', 'payment_status', 'payment_method_id',
    'shipping_id', 'shipping_status', 'shipping_tracking_number',
    'buyer_id', 'buyer_nickname', 'seller_id', 'seller_nickname'
  ];
  
  const filledFields = importantFields.filter(field => 
    sale[field] !== null && sale[field] !== undefined && sale[field] !== ''
  ).length;
  
  return Math.round((filledFields / importantFields.length) * 100);
}