import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

// Função para buscar pedidos da Shopee
async function fetchShopeeOrders(accessToken: string, shopId: string, partnerId: string, partnerSecret: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const baseUrl = 'https://partner.shopeemobile.com';
  const path = '/api/v2/order/get_order_list';
  
  // Parâmetros da API
  const params = {
    partner_id: partnerId,
    timestamp: timestamp.toString(),
    access_token: accessToken,
    shop_id: shopId,
    time_range_field: 'create_time',
    time_from: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // Últimos 30 dias
    time_to: timestamp,
    page_size: 100,
    cursor: ''
  };

  // Gerar assinatura
  const baseString = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
  const signature = await generateSignature(baseString, partnerSecret);

  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, String(value));
  });
  urlParams.append('sign', signature);
  const url = `${baseUrl}${path}?${urlParams}`;

  console.log(`[Shopee Orders] Buscando pedidos para shop ${shopId}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Shopee API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Shopee API error: ${data.error} - ${data.message}`);
  }

  return data.response?.order_list || [];
}

// Função para buscar detalhes de um pedido
async function fetchOrderDetails(orderSn: string, accessToken: string, shopId: string, partnerId: string, partnerSecret: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const baseUrl = 'https://partner.shopeemobile.com';
  const path = '/api/v2/order/get_order_detail';
  
  const params = {
    partner_id: partnerId,
    timestamp: timestamp.toString(),
    access_token: accessToken,
    shop_id: shopId,
    order_sn_list: orderSn
  };

  const baseString = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
  const signature = await generateSignature(baseString, partnerSecret);

  const url = `${baseUrl}${path}?${new URLSearchParams({
    ...params,
    sign: signature
  })}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Shopee API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Shopee API error: ${data.error} - ${data.message}`);
  }

  return data.response?.order_list?.[0] || null;
}

// Função para gerar assinatura HMAC-SHA256
async function generateSignature(baseString: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Transformar pedidos Shopee para formato unified
function transformShopeeOrders(orders: any[], integrationAccountId: string, accountName: string) {
  return orders.map(order => ({
    provider: 'shopee',
    integration_account_id: integrationAccountId,
    order_id: order.order_sn,
    order_status: order.order_status,
    date_created: new Date(order.create_time * 1000).toISOString(),
    total_amount: order.total_amount / 100000, // Shopee usa micro-units
    currency: order.currency,
    customer_name: order.recipient_address?.name || 'N/A',
    items: order.item_list?.map((item: any) => ({
      title: item.item_name,
      quantity: item.model_quantity_purchased,
      sku: item.model_sku || item.item_sku,
      unit_price: item.model_original_price / 100000
    })) || [],
    raw_data: {
      ...order,
      account_name: accountName,
      provider: 'shopee'
    }
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { integration_account_id, action = 'sync_orders' } = await req.json();

    if (!integration_account_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'integration_account_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = makeClient(req.headers.get("Authorization"));

    // Buscar dados da conta de integração
    const { data: account } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'shopee')
      .single();

    if (!account) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Shopee account not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar secrets
    const { data: secretData } = await supabase.functions.invoke('integrations-get-secret', {
      body: {
        integration_account_id,
        provider: 'shopee'
      }
    });

    if (!secretData?.secret) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Shopee credentials not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const secrets = secretData.secret;
    const accessToken = secrets.access_token;
    const shopId = secrets.shop_id;
    const partnerId = Deno.env.get('SHOPEE_PARTNER_ID');
    const partnerSecret = Deno.env.get('SHOPEE_PARTNER_SECRET');

    if (!accessToken || !shopId || !partnerId || !partnerSecret) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing Shopee configuration' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'sync_orders') {
      console.log(`[Shopee Orders] Sincronizando pedidos para conta ${account.name}`);

      // Buscar pedidos
      const orders = await fetchShopeeOrders(accessToken, shopId, partnerId, partnerSecret);
      
      if (!orders.length) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'No orders found',
          orders_processed: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Buscar detalhes de cada pedido
      const detailedOrders = [];
      for (const order of orders) {
        try {
          const details = await fetchOrderDetails(order.order_sn, accessToken, shopId, partnerId, partnerSecret);
          if (details) {
            detailedOrders.push(details);
          }
        } catch (error) {
          console.warn(`[Shopee Orders] Erro ao buscar detalhes do pedido ${order.order_sn}:`, error);
          detailedOrders.push(order); // Usar dados básicos se falhar
        }
      }

      // Transformar para formato unified
      const unifiedOrders = transformShopeeOrders(detailedOrders, integration_account_id, account.name);

      // Salvar na tabela unified_orders
      const { error: insertError } = await supabase
        .from('unified_orders')
        .upsert(unifiedOrders, { 
          onConflict: 'provider,order_id',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('[Shopee Orders] Erro ao salvar pedidos:', insertError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to save orders',
          details: insertError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Shopee Orders] ✅ ${unifiedOrders.length} pedidos sincronizados com sucesso`);

      return new Response(JSON.stringify({ 
        success: true,
        orders_processed: unifiedOrders.length,
        message: `${unifiedOrders.length} pedidos Shopee sincronizados com sucesso`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Shopee Orders] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});