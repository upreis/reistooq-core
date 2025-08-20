import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, getMlConfig, corsHeaders, ok, fail } from "../_shared/client.ts";

// Generate random string for PKCE and state
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate PKCE code verifier
function generateCodeVerifier(): string {
  return generateRandomString(32);
}

// Generate PKCE code challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return fail("User not authenticated", 401);
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organizacao_id) {
      return fail("Organization not found for user", 400);
    }

    console.log('[ML OAuth Start] Starting OAuth flow for user:', user.id);

    // Get ML configuration
    const { clientId, redirectUri } = getMlConfig();

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);

    // Store OAuth state in database
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state_value: state,
        code_verifier: codeVerifier,
        user_id: user.id,
        organization_id: profile.organizacao_id,
        provider: 'mercadolivre',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        used: false
      });

    if (stateError) {
      console.error('[ML OAuth Start] Failed to store state:', stateError);
      return fail("Failed to initialize OAuth flow", 500);
    }

    // Build authorization URL
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('[ML OAuth Start] Generated authorization URL');

    return ok({
      authorization_url: authUrl.toString(),
      state,
      expires_in: 900 // 15 minutes
    });

  } catch (e) {
    console.error('[ML OAuth Start] Unexpected error:', e);
    return fail(String(e?.message ?? e), 500);
  }
});