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

// Verificar saúde do MercadoLibre
async function checkMercadoLibreHealth(accessToken: string) {
  try {
    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      return { success: false, error: 'Token expirado ou inválido', requiresRefresh: true };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit atingido', rateLimit: true };
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { 
      success: true, 
      user_id: data.id,
      nickname: data.nickname,
      country_id: data.country_id 
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Verificar saúde da Shopee
async function checkShopeeHealth(accessToken: string, shopId: string, partnerId: string, partnerSecret: string) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/get_shop_info';
    
    // Gerar assinatura
    const baseString = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(partnerSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString));
    const hashArray = Array.from(new Uint8Array(signature));
    const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: timestamp.toString(),
      access_token: accessToken,
      shop_id: shopId,
      sign
    });

    const response = await fetch(`https://partner.shopeemobile.com${path}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, error: `Shopee API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: `Shopee error: ${data.error}` };
    }

    return { 
      success: true,
      shop_name: data.response?.shop_name,
      country: data.response?.country
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
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
    const { integration_account_id, provider } = await req.json();

    if (!integration_account_id || !provider) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'integration_account_id and provider are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = makeClient(req.headers.get("Authorization"));

    // Buscar secrets da integração
    const { data: secretData } = await supabase.functions.invoke('integrations-get-secret', {
      body: {
        integration_account_id,
        provider
      }
    });

    if (!secretData?.secret) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Integration credentials not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const secrets = secretData.secret;
    let healthResult;

    if (provider === 'mercadolivre') {
      if (!secrets.access_token) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'MercadoLibre access token not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      healthResult = await checkMercadoLibreHealth(secrets.access_token);
    } else if (provider === 'shopee') {
      const partnerId = Deno.env.get('SHOPEE_PARTNER_ID');
      const partnerSecret = Deno.env.get('SHOPEE_PARTNER_SECRET');

      if (!secrets.access_token || !secrets.shop_id || !partnerId || !partnerSecret) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Shopee configuration incomplete' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      healthResult = await checkShopeeHealth(
        secrets.access_token, 
        secrets.shop_id, 
        partnerId, 
        partnerSecret
      );
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unsupported provider' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Health Check] ${provider} health check result:`, healthResult);

    return new Response(JSON.stringify({
      provider,
      integration_account_id,
      ...healthResult,
      checked_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Health Check] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});