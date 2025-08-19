import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshTokenRequest {
  integration_account_id: string
}

function makeClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          authorization: req.headers.get('authorization') ?? '',
          'x-client-info': req.headers.get('x-client-info') ?? '',
          apikey: req.headers.get('apikey') ?? '',
        }
      }
    }
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Renovando token MercadoLibre')
    
    const { integration_account_id } = await req.json() as RefreshTokenRequest
    
    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ error: 'integration_account_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = makeClient(req)
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Usuário não autenticado')
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter organização do usuário
    const { data: orgData, error: orgError } = await supabase.rpc('get_user_organization_id', {
      target_user_id: user.id
    })
    
    if (orgError || !orgData) {
      console.error('❌ Organização não encontrada')
      return new Response(
        JSON.stringify({ error: 'Organização não encontrada' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter refresh token atual
    const APP_ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')
    if (!APP_ENCRYPTION_KEY) {
      console.error('❌ APP_ENCRYPTION_KEY não configurado')
      return new Response(
        JSON.stringify({ error: 'Chave de criptografia não configurada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: secretData, error: secretError } = await supabase.rpc('get_integration_secret_secure', {
      account_id: integration_account_id,
      provider_name: 'mercadolivre',
      requesting_function: 'mercadolivre-refresh-token'
    })

    if (secretError || !secretData || secretData.length === 0) {
      console.error('❌ Refresh token não encontrado:', secretError?.message)
      return new Response(
        JSON.stringify({ error: 'Tokens não encontrados para esta conta' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenInfo = secretData[0]
    
    if (!tokenInfo.refresh_token) {
      console.error('❌ Refresh token ausente')
      return new Response(
        JSON.stringify({ error: 'Refresh token não disponível' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fazer refresh do token no MercadoLibre
    const refreshParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: tokenInfo.client_id,
      client_secret: tokenInfo.client_secret,
      refresh_token: tokenInfo.refresh_token
    })

    console.log('🔑 Fazendo refresh do token no ML')
    
    const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: refreshParams.toString()
    })

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text()
      console.error('❌ Erro no refresh:', errorText)
      
      // Se refresh token expirou, retornar erro específico
      if (refreshResponse.status === 400) {
        return new Response(
          JSON.stringify({ 
            error: 'Refresh token expirado',
            message: 'É necessário reconectar a conta MercadoLibre',
            requires_reauth: true
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao renovar token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const newTokenData = await refreshResponse.json()
    console.log('✅ Novo token obtido com sucesso')

    // Atualizar tokens no banco
    const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString()
    
    const { error: updateError } = await supabase.rpc('encrypt_integration_secret', {
      p_account_id: integration_account_id,
      p_provider: 'mercadolivre',
      p_client_id: tokenInfo.client_id,
      p_client_secret: tokenInfo.client_secret,
      p_access_token: newTokenData.access_token,
      p_refresh_token: newTokenData.refresh_token || tokenInfo.refresh_token, // Manter refresh se não vier novo
      p_expires_at: newExpiresAt,
      p_payload: tokenInfo.payload,
      p_encryption_key: APP_ENCRYPTION_KEY
    })

    if (updateError) {
      console.error('❌ Erro ao atualizar tokens:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar novos tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Tokens atualizados com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: newTokenData.access_token,
        expires_at: newExpiresAt,
        message: 'Token renovado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no refresh de token:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})