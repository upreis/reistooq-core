import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { makeClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrdersRequest {
  integration_account_id: string;
  seller_id?: string;
  status?: string;
  since?: string;
  until?: string;
  sort?: 'date_asc' | 'date_desc';
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const client = makeClient(authHeader);
    const params: OrdersRequest = await req.json();

    if (!params.integration_account_id) {
      throw new Error('integration_account_id is required');
    }

    // Get valid access token (with auto-refresh)
    const { data: secrets } = await client.rpc('get_integration_secret_secure', {
      account_id: params.integration_account_id,
      provider_name: 'mercadolivre',
      requesting_function: 'mercadolivre-orders',
    });

    if (!secrets || !secrets.access_token) {
      throw new Error('MercadoLibre not connected or tokens expired');
    }

    // Check if token needs refresh (expires in less than 5 minutes)
    let accessToken = secrets.access_token;
    if (secrets.expires_at) {
      const expiresAt = new Date(secrets.expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (expiresAt < fiveMinutesFromNow && secrets.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: secrets.client_id,
            client_secret: secrets.client_secret,
            refresh_token: secrets.refresh_token,
          }),
        });

        if (refreshResponse.ok) {
          const newTokenData = await refreshResponse.json();
          accessToken = newTokenData.access_token;
          
          // Update stored tokens
          const newExpiresAt = newTokenData.expires_in 
            ? new Date(Date.now() + newTokenData.expires_in * 1000)
            : new Date(Date.now() + 6 * 60 * 60 * 1000);

          await client.rpc('update_integration_secret_secure', {
            account_id: params.integration_account_id,
            provider_name: 'mercadolivre',
            new_access_token: newTokenData.access_token,
            new_refresh_token: newTokenData.refresh_token || secrets.refresh_token,
            new_expires_at: newExpiresAt.toISOString(),
          });

          console.log('ML token refreshed successfully');
        }
      }
    }

    // Get user info to extract seller_id if not provided
    let sellerId = params.seller_id;
    if (!sellerId) {
      const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info from MercadoLibre');
      }

      const userData = await userResponse.json();
      sellerId = userData.id.toString();
    }

    // Build orders search URL following ML API specs
    const ordersUrl = new URL('https://api.mercadolibre.com/orders/search');
    ordersUrl.searchParams.set('seller', sellerId);
    
    if (params.status) {
      ordersUrl.searchParams.set('order.status', params.status);
    }
    
    if (params.since) {
      ordersUrl.searchParams.set('order.date_created.from', params.since);
    }
    
    if (params.until) {
      ordersUrl.searchParams.set('order.date_created.to', params.until);
    }
    
    if (params.sort) {
      const sortValue = params.sort === 'date_desc' ? 'date_desc' : 'date_asc';
      ordersUrl.searchParams.set('sort', sortValue);
    }
    
    if (params.limit) {
      ordersUrl.searchParams.set('limit', Math.min(params.limit, 50).toString()); // ML max is 50
    }
    
    if (params.offset) {
      ordersUrl.searchParams.set('offset', params.offset.toString());
    }

    // Fetch orders from MercadoLibre API
    const ordersResponse = await fetch(ordersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      throw new Error(`ML API error: ${ordersResponse.status} - ${errorText}`);
    }

    const ordersData = await ordersResponse.json();

    // Process and normalize orders data
    const processedOrders = ordersData.results?.map((order: any) => ({
      ml_order_id: order.id,
      status: order.status,
      date_created: order.date_created,
      date_closed: order.date_closed,
      currency_id: order.currency_id,
      total_amount: order.total_amount,
      paid_amount: order.paid_amount,
      buyer: {
        id: order.buyer?.id,
        nickname: order.buyer?.nickname,
        email: order.buyer?.email,
      },
      seller: {
        id: order.seller?.id,
        nickname: order.seller?.nickname,
      },
      shipping: order.shipping ? {
        id: order.shipping.id,
        status: order.shipping.status,
        mode: order.shipping.mode,
        tracking_number: order.shipping.tracking_number,
        tracking_method: order.shipping.tracking_method,
      } : null,
      order_items: order.order_items?.map((item: any) => ({
        item_id: item.item?.id,
        title: item.item?.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        full_unit_price: item.full_unit_price,
      })) || [],
      payments: order.payments?.map((payment: any) => ({
        id: payment.id,
        status: payment.status,
        payment_method_id: payment.payment_method_id,
        payment_type: payment.payment_type,
        total_paid_amount: payment.total_paid_amount,
      })) || [],
      feedback: order.feedback,
      context: order.context,
      mediations: order.mediations,
    })) || [];

    console.log('ML orders fetched successfully:', {
      seller_id: sellerId,
      total_orders: ordersData.paging?.total || 0,
      returned_orders: processedOrders.length,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: processedOrders,
        paging: ordersData.paging || {
          total: processedOrders.length,
          offset: params.offset || 0,
          limit: params.limit || 50,
        },
        sort: ordersData.sort,
        available_sorts: ordersData.available_sorts,
        available_filters: ordersData.available_filters,
      },
      metadata: {
        seller_id: sellerId,
        fetched_at: new Date().toISOString(),
        source: 'mercadolibre_api',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML orders fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch MercadoLibre orders',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});