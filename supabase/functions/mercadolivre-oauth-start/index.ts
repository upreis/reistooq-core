import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { makeClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthStartRequest {
  organization_id: string;
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
    const serviceClient = makeClient(null); // service role for DB writes without RLS friction
    const { organization_id }: OAuthStartRequest = await req.json();

    if (!organization_id) {
      throw new Error('organization_id is required');
    }

    // Get ML credentials from secrets
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI');
    
    if (!ML_CLIENT_ID) {
      throw new Error('ML_CLIENT_ID not configured');
    }
    if (!ML_REDIRECT_URI) {
      throw new Error('ML_REDIRECT_URI not configured');
    }

    // Generate secure state for CSRF protection
    const state = crypto.randomUUID();

    // PKCE S256: generate code_verifier and derive code_challenge
    const makeCodeVerifier = () => {
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';
      const random = new Uint8Array(64);
      crypto.getRandomValues(random);
      return Array.from(random).map(b => charset[b % charset.length]).join('');
    };

    const toBase64Url = (bytes: Uint8Array) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+/g, '');
    };

    const code_verifier = makeCodeVerifier();
    const challengeBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code_verifier)));
    const code_challenge = toBase64Url(challengeBytes);

    // Resolve user and organization
    const jwt = authHeader.replace('Bearer ', '');
    let userId: string | null = null;
    try {
      userId = JSON.parse(atob(jwt.split('.')[1])).sub;
    } catch (_) {
      userId = null;
    }

    let organizationId: string | null = null;
    if (userId) {
      const { data: orgId, error: orgError } = await serviceClient
        .rpc('get_user_organization_id', { target_user_id: userId });
      if (orgError) {
        console.error('Organization lookup error (start):', orgError);
      }
      organizationId = orgId ?? null;
    }

    // Store OAuth state temporarily (expires in 10 minutes)
    let finalError: any = null;
    const { error: se1 } = await serviceClient
      .from('oauth_states')
      .insert({
        state_value: state,
        provider: 'mercadolivre',
        user_id: userId,
        organization_id: organizationId,
        code_verifier: code_verifier,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });


    if (se1) {
      console.error('Primary oauth_states insert failed (state_value schema). Falling back to legacy schema...', se1);
      // Fallback for legacy schema that uses id column and no provider/state_value
      const { error: se2 } = await serviceClient
        .from('oauth_states')
        .insert({
          id: state,
          user_id: userId!,
          code_verifier: code_verifier,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
      finalError = se2;
    }

    if (finalError) {
      console.error('Failed to store OAuth state (all attempts):', finalError);
      throw new Error('Failed to initialize OAuth flow');
    }

    // Build authorization URL following ML specs using environment variable
    const ML_AUTH_DOMAIN = 'https://auth.mercadolivre.com.br';
    const authUrl = new URL(`${ML_AUTH_DOMAIN}/authorization`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', ML_CLIENT_ID);
    // IMPORTANT: do NOT pre-encode, URLSearchParams will encode correctly
    authUrl.searchParams.set('redirect_uri', ML_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    // Add required scopes and PKCE for offline access and orders
    authUrl.searchParams.set('scope', 'offline_access read write');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('code_challenge', code_challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('OAuth flow initiated:', {
      organization_id,
      user_id: userId,
      state,
      redirect_uri: ML_REDIRECT_URI,
      authorization_url: authUrl.toString(),
      pkce_enabled: true,
      scopes: 'offline_access read write',
      timestamp: new Date().toISOString(),
    });

    // Set secure cookie with state for validation
    const cookieOptions = 'Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=600'; // 10 minutes
    
    return new Response(JSON.stringify({
      success: true,
      authorization_url: authUrl.toString(),
      state,
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': `ml_oauth_state=${state}; ${cookieOptions}`
      },
    });

  } catch (error) {
    console.error('OAuth start error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to start OAuth flow',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});