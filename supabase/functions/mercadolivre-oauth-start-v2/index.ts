import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthStartRequest {
  organization_id: string;
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { organization_id } = await req.json() as OAuthStartRequest;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'Organization ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ML credentials from environment
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI');

    if (!ML_CLIENT_ID || !ML_REDIRECT_URI) {
      console.error('Missing ML credentials:', { ML_CLIENT_ID: !!ML_CLIENT_ID, ML_REDIRECT_URI: !!ML_REDIRECT_URI });
      return new Response(JSON.stringify({ error: 'ML credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from Authorization header
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

    // Verify user token and get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Failed to verify user:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

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
        provider: 'mercadolivre',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        used: false
      });

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError);
      return new Response(JSON.stringify({ error: 'Failed to initialize OAuth' }), {
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
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('OAuth v2 flow initiated:', {
      user_id: userId,
      organization_id,
      state,
      redirect_uri: ML_REDIRECT_URI,
      authorization_url: authUrl.toString(),
      pkce_enabled: true,
      scopes: 'offline_access read write',
      timestamp: new Date().toISOString()
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
    console.error('OAuth start v2 error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});