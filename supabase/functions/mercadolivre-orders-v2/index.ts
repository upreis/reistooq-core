import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SyncOrdersRequest {
  account_id: string;
  since?: string;
  until?: string;
  status?: string;
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role for secure operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Failed to verify user:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { account_id, since, until, status } = await req.json() as SyncOrdersRequest;

    if (!account_id) {
      return new Response(JSON.stringify({ error: 'Account ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('ML Orders sync v2 initiated:', {
      user_id: user.id,
      account_id,
      since,
      until,
      status,
      timestamp: new Date().toISOString()
    });

    // Get ML account details
    const { data: mlAccount, error: accountError } = await supabase
      .from('ml_accounts_v2')
      .select('*')
      .eq('ml_user_id', account_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (accountError || !mlAccount) {
      console.error('ML account not found:', { accountError, account_id });
      return new Response(JSON.stringify({ error: 'MercadoLibre account not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token from encrypted secrets
    const { data: secretData, error: secretError } = await supabase
      .rpc('get_integration_secret_secure', {
        account_id: mlAccount.ml_user_id,
        provider_name: 'mercadolivre_v2',
        requesting_function: 'mercadolivre-orders-v2'
      })
      .maybeSingle();

    if (secretError || !secretData?.access_token) {
      console.error('Failed to get access token:', secretError);
      return new Response(JSON.stringify({ error: 'Access token not available' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = secretData.access_token;

    // Build ML API URL for orders
    const mlApiUrl = new URL(`https://api.mercadolibre.com/orders/search`);
    mlApiUrl.searchParams.set('seller', mlAccount.ml_user_id);
    mlApiUrl.searchParams.set('limit', '50');
    
    if (since) mlApiUrl.searchParams.set('order.date_created.from', since);
    if (until) mlApiUrl.searchParams.set('order.date_created.to', until);
    if (status) mlApiUrl.searchParams.set('order.status', status);

    console.log('Fetching orders from ML API:', mlApiUrl.toString());

    // Fetch orders from MercadoLibre
    const ordersResponse = await fetch(mlApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('ML API error:', {
        status: ordersResponse.status,
        statusText: ordersResponse.statusText,
        error: errorText
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch orders from MercadoLibre',
        details: `${ordersResponse.status}: ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ordersData = await ordersResponse.json();
    console.log('Orders fetched:', {
      total: ordersData.paging?.total || 0,
      results_count: ordersData.results?.length || 0
    });

    let syncedCount = 0;
    const errors: string[] = [];

    // Process each order
    if (ordersData.results && ordersData.results.length > 0) {
      for (const order of ordersData.results) {
        try {
          // Convert ML order to our format
          const orderData = {
            id: order.id.toString(),
            numero: order.id.toString(),
            numero_ecommerce: order.id.toString(),
            nome_cliente: order.buyer?.nickname || 'Cliente ML',
            cpf_cnpj: order.buyer?.id?.toString() || '',
            data_pedido: new Date(order.date_created).toISOString().split('T')[0],
            valor_total: parseFloat(order.total_amount) || 0,
            valor_frete: parseFloat(order.shipping?.cost || 0),
            valor_desconto: 0,
            situacao: order.status,
            obs: order.status_detail?.description || '',
            obs_interna: `ML Order ID: ${order.id}`,
            integration_account_id: mlAccount.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Insert/update order
          const { error: orderError } = await supabase
            .from('pedidos')
            .upsert(orderData, {
              onConflict: 'id'
            });

          if (orderError) {
            console.error(`Failed to save order ${order.id}:`, orderError);
            errors.push(`Order ${order.id}: ${orderError.message}`);
            continue;
          }

          // Process order items if available
          if (order.order_items) {
            for (const item of order.order_items) {
              const itemData = {
                pedido_id: order.id.toString(),
                numero_pedido: order.id.toString(),
                sku: item.item?.id || item.item?.seller_sku || '',
                descricao: item.item?.title || '',
                quantidade: item.quantity || 1,
                valor_unitario: parseFloat(item.unit_price) || 0,
                valor_total: parseFloat(item.full_unit_price) || 0,
                integration_account_id: mlAccount.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { error: itemError } = await supabase
                .from('itens_pedidos')
                .upsert(itemData, {
                  onConflict: 'pedido_id,sku'
                });

              if (itemError) {
                console.error(`Failed to save item for order ${order.id}:`, itemError);
                errors.push(`Item for order ${order.id}: ${itemError.message}`);
              }
            }
          }

          syncedCount++;

        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error);
          errors.push(`Order ${order.id}: ${error.message}`);
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from('ml_accounts_v2')
      .update({ 
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mlAccount.id);

    console.log('Orders sync v2 completed:', {
      account_id,
      synced: syncedCount,
      errors: errors.length,
      total_orders: ordersData.paging?.total || 0
    });

    return new Response(JSON.stringify({
      success: true,
      synced: syncedCount,
      errors: errors,
      total_available: ordersData.paging?.total || 0,
      account_nickname: mlAccount.nickname
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Orders sync v2 error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});