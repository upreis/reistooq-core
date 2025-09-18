// 🔄 SHOPEE CALLBACK - Recebe redirect da autorização Shopee
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log(`[shopee-callback:${requestId}] 🔄 Recebendo callback Shopee`);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const shop_id = url.searchParams.get('shop_id');

    console.log(`[shopee-callback:${requestId}] 📥 Parâmetros: code=${code?.substring(0, 10)}..., state=${state}, shop_id=${shop_id}`);

    if (!code || !state) {
      console.log(`[shopee-callback:${requestId}] ❌ Parâmetros obrigatórios ausentes`);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Erro - Shopee OAuth</title></head>
        <body>
          <h1>Erro na autorização Shopee</h1>
          <p>Parâmetros obrigatórios não foram recebidos.</p>
          <p><a href="javascript:window.close()">Fechar janela</a></p>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Processar callback através da função shopee-oauth
    const { data: callbackResult } = await supabase.functions.invoke('shopee-oauth', {
      body: {
        action: 'handle_callback',
        code: code,
        state: state,
        shop_id: shop_id
      }
    });

    if (callbackResult?.success) {
      console.log(`[shopee-callback:${requestId}] ✅ Callback processado com sucesso`);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sucesso - Shopee OAuth</title>
          <script>
            // Notificar janela pai e fechar
            if (window.opener) {
              window.opener.postMessage({
                type: 'SHOPEE_AUTH_SUCCESS',
                data: ${JSON.stringify(callbackResult)}
              }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </head>
        <body>
          <h1>✅ Conexão com Shopee realizada com sucesso!</h1>
          <p>Conta conectada: Shop ${callbackResult.shop_id}</p>
          <p>Esta janela será fechada automaticamente...</p>
          <p><a href="javascript:window.close()">Fechar agora</a></p>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      console.log(`[shopee-callback:${requestId}] ❌ Erro no callback:`, callbackResult);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro - Shopee OAuth</title>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'SHOPEE_AUTH_ERROR',
                error: '${callbackResult?.error || 'Erro desconhecido'}'
              }, '*');
            }
            setTimeout(() => window.close(), 5000);
          </script>
        </head>
        <body>
          <h1>❌ Erro na conexão com Shopee</h1>
          <p>Erro: ${callbackResult?.error || 'Erro desconhecido'}</p>
          <p>Esta janela será fechada automaticamente...</p>
          <p><a href="javascript:window.close()">Fechar agora</a></p>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

  } catch (error) {
    console.error('[shopee-callback] ❌ Erro:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro - Shopee OAuth</title></head>
      <body>
        <h1>❌ Erro interno</h1>
        <p>Ocorreu um erro inesperado: ${error.message}</p>
        <p><a href="javascript:window.close()">Fechar janela</a></p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});