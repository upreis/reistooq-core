import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Standalone helpers (no _shared import)
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

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

function ok(data: any) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

function fail(error: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET');
  }
  return { clientId, clientSecret };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail("Method Not Allowed", 405);
  }

  try {
    const supabase = makeClient(req.headers.get("Authorization"));
    const body = await req.json();
    const { integration_account_id } = body;

    if (!integration_account_id) {
      return fail("integration_account_id é obrigatório");
    }

    console.log('[ML Token Refresh] Starting token refresh for account:', integration_account_id);

    // Get current secrets
    const { data: secrets, error: secretsError } = await supabase.rpc('decrypt_integration_secret', {
      p_account_id: integration_account_id,
      p_provider: 'mercadolivre',
      p_encryption_key: ENC_KEY,
    });

    if (secretsError || !secrets) {
      console.error('[ML Token Refresh] Failed to get secrets:', secretsError);
      return fail("Segredos não encontrados ou inválidos", 404);
    }

    const refreshToken = secrets.refresh_token;
    if (!refreshToken) {
      return fail("Refresh token não encontrado", 400);
    }

    // Get ML credentials
    const { clientId, clientSecret } = getMlConfig();

    // Refresh tokens
    const refreshParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    console.log('[ML Token Refresh] Calling ML token refresh API...');

    const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: refreshParams.toString(),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('[ML Token Refresh] Token refresh failed:', errorText);
      return fail("Falha ao renovar token de acesso", 400);
    }

    const newTokenData = await refreshResponse.json();
    console.log('[ML Token Refresh] Token refresh successful');

    // Calculate new expires_at
    const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();

    // Update stored secrets with new tokens
    const { error: updateError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integration_account_id,
      p_provider: 'mercadolivre',
      p_client_id: clientId,
      p_client_secret: clientSecret,
      p_access_token: newTokenData.access_token,
      p_refresh_token: newTokenData.refresh_token || refreshToken, // Keep old if not returned
      p_expires_at: newExpiresAt,
      p_payload: secrets.payload, // Keep existing payload
      p_encryption_key: ENC_KEY,
    });

    if (updateError) {
      console.error('[ML Token Refresh] Failed to update secrets:', updateError);
      return fail("Falha ao salvar novos tokens", 500);
    }

    console.log('[ML Token Refresh] Successfully updated tokens');

    return ok({
      success: true,
      access_token: newTokenData.access_token,
      expires_at: newExpiresAt,
      token_type: newTokenData.token_type || 'Bearer',
    });

  } catch (e) {
    console.error('[ML Token Refresh] Unexpected error:', e);
    return fail(String(e?.message ?? e), 500);
  }
});