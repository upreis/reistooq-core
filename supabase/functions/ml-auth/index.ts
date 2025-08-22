import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID')!;
const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // Verificar auth do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }

    if (action === 'start') {
      // Iniciar OAuth
      const state = crypto.randomUUID();
      const redirectUri = `${SUPABASE_URL}/functions/v1/ml-auth?action=callback`;
      
      const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', ML_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'offline_access read write');
      authUrl.searchParams.set('state', state);

      // Salvar state temporário
      await supabase.from('oauth_states').insert({
        state_value: state,
        user_id: user.id,
        provider: 'mercadolivre',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      return Response.json({ 
        authorization_url: authUrl.toString() 
      }, { headers: corsHeaders });

    } else if (action === 'callback') {
      // Callback do OAuth
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        return new Response(`
          <script>
            window.opener?.postMessage({type:'oauth_error', error:'${error}'}, '*');
            window.close();
          </script>
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      if (!code || !state) {
        return new Response(`
          <script>
            window.opener?.postMessage({type:'oauth_error', error:'Missing code or state'}, '*');
            window.close();
          </script>
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // Verificar state
      const { data: stateData } = await supabase
        .from('oauth_states')
        .select('user_id')
        .eq('state_value', state)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!stateData) {
        return new Response(`
          <script>
            window.opener?.postMessage({type:'oauth_error', error:'Invalid state'}, '*');
            window.close();
          </script>
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // Marcar state como usado
      await supabase.from('oauth_states').update({ used: true }).eq('state_value', state);

      // Trocar code por tokens
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code,
        redirect_uri: `${SUPABASE_URL}/functions/v1/ml-auth?action=callback`
      });

      const tokenResp = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });

      if (!tokenResp.ok) {
        return new Response(`
          <script>
            window.opener?.postMessage({type:'oauth_error', error:'Token exchange failed'}, '*');
            window.close();
          </script>
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      const tokenData = await tokenResp.json();

      // Buscar dados do usuário ML
      const userResp = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!userResp.ok) {
        return new Response(`
          <script>
            window.opener?.postMessage({type:'oauth_error', error:'Failed to get user info'}, '*');
            window.close();
          </script>
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      const userData = await userResp.json();

      // Buscar organização do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', stateData.user_id)
        .single();

      // Salvar conta e tokens
      const { data: account } = await supabase
        .from('integration_accounts')
        .upsert({
          provider: 'mercadolivre',
          name: userData.nickname,
          account_identifier: String(userData.id),
          is_active: true,
          organization_id: profile?.organizacao_id,
          public_auth: {
            user_id: userData.id,
            nickname: userData.nickname,
            email: userData.email,
            site_id: userData.site_id
          }
        }, { onConflict: 'provider,account_identifier' })
        .select()
        .single();

      if (account) {
        // Buscar tokens existentes primeiro para atualizar ou criar
        const { data: existingSecret } = await supabase
          .from('integration_secrets')
          .select('id')
          .eq('integration_account_id', account.id)
          .eq('provider', 'mercadolivre')
          .single();

        if (existingSecret) {
          // Atualizar tokens existentes
          await supabase.from('integration_secrets').update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            meta: { user_id: userData.id },
            updated_at: new Date().toISOString()
          }).eq('id', existingSecret.id);
        } else {
          // Criar novo secret
          await supabase.from('integration_secrets').insert({
            integration_account_id: account.id,
            provider: 'mercadolivre',
            organization_id: profile?.organizacao_id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            meta: { user_id: userData.id }
          });
        }
      }

      return new Response(`
        <script>
          window.opener?.postMessage({type:'oauth_success', account: ${JSON.stringify(account)}}, '*');
          window.close();
        </script>
      `, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });

    } else if (action === 'orders') {
      // Buscar pedidos
      const body = await req.json();
      const { account_id } = body;

      if (!account_id) {
        return Response.json({ error: 'account_id required' }, { status: 400, headers: corsHeaders });
      }

      // Buscar tokens com organização válida
      const { data: secrets } = await supabase
        .from('integration_secrets')
        .select('access_token, refresh_token, expires_at, organization_id')
        .eq('integration_account_id', account_id)
        .eq('provider', 'mercadolivre')
        .single();

      if (!secrets) {
        return Response.json({ error: 'No tokens found' }, { status: 404, headers: corsHeaders });
      }

      let accessToken = secrets.access_token;

      // Refresh se necessário
      if (secrets.expires_at && new Date(secrets.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)) {
        const refreshParams = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: ML_CLIENT_ID,
          client_secret: ML_CLIENT_SECRET,
          refresh_token: secrets.refresh_token
        });

        const refreshResp = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshParams.toString()
        });

        if (refreshResp.ok) {
          const refreshData = await refreshResp.json();
          accessToken = refreshData.access_token;
          
          await supabase.from('integration_secrets').update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || secrets.refresh_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
          }).eq('integration_account_id', account_id);
        }
      }

      // Buscar conta para pegar seller ID
      const { data: account } = await supabase
        .from('integration_accounts')
        .select('account_identifier')
        .eq('id', account_id)
        .single();

      if (!account) {
        return Response.json({ error: 'Account not found' }, { status: 404, headers: corsHeaders });
      }

      // Buscar pedidos do ML
      const ordersUrl = new URL('https://api.mercadolibre.com/orders/search');
      ordersUrl.searchParams.set('seller', account.account_identifier);
      ordersUrl.searchParams.set('limit', String(body.limit || 50));
      ordersUrl.searchParams.set('offset', String(body.offset || 0));
      
      if (body.status) ordersUrl.searchParams.set('order.status', body.status);

      const ordersResp = await fetch(ordersUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!ordersResp.ok) {
        return Response.json({ 
          error: 'Failed to fetch orders',
          status: ordersResp.status 
        }, { status: ordersResp.status, headers: corsHeaders });
      }

      const ordersData = await ordersResp.json();
      
      return Response.json({
        orders: ordersData.results || [],
        paging: ordersData.paging || { total: 0 }
      }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('ML Auth error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500, headers: corsHeaders });
  }
});