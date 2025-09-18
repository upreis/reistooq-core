// 🛡️ FASE 4: OAuth Shopee - Sistema Blindado
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopeeOAuthRequest {
  action: 'get_auth_url' | 'handle_callback';
  integration_account_id?: string;
  shop_id?: string;
  redirect_uri?: string;
  code?: string;
  state?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[shopee-oauth:${requestId}] 🚀 Iniciando OAuth Shopee - Method: ${req.method}`);

    let action, integration_account_id, shop_id, redirect_uri, code, state;

    // Se for GET (redirect da Shopee), extrair parâmetros da URL
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('token'); // Shopee usa 'token' como state
      shop_id = url.searchParams.get('shop_id');
      action = 'handle_callback';
      console.log(`[shopee-oauth:${requestId}] 📥 GET Callback - code: ${code?.substring(0, 10)}..., state: ${state}`);
    } else {
      // Se for POST (chamada interna), extrair do JSON
      const body = await req.json() as ShopeeOAuthRequest;
      action = body.action;
      integration_account_id = body.integration_account_id;
      shop_id = body.shop_id;
      redirect_uri = body.redirect_uri;
      code = body.code;
      state = body.state;
    }

    if (action === 'get_auth_url') {
      // 🔐 GERAR URL DE AUTORIZAÇÃO SHOPEE - Buscar credenciais da conta
      console.log(`[shopee-oauth:${requestId}] 🔗 Gerando URL para account: ${integration_account_id}`);
      
      if (!integration_account_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'integration_account_id required' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Buscar credenciais da conta
      const { data: secretData, error: secretError } = await supabase.functions.invoke('integrations-get-secret', {
        body: {
          integration_account_id: integration_account_id,
          provider: 'shopee'
        }
      });

      if (secretError || !secretData?.success) {
        console.log(`[shopee-oauth:${requestId}] ❌ Erro ao buscar credenciais:`, secretError);
        return new Response(
          JSON.stringify({ success: false, error: 'Shopee credentials not found for this account' }),
          { status: 404, headers: corsHeaders }
        );
      }

      const credentials = secretData.payload;
      const SHOPEE_APP_ID = credentials.app_id;
      const SHOPEE_APP_SECRET = credentials.app_secret;
      
      if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET) {
        console.log(`[shopee-oauth:${requestId}] ❌ Credenciais incompletas para conta`);
        return new Response(
          JSON.stringify({ success: false, error: 'Incomplete Shopee credentials for this account' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Buscar dados da conta
      const { data: accountData } = await supabase
        .from('integration_accounts')
        .select('account_identifier, public_auth, organization_id')
        .eq('id', integration_account_id)
        .single();

      if (!accountData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Integration account not found' }),
          { status: 404, headers: corsHeaders }
        );
      }
      
      const authState = crypto.randomUUID();
      const baseUrl = 'https://partner.shopeemobile.com';
      
      // Salvar state temporário para validação
      await supabase.from('oauth_states').insert({
        state: authState,
        provider: 'shopee',
        shop_id: accountData.account_identifier,
        redirect_uri: redirect_uri,
        organization_id: accountData.organization_id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
      });

      const callbackUrl = `https://reistoq.com.br`;
      
      const authUrl = new URL(`${baseUrl}/api/v2/shop/auth_partner`);
      authUrl.searchParams.set('id', SHOPEE_APP_ID);
      authUrl.searchParams.set('token', authState);
      authUrl.searchParams.set('redirect', callbackUrl);

      console.log(`[shopee-oauth:${requestId}] ✅ URL gerada para shop: ${accountData.account_identifier}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          auth_url: authUrl.toString(),
          state: authState
        }),
        { headers: corsHeaders }
      );
    }

    if (action === 'handle_callback') {
      // 🔄 PROCESSAR CALLBACK E OBTER TOKEN
      console.log(`[shopee-oauth:${requestId}] 🔄 Processando callback - Code: ${code?.substring(0, 10)}...`);
      
      if (!code || !state) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing code or state' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Validar state
      const { data: stateData } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('provider', 'shopee')
        .single();

      if (!stateData) {
        console.log(`[shopee-oauth:${requestId}] ❌ State inválido: ${state}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid state' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Buscar credenciais para o callback - precisamos buscar pela organização do state
      const { data: accountsData } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('provider', 'shopee')
        .eq('account_identifier', stateData.shop_id)
        .eq('organization_id', stateData.organization_id);

      if (!accountsData || accountsData.length === 0) {
        console.log(`[shopee-oauth:${requestId}] ❌ Conta não encontrada para shop: ${stateData.shop_id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Account not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      const accountId = accountsData[0].id;

      // Buscar credenciais da conta
      const { data: secretData, error: secretError } = await supabase.functions.invoke('integrations-get-secret', {
        body: {
          integration_account_id: accountId,
          provider: 'shopee'
        }
      });

      if (secretError || !secretData?.success) {
        console.log(`[shopee-oauth:${requestId}] ❌ Erro ao buscar credenciais:`, secretError);
        return new Response(
          JSON.stringify({ success: false, error: 'Shopee credentials not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      const credentials = secretData.payload;
      const SHOPEE_APP_ID = credentials.app_id;
      const SHOPEE_APP_SECRET = credentials.app_secret;
      const SHOPEE_PARTNER_ID = credentials.partner_id;
      
      // Obter access token
      const timestamp = Math.floor(Date.now() / 1000);
      const baseString = `${SHOPEE_PARTNER_ID}${timestamp}`;
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(credentials.partner_key);
      const messageData = encoder.encode(baseString);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const sign = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const tokenUrl = 'https://partner.shopeemobile.com/api/v2/auth/token/get';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          shop_id: parseInt(stateData.shop_id),
          partner_id: parseInt(SHOPEE_PARTNER_ID),
          timestamp: timestamp,
          sign: sign
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok || tokenData.error) {
        console.log(`[shopee-oauth:${requestId}] ❌ Erro no token:`, tokenData);
        return new Response(
          JSON.stringify({ success: false, error: tokenData.message || 'Token request failed' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`[shopee-oauth:${requestId}] ✅ Token obtido com sucesso`);

      // 💾 ATUALIZAR TOKENS NA INTEGRAÇÃO EXISTENTE
      // Atualizar tokens existentes
      const { error: updateError } = await supabase.functions.invoke('integrations-store-secret', {
        body: {
          integration_account_id: accountId,
          provider: 'shopee',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + (tokenData.expire_in * 1000)).toISOString()
        }
      });

      if (updateError) {
        console.log(`[shopee-oauth:${requestId}] ❌ Erro ao atualizar tokens:`, updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update tokens' }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Atualizar status da conta
      await supabase
        .from('integration_accounts')
        .update({ 
          token_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      console.log(`[shopee-oauth:${requestId}] ✅ Tokens atualizados para conta: ${accountId}`);

      // Limpar state usado
      await supabase.from('oauth_states').delete().eq('state', state);

      // Se for GET (redirect), retornar HTML
      if (req.method === 'GET') {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Sucesso - Shopee OAuth</title>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'SHOPEE_AUTH_SUCCESS',
                  data: ${JSON.stringify({
                    success: true,
                    account_id: accountId,
                    shop_id: stateData.shop_id
                  })}
                }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </head>
          <body>
            <h1>✅ Conexão com Shopee realizada com sucesso!</h1>
            <p>Conta conectada: Shop ${stateData.shop_id}</p>
            <p>Esta janela será fechada automaticamente...</p>
            <p><a href="javascript:window.close()">Fechar agora</a></p>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Se for POST, retornar JSON
      return new Response(
        JSON.stringify({
          success: true,
          account_id: accountId,
          shop_id: stateData.shop_id
        }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[shopee-oauth] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});