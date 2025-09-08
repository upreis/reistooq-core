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

// Encryption helpers
async function deriveAesKey(encKey: string) {
  const te = new TextEncoder();
  const raw = te.encode(encKey);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt']);
}

function concatBytes(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // deno-lint-ignore no-explicit-any
  return (btoa as any)(binary);
}

async function encryptPayload(obj: unknown) {
  const te = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(ENC_KEY);
  const plaintext = te.encode(JSON.stringify(obj));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const cipher = new Uint8Array(cipherBuf);
  const packed = concatBytes(iv, cipher);
  return toBase64(packed);
}

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
    const authHeader = req.headers.get("Authorization");
    const isInternal = (req.headers.get('x-internal-call') ?? '') === ENC_KEY;
    const supabase = makeClient(authHeader);
    const b = await req.json();
    
    console.log('[integrations-store-secret] DEBUG: Request received', {
      hasAuth: !!authHeader,
      isInternal,
      accountId: b?.integration_account_id,
      provider: b?.provider
    });
    
    if (!b?.integration_account_id || !b?.provider) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "integration_account_id e provider são obrigatórios" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Preparar organização (sempre precisamos do organization_id)
    let orgId: string | null = null;
    let ia: { id: string; organization_id: string } | null = null;

    if (!isInternal) {
      // Autorização: validar organização e permissão antes de gravar segredos
      const { data: iaRes, error: iaErr } = await supabase
        .from('integration_accounts')
        .select('id, organization_id')
        .eq('id', b.integration_account_id)
        .maybeSingle();

      if (iaErr || !iaRes) {
        await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: false, p_error: iaErr?.message ?? 'integration_account_not_found' });
        return new Response(JSON.stringify({ ok: false, error: 'Conta de integração não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      ia = iaRes;

      const { data: currentOrg } = await supabase.rpc('get_current_org_id');
      if (!currentOrg || ia.organization_id !== currentOrg) {
        await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: false, p_error: 'forbidden' });
        return new Response(JSON.stringify({ ok: false, error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: canManage } = await supabase.rpc('has_permission', { permission_key: 'integrations:manage' });
      if (!canManage) {
        await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: false, p_error: 'missing_permission' });
        return new Response(JSON.stringify({ ok: false, error: 'Permissão insuficiente' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      orgId = ia.organization_id;
    } else {
      // Chamada interna (OAuth callback): apenas garantir que a conta existe e obter organization_id
      const { data: iaRes, error: iaErr } = await supabase
        .from('integration_accounts')
        .select('id, organization_id')
        .eq('id', b.integration_account_id)
        .maybeSingle();

      if (iaErr || !iaRes) {
        await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: false, p_error: iaErr?.message ?? 'integration_account_not_found' });
        return new Response(JSON.stringify({ ok: false, error: 'Conta de integração não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      ia = iaRes;
      orgId = ia.organization_id;
    }

    // Montar payload criptografado e efetuar UPSERT com organization_id
    const encPayload = {
      provider: b.provider,
      integration_account_id: b.integration_account_id,
      access_token: b.access_token ?? null,
      refresh_token: b.refresh_token ?? null,
      expires_at: b.expires_at ? new Date(b.expires_at).toISOString() : null,
      meta: b.payload || {}
    };

    let secretEnc: string;
    try {
      secretEnc = await encryptPayload(encPayload);
    } catch (e) {
      console.error('[integrations-store-secret] encryption_failed', e);
      await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: false, p_error: 'encryption_failed' });
      return new Response(JSON.stringify({ ok: false, error: 'Falha ao criptografar segredos' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabase.from('integration_secrets').upsert({
      integration_account_id: b.integration_account_id,
      provider: b.provider,
      organization_id: orgId,
      access_token: b.access_token ?? null,
      refresh_token: b.refresh_token ?? null,
      expires_at: b.expires_at ? new Date(b.expires_at).toISOString() : null,
      meta: b.payload || {},
      secret_enc: secretEnc,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'integration_account_id,provider',
      ignoreDuplicates: false 
    }).select('id');

    if (error) throw error;

    console.log('[integrations-store-secret] SUCCESS: Tokens persisted', { accountId: b.integration_account_id, provider: b.provider, id: data?.[0]?.id });
    await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'set', p_function: 'integrations-store-secret', p_success: true });

    return new Response(JSON.stringify({ ok: true, id: data?.[0]?.id }), { 
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