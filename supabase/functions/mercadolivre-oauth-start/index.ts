import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthStartRequest {
  organization_id?: string
}

// Função para gerar PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, [...array]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
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
    console.log('🚀 Iniciando fluxo OAuth MercadoLibre')
    
    const { organization_id } = await req.json() as OAuthStartRequest
    
    // Obter credenciais do ML
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID')
    const ML_REDIRECT_URI = Deno.env.get('ML_REDIRECT_URI')
    
    if (!ML_CLIENT_ID || !ML_REDIRECT_URI) {
      console.error('❌ Credenciais ML não configuradas')
      return new Response(
        JSON.stringify({ error: 'Credenciais MercadoLibre não configuradas' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase
    const supabase = makeClient(req)
    
    // Obter informações do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Usuário não autenticado:', userError?.message)
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
      console.error('❌ Organização não encontrada:', orgError?.message)
      return new Response(
        JSON.stringify({ error: 'Organização não encontrada' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const final_org_id = organization_id === 'current' ? orgData : (organization_id || orgData)
    
    // Gerar PKCE
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    // Gerar state seguro
    const state = crypto.randomUUID()
    
    // Salvar estado OAuth com PKCE
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        organization_id: final_org_id,
        provider: 'mercadolivre',
        state_value: state,
        code_verifier: codeVerifier,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
      })
      
    if (stateError) {
      console.error('❌ Erro ao salvar estado OAuth:', stateError.message)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construir URL de autorização do MercadoLibre com PKCE e offline_access
    const authUrl = new URL('https://auth.mercadolibre.com.br/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', ML_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', ML_REDIRECT_URI)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', 'offline_access read write') // Scope explícito com offline_access
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    console.log('✅ URL de autorização gerada (com PKCE e offline_access)')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        authorization_url: authUrl.toString(),
        state: state
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no fluxo OAuth start:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})