import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptAESGCM } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRYPTO_KEY = Deno.env.get("APP_ENCRYPTION_KEY");
const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") ?? "";

// Fail-fast se envs obrigatórias estão ausentes
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "APP_ENCRYPTION_KEY"];
const missing = required.filter(k => !Deno.env.get(k));
if (missing.length) throw new Error("Missing envs: " + missing.join(","));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function makeServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

function makeUserClient(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: auth ? { Authorization: auth } : {} },
  });
}

function isInternal(req: Request) {
  return req.headers.get("x-internal-call") === "true" && 
         INTERNAL_TOKEN && 
         req.headers.get("x-internal-token") === INTERNAL_TOKEN;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { integration_account_id, provider } = await req.json();

    if (!integration_account_id) {
      return new Response(JSON.stringify({ error: 'integration_account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const internal = isInternal(req);
    const serviceClient = makeServiceClient();

    if (!internal) {
      // Chamada externa: validar permissões
      const userClient = makeUserClient(req);
      
      const { data: orgData } = await userClient.rpc('get_current_org_id');
      if (!orgData) {
        return new Response(JSON.stringify({ error: 'Organization not found' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { data: hasPermission } = await userClient.rpc('has_permission', { permission_key: 'integrations:manage' });
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Buscar segredo usando serviceClient (bypass RLS)
    const { data: secretRow, error: fetchError } = await serviceClient
      .from('integration_secrets')
      .select('secret_enc, provider, expires_at')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', provider || 'mercadolivre')
      .maybeSingle();

    // Log da tentativa de acesso
    await serviceClient.rpc('log_secret_access', {
      p_account_id: integration_account_id,
      p_provider: provider || 'mercadolivre',
      p_action: 'get',
      p_function: 'integrations-get-secret',
      p_success: !!secretRow && !fetchError
    });

    if (fetchError) {
      console.error('Fetch secret error:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!secretRow || !secretRow.secret_enc) {
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'No secret found for this account' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Converter bytea para string se necessário
      let secretString = secretRow.secret_enc;
      if (typeof secretString === 'string' && secretString.startsWith('\\x')) {
        const hexString = secretString.slice(2);
        const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        secretString = new TextDecoder().decode(bytes);
      }

      const decryptedData = await decryptAESGCM(secretString, CRYPTO_KEY!);
      const secret = JSON.parse(decryptedData);

      if (internal) {
        // Chamada interna: retorna segredo completo
        return new Response(JSON.stringify({
          found: true,
          secret,
          expires_at: secretRow.expires_at
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Chamada externa: retorna versão ofuscada
        return new Response(JSON.stringify({
          found: true,
          has_access_token: !!secret.access_token,
          has_refresh_token: !!secret.refresh_token,
          expires_at: secretRow.expires_at,
          provider: secretRow.provider
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (decryptError) {
      console.error('Decrypt error:', decryptError);
      return new Response(JSON.stringify({ 
        error: 'Failed to decrypt secret - may need to reconnect' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Get secret error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});