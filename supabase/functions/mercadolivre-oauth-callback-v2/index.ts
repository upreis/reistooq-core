import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

interface MLUser {
  id: number;
  nickname: string;
  site_id: string;
  email?: string;
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    console.log('[ML OAuth Callback v2] Processing callback...');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[ML OAuth Callback v2] OAuth error:', error);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: '${error}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    if (!code || !state) {
      console.error('[ML OAuth Callback v2] Missing code or state');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Missing authorization code or state'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Get ML credentials from environment
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI') || 
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolivre-oauth-callback-v2`;

    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      console.error('[ML OAuth Callback v2] Missing ML credentials');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Credenciais MercadoLibre não configuradas'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate OAuth state
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre_v2')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError || !oauthState) {
      console.error('[ML OAuth Callback v2] Invalid state:', stateError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Estado OAuth inválido ou expirado'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id);

    console.log('[ML OAuth Callback v2] State validated:', {
      state: state.substring(0, 8) + '...',
      user_id: oauthState.user_id,
      organization_id: oauthState.organization_id
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code: code,
        redirect_uri: ML_REDIRECT_URI,
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[ML OAuth Callback v2] Token exchange failed:', {
        status: tokenResponse.status,
        error: errorText
      });
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Falha na troca de token com MercadoLibre'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    const tokenData: TokenResponse = await tokenResponse.json();
    console.log('[ML OAuth Callback v2] Token obtained successfully:', {
      user_id: tokenData.user_id,
      expires_in: tokenData.expires_in
    });

    // Get user information from MercadoLibre
    const userResponse = await fetch(`https://api.mercadolibre.com/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('[ML OAuth Callback v2] Failed to get user info');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Falha ao obter informações do usuário'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    const userInfo: MLUser = await userResponse.json();
    console.log('[ML OAuth Callback v2] User info obtained:', {
      id: userInfo.id,
      nickname: userInfo.nickname,
      site_id: userInfo.site_id
    });

    // Store ML account in database
    const accountData = {
      ml_user_id: userInfo.id.toString(),
      user_id: oauthState.user_id,
      organization_id: oauthState.organization_id,
      nickname: userInfo.nickname,
      site_id: userInfo.site_id,
      email: userInfo.email || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: accountError } = await supabase
      .from('ml_accounts_v2')
      .upsert(accountData, {
        onConflict: 'ml_user_id,organization_id'
      });

    if (accountError) {
      console.error('[ML OAuth Callback v2] Failed to store account:', accountError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Falha ao salvar conta MercadoLibre'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Store encrypted secrets
    const { error: secretError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: userInfo.id.toString(),
      p_provider: 'mercadolivre_v2',
      p_client_id: ML_CLIENT_ID,
      p_client_secret: ML_CLIENT_SECRET,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      p_payload: JSON.stringify({
        user_id: tokenData.user_id,
        scope: tokenData.scope,
        token_type: tokenData.token_type
      })
    });

    if (secretError) {
      console.error('[ML OAuth Callback v2] Failed to store secrets:', secretError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'MERCADOLIVRE_OAUTH_ERROR',
                error: 'Falha ao armazenar credenciais'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    console.log('[ML OAuth Callback v2] OAuth completed successfully:', {
      user_id: oauthState.user_id,
      ml_user_id: userInfo.id,
      nickname: userInfo.nickname
    });

    // Return success response
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'MERCADOLIVRE_OAUTH_SUCCESS',
              data: {
                nickname: '${userInfo.nickname}',
                user_id: '${userInfo.id}',
                site_id: '${userInfo.site_id}'
              }
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('[ML OAuth Callback v2] Error:', error);
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'MERCADOLIVRE_OAUTH_ERROR',
              error: 'Erro interno do servidor'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
});