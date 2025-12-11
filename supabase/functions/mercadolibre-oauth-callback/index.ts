// supabase/functions/mercadolibre-oauth-callback/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Chave usada pelo RPC para cifrar/decifrar (Project Settings → Secrets)
const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

Deno.serve(async (req) => {
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

    // Cria ou atualiza conta de integração para evitar duplicação
    const { data: account, error: accErr } = await serviceClient
      .from("integration_accounts")
      .upsert({
        provider: "mercadolivre",
        name: user.nickname || user.first_name,
        account_identifier: String(user.id),
        is_active: true,
        token_status: 'active',
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
      }, { 
        onConflict: 'provider,account_identifier',
        ignoreDuplicates: false
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

    // Salvar tokens usando o edge function integrations-store-secret para criptografia correta
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    console.log('[ML OAuth Callback] Storing tokens via integrations-store-secret...');
    
    // Chamar edge function para salvar tokens criptografados
    const storeResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/integrations-store-secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'x-internal-call': 'true',
        'x-internal-token': Deno.env.get("INTERNAL_SHARED_TOKEN") || ''
      },
      body: JSON.stringify({
        integration_account_id: account.id,
        provider: 'mercadolivre',
        payload: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString()
        }
      })
    });

    if (!storeResp.ok) {
      const storeError = await storeResp.text();
      console.error('[ML OAuth Callback] Failed to store secrets via edge function:', storeError);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Failed to store tokens securely'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const storeResult = await storeResp.json();
    const storeOk = storeResult?.ok === true || storeResult?.success === true;
    if (!storeOk) {
      console.error('[ML OAuth Callback] Store secret returned error:', storeResult);
      return new Response(
        "<!doctype html><script>window.opener?.postMessage({type:'oauth_error',provider:'mercadolivre',error:'Failed to store tokens securely'},'*');window.close();</script>",
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    console.log("ML OAuth completed successfully for account:", account.id);

    // 🚀 TRIGGER BACKFILL: Buscar últimos 60 dias de histórico automaticamente
    // Usa EdgeRuntime.waitUntil para não bloquear a resposta ao usuário
    console.log(`[ML OAuth Callback] 🔄 Iniciando backfill automático de 60 dias para conta: ${account.id}`);
    
    // Background task para não bloquear o OAuth
    const backfillTask = async () => {
      try {
        const backfillResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-vendas-hoje`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            organization_id: organizationId,
            integration_account_ids: [account.id],
            days_back: 60 // Backfill inicial de 60 dias
          })
        });

        if (backfillResp.ok) {
          const backfillResult = await backfillResp.json();
          console.log(`[ML OAuth Callback] ✅ Backfill concluído: ${backfillResult.synced || 0} vendas sincronizadas`);
        } else {
          console.warn(`[ML OAuth Callback] ⚠️ Backfill falhou (não crítico):`, await backfillResp.text());
        }
      } catch (backfillError) {
        // Backfill é best-effort, não deve bloquear OAuth
        console.warn(`[ML OAuth Callback] ⚠️ Erro no backfill (não crítico):`, backfillError);
      }
    };

    // Executa em background sem bloquear resposta
    EdgeRuntime.waitUntil(backfillTask());

    return new Response(
      "<!doctype html><script>" +
        "window.opener?.postMessage({" +
          "type:'oauth_success'," +
          "provider:'mercadolivre'," +
          "account_id:" + JSON.stringify(account.id) + "," +
          "account_name:" + JSON.stringify(account.name) +
        "},'*');" +
        "window.close();" +
      "</script>",
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