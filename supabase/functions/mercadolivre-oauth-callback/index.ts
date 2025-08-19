import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function makeClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Processando callback OAuth MercadoLibre')
    
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI')
    
    if (!ML_REDIRECT_URI) {
      console.error('❌ ML_REDIRECT_URI não configurado')
      return new Response('ML_REDIRECT_URI não configurado', { status: 500 })
    }

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('❌ Erro OAuth do MercadoLibre:', error)
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Erro na Autorização</title></head>
          <body>
            <h1>Erro na autorização</h1>
            <p>Erro: ${error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_error', error: '${error}' }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      console.error('❌ Code ou state ausente na callback')
      return new Response('Parâmetros obrigatórios ausentes', { status: 400 })
    }

    const supabase = makeClient()

    // Validar e recuperar estado OAuth
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !oauthState) {
      console.error('❌ Estado OAuth inválido ou expirado:', stateError?.message)
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Estado Inválido</title></head>
          <body>
            <h1>Estado OAuth inválido</h1>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_error', error: 'Estado inválido' }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Trocar code por tokens usando PKCE
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID')
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET')
    
    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      console.error('❌ Credenciais ML não configuradas')
      return new Response('Credenciais não configuradas', { status: 500 })
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      code: code,
      redirect_uri: ML_REDIRECT_URI,
      code_verifier: oauthState.code_verifier // PKCE
    })

    console.log('🔑 Trocando code por tokens (com PKCE)')
    
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Erro na troca de tokens:', errorText)
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Erro nos Tokens</title></head>
          <body>
            <h1>Erro ao obter tokens</h1>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_error', error: 'Erro ao obter tokens' }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Tokens obtidos com sucesso')

    // Obter informações do usuário ML
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      console.error('❌ Erro ao obter dados do usuário ML')
      return new Response('Erro ao obter dados do usuário', { status: 500 })
    }

    const userData = await userResponse.json()
    console.log('✅ Dados do usuário ML obtidos:', { id: userData.id, nickname: userData.nickname })

    // Criar ou atualizar integration_account
    const { data: integrationAccount, error: accountError } = await supabase
      .from('integration_accounts')
      .upsert({
        organization_id: oauthState.organization_id,
        provider: 'mercadolivre',
        name: userData.nickname || userData.email || `ML-${userData.id}`,
        account_identifier: userData.id.toString(),
        public_auth: {
          user_id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          site_id: userData.site_id || 'MLB'
        },
        is_active: true
      }, {
        onConflict: 'organization_id,provider,account_identifier'
      })
      .select()
      .single()

    if (accountError || !integrationAccount) {
      console.error('❌ Erro ao criar integration_account:', accountError?.message)
      return new Response('Erro ao salvar conta', { status: 500 })
    }

    // Criptografar e salvar tokens usando edge function
    const APP_ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')
    if (!APP_ENCRYPTION_KEY) {
      console.error('❌ APP_ENCRYPTION_KEY não configurado')
      return new Response('Chave de criptografia não configurada', { status: 500 })
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    
    const { error: secretError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integrationAccount.id,
      p_provider: 'mercadolivre',
      p_client_id: ML_CLIENT_ID,
      p_client_secret: ML_CLIENT_SECRET,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt,
      p_payload: {
        user_id: userData.id,
        nickname: userData.nickname,
        site_id: userData.site_id,
        scope: tokenData.scope
      },
      p_encryption_key: APP_ENCRYPTION_KEY
    })

    if (secretError) {
      console.error('❌ Erro ao criptografar segredos:', secretError.message)
      return new Response('Erro ao salvar tokens', { status: 500 })
    }

    // Marcar estado como usado
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', oauthState.id)

    console.log('✅ Callback OAuth concluído com sucesso')

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Autorização Concluída</title></head>
        <body>
          <h1>Autorização concluída com sucesso!</h1>
          <p>Conta MercadoLibre conectada: ${userData.nickname}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth_success', 
                account: {
                  id: '${integrationAccount.id}',
                  name: '${userData.nickname}',
                  user_id: '${userData.id}'
                }
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error)
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Erro Interno</title></head>
        <body>
          <h1>Erro interno do servidor</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth_error', error: 'Erro interno' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})