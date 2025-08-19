import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const appEncryptionKey = Deno.env.get('APP_ENCRYPTION_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey || !appEncryptionKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required environment variables" 
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const { account_id, since, until, status, limit = 50, offset = 0 } = await req.json();

    if (!account_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "account_id é obrigatório" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[Rapid Responder] Fetching orders for account ${account_id}`);

    // Get access token
    const { data: secretData, error: secretError } = await supabase.rpc('decrypt_integration_secret', {
      p_account_id: account_id,
      p_provider: 'mercadolivre',
      p_encryption_key: appEncryptionKey
    });

    if (secretError || !secretData?.access_token) {
      console.error('Failed to get access token:', secretError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Token de acesso não encontrado" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let accessToken = secretData.access_token;

    // Check if token is expired and refresh if needed
    if (secretData.expires_at) {
      const expiresAt = new Date(secretData.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      if (expiresAt.getTime() - now.getTime() < bufferTime) {
        console.log('[Rapid Responder] Token expiring soon, refreshing...');
        
        // Call smart-responder to refresh token
        const refreshResponse = await supabase.functions.invoke('smart-responder', {
          body: { account_id, provider: 'mercadolivre' }
        });

        if (refreshResponse.data?.success) {
          accessToken = refreshResponse.data.access_token;
          console.log('[Rapid Responder] Token refreshed successfully');
        } else {
          console.error('[Rapid Responder] Failed to refresh token:', refreshResponse.error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Falha ao renovar token de acesso" 
          }), { 
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
    }

    // Get seller info if not available
    let sellerId = secretData.payload?.seller_id;
    
    if (!sellerId) {
      console.log('[Rapid Responder] Getting seller info...');
      const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.text();
        console.error('Failed to get user info:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Falha ao obter informações do usuário" 
        }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const userData = await userResponse.json();
      sellerId = userData.id;

      // Update payload with seller_id
      const updatedPayload = { ...secretData.payload, seller_id: sellerId };
      await supabase.rpc('encrypt_integration_secret', {
        p_account_id: account_id,
        p_provider: 'mercadolivre',
        p_client_id: secretData.client_id,
        p_client_secret: secretData.client_secret,
        p_access_token: accessToken,
        p_refresh_token: secretData.refresh_token,
        p_expires_at: secretData.expires_at,
        p_payload: updatedPayload,
        p_encryption_key: appEncryptionKey,
      });
    }

    // Build orders search URL
    const searchParams = new URLSearchParams({
      seller: sellerId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (since) {
      searchParams.append('order.date_created.from', since);
    }
    if (until) {
      searchParams.append('order.date_created.to', until);
    }
    if (status) {
      searchParams.append('order.status', status);
    }

    const ordersUrl = `https://api.mercadolibre.com/orders/search?${searchParams.toString()}`;
    
    console.log(`[Rapid Responder] Fetching orders from: ${ordersUrl}`);

    // Fetch orders from MercadoLibre
    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text();
      console.error('Failed to fetch orders:', error);
      
      // Handle specific ML errors
      if (ordersResponse.status === 401) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Token de acesso inválido ou expirado" 
        }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      if (ordersResponse.status === 403) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Acesso negado. Verifique se a conta tem permissão para acessar vendas." 
        }), { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Falha ao buscar pedidos do MercadoLibre" 
      }), { 
        status: ordersResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const ordersData = await ordersResponse.json();
    
    console.log(`[Rapid Responder] Found ${ordersData.results?.length || 0} orders`);

    return new Response(JSON.stringify({ 
      success: true,
      orders: ordersData.results || [],
      paging: ordersData.paging || {},
      total: ordersData.paging?.total || 0
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error('Error in rapid-responder:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error?.message ?? error) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});