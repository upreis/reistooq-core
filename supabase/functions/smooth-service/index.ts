import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Local helpers (no cross-file imports to avoid deploy errors)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');
  const siteId = Deno.env.get('ML_SITE_ID') || 'MLB';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI are required');
  }

  return { clientId, clientSecret, redirectUri, siteId };
}

function errorResponse(error: string, description: string, status: number = 400, hint?: string) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Integration Error</title></head>
    <body>
      <script>
        (function () {
          try {
            window.opener && window.opener.postMessage({
              "type":"oauth_error",
              "provider":"mercadolivre",
              "error":"${error}",
              "description":"${description}",
              "status":${status},
              "hint":"${hint || ''}"
            }, '*');
          } catch (e) {}
          window.close();
        })();
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log('[ML-OAUTH] smooth-service.in', { 
    hasCode: !!code, 
    origin: url.origin, 
    path: url.pathname 
  });
  console.log('[ML OAuth Callback] Received callback with code:', !!code, 'state:', !!state, 'error:', error);

  // Handle OAuth errors
  if (error) {
    console.error('[ML OAuth Callback] OAuth error:', error, errorDescription);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>OAuth Error</title></head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'oauth_error',
            provider: 'mercadolivre',
            error: '${error}',
            description: '${errorDescription || 'OAuth authorization failed'}'
          }, '*');
          window.close();
        </script>
        <p>OAuth error: ${error}</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('[ML OAuth Callback] Missing code or state parameters');
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Missing Parameters</title></head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'oauth_error',
            provider: 'mercadolivre',
            error: 'missing_parameters',
            description: 'Missing code or state parameters'
          }, '*');
          window.close();
        </script>
        <p>Missing code or state parameters</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    const supabase = makeClient(null);

    // Validate state and get code_verifier
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre')
      .gt('expires_at', new Date().toISOString())
      .eq('used', false)
      .single();

    if (stateError || !oauthState) {
      console.error('[ML OAuth Callback] Invalid or expired state:', stateError);
      throw new Error('Invalid or expired state parameter');
    }

    // Get organization_id from user profile if not present in oauthState
    let organizationId = oauthState.organization_id;
    if (!organizationId) {
      console.log('[ML OAuth Callback] Getting organization_id from profile for user:', oauthState.user_id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', oauthState.user_id)
        .single();
      
      if (profileError || !profile?.organizacao_id) {
        console.error('[ML OAuth Callback] Failed to get organization_id:', profileError);
        throw new Error('User organization not found');
      }
      
      organizationId = profile.organizacao_id;
      console.log('[ML OAuth Callback] Found organization_id:', organizationId);
    }

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id);

    // Get ML configuration
    const { clientId, clientSecret, redirectUri, siteId } = getMlConfig();

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri, // Use ML_REDIRECT_URI from secrets
    });

    // Add PKCE code_verifier if it was used
    if (oauthState.code_verifier) {
      tokenParams.set('code_verifier', oauthState.code_verifier);
    }

    console.log('[ML OAuth Callback] Exchanging code for tokens...');
    console.log('[ML-OAUTH] token.request', { 
      client_id: clientId, 
      redirect_uri: redirectUri 
    });

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[ML OAuth Callback] Token exchange failed:', {
        status: tokenResponse.status,
        error: errorText,
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code_present: !!code,
          code_verifier_present: !!oauthState.code_verifier
        }
      });
      
      return errorResponse(
        'token_exchange_failed',
        `Failed to exchange code for tokens`,
        400,
        `Cheque se o redirect_uri é idêntico no app do ML, no authorize e no token. Gere um code novo.`
      );
    }

    console.log('[ML-OAUTH] token.response', { 
      ok: tokenResponse.ok, 
      status: tokenResponse.status 
    });

    const tokenData = await tokenResponse.json();
    console.log('[ML OAuth Callback] Token exchange successful, user_id:', tokenData.user_id);

    // Get user info for account creation
    console.log('[ML-OAUTH] me.request');
    const userInfoResponse = await fetch(`https://api.mercadolibre.com/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    console.log('[ML-OAUTH] me.response', { 
      ok: userInfoResponse.ok, 
      status: userInfoResponse.status 
    });

    let userInfo = { nickname: 'Usuário ML' };
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
    }

    // Create integration account
    const { data: integrationAccount, error: accountError } = await supabase
      .from('integration_accounts')
      .insert({
        provider: 'mercadolivre',
        name: userInfo.nickname || `ML User ${tokenData.user_id}`,
        identifier: tokenData.user_id.toString(),
        organization_id: organizationId,
        is_active: true,
      })
      .select()
      .single();

    if (accountError) {
      console.error('[ML OAuth Callback] Failed to create integration account:', accountError);
      throw new Error('Failed to create integration account');
    }

    console.log('[ML OAuth Callback] Integration account created:', integrationAccount.id);

    // Calculate expires_at
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    console.log('[ML-OAUTH] vault.encrypt', { 
      integration_account_id: integrationAccount.id 
    });

    // Store encrypted secrets
    const { error: secretError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integrationAccount.id,
      p_provider: 'mercadolivre',
      p_client_id: clientId,
      p_client_secret: clientSecret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt,
      p_payload: {
        user_id: tokenData.user_id,
        scope: tokenData.scope,
        site: siteId,
        nickname: userInfo.nickname
      },
      p_encryption_key: ENC_KEY,
    });

    if (secretError) {
      console.error('[ML OAuth Callback] Failed to store secrets:', secretError);
      throw new Error('Failed to store integration secrets');
    }

    console.log('[ML OAuth Callback] Integration completed successfully');
    console.log('[ML-OAUTH] success', { 
      integration_account_id: integrationAccount.id 
    });

    // Success response
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Integration Success</title></head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'oauth_success',
            provider: 'mercadolivre',
            integration_account_id: '${integrationAccount.id}',
            user_id: '${tokenData.user_id}',
            nickname: '${userInfo.nickname || ''}'
          }, '*');
          window.close();
        </script>
        <p>Integration successful! You can close this window.</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (e) {
    console.error('[ML OAuth Callback] Error:', e);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Integration Error</title></head>
      <body>
        <script>
          window.opener?.postMessage({
            type: 'oauth_error',
            provider: 'mercadolivre',
            error: 'integration_failed',
            description: '${String(e?.message ?? e).replace(/'/g, "\\'")}'
          }, '*');
          window.close();
        </script>
        <p>Integration failed: ${e?.message ?? e}</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});