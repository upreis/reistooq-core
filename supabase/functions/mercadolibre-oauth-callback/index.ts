import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return generateErrorResponse(error, 'OAuth authorization failed')
    }

    if (!code || !state) {
      return generateErrorResponse('missing_params', 'Missing code or state')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate state
    const { data: oauthState } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!oauthState) {
      return generateErrorResponse('invalid_state', 'Invalid or expired state')
    }

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id)

    // Exchange code for tokens
    const clientId = '2053972567766696'
    const clientSecret = Deno.env.get('ML_CLIENT_SECRET')
    const redirectUri = 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolibre-oauth-callback'

    console.log('Exchanging code for tokens with ML API...')

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret || '',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return generateErrorResponse('token_error', tokenData.message || 'Token exchange failed')
    }

    console.log('Token exchange successful, fetching user info...')

    // Get user info
    const userResponse = await fetch(`https://api.mercadolibre.com/users/me?access_token=${tokenData.access_token}`)
    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error('User info failed:', userData)
      return generateErrorResponse('user_info_error', 'Failed to get user info')
    }

    console.log('User info retrieved:', userData.nickname)

    // Create integration account
    const { data: integrationAccount } = await supabase
      .from('integration_accounts')
      .insert({
        provider: 'mercadolivre',
        account_identifier: userData.id.toString(),
        name: userData.nickname,
        organization_id: oauthState.organization_id,
        public_auth: {
          user_id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          site_id: userData.site_id
        },
        is_active: true
      })
      .select()
      .single()

    if (!integrationAccount) {
      return generateErrorResponse('account_creation_error', 'Failed to create integration account')
    }

    console.log('Integration account created:', integrationAccount.id)

    // Store encrypted secrets
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')
    if (!encryptionKey) {
      return generateErrorResponse('encryption_error', 'Encryption key not found')
    }

    await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integrationAccount.id,
      p_provider: 'mercadolivre',
      p_client_id: clientId,
      p_client_secret: clientSecret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      p_payload: { user_data: userData },
      p_encryption_key: encryptionKey
    })

    console.log('Secrets stored successfully')

    return generateSuccessResponse()

  } catch (error) {
    console.error('OAuth callback error:', error)
    return generateErrorResponse('internal_error', error.message)
  }
})

function generateErrorResponse(error: string, description?: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Erro na Autenticação</title>
      <meta charset="utf-8">
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
      <p>Erro na autenticação. Esta janela será fechada automaticamente.</p>
    </body>
    </html>
  `
  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  })
}

function generateSuccessResponse(): Response {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Autenticação Concluída</title>
      <meta charset="utf-8">
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
      <p>Autenticação concluída com sucesso! Esta janela será fechada automaticamente.</p>
    </body>
    </html>
  `
  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  })
}