import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptAESGCM, encryptAESGCM } from "../_shared/crypto.ts";
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
      .select('refresh_token, meta, secret_enc')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();
    let refreshToken = secrets.refresh_token as string | null;

    // ✅ CORRIGIDO: Fallback robusto com múltiplos métodos de decriptação
    if ((!refreshToken || refreshToken.length === 0) && secrets?.secret_enc) {
      try {
        let raw: any = secrets.secret_enc;
        
        // Método 1: Handle bytea format (PostgreSQL)
        if (typeof raw === 'string' && raw.startsWith('\\x')) {
          const hex = raw.slice(2);
          const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
          raw = new TextDecoder().decode(bytes);
        }
        
        // Método 2: Handle Buffer objects
        if (raw && typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data)) {
          raw = new TextDecoder().decode(Uint8Array.from(raw.data));
        }
        
        // Método 3: Handle Uint8Array
        if (raw instanceof Uint8Array) {
          raw = new TextDecoder().decode(raw);
        }
        
        // Validação antes da decriptação
        const payload = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
        if (!payload || payload.length === 0) {
          console.warn('[ML Token Refresh] Payload vazio após processamento');
          return fail("Secret data corrupted", 500);
        }
        
        // Tentar decriptar com validação de integridade
        const secretJson = await decryptAESGCM(payload, ENC_KEY);
        if (!secretJson || secretJson.trim().length === 0) {
          console.warn('[ML Token Refresh] Decriptação resultou em string vazia');
          return fail("Failed to decrypt tokens", 500);
        }
        
        const secret = JSON.parse(secretJson);
        refreshToken = secret.refresh_token || refreshToken;
        
        if (refreshToken) {
          console.log('[ML Token Refresh] ✅ Refresh token recuperado via decriptação');
        }
      } catch (e) {
        console.error('[ML Token Refresh] ❌ Falha crítica na decriptação:', e.message);
        return fail("Token decryption failed - reconnect required", 500, { decryption_error: e.message });
      }
    }

    // ✅ VALIDAÇÃO DE SECRETS OBRIGATÓRIA (Sistema Blindado)
    if (!refreshToken) {
      console.error('[ML Token Refresh] ❌ CRITICO: Refresh token não encontrado após todos os fallbacks');
      
      // Verificar se secrets estão configurados (sistema blindado exige)
      if (!Deno.env.get('APP_ENCRYPTION_KEY') || Deno.env.get('APP_ENCRYPTION_KEY')!.length < 32) {
        console.error('[ML Token Refresh] ❌ CRITICO: APP_ENCRYPTION_KEY ausente ou inválido');
        return fail("APP_ENCRYPTION_KEY not configured", 500, { 
          error_type: 'config_missing',
          required_secret: 'APP_ENCRYPTION_KEY'
        });
      }

      try {
        const { clientId, clientSecret } = getMlConfig();
        if (!clientId || !clientSecret) {
          console.error('[ML Token Refresh] ❌ CRITICO: ML_CLIENT_ID ou ML_CLIENT_SECRET ausentes');
          return fail("ML secrets not configured", 500, { 
            error_type: 'config_missing',
            required_secrets: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET']
          });
        }
      } catch (e) {
        console.error('[ML Token Refresh] ❌ CRITICO: Erro ao verificar ML secrets:', e.message);
        return fail("ML configuration error", 500, { 
          error_type: 'config_error',
          message: e.message
        });
      }

      return fail("Refresh token não encontrado", 404, { 
        error_type: 'no_refresh_token',
        message: 'Conta requer reconexão OAuth',
        account_id: integration_account_id
      });
    }

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
