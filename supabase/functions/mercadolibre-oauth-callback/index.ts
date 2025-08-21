// supabase/functions/mercadolibre-oauth-callback/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Chave usada pelo RPC para cifrar/decifrar (Project Settings → Secrets)
const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function getMlConfig() {
  const clientId = Deno.env.get("ML_CLIENT_ID");
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET");
  const canonical = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadolibre-oauth-callback`;
  const redirectUri = Deno.env.get("ML_REDIRECT_URI") ||
                      Deno.env.get("MERCADOLIVRE_REDIRECT_URI") ||
                      canonical;
  if (!clientId || !clientSecret) {
    throw new Error("Missing ML secrets: ML_CLIENT_ID / ML_CLIENT_SECRET");
  }
  return { clientId, clientSecret, redirectUri, canonical };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ENC_KEY) {
      console.error("[ML OAuth Callback] Missing APP_ENCRYPTION_KEY");
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Encryption key missing'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const serviceClient = makeClient(null);
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errParam = url.searchParams.get("error");
    if (errParam) {
      console.error("ML OAuth error:", errParam);
      return new Response(
        `<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:${JSON.stringify(errParam)}},'*');window.close();</script>`,
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }
    if (!code || !state) {
      console.error("Missing code or state");
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Missing code or state'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Busca state + PKCE
    const { data: stateData, error: stateErr } = await serviceClient
      .from("oauth_states")
      .select("*")
      .eq("state_value", state)
      .eq("provider", "mercadolivre")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (stateErr || !stateData) {
      console.error("Invalid state:", stateErr);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Invalid or expired state'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    await serviceClient.from("oauth_states").update({ used: true }).eq("id", stateData.id);

    // resolve organization_id
    let organizationId = stateData.organization_id as string | null;
    if (!organizationId && stateData.user_id) {
      const { data: prof } = await serviceClient
        .from("profiles")
        .select("organizacao_id")
        .eq("id", stateData.user_id)
        .maybeSingle();
      organizationId = prof?.organizacao_id ?? null;
    }

    // Config ML (usa o redirectUri do env em TODAS as etapas)
    const { clientId, clientSecret, redirectUri, canonical } = getMlConfig();

    // Apenas log de comparação
    const computedRedirect = `${url.origin}${url.pathname}`;
    if (redirectUri !== computedRedirect) {
      console.warn("[ML OAuth Callback] redirectUri(env) != computedRedirect(req)", {
        redirectUri,
        computedRedirect,
        canonical,
      });
    }
    console.log("[ML OAuth Callback] Using redirect_uri for token exchange:", redirectUri);

    // Troca code -> tokens (usa o MESMO redirect_uri enviado na etapa de autorização)
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    if (stateData.code_verifier) tokenParams.set("code_verifier", stateData.code_verifier);

    const tokenResp = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResp.ok) {
      const body = await tokenResp.text();
      console.error("Token exchange failed:", tokenResp.status, body, {
        redirectUriSent: redirectUri,
        computedRedirect,
      });
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Token exchange failed'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const tokenData = await tokenResp.json();

    // Dados do usuário (endpoint global)
    const meResp = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meResp.ok) {
      const t = await meResp.text();
      console.error("Failed to fetch user info:", meResp.status, t);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Failed to get user info'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }
    const user = await meResp.json();

    // Cria conta de integração
    const { data: account, error: accErr } = await serviceClient
      .from("integration_accounts")
      .insert({
        provider: "mercadolivre",
        name: user.nickname || user.first_name,
        account_identifier: String(user.id),
        is_active: true,
        organization_id: organizationId,
        public_auth: {
          user_id: user.id,
          nickname: user.nickname,
          email: user.email,
          site_id: user.site_id,
          country_id: user.country_id,
          user_type: user.user_type,
          permalink: user.permalink,
          status: user.status?.site_status,
        },
      })
      .select()
      .single();

    if (accErr) {
      console.error("Failed to store integration account:", accErr);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Failed to store account'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Guarda tokens no cofre via RPC
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const { error: storeErr } = await serviceClient.rpc("encrypt_integration_secret", {
      p_account_id: account.id,
      p_provider: "mercadolivre",
      p_client_id: Deno.env.get("ML_CLIENT_ID"),
      p_client_secret: Deno.env.get("ML_CLIENT_SECRET"),
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_payload: { user_id: user.id, scope: tokenData.scope || null },
      p_encryption_key: ENC_KEY,
    });

    if (storeErr) {
      console.error("Failed to store secrets:", storeErr);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Failed to store tokens'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    console.log("ML OAuth completed successfully for account:", account.id);

    return new Response(
      `<!doctype html><script>
        window.opener?.postMessage({
          type:'oauth_success',
          provider:'mercadolivre',
          account_id:${JSON.stringify(account.id)},
          account_name:${JSON.stringify(account.name)}
        },'*');
        window.close();
      </script>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("MercadoLivre callback error:", e);
    return new Response(
      "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Internal server error'},'*');window.close();</script>",
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});