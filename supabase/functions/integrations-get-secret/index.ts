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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call',
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
    
    if (!b?.integration_account_id || !b?.provider) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "integration_account_id e provider são obrigatórios" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Autorização: validar organização e permissão antes de acessar segredos
    const { data: ia, error: iaErr } = await supabase
      .from('integration_accounts')
      .select('id, organization_id')
      .eq('id', b.integration_account_id)
      .maybeSingle();

    if (iaErr || !ia) {
      await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'get', p_function: 'integrations-get-secret', p_success: false, p_error: iaErr?.message ?? 'integration_account_not_found' });
      return new Response(JSON.stringify({ ok: false, error: 'Conta de integração não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: currentOrg } = await supabase.rpc('get_current_org_id');
    if (!currentOrg || ia.organization_id !== currentOrg) {
      await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'get', p_function: 'integrations-get-secret', p_success: false, p_error: 'forbidden' });
      return new Response(JSON.stringify({ ok: false, error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: canManage } = await supabase.rpc('has_permission', { permission_key: 'integrations:manage' });
    if (!canManage) {
      await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: 'get', p_function: 'integrations-get-secret', p_success: false, p_error: 'missing_permission' });
      return new Response(JSON.stringify({ ok: false, error: 'Permissão insuficiente' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Buscar segredos, mas NÃO retornar tokens em texto puro
    const { data, error } = await supabase
      .from('integration_secrets')
      .select('access_token, refresh_token, expires_at, meta')
      .eq('integration_account_id', b.integration_account_id)
      .eq('provider', b.provider)
      .maybeSingle();

    if (error) throw error;

    await supabase.rpc('log_secret_access', { p_account_id: b.integration_account_id, p_provider: b.provider, p_action: isInternal ? 'get_internal' : 'get', p_function: 'integrations-get-secret', p_success: true });

    if (isInternal) {
      return new Response(JSON.stringify({ ok: true, secret: data, internal: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const redacted = {
      has_access_token: !!data?.access_token,
      has_refresh_token: !!data?.refresh_token,
      expires_at: data?.expires_at ?? null,
      meta: data?.meta ?? {}
    };

    return new Response(JSON.stringify({ ok: true, secret: redacted }), { 
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