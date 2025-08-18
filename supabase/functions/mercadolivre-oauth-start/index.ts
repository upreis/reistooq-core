import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeClient } from "../_shared/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthStartRequest {
  organization_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json() as OAuthStartRequest;
    
    // Get environment variables
    const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID");
    const ML_REDIRECT_URI = Deno.env.get("ML_REDIRECT_URI");
    
    if (!ML_CLIENT_ID || !ML_REDIRECT_URI) {
      console.error("Missing ML credentials:", { ML_CLIENT_ID: !!ML_CLIENT_ID, ML_REDIRECT_URI: !!ML_REDIRECT_URI });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "MercadoLibre credentials not configured" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate secure state for CSRF protection
    const state = crypto.randomUUID();
    
    // Get user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    const supabase = makeClient(authHeader);
    
    let userId: string | null = null;
    let organizationId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      
      // Get organization ID if needed
      if (organization_id === 'current' && userId) {
        const { data } = await supabase.rpc('get_current_org_id');
        organizationId = data || null;
      }
    }

    // Store OAuth state in database
    try {
      const { error: stateError } = await supabase
        .from('oauth_states')
        .insert({
          state_value: state,
          provider: 'mercadolivre',
          user_id: userId,
          organization_id: organizationId,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          used: false
        });

      if (stateError) {
        console.error("Failed to store OAuth state:", stateError);
        // Continue anyway, state validation is secondary
      }
    } catch (error) {
      console.error("Error storing OAuth state:", error);
      // Continue anyway
    }

    // Build MercadoLibre authorization URL
    const authUrl = new URL("https://auth.mercadolivre.com.br/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", ML_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", ML_REDIRECT_URI);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", "read write offline_access");

    console.log("OAuth URL generated successfully:", {
      client_id: ML_CLIENT_ID,
      redirect_uri: ML_REDIRECT_URI,
      state: state.substring(0, 8) + "...",
      user_id: userId?.substring(0, 8) + "..." || "anonymous"
    });

    // Set secure cookie with state
    const response = new Response(
      JSON.stringify({
        success: true,
        authorization_url: authUrl.toString(),
        state: state
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': `ml_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
        }
      }
    );

    return response;

  } catch (error) {
    console.error("OAuth start error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});