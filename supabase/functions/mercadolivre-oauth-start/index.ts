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
    const { organization_id }: OAuthStartRequest = await req.json();

    if (!organization_id) {
      throw new Error('organization_id is required');
    }

    // Get ML credentials from secrets
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    if (!ML_CLIENT_ID) {
      throw new Error('ML_CLIENT_ID not configured');
    }

    // ML OAuth URLs for Brazil
    const ML_AUTH_DOMAIN = 'https://auth.mercadolivre.com.br';
    const ML_REDIRECT_URI = `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolivre-oauth-callback`;

    // Generate secure state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store OAuth state temporarily (expires in 10 minutes)
    const { error: stateError } = await client
      .from('oauth_states')
      .insert({
        id: state,
        user_id: JSON.parse(atob(authHeader.replace('Bearer ', '').split('.')[1])).sub, // Decode JWT for user ID
        code_verifier: state, // Using state as verifier for simplicity
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError);
      throw new Error('Failed to initialize OAuth flow');
    }

    // Build authorization URL following ML specs
    const authUrl = new URL(`${ML_AUTH_DOMAIN}/authorization`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', ML_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', ML_REDIRECT_URI);
    authUrl.searchParams.set('state', state);

    console.log('OAuth flow initiated:', {
      organization_id,
      state,
      redirect_uri: ML_REDIRECT_URI,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      authorization_url: authUrl.toString(),
      state,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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