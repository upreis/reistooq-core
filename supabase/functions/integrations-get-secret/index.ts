import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptCompat, decryptAESGCM } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const INTERNAL_SHARED_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") ?? "";
const INTEGRATIONS_CRYPTO_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

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

function isInternalCall(req: Request) {
  const x = req.headers.get("x-internal-call");
  const t = req.headers.get("x-internal-token");
  return (x === "true") && (!!INTERNAL_SHARED_TOKEN && t === INTERNAL_SHARED_TOKEN);
}

// Legacy para compatibilidade (se existia decrypt antigo)
async function decryptLegacyIfAny(payloadB64: string, key: string) {
  return Promise.reject("no-legacy");
}

Deno.serve(async (req) => {
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
    const isInternal = isInternalCall(req);
    const serviceClient = makeServiceClient();
    const userClient = makeUserClient(req);
    const supabase = isInternal ? serviceClient : userClient;

    const body = await req.json();
    const { integration_account_id, provider } = body;
    
    console.log(`[integrations-get-secret] DEBUG: Request received`, {
      hasAuth: !!req.headers.get("Authorization"),
      isInternal,
      accountId: integration_account_id,
      provider
    });
    
    if (!integration_account_id) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "integration_account_id é obrigatório" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Para chamadas não internas, verificar organização e permissões usando userClient
    if (!isInternal) {
      const orgResult = await userClient.rpc('get_current_org_id');
      if (orgResult.error || !orgResult.data) {
        await userClient.rpc('log_secret_access', {
          p_account_id: integration_account_id,
          p_provider: provider,
          p_action: 'read_failed',
          p_function: 'integrations-get-secret',
          p_success: false,
          p_error: 'organization_not_found'
        });
        return new Response(JSON.stringify({ ok: false, error: 'Organization not found' }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Verificar permissões
      const permResult = await userClient.rpc('has_permission', { permission_key: 'integrations:manage' });
      if (permResult.error || !permResult.data) {
        await userClient.rpc('log_secret_access', {
          p_account_id: integration_account_id,
          p_provider: provider,
          p_action: 'read_failed',
          p_function: 'integrations-get-secret',
          p_success: false,
          p_error: 'insufficient_permissions'
        });
        return new Response(JSON.stringify({ ok: false, error: 'Insufficient permissions' }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // Buscar o segredo usando serviceClient (bypass RLS) para leitura dos secrets
    const { data: secret, error } = await serviceClient
      .from('integration_secrets')
      .select('*')
      .eq('integration_account_id', integration_account_id)
      .ilike('provider', provider)
      .maybeSingle();

    if (error) {
      console.error('[integrations-get-secret] Database error:', error);
      const logClient = isInternal ? serviceClient : userClient;
      await logClient.rpc('log_secret_access', {
        p_account_id: integration_account_id,
        p_provider: provider,
        p_action: 'read_failed',
        p_function: 'integrations-get-secret',
        p_success: false,
        p_error: error.message
      });
      return new Response(JSON.stringify({ ok: false, error: 'Database error' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Log do acesso
    const logClient = isInternal ? serviceClient : userClient;
    await logClient.rpc('log_secret_access', {
      p_account_id: integration_account_id,
      p_provider: provider,
      p_action: 'read_success',
      p_function: 'integrations-get-secret',
      p_success: true
    });

    if (!secret) {
      return new Response(JSON.stringify({ 
        ok: true, 
        secret: null,
        internal: isInternal 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Decriptar secret_enc se existir
    let decryptedSecret = null;
    if (secret.secret_enc) {
      try {
        const secretJson = await decryptCompat(secret.secret_enc, INTEGRATIONS_CRYPTO_KEY, decryptLegacyIfAny);
        decryptedSecret = JSON.parse(secretJson);
        console.log('[integrations-get-secret] Secret decrypted successfully');
      } catch (decryptError) {
        console.error('[integrations-get-secret] Failed to decrypt secret_enc:', decryptError);
        // Fallback para tokens diretos se existirem
        decryptedSecret = {
          access_token: secret.access_token,
          refresh_token: secret.refresh_token,
          expires_at: secret.expires_at
        };
      }
    } else {
      // Usar tokens diretos se não há secret_enc
      decryptedSecret = {
        access_token: secret.access_token,
        refresh_token: secret.refresh_token,
        expires_at: secret.expires_at
      };
    }

    // Para chamadas internas, retornar dados completos
    if (isInternal) {
      return new Response(JSON.stringify({
        ok: true,
        secret: {
          ...decryptedSecret,
          secret_enc: secret.secret_enc,
          provider: secret.provider,
          created_at: secret.created_at,
          updated_at: secret.updated_at
        },
        internal: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Para chamadas externas, retornar dados redacted
    const redactedSecret = {
      has_access_token: !!(decryptedSecret?.access_token || secret.access_token),
      has_refresh_token: !!(decryptedSecret?.refresh_token || secret.refresh_token),
      expires_at: decryptedSecret?.expires_at || secret.expires_at,
      provider: secret.provider,
      created_at: secret.created_at,
      updated_at: secret.updated_at
    };

    return new Response(JSON.stringify({
      ok: true,
      secret: redactedSecret,
      internal: false
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
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