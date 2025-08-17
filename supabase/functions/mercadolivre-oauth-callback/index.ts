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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const client = makeClient(authHeader);
    const url = new URL(req.url);
    
    // Extract callback parameters
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing required OAuth parameters');
    }

    // Validate state to prevent CSRF attacks
    const { data: storedState, error: stateError } = await client
      .from('oauth_states')
      .select('*')
      .eq('id', state)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (stateError || !storedState) {
      throw new Error('Invalid or expired OAuth state');
    }

    // Get ML credentials
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    
    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      throw new Error('ML credentials not configured');
    }

    const ML_REDIRECT_URI = `${new URL(req.url).origin}/api/mercadolivre/oauth/callback`;

    // Exchange code for tokens - following ML specs
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
    const { data: profile } = await client
      .from('profiles')
      .select('organizacao_id')
      .eq('id', storedState.user_id)
      .single();

    if (!profile?.organizacao_id) {
      throw new Error('User organization not found');
    }

    // Store/update integration account
    const { data: account, error: accountError } = await client
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
    const { error: secretError } = await client.rpc('encrypt_integration_secret', {
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
    await client
      .from('oauth_states')
      .delete()
      .eq('id', state);

    console.log('ML OAuth completed successfully:', {
      user_id: userData.id,
      nickname: userData.nickname,
      site_id: userData.site_id,
      organization_id: profile.organizacao_id,
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'MercadoLibre connected successfully',
      data: {
        user_id: userData.id,
        nickname: userData.nickname,
        site_id: userData.site_id,
        account_id: account.id,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'OAuth callback failed',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});