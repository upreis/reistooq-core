// supabase/functions/mercadolibre-diagnose/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Check = { name: string; ok: boolean; detail?: any; fix?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const autoFix = url.searchParams.get("autofix") === "1";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID") ?? Deno.env.get("MERCADOLIVRE_CLIENT_ID") ?? "";
  const ML_CLIENT_SECRET = Deno.env.get("ML_CLIENT_SECRET") ?? Deno.env.get("MERCADOLIVRE_CLIENT_SECRET") ?? "";
  const APP_ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY") ?? "";
  const REDIRECT_URI = Deno.env.get("ML_REDIRECT_URI")
    ?? `${SUPABASE_URL}/functions/v1/mercadolibre-oauth-callback`;

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const checks: Check[] = [];

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ ok: false, checks: [{ name: "auth", ok: false, fix: "Envie Authorization: Bearer <token do usuário>" }] }, 401);
  }

  // 1) ENV
  checks.push(check("env.ML_CLIENT_ID", !!ML_CLIENT_ID, "Configure ML_CLIENT_ID"));
  checks.push(check("env.ML_CLIENT_SECRET", !!ML_CLIENT_SECRET, "Configure ML_CLIENT_SECRET"));
  checks.push(check("env.APP_ENCRYPTION_KEY", !!APP_ENCRYPTION_KEY, "Configure APP_ENCRYPTION_KEY"));
  checks.push(check("env.SUPABASE_URL", !!SUPABASE_URL, "Configure SUPABASE_URL"));

  // 2) Sessão usuário
  const { data: userRes, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  checks.push(check("auth.user", !!userRes?.user && !userErr, "Token inválido/ausente"));
  const user = userRes?.user;

  // 3) Organização do usuário (com autofix)
  let orgId: string | null = null;
  if (user) {
    const { data: prof } = await sb.from("profiles").select("organizacao_id").eq("id", user.id).maybeSingle();
    orgId = (prof as any)?.organizacao_id ?? null;

    if (!orgId && autoFix) {
      // tenta RPC ensure_current_org, se existir
      try {
        const { data: ensured } = await sb.rpc("ensure_current_org");
        if (ensured?.success && ensured?.organization_id) {
          orgId = ensured.organization_id;
        }
      } catch {}

      if (!orgId) {
        // cria fallback
        const { data: org, error: orgErr } = await sb
          .from("organizacoes")
          .insert({ nome: "Organização Principal", plano: "basico", ativo: true })
          .select("id")
          .single();
        if (!orgErr) {
          orgId = org.id;
          await sb.from("profiles").update({ organizacao_id: orgId, updated_at: new Date().toISOString() }).eq("id", user.id);
        }
      }
    }
  }
  checks.push(check("profile.organizacao_id", !!orgId, "Preencha profiles.organizacao_id (use ensure_current_org ou habilite ?autofix=1)"));

  // 4) oauth_states write
  const state = crypto.randomUUID();
  const codeVerifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  let stateRowId: any = null;
  try {
    const { data: ins, error: insErr } = await sb.from("oauth_states").insert({
      state_value: state,
      code_verifier: codeVerifier,
      user_id: user?.id ?? null,
      organization_id: orgId,
      provider: "mercadolivre",
      used: false,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }).select("id").single();
    checks.push(check("db.oauth_states.insert", !insErr && !!ins?.id, "Crie tabela oauth_states com colunas: state_value, code_verifier, user_id, organization_id, provider, used, expires_at"));
    stateRowId = ins?.id ?? null;
  } catch (e) {
    checks.push(check("db.oauth_states.insert", false, "Veja logs; verifique colunas/permissions da oauth_states"));
  } finally {
    if (stateRowId) await sb.from("oauth_states").delete().eq("id", stateRowId);
  }

  // 5) Vault/RPC encrypt_integration_secret (selftest)
  const selfAccount = "selftest:ml:diagnose";
  try {
    const { error: encErr } = await sb.rpc("encrypt_integration_secret", {
      p_account_id: selfAccount,
      p_provider: "mercadolivre",
      p_client_id: ML_CLIENT_ID || "test",
      p_client_secret: ML_CLIENT_SECRET || "test",
      p_access_token: "test",
      p_refresh_token: "test",
      p_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      p_payload: { ping: true },
      p_encryption_key: APP_ENCRYPTION_KEY, // ESSENCIAL
    });
    checks.push(check("rpc.encrypt_integration_secret", !encErr, "Verifique se o RPC existe e aceite p_encryption_key; confira estrutura de integration_secrets"));
  } catch (e) {
    checks.push(check("rpc.encrypt_integration_secret", false, "RPC ausente/erro interno; veja logs do banco"));
  } finally {
    // tenta limpar registro de teste
    try { await sb.from("integration_secrets").delete().eq("account_id", selfAccount); } catch {}
  }

  // 6) Redirect calculado
  checks.push({ name: "oauth.redirect_uri.expected", ok: true, detail: REDIRECT_URI });

  // 7) Functions "vivas" (ping)
  const fns = [
    "mercadolibre-oauth-start",
    "mercadolibre-oauth-callback",
    "unified-orders",
  ];
  for (const fn of fns) {
    const alive = await pingFn(SUPABASE_URL, fn, authHeader);
    checks.push(check(`fn.${fn}.alive`, alive, `A function ${fn} não respondeu 200/400/405`));
  }

  const ok = checks.every(c => c.ok);
  return json({ ok, checks }, ok ? 200 : 400);
});

function check(name: string, ok: boolean, fix?: string, detail?: any): Check {
  const c: Check = { name, ok };
  if (detail !== undefined) c.detail = detail;
  if (!ok && fix) c.fix = fix;
  return c;
}

async function pingFn(base: string, fn: string, authHeader: string | null) {
  try {
    const r = await fetch(`${base}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      body: JSON.stringify({ ping: true }),
    });
    return [200, 400, 405].includes(r.status);
  } catch {
    return false;
  }
}

function b64url(bytes: Uint8Array) {
  const s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}