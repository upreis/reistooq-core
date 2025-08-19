import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Local helpers (no cross-file imports to avoid deploy errors)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI');
  }
  return { clientId, clientSecret, redirectUri };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service role client
    const serviceClient = makeClient(null);
    console.log('[ML OAuth Callback] Using service role: true');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('ML OAuth error:', error);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: '${error}' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Missing code or state' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }

    // Validate state + get PKCE verifier and org
    const { data: stateData, error: stateErr } = await serviceClient
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateErr || !stateData) {
      console.error('Invalid state:', stateErr);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Invalid or expired state' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }

    await serviceClient.from('oauth_states').update({ used: true }).eq('id', stateData.id);

    // Resolve organization_id fallback via profiles if missing
    let organizationId = stateData.organization_id as string | null;
    if (!organizationId && stateData.user_id) {
      const { data: prof } = await serviceClient
        .from('profiles')
        .select('organizacao_id')
        .eq('id', stateData.user_id)
        .maybeSingle();
      organizationId = prof?.organizacao_id ?? null;
    }

    // Get ML config (will throw if secrets are missing)
    const { clientId, clientSecret, redirectUri } = getMlConfig();
    console.log('[ML OAuth Callback] Secrets loaded successfully');

    // Token exchange (PKCE if verifier exists)
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    if (stateData.code_verifier) tokenParams.set('code_verifier', stateData.code_verifier);

    const tokenResp = await fetch('https://api.mercadolivre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: tokenParams,
    });
    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('Token exchange failed:', tokenResp.status, err);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Token exchange failed' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }
    const tokenData = await tokenResp.json();

    // User info
    const userResp = await fetch('https://api.mercadolivre.com/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userResp.ok) {
      console.error('Failed to fetch user info:', userResp.status);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Failed to get user info' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }
    const user = await userResp.json();

    // Create/Store integration account
    const { data: account, error: accErr } = await serviceClient
      .from('integration_accounts')
      .insert({
        provider: 'mercadolivre',
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
      console.error('Failed to store integration account:', accErr);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Failed to store account' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }

    // Save secrets via secure RPC function
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const { error: storeErr } = await serviceClient.rpc('encrypt_integration_secret', {
      p_account_id: account.id,
      p_provider: 'mercadolivre',
      p_client_id: clientId,
      p_client_secret: clientSecret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_payload: { user_id: tokenData.user_id, scope: tokenData.scope }
    });
    if (storeErr) {
      console.error('Failed to store secrets:', storeErr);
      return new Response(`
        <html><body><script>
        window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Failed to store tokens' }, '*');
        window.close();
        </script></body></html>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }

    console.log('ML OAuth completed successfully for account:', account.id);

    // Success
    return new Response(`
      <html><body><script>
      window.opener?.postMessage({ type: 'oauth_success', provider: 'mercadolivre', account_id: '${account.id}', account_name: '${account.name}' }, '*');
      window.close();
      </script></body></html>
    `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('MercadoLivre callback error:', e);
    return new Response(`
      <html><body><script>
      window.opener?.postMessage({ type: 'oauth_error', provider: 'mercadolivre', error: 'Internal server error' }, '*');
      window.close();
      </script></body></html>
    `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
  }
});