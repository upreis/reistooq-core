import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient } from "../_shared/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = makeClient(req.headers.get("Authorization"));
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Usuário não autenticado" 
      }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Get ML secrets from vault
    const { data: clientIdData } = await supabase.rpc('get_secret', { 
      name: 'ML_CLIENT_ID' 
    });
    const { data: redirectUriData } = await supabase.rpc('get_secret', { 
      name: 'ML_REDIRECT_URI' 
    });

    if (!clientIdData || !redirectUriData) {
      console.error('Missing ML secrets:', { clientIdData, redirectUriData });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Configuração do MercadoLibre não encontrada" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const clientId = clientIdData;
    const redirectUri = redirectUriData;
    
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
        user_id: user.id, // Current authenticated user
        organization_id: null // Will be set by trigger
      });

    if (stateError) {
      console.error('Failed to store state:', stateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro interno de segurança" 
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Build authorization URL with PKCE support (global auth domain per docs)
    const authUrl = new URL('https://auth.mercadolibre.com/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'offline_access read write');
    
    // Add PKCE parameters
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('ML OAuth URL generated:', authUrl.toString());

    return new Response(JSON.stringify({ 
      success: true, 
      authorization_url: authUrl.toString(),
      state: state
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error('Error in hyper-function:', e);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(e?.message ?? e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});