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

  if (!clientId) {
    throw new Error('Missing ML_CLIENT_ID or MERCADOLIVRE_CLIENT_ID environment variable');
  }
  if (!clientSecret) {
    throw new Error('Missing ML_CLIENT_SECRET or MERCADOLIVRE_CLIENT_SECRET environment variable');
  }
  console.log('[OAuth] ML credentials configured successfully')
  return { clientId, clientSecret, redirectUri };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service client for auth verification only
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[OAuth][start] Missing authorization header')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('[OAuth][start] Invalid user token:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticated client for operations that need auth.uid()
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Generate state for OAuth
    const state = crypto.randomUUID()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Get user's organization or create one
    let { data: profile } = await authClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .maybeSingle()

    let orgId = profile?.organizacao_id
    
    // If user doesn't have an organization, use ensure_current_org RPC
    if (!orgId) {
      console.log('[OAuth][start] User has no organization, auto-creating...')
      
      const { data: orgResult, error: orgError } = await authClient
        .rpc('ensure_current_org')

      if (orgError || !orgResult?.success) {
        console.error('[OAuth][start] Failed to ensure organization:', orgError, orgResult)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user organization. Please try again.' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      orgId = orgResult.organization_id
      console.log('[OAuth][start] Organization auto-created:', orgId)
    }
    
    if (!orgId) {
      console.error('[OAuth][start] User organization not found after ensure')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User organization not found' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store OAuth state using auth client
    await authClient
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
    
    // Determine appropriate status code
    const status = error.message?.includes('Missing ML_CLIENT') ? 500 : 400
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status,
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