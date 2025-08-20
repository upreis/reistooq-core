import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY } from "../_shared/client.ts";

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

    const { data, error } = await supabase.rpc("encrypt_integration_secret", {
      p_account_id: b.integration_account_id,
      p_provider: b.provider,
      p_client_id: b.client_id ?? null,
      p_client_secret: b.client_secret ?? null,
      p_access_token: b.access_token ?? null,
      p_refresh_token: b.refresh_token ?? null,
      p_expires_at: b.expires_at ?? null,
      p_payload: b.payload ?? {},
      p_encryption_key: ENC_KEY,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: data }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error('Error in integrations-store-secret:', e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: String(e?.message ?? e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});