import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Standalone helpers (no _shared import)
function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

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
    const supabase = makeClient(req.headers.get("Authorization"));
    const b = await req.json();
    
    if (!b?.integration_account_id || !b?.provider) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "integration_account_id e provider são obrigatórios" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Direct query to integration_secrets table (no decryption needed)
    const { data, error } = await supabase
      .from('integration_secrets')
      .select('access_token, refresh_token, expires_at, meta')
      .eq('integration_account_id', b.integration_account_id)
      .eq('provider', b.provider)
      .maybeSingle();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, secret: data ?? {} }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error('Error in integrations-get-secret:', e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: String(e?.message ?? e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});