// 🛡️ FASE 4: API Shopee Orders - Sistema Blindado
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopeeOrdersRequest {
  integration_account_id: string;
  time_range_field?: 'create_time' | 'update_time';
  time_from?: number;
  time_to?: number;
  page_size?: number;
  cursor?: string;
  order_status?: string;
  response_optional_fields?: string[];
}

interface ShopeeOrder {
  order_sn: string;
  order_status: string;
  create_time: number;
  update_time: number;
  currency: string;
  cod: boolean;
  total_amount: number;
  order_flag: string;
  message_to_seller: string;
  note: string;
  note_update_time: number;
  item_list: ShopeeOrderItem[];
  pay_time: number;
  dropshipper: string;
  dropshipper_phone: string;
  split_up: boolean;
  buyer_user_id: number;
  buyer_username: string;
  estimated_shipping_fee: number;
  recipient_address: {
    name: string;
    phone: string;
    town: string;
    district: string;
    city: string;
    state: string;
    region: string;
    zipcode: string;
    full_address: string;
  };
  actual_shipping_fee: number;
  goods_to_declare: boolean;
  note_update_time: number;
  package_list: any[];
  invoice_data: any;
  checkout_shipping_carrier: string;
  reverse_shipping_fee: number;
  order_chargeable_weight_gram: number;
  fulfillment_flag: string;
  pickup_done_time: number;
  package_list: any[];
  shipping_carrier: string;
  payment_method: string;
  total_amount: number;
  buyer_cancel_reason: string;
  cancel_by: string;
  cancel_reason: string;
  actual_shipping_fee_confirmed: boolean;
  buyer_cpf_id: string;
  fulfillment_flag: string;
  pickup_done_time: number;
  package_list: any[];
  prescription_check_status: number;
  prescription_images: string[];
  edt: {
    edt_from: number;
    edt_to: number;
  };
}

interface ShopeeOrderItem {
  item_id: number;
  item_name: string;
  item_sku: string;
  model_id: number;
  model_name: string;
  model_sku: string;
  model_quantity_purchased: number;
  model_original_price: number;
  model_discounted_price: number;
  wholesale: boolean;
  weight: number;
  add_on_deal: boolean;
  main_item: boolean;
  add_on_deal_id: number;
  promotion_type: string;
  promotion_id: number;
  order_item_id: number;
  promotion_group_id: number;
  image_info: {
    image_url: string;
  };
  product_location_id: string[];
  is_prescription_item: boolean;
  is_b2c_voucher: boolean;
  voucher_code: string;
  voucher_code_type: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[shopee-orders:${requestId}] 🚀 Buscando pedidos Shopee`);

    const request = await req.json() as ShopeeOrdersRequest;
    const { integration_account_id } = request;

    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'integration_account_id required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔐 OBTER CREDENCIAIS SEGURAS
    const { data: account } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'shopee')
      .eq('is_active', true)
      .single();

    if (!account) {
      console.log(`[shopee-orders:${requestId}] ❌ Conta não encontrada: ${integration_account_id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Account not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    const { data: secrets } = await supabase
      .from('integration_secrets')
      .select('simple_tokens, expires_at')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'shopee')
      .single();

    if (!secrets?.simple_tokens) {
      console.log(`[shopee-orders:${requestId}] ❌ Tokens não encontrados`);
      return new Response(
        JSON.stringify({ success: false, error: 'Tokens not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    const tokens = JSON.parse(secrets.simple_tokens);
    const SHOPEE_APP_ID = Deno.env.get('SHOPEE_APP_ID');
    const SHOPEE_APP_SECRET = Deno.env.get('SHOPEE_APP_SECRET');

    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Shopee credentials not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 📅 CONFIGURAR PARÂMETROS DE BUSCA
    const timeFrom = request.time_from || Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000); // 30 dias atrás
    const timeTo = request.time_to || Math.floor(Date.now() / 1000);
    const pageSize = Math.min(request.page_size || 100, 100);
    const cursor = request.cursor || '';

    // 🔐 GERAR ASSINATURA SHOPEE
    const timestamp = Math.floor(Date.now() / 1000);
    const shopId = tokens.shop_id;
    const path = `/api/v2/order/get_order_list`;
    
    const baseString = `${SHOPEE_APP_ID}${path}${timestamp}${tokens.access_token}${shopId}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SHOPEE_APP_SECRET);
    const messageData = encoder.encode(baseString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const sign = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 🌐 BUSCAR PEDIDOS NA API SHOPEE
    const url = new URL(`https://partner.shopeemobile.com${path}`);
    url.searchParams.set('partner_id', SHOPEE_APP_ID);
    url.searchParams.set('timestamp', timestamp.toString());
    url.searchParams.set('access_token', tokens.access_token);
    url.searchParams.set('shop_id', shopId);
    url.searchParams.set('sign', sign);
    url.searchParams.set('time_range_field', request.time_range_field || 'create_time');
    url.searchParams.set('time_from', timeFrom.toString());
    url.searchParams.set('time_to', timeTo.toString());
    url.searchParams.set('page_size', pageSize.toString());
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    console.log(`[shopee-orders:${requestId}] 🌐 Buscando: ${url.pathname}?...`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.log(`[shopee-orders:${requestId}] ❌ Erro API:`, data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'API request failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[shopee-orders:${requestId}] ✅ Lista obtida: ${data.response?.order_list?.length || 0} pedidos`);

    if (!data.response?.order_list?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          orders: [],
          total_count: 0,
          has_more: false,
          next_cursor: null
        }),
        { headers: corsHeaders }
      );
    }

    // 🔍 BUSCAR DETALHES DOS PEDIDOS
    const orderSns = data.response.order_list.map((order: any) => order.order_sn);
    
    const detailsTimestamp = Math.floor(Date.now() / 1000);
    const detailsPath = `/api/v2/order/get_order_detail`;
    const detailsBaseString = `${SHOPEE_APP_ID}${detailsPath}${detailsTimestamp}${tokens.access_token}${shopId}`;
    
    const detailsMessageData = encoder.encode(detailsBaseString);
    const detailsSignature = await crypto.subtle.sign('HMAC', cryptoKey, detailsMessageData);
    const detailsSign = Array.from(new Uint8Array(detailsSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const detailsUrl = new URL(`https://partner.shopeemobile.com${detailsPath}`);
    detailsUrl.searchParams.set('partner_id', SHOPEE_APP_ID);
    detailsUrl.searchParams.set('timestamp', detailsTimestamp.toString());
    detailsUrl.searchParams.set('access_token', tokens.access_token);
    detailsUrl.searchParams.set('shop_id', shopId);
    detailsUrl.searchParams.set('sign', detailsSign);
    detailsUrl.searchParams.set('order_sn_list', orderSns.join(','));
    detailsUrl.searchParams.set('response_optional_fields', [
      'order_status',
      'recipient_address',
      'actual_shipping_fee',
      'goods_to_declare',
      'note',
      'note_update_time',
      'item_list',
      'pay_time',
      'dropshipper',
      'dropshipper_phone',
      'split_up',
      'buyer_user_id',
      'buyer_username',
      'estimated_shipping_fee',
      'package_list',
      'invoice_data',
      'checkout_shipping_carrier',
      'reverse_shipping_fee',
      'order_chargeable_weight_gram',
      'fulfillment_flag',
      'pickup_done_time',
      'shipping_carrier',
      'payment_method',
      'total_amount',
      'buyer_cancel_reason',
      'cancel_by',
      'cancel_reason',
      'actual_shipping_fee_confirmed',
      'buyer_cpf_id'
    ].join(','));

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok || detailsData.error) {
      console.log(`[shopee-orders:${requestId}] ❌ Erro detalhes:`, detailsData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get order details' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[shopee-orders:${requestId}] ✅ Detalhes obtidos: ${detailsData.response?.order_list?.length || 0} pedidos`);

    // 🔄 CONVERTER PARA FORMATO UNIFICADO
    const unifiedOrders = (detailsData.response?.order_list || []).map((order: ShopeeOrder) => {
      const firstItem = order.item_list?.[0];
      
      return {
        provider: 'shopee',
        integration_account_id: integration_account_id,
        organization_id: account.organization_id,
        order_id: order.order_sn,
        order_status: mapShopeeStatus(order.order_status),
        date_created: new Date(order.create_time * 1000).toISOString(),
        date_updated: new Date(order.update_time * 1000).toISOString(),
        total_amount: order.total_amount / 100000, // Shopee usa micro-units
        currency: order.currency || 'BRL',
        customer_name: order.recipient_address?.name || order.buyer_username || '',
        customer_email: '', // Shopee não expõe email
        customer_phone: order.recipient_address?.phone || '',
        shipping_address: {
          street: order.recipient_address?.full_address || '',
          city: order.recipient_address?.city || '',
          state: order.recipient_address?.state || '',
          zipcode: order.recipient_address?.zipcode || '',
          country: 'BR'
        },
        items: order.item_list?.map(item => ({
          id: item.item_id.toString(),
          title: item.item_name,
          sku: item.model_sku || item.item_sku || '',
          quantity: item.model_quantity_purchased,
          unit_price: item.model_discounted_price / 100000,
          total_price: (item.model_discounted_price * item.model_quantity_purchased) / 100000,
          image_url: item.image_info?.image_url
        })) || [],
        payment_info: {
          method: order.payment_method || '',
          status: order.pay_time ? 'paid' : 'pending',
          paid_at: order.pay_time ? new Date(order.pay_time * 1000).toISOString() : null
        },
        shipping_info: {
          carrier: order.shipping_carrier || order.checkout_shipping_carrier || '',
          tracking_number: '', // Precisa buscar em endpoint separado
          cost: order.actual_shipping_fee / 100000,
          estimated_cost: order.estimated_shipping_fee / 100000
        },
        raw_data: order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        orders: unifiedOrders,
        total_count: unifiedOrders.length,
        has_more: !!data.response?.more,
        next_cursor: data.response?.next_cursor || null
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('[shopee-orders] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// 🔄 MAPEAR STATUS SHOPEE PARA PADRÃO UNIFICADO
function mapShopeeStatus(shopeeStatus: string): string {
  const statusMap: Record<string, string> = {
    'UNPAID': 'pending_payment',
    'TO_SHIP': 'confirmed',
    'SHIPPED': 'shipped',
    'TO_CONFIRM_RECEIVE': 'shipped',
    'IN_CANCEL': 'cancelling',
    'CANCELLED': 'cancelled',
    'TO_RETURN': 'returning',
    'COMPLETED': 'delivered',
    'READY_TO_SHIP': 'confirmed'
  };
  
  return statusMap[shopeeStatus] || 'unknown';
}