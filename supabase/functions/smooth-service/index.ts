import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient } from "../_shared/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = makeClient(null); // No auth required for callback
    const url = new URL(req.url);
    
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('ML OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('ML OAuth error:', error);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: '${error}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Missing authorization code or state'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    // Validate state
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_value', state)
      .eq('provider', 'mercadolivre')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      console.error('Invalid or expired state:', stateError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Invalid or expired authorization state'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    // Mark state as used
    await supabase
      .from('oauth_states')
      .update({ used: true })
      .eq('id', stateData.id);

    // Get ML credentials
    const { data: clientId } = await supabase.rpc('get_secret', { name: 'ML_CLIENT_ID' });
    const { data: clientSecret } = await supabase.rpc('get_secret', { name: 'ML_CLIENT_SECRET' });
    const { data: redirectUri } = await supabase.rpc('get_secret', { name: 'ML_REDIRECT_URI' });

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing ML credentials for token exchange');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Missing MercadoLibre configuration'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'client_id': clientId,
        'client_secret': clientSecret,
        'code': code,
        'redirect_uri': redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('ML token exchange failed:', tokenResponse.status, errorText);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Token exchange failed'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('ML token received, user_id:', tokenData.user_id);

    // Get user info from ML
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to get ML user info:', userResponse.status);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Failed to get user information'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const userData = await userResponse.json();

    // Store integration account
    const { data: accountData, error: accountError } = await supabase
      .from('integration_accounts')
      .insert({
        provider: 'mercadolivre',
        external_account_id: userData.id.toString(),
        account_name: userData.nickname || userData.first_name,
        account_email: userData.email,
        is_active: true,
        site_id: userData.site_id,
        user_type: userData.user_type,
        metadata: {
          country_id: userData.country_id,
          status: userData.status?.site_status,
          permalink: userData.permalink
        }
      })
      .select()
      .single();

    if (accountError) {
      console.error('Failed to store integration account:', accountError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Failed to store account information'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    // Store encrypted tokens using the secure function
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    const { error: secretError } = await supabase.functions.invoke('integrations-store-secret', {
      body: {
        integration_account_id: accountData.id,
        provider: 'mercadolivre',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        payload: {
          user_id: tokenData.user_id,
          scope: tokenData.scope
        }
      }
    });

    if (secretError) {
      console.error('Failed to store secrets:', secretError);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'oauth_error',
                provider: 'mercadolivre',
                error: 'Failed to store authentication tokens'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    console.log('ML OAuth completed successfully for account:', accountData.id);

    // Success response
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'oauth_success',
              provider: 'mercadolivre',
              account_id: '${accountData.id}',
              account_name: '${userData.nickname || userData.first_name}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { ...corsHeaders, "Content-Type": "text/html" }
    });

  } catch (e) {
    console.error('Error in smooth-service:', e);
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'oauth_error',
              provider: 'mercadolivre',
              error: 'Internal server error'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { ...corsHeaders, "Content-Type": "text/html" }
    });
  }
});