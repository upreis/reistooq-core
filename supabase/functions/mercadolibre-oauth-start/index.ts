// supabase/functions/mercadolibre-oauth-start/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getMlConfig() {
  // credenciais
  const clientId =
    Deno.env.get('ML_CLIENT_ID') ||
    Deno.env.get('MERCADOLIVRE_CLIENT_ID') ||
    '';
  const clientSecret =
    Deno.env.get('ML_CLIENT_SECRET') ||
    Deno.env.get('MERCADOLIVRE_CLIENT_SECRET') ||
    '';

  // redirect canônico (sempre com /functions/v1)
  const canonical = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolibre-oauth-callback`;
  const redirectUri =
    Deno.env.get('ML_REDIRECT_URI') ||
    Deno.env.get('MERCADOLIVRE_REDIRECT_URI') ||
    canonical;

  if (!clientId) throw new Error('Missing ML_CLIENT_ID or MERCADOLIVRE_CLIENT_ID');
  if (!clientSecret) throw new Error('Missing ML_CLIENT_SECRET or MERCADOLIVRE_CLIENT_SECRET');

  if (redirectUri !== canonical) {
    console.warn('[OAuth][start] ML_REDIRECT_URI difere do canônico:', { redirectUri, canonical });
  }

  return { clientId, clientSecret, redirectUri };
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const reqHeaders = req.headers.get('Access-Control-Request-Headers') ?? 'authorization, x-client-info, apikey, content-type';
    return new Response(null, { status: 200, headers: { ...corsHeaders, 'Access-Control-Allow-Headers': reqHeaders } });
  }

  try {
    // 1) valida usuário
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: { user }, error: userError } =
      await serviceClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) cliente autenticado (RLS)
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2.1) garante organização (idempotente)
    try {
      const ensure = await authClient.rpc('ensure_current_org');
      console.log('[OAuth][start] ensure_current_org:', ensure?.data || ensure?.error);
    } catch (e) {
      console.warn('[OAuth][start] ensure_current_org exception', e);
    }

    // 3) PKCE + state
    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 4) resolve org do usuário
    let { data: profile } = await authClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .maybeSingle();
    let orgId = profile?.organizacao_id;
    if (!orgId) {
      const again = await authClient.rpc('ensure_current_org');
      if (again.error || !again.data?.success) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to create user organization' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      orgId = again.data.organization_id;
    }

    // 5) persiste state/PKCE
    const { error: stErr } = await authClient.from('oauth_states').insert({
      state_value: state,
      code_verifier: codeVerifier,
      user_id: user.id,
      organization_id: orgId,
      provider: 'mercadolivre',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (stErr) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to create OAuth state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6) monta URL de autorização usando o MESMO redirect_uri do env
    const { clientId, redirectUri } = getMlConfig();
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'offline_access read write');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return new Response(JSON.stringify({ success: true, authorization_url: authUrl.toString(), state }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = errorMessage.includes('Missing ML_CLIENT') ? 500 : 400;
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});