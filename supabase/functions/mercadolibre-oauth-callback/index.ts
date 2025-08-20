import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, getMlConfig, ENC_KEY, corsHeaders } from "../_shared/client.ts";

function errorResponse(error: string, description?: string) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Error</title>
    </head>
    <body>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_error',
            provider: 'mercadolivre',
            error: '${error}',
            description: '${description || ''}'
          }, '*');
        }
        window.close();
      </script>
      <p>Error: ${error}</p>
      <p>${description || ''}</p>
      <p>This window should close automatically.</p>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html', ...corsHeaders }
  });
}

function successResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Success</title>
    </head>
    <body>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_success',
            provider: 'mercadolivre',
            connected: true
          }, '*');
        }
        window.close();
      </script>
      <p>Conexão realizada com sucesso!</p>
      <p>Esta janela será fechada automaticamente.</p>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html', ...corsHeaders }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('[ML OAuth Callback] Received:', { code: !!code, state, error });

    // Handle OAuth errors
    if (error) {
      console.error('[ML OAuth Callback] OAuth error:', error);
      return errorResponse(error, url.searchParams.get('error_description'));
    }

    if (!code || !state) {
      return errorResponse('missing_parameters', 'Missing code or state parameter');
    }

    const supabase = makeClient(null); // Use service role for callback

    // Validate and get OAuth state
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !oauthState) {
      console.error('[ML OAuth Callback] Invalid or expired state:', stateError);
      return errorResponse('invalid_state', 'Invalid or expired state');
    }

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id);

    console.log('[ML OAuth Callback] State validated for user:', oauthState.user_id);

    // Get ML config
    const { clientId, clientSecret, redirectUri } = getMlConfig();

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[ML OAuth Callback] Token exchange failed:', errorText);
      return errorResponse('token_exchange_failed', 'Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();
    console.log('[ML OAuth Callback] Token exchange successful');

    // Get user info from ML
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('[ML OAuth Callback] Failed to get user info');
      return errorResponse('user_info_failed', 'Failed to get user information');
    }

    const userData = await userResponse.json();
    console.log('[ML OAuth Callback] Got user info:', userData.id);

    // Create integration account
    const { data: integrationAccount, error: accountError } = await supabase
      .from('integration_accounts')
      .insert({
        provider: 'mercadolivre',
        name: userData.nickname || userData.email || `ML User ${userData.id}`,
        account_identifier: userData.id.toString(),
        organization_id: oauthState.organization_id,
        public_auth: {
          user_id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          site_id: userData.site_id,
          country_id: userData.country_id,
        },
        is_active: true
      })
      .select()
      .single();

    if (accountError) {
      console.error('[ML OAuth Callback] Failed to create integration account:', accountError);
      return errorResponse('account_creation_failed', 'Failed to create integration account');
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Store encrypted secrets
    const { error: secretError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integrationAccount.id,
      p_provider: 'mercadolivre',
      p_client_id: clientId,
      p_client_secret: clientSecret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt,
      p_payload: userData,
      p_encryption_key: ENC_KEY,
    });

    if (secretError) {
      console.error('[ML OAuth Callback] Failed to store secrets:', secretError);
      return errorResponse('secret_storage_failed', 'Failed to store integration secrets');
    }

    console.log('[ML OAuth Callback] Integration completed successfully');
    return successResponse();

  } catch (e) {
    console.error('[ML OAuth Callback] Unexpected error:', e);
    return errorResponse('unexpected_error', String(e?.message ?? e));
  }
});