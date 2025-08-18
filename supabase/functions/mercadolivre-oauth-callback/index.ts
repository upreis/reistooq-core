import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { makeClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CallbackParams {
  code?: string;
  state?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get ML_REDIRECT_URI from environment
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI');
    if (!ML_REDIRECT_URI) {
      throw new Error('ML_REDIRECT_URI not configured');
    }
    
    // Extract callback parameters
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    console.log('OAuth callback received:', {
      redirect_uri_used: ML_REDIRECT_URI,
      has_code: !!code,
      has_state: !!state,
      error: error,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      // Return error page for missing parameters
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">Erro de Autenticação</h1>
          <p>Parâmetros OAuth ausentes.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      });
    }

    // Validate state using cookie first (CSRF protection)
    const cookieHeader = req.headers.get('Cookie') || '';
    const cookieState = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('ml_oauth_state='))
      ?.split('=')[1];

    if (!cookieState || cookieState !== state) {
      console.warn('OAuth state cookie missing or mismatch; proceeding with DB validation only', { cookiePresent: !!cookieState, queryState: state });
      // Do not throw here; fall back to DB validation below to reduce third-party cookie issues
    }

    // Create service role client for server-side operations
    const serviceClient = makeClient('Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Validate state in database to prevent CSRF attacks (double check)
    const { data: storedState, error: stateError } = await serviceClient
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError) {
      console.error('State validation error:', stateError);
      throw new Error('Error validating OAuth state');
    }

    if (!storedState) {
      console.error('No valid OAuth state found:', { state, current_time: new Date().toISOString() });
      throw new Error('Estado OAuth inválido ou expirado. Tente fazer login novamente.');
    }

    // Get ML credentials
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    
    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      throw new Error('ML credentials not configured');
    }

    // Exchange code for tokens - following ML specs with proper redirect_uri
    console.log('Exchanging code for tokens:', {
      redirect_uri: ML_REDIRECT_URI,
      client_id: ML_CLIENT_ID,
      has_code: !!code,
    });

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code,
        redirect_uri: ML_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        redirect_uri_used: ML_REDIRECT_URI,
      });
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Invalid token response');
    }

    // Get user info from ML API
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info from MercadoLibre');
    }

    const userData = await userResponse.json();

    // Calculate token expiration
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 6 * 60 * 60 * 1000); // Default 6 hours

    // Get organization ID from current user
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', storedState.user_id)
      .single();

    if (!profile?.organizacao_id) {
      throw new Error('User organization not found');
    }

    // Store/update integration account
    const { data: account, error: accountError } = await serviceClient
      .from('integration_accounts')
      .upsert({
        organization_id: profile.organizacao_id,
        provider: 'mercadolivre',
        name: userData.nickname || userData.first_name || 'MercadoLibre Account',
        account_identifier: userData.id.toString(),
        cnpj: userData.identification?.number || null,
        public_auth: {
          user_id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          site_id: userData.site_id,
          permalink: userData.permalink,
        },
        is_active: true,
      }, {
        onConflict: 'organization_id,provider,account_identifier',
      })
      .select()
      .single();

    if (accountError) {
      console.error('Failed to store integration account:', accountError);
      throw new Error('Failed to store integration account');
    }

    // Store tokens securely using existing integration_secrets table
    const { error: secretError } = await serviceClient.rpc('encrypt_integration_secret', {
      p_account_id: account.id,
      p_provider: 'mercadolivre',
      p_client_id: ML_CLIENT_ID,
      p_client_secret: ML_CLIENT_SECRET,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token || null,
      p_expires_at: expiresAt.toISOString(),
      p_payload: {
        user_id: userData.id,
        site_id: userData.site_id,
        scope: tokenData.scope,
        token_type: tokenData.token_type || 'Bearer',
      },
      p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY'),
    });

    if (secretError) {
      console.error('Failed to store ML tokens:', secretError);
      throw new Error('Failed to store authentication tokens');
    }

    // Clean up OAuth state
    await serviceClient
      .from('oauth_states')
      .delete()
      .eq('id', storedState.id);

    console.log('ML OAuth completed successfully:', {
      user_id: userData.id,
      nickname: userData.nickname,
      site_id: userData.site_id,
      organization_id: profile.organizacao_id,
      timestamp: new Date().toISOString(),
    });

    // Return success page that closes the popup
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          <h1>Conectado com Sucesso!</h1>
          <p>Sua conta MercadoLibre foi conectada.</p>
          <p>Fechando janela...</p>
        </div>
        <script>
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth_success',
              provider: 'mercadolivre',
              user: {
                id: ${userData.id},
                nickname: '${userData.nickname}',
                site_id: '${userData.site_id}'
              }
            }, '*');
          }
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'ml_oauth_state=; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=0' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Return error page
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
          <p>${error.message || 'Falha na autenticação'}</p>
          <p>Fechando janela...</p>
        </div>
        <script>
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth_error',
              provider: 'mercadolivre',
              error: '${error.message || 'Falha na autenticação'}'
            }, '*');
          }
          
          // Close popup after a delay
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `, {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});