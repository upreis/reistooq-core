import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getMlConfig() {
  // Suporta duas convenções de env keys
  const clientId = Deno.env.get('ML_CLIENT_ID') || Deno.env.get('MERCADOLIVRE_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET') || Deno.env.get('MERCADOLIVRE_CLIENT_SECRET') || '';
  const redirectUri = Deno.env.get('ML_REDIRECT_URI') || Deno.env.get('MERCADOLIVRE_REDIRECT_URI') ||
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolibre-oauth-callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing ML client credentials (client_id/client_secret)');
  }
  return { clientId, clientSecret, redirectUri };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Generate state for OAuth
    const state = crypto.randomUUID()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Get user's organization or create one
    let { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .maybeSingle()

    let orgId = profile?.organizacao_id
    
    // If user doesn't have an organization, create a default one
    if (!orgId) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizacoes')
        .insert({
          nome: `Organização de ${user.email?.split('@')[0] || 'Usuário'}`,
          tipo: 'individual',
          ativa: true
        })
        .select('id')
        .single()

      if (orgError || !newOrg) {
        console.error('Failed to create organization:', orgError)
        throw new Error('Failed to create user organization')
      }

      orgId = newOrg.id

      // Update user profile with new organization
      await supabase
        .from('profiles')
        .update({ organizacao_id: orgId })
        .eq('id', user.id)
    }

    // Store OAuth state
    await supabase
      .from('oauth_states')
      .insert({
        state_value: state,
        code_verifier: codeVerifier,
        user_id: user.id,
        organization_id: orgId,
        provider: 'mercadolivre',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      })

    // Mercado Livre OAuth URL
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
      JSON.stringify({ 
        success: true, 
        authorization_url: authUrl.toString(),
        state 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('OAuth start error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}