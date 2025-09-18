// 🛡️ FASE 4: OAuth Shopee - Sistema Blindado
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopeeOAuthRequest {
  action: 'get_auth_url' | 'handle_callback';
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

    let action, shop_id, redirect_uri, code, state;

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
      shop_id = body.shop_id;
      redirect_uri = body.redirect_uri;
      code = body.code;
      state = body.state;
    }
    
    const SHOPEE_APP_ID = Deno.env.get('SHOPEE_APP_ID');
    const SHOPEE_APP_SECRET = Deno.env.get('SHOPEE_APP_SECRET');
    
    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET) {
      console.log(`[shopee-oauth:${requestId}] ❌ Credenciais Shopee não configuradas`);
      return new Response(
        JSON.stringify({ success: false, error: 'Shopee credentials not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (action === 'get_auth_url') {
      // 🔐 GERAR URL DE AUTORIZAÇÃO SHOPEE
      console.log(`[shopee-oauth:${requestId}] 🔗 Gerando URL de autorização para shop: ${shop_id}`);
      
      const authState = crypto.randomUUID();
      const baseUrl = 'https://partner.shopeemobile.com';
      
      // Salvar state temporário para validação
      await supabase.from('oauth_states').insert({
        state: authState,
        provider: 'shopee',
        shop_id: shop_id,
        redirect_uri: redirect_uri,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
      });

      const callbackUrl = 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/shopee-oauth';
      
      const authUrl = new URL(`${baseUrl}/api/v2/shop/auth_partner`);
      authUrl.searchParams.set('id', SHOPEE_APP_ID);
      authUrl.searchParams.set('token', authState);
      authUrl.searchParams.set('redirect', callbackUrl);

      console.log(`[shopee-oauth:${requestId}] ✅ URL gerada: ${authUrl.toString()}`);
      
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

      // Obter access token
      const timestamp = Math.floor(Date.now() / 1000);
      const baseString = `${SHOPEE_APP_ID}${timestamp}`;
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(SHOPEE_APP_SECRET);
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
          partner_id: parseInt(SHOPEE_APP_ID),
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

      // 💾 SALVAR INTEGRAÇÃO
      const { data: account } = await supabase
        .from('integration_accounts')
        .insert({
          provider: 'shopee',
          name: `Shopee Shop ${stateData.shop_id}`,
          account_identifier: stateData.shop_id,
          organization_id: stateData.organization_id,
          is_active: true
        })
        .select()
        .single();

      if (account) {
        // Salvar tokens de forma segura
        await supabase.from('integration_secrets').insert({
          integration_account_id: account.id,
          provider: 'shopee',
          organization_id: account.organization_id,
          simple_tokens: JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expire_in * 1000),
            shop_id: stateData.shop_id
          }),
          expires_at: new Date(Date.now() + (tokenData.expire_in * 1000)).toISOString(),
          use_simple: true
        });

        console.log(`[shopee-oauth:${requestId}] ✅ Integração salva: ${account.id}`);
      }

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
                    account_id: account?.id,
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
          account_id: account?.id,
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