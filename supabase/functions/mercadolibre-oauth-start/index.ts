import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Local helpers (no cross-file imports to avoid deploy errors)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function ok(data: any) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(error: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');
  if (!clientId || !redirectUri) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID and ML_REDIRECT_URI are required');
  }
  return { clientId, redirectUri };
}

// PKCE helper functions
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return fail("Usuário não autenticado", 401);
    }

    // Get ML config (will throw if secrets are missing)
    const { clientId, redirectUri } = getMlConfig();

    console.log('[ML OAuth] Config loaded, starting OAuth flow');

    const body = await req.json();
    const { usePkce = true } = body;

    console.log('[ML OAuth] Starting OAuth flow with PKCE:', usePkce);

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state for security
    const state = crypto.randomUUID();

    console.log('Generated PKCE code_challenge for user:', user.id);

    // Store state and code_verifier in database for validation
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state_value: state,
        code_verifier: codeVerifier,
        provider: 'mercadolivre',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        user_id: user.id,
        organization_id: null // Will be set by trigger
      });

    if (stateError) {
      console.error('Failed to store state:', stateError);
      return fail("Erro interno de segurança", 500);
    }

    // Build authorization URL with PKCE support (Brasil domain per docs)
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'offline_access read write');

    // Add PKCE parameters if requested
    if (usePkce) {
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
    }

    console.log('[ML OAuth] Authorization URL generated successfully');

    return ok({
      url: authUrl.toString(),
      state: state
    });
  } catch (e) {
    console.error('Error in hyper-function:', e);
    return fail(String(e?.message ?? e), 500);
  }
});