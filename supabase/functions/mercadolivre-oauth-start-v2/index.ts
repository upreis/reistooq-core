import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface OAuthStartRequest {
  organization_id: string;
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

    console.log('[ML OAuth v2] Starting OAuth flow...');

    // Parse request body
    const { organization_id } = await req.json() as OAuthStartRequest;

    if (!organization_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Organization ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ML credentials from environment/secrets
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI') || 
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolivre-oauth-callback-v2`;

    if (!ML_CLIENT_ID) {
      console.error('[ML OAuth v2] Missing ML_CLIENT_ID');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais MercadoLibre não configuradas. Configure ML_CLIENT_ID.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from Authorization header (optional for demo)
    const authHeader = req.headers.get('Authorization');
    let userId = 'demo-user-v2';
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (user && !userError) {
        userId = user.id;
        console.log('[ML OAuth v2] User authenticated:', user.id);
      } else {
        console.warn('[ML OAuth v2] User auth failed, using demo mode:', userError?.message);
      }
    }

    // Generate secure state and PKCE parameters
    const state = crypto.randomUUID();
    const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Store OAuth state in database
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state_value: state,
        user_id: userId,
        organization_id: organization_id,
        code_verifier: codeVerifier,
        provider: 'mercadolivre_v2',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: false
      });

    if (stateError) {
      console.error('[ML OAuth v2] Failed to store OAuth state:', stateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to initialize OAuth' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build authorization URL
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', ML_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', ML_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'offline_access read write');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('[ML OAuth v2] OAuth flow initialized successfully:', {
      user_id: userId,
      organization_id,
      state: state.substring(0, 8) + '...',
      redirect_uri: ML_REDIRECT_URI,
      client_id: ML_CLIENT_ID.substring(0, 8) + '...'
    });

    // Return authorization URL
    return new Response(JSON.stringify({
      success: true,
      authorization_url: authUrl.toString(),
      state
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': `ml_oauth_state_v2=${state}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=900`
      },
    });

  } catch (error) {
    console.error('[ML OAuth v2] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});