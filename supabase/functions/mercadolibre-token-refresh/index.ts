import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function makeClient(authHeader) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // service-role para bypass de RLS
  return createClient(url, key, {
    global: authHeader ? {
      headers: {
        Authorization: authHeader
      }
    } : undefined
  });
}
const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";
function ok(data, status = 200) {
  return new Response(JSON.stringify({
    ok: true,
    ...data
  }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
function fail(error, status = 400, extra) {
  return new Response(JSON.stringify({
    ok: false,
    error,
    error_detail: extra ?? null
  }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
function getMlConfig() {
  const clientId = Deno.env.get("ML_CLIENT_ID");
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Missing ML secrets: ML_CLIENT_ID / ML_CLIENT_SECRET");
  return {
    clientId,
    clientSecret
  };
}
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    headers: corsHeaders
  });
  if (req.method !== "POST") return fail("Method Not Allowed", 405);
  try {
    if (!ENC_KEY) return fail("Encryption key not configured (APP_ENCRYPTION_KEY)", 500);
    const supabase = makeClient(req.headers.get("Authorization"));
    const { integration_account_id } = await req.json();
    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400);
    // 1) Lê refresh_token atual
    const { data: secrets, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('refresh_token, meta')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();
      
    if (secretsError || !secrets?.refresh_token) return fail("Refresh token não encontrado", 404, secretsError);
    const refreshToken = secrets.refresh_token;
    if (!refreshToken) return fail("Refresh token não encontrado", 400);
    const { clientId, clientSecret } = getMlConfig();
    // 2) Chama refresh no ML
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });
    const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString()
    });
    const raw = await resp.text();
    if (!resp.ok) {
      console.error("[ML Token Refresh] HTTP", resp.status, raw);
      // invalid_grant -> refresh vencido: forçará reconectar no app
      const msg = raw.includes("invalid_grant") ? "Refresh token inválido/expirado — reconecte a conta" : "Falha ao renovar token de acesso";
      return fail(msg, resp.status, {
        http_status: resp.status,
        body: raw
      });
    }
    const json = JSON.parse(raw);
    const newExpiresAt = new Date(Date.now() + (json.expires_in ?? 0) * 1000).toISOString();
    // 3) Atualiza tokens em texto puro
    const { error: upErr } = await supabase.from('integration_secrets').upsert({
      integration_account_id,
      provider: 'mercadolivre',
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? refreshToken,
      expires_at: newExpiresAt,
      meta: secrets.meta ?? {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'integration_account_id,provider' });
    if (upErr) return fail("Falha ao salvar novos tokens", 500, upErr);
    return ok({
      success: true,
      access_token: json.access_token,
      expires_at: newExpiresAt,
      token_type: json.token_type || "Bearer"
    });
  } catch (e) {
    console.error("[ML Token Refresh] Unexpected error:", e);
    return fail(String(e?.message ?? e), 500);
  }
});
