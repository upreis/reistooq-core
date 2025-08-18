import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('OAuth callback v2 received:', {
      redirect_uri_used: req.url,
      has_code: !!code,
      has_state: !!state,
      error: error,
      timestamp: new Date().toISOString()
    });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error from ML:', error);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Autenticação</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              text-align: center; 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .error { 
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.2);
            }
            .icon { font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; }
            p { margin: 5px 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="error">
            <div class="icon">⚠️</div>
            <h1>Erro na Autenticação</h1>
            <p>Erro: ${error}</p>
            <p>Fechando janela...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: '${error}'
              }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html', 
          'Set-Cookie': 'ml_oauth_state_v2=; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=0' 
        },
      });
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Autenticação</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              text-align: center; 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .error { 
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.2);
            }
            .icon { font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; }
            p { margin: 5px 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="error">
            <div class="icon">❌</div>
            <h1>Erro na Autenticação</h1>
            <p>Parâmetros inválidos ou ausentes</p>
            <p>Fechando janela...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Parâmetros inválidos ou ausentes'
              }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html', 
          'Set-Cookie': 'ml_oauth_state_v2=; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=0' 
        },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ML OAuth Callback v2] Using service role for secure operations');

    // Validate OAuth state
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError || !oauthState) {
      console.error('Invalid or expired OAuth state:', { stateError, found: !!oauthState });
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Autenticação</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              text-align: center; 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .error { 
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.2);
            }
            .icon { font-size: 3em; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; }
            p { margin: 5px 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="error">
            <div class="icon">🔒</div>
            <h1>Erro na Autenticação</h1>
            <p>Estado OAuth inválido ou expirado</p>
            <p>Fechando janela...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Estado OAuth inválido ou expirado'
              }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html', 
          'Set-Cookie': 'ml_oauth_state_v2=; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=0' 
        },
      });
    }

    console.log('OAuth state validated:', {
      user_id: oauthState.user_id,
      organization_id: oauthState.organization_id,
      code_verifier_present: !!oauthState.code_verifier
    });

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id);

    // Get ML credentials
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolivre-oauth-callback-v2`;

    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET || !ML_REDIRECT_URI) {
      console.error('Missing ML credentials for token exchange');
      throw new Error('ML credentials not configured');
    }

    console.log('Exchanging code for tokens:', {
      redirect_uri: ML_REDIRECT_URI,
      client_id: ML_CLIENT_ID,
      has_code: !!code,
      has_code_verifier: !!oauthState.code_verifier
    });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code: code,
        redirect_uri: ML_REDIRECT_URI,
        code_verifier: oauthState.code_verifier
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful:', {
      access_token_present: !!tokenData.access_token,
      refresh_token_present: !!tokenData.refresh_token,
      user_id: tokenData.user_id,
      expires_in: tokenData.expires_in
    });

    // Get user info from MercadoLibre
    const userInfoResponse = await fetch(`https://api.mercadolibre.com/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from ML');
      throw new Error('Failed to get user info from MercadoLibre');
    }

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', {
      id: userInfo.id,
      nickname: userInfo.nickname,
      email: userInfo.email,
      site_id: userInfo.site_id,
      country_id: userInfo.country_id
    });

    // Store ML account
    const { error: accountError } = await supabase
      .from('ml_accounts_v2')
      .upsert({
        organization_id: oauthState.organization_id,
        user_id: oauthState.user_id,
        ml_user_id: userInfo.id.toString(),
        nickname: userInfo.nickname,
        email: userInfo.email,
        site_id: userInfo.site_id,
        country_id: userInfo.country_id,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,ml_user_id'
      });

    if (accountError) {
      console.error('Failed to store ML account:', accountError);
      throw new Error('Failed to store MercadoLibre account');
    }

    // Store encrypted secrets
    const { error: secretError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: userInfo.id.toString(),
      p_provider: 'mercadolivre',
      p_client_id: ML_CLIENT_ID,
      p_client_secret: ML_CLIENT_SECRET,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      p_payload: {
        user_id: userInfo.id,
        nickname: userInfo.nickname,
        site_id: userInfo.site_id
      }
    });

    if (secretError) {
      console.error('Failed to store secrets:', secretError);
      throw new Error('Failed to store authentication secrets');
    }

    console.log('OAuth v2 callback completed successfully:', {
      user_id: oauthState.user_id,
      organization_id: oauthState.organization_id,
      ml_user_id: userInfo.id,
      nickname: userInfo.nickname
    });

    // Success response
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticação Concluída</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .success { 
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .icon { font-size: 3em; margin-bottom: 20px; }
          h1 { margin: 0 0 10px 0; }
          p { margin: 5px 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="success">
          <div class="icon">✅</div>
          <h1>Autenticação Concluída</h1>
          <p>Conta MercadoLibre conectada com sucesso!</p>
          <p>Fechando janela...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth_success',
              provider: 'mercadolivre',
              data: {
                user_id: '${userInfo.id}',
                nickname: '${userInfo.nickname}',
                site_id: '${userInfo.site_id}'
              }
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html', 
        'Set-Cookie': 'ml_oauth_state_v2=; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=0' 
      },
    });

  } catch (error) {
    console.error('OAuth callback v2 error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro de Autenticação</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .error { 
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .icon { font-size: 3em; margin-bottom: 20px; }
          h1 { margin: 0 0 10px 0; }
          p { margin: 5px 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="error">
          <div class="icon">⚠️</div>
          <h1>Erro na Autenticação</h1>
          <p>${error.message}</p>
          <p>Fechando janela...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth_error',
              provider: 'mercadolivre',
              error: '${error.message}'
            }, '*');
          }
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html', 
        'Set-Cookie': 'ml_oauth_state_v2=; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=0' 
      },
    });
  }
});