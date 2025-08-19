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
    const mlClientId = Deno.env.get('ML_CLIENT_ID');
    const mlClientSecret = Deno.env.get('ML_CLIENT_SECRET');

    if (!supabaseUrl || !supabaseServiceRoleKey || !appEncryptionKey || !mlClientId || !mlClientSecret) {
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

    const { account_id, provider } = await req.json();

    if (!account_id || !provider) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "account_id e provider são obrigatórios" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[Smart Responder] Refreshing token for account ${account_id}`);

    // Get current encrypted secret
    const { data: secretData, error: secretError } = await supabase.rpc('decrypt_integration_secret', {
      p_account_id: account_id,
      p_provider: provider,
      p_encryption_key: appEncryptionKey
    });

    if (secretError || !secretData?.refresh_token) {
      console.error('Failed to get refresh token:', secretError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Refresh token não encontrado" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Refresh token with MercadoLibre
    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: secretData.refresh_token,
      client_id: mlClientId,
      client_secret: mlClientSecret,
    });

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('ML token refresh failed:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Falha ao renovar token do MercadoLibre" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const tokenData = await tokenResponse.json();
    
    // Calculate expires_at (ML returns expires_in in seconds)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update encrypted secret with new tokens
    const { data: updateResult, error: updateError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: account_id,
      p_provider: provider,
      p_client_id: mlClientId,
      p_client_secret: mlClientSecret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token || secretData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_payload: secretData.payload || {},
      p_encryption_key: appEncryptionKey,
    });

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Falha ao salvar novos tokens" 
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[Smart Responder] Token refreshed successfully for account ${account_id}`);

    return new Response(JSON.stringify({ 
      success: true,
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString()
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error('Error in smart-responder:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error?.message ?? error) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});