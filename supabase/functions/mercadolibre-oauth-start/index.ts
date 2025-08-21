// supabase/functions/mercadolibre-oauth-start/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getMlConfig() {
  // Suporta duas convenções de env keys
  const clientId =
    Deno.env.get('ML_CLIENT_ID') || Deno.env.get('MERCADOLIVRE_CLIENT_ID') || ''
  const clientSecret =
    Deno.env.get('ML_CLIENT_SECRET') || Deno.env.get('MERCADOLIVRE_CLIENT_SECRET') || ''
  // ⚠️ Fallback fixo para mercadolibre-oauth-callback (com “livre”)
  const redirectUri =
    Deno.env.get('ML_REDIRECT_URI') ||
    Deno.env.get('MERCADOLIVRE_REDIRECT_URI') ||
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolivre-oauth-callback`

  if (!clientId) {
    throw new Error('Missing ML_CLIENT_ID or MERCADOLIVRE_CLIENT_ID environment variable')
  }
  if (!clientSecret) {
    throw new Error('Missing ML_CLIENT_SECRET or MERCADOLIVRE_CLIENT_SECRET environment variable')
  }

  console.log('[OAuth][start] ML credentials configured successfully')
  return { clientId, clientSecret, redirectUri }
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1) Service role: só para validar o bearer do usuário
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[OAuth][start] Missing authorization header')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const {
      data: { user },
      error: userError
    } = await serviceClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      console.error('[OAuth][start] Invalid user token:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Client autenticado: para RPC que usa auth.uid() e inserts com RLS
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2.1) ✅ Garante organização (idempotente)
    try {
      const ensureResp = await authClient.rpc('ensure_current_org')
      console.log('[OAuth][start] ensure_current_org', ensureResp?.data || ensureResp?.error)
    } catch (e) {
      console.warn('[OAuth][start] ensure_current_org exception', e)
    }

    // 3) Gera state + PKCE
    const state = crypto.randomUUID()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // 4) Busca organização (com fallback caso ainda esteja nula)
    let { data: profile } = await authClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .maybeSingle()

    let orgId = profile?.organizacao_id
    if (!orgId) {
      console.log('[OAuth][start] No org after ensure, trying ensure again...')
      const { data: again, error: againErr } = await authClient.rpc('ensure_current_org')
      if (againErr || !again?.success) {
        console.error('[OAuth][start] ensure_current_org failed:', againErr, again)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create user organization' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      orgId = again.organization_id
    }

    if (!orgId) {
      console.error('[OAuth][start] User organization not found after ensure')
      return new Response(
        JSON.stringify({ success: false, error: 'User organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5) Persiste state/PKCE
    const { error: stErr } = await authClient.from('oauth_states').insert({
      state_value: state,
      code_verifier: codeVerifier,
      user_id: user.id,
      organization_id: orgId,
      provider: 'mercadolivre',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    })
    if (stErr) {
      console.error('[OAuth][start] oauth_states insert failed', stErr)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create OAuth state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6) Monta URL de autorização (com redirect_uri correto)
    const { clientId, redirectUri } = getMlConfig()
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'offline_access read write')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return new Response(
      JSON.stringify({ success: true, authorization_url: authUrl.toString(), state }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[OAuth][start] error:', error)
    const status = String(error?.message || '').includes('Missing ML_CLIENT') ? 500 : 400
    return new Response(
      JSON.stringify({ success: false, error: error?.message || String(error) }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}