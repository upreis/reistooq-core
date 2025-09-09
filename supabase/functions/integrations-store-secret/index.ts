import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptAESGCM } from "../_shared/crypto.ts";
import { SUPABASE_URL, SERVICE_KEY, ANON_KEY, CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") ?? "";

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
    const payload = await req.json();
    const { integration_account_id, provider, client_id, client_secret, access_token, refresh_token, expires_at } = payload;

    // Validações básicas
    if (!integration_account_id || !provider) {
      return new Response(JSON.stringify({ error: 'integration_account_id and provider are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const internal = isInternal(req);
    const serviceClient = makeServiceClient();
    let userClient = null;
    let organization_id = null;

    if (internal) {
      // Chamada interna: buscar organization_id via integration_accounts
      const { data: accountData } = await serviceClient
        .from('integration_accounts')
        .select('organization_id')
        .eq('id', integration_account_id)
        .single();
      
      organization_id = accountData?.organization_id;
    } else {
      // Chamada externa: validar usuário e permissões
      userClient = makeUserClient(req);
      
      // Verificar organização do usuário
      const { data: orgData } = await userClient.rpc('get_current_org_id');
      organization_id = orgData;
      
      if (!organization_id) {
        return new Response(JSON.stringify({ error: 'Organization not found' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Verificar permissão
      const { data: hasPermission } = await userClient.rpc('has_permission', { permission_key: 'integrations:manage' });
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Construir payload de segredos (minimização - só o necessário)
    const secretData = {
      client_id: client_id || '',
      client_secret: client_secret || '',
      access_token: access_token || '',
      refresh_token: refresh_token || '',
      expires_at: expires_at || ''
    };

    // Filtrar campos vazios
    const filteredSecretData = Object.fromEntries(
      Object.entries(secretData).filter(([_, value]) => value !== '')
    );

    // Criptografar com padrão único AES-GCM
    const encryptedSecret = await encryptAESGCM(JSON.stringify(filteredSecretData));

    // Também armazenar formato simples para compatibilidade (desbloqueia leitura imediata)
    const { data: simpleEnc, error: simpleErr } = await makeServiceClient()
      .rpc('encrypt_simple', { data: JSON.stringify(filteredSecretData) });
    if (simpleErr) {
      console.warn('[store-secret] encrypt_simple falhou, prosseguindo apenas com secret_enc:', simpleErr.message);
    }

    // Salvar no banco usando serviceClient (bypass RLS)
    const { error: upsertError } = await serviceClient
      .from('integration_secrets')
      .upsert({
        integration_account_id,
        provider,
        organization_id,
        secret_enc: encryptedSecret,
        simple_tokens: simpleEnc ?? null,
        use_simple: !!simpleEnc,
        expires_at: expires_at || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'integration_account_id,provider'
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to store secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log da operação (sem conteúdo sensível) + fingerprint da chave
    const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
    
    console.log(`[store-secret] persisted`, {
      integration_account_id,
      provider,
      keyFp: keyFingerprint,
      updated_at: new Date().toISOString()
    });

    await serviceClient.rpc('log_secret_access', {
      p_account_id: integration_account_id,
      p_provider: provider,
      p_action: 'store',
      p_function: 'integrations-store-secret',
      p_success: true
    });

    return new Response(JSON.stringify({ 
      ok: true,
      success: true, 
      message: 'Secret stored successfully',
      account_id: integration_account_id,
      provider 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Store secret error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});