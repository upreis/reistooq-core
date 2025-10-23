import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, shop_id, partner_id } = await req.json();

    console.log('🔄 Iniciando troca de code por access_token Shopee');
    console.log('📊 Parâmetros recebidos:', { code, shop_id, partner_id });

    // Validar parâmetros obrigatórios
    if (!code || !shop_id || !partner_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetros obrigatórios: code, shop_id, partner_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter partner_key dos secrets
    const partnerKey = Deno.env.get('SHOPEE_PARTNER_KEY');
    if (!partnerKey) {
      console.error('❌ SHOPEE_PARTNER_KEY não encontrada nas variáveis de ambiente');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração de partner_key não encontrada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 1. Gerar timestamp atual
    const timestamp = Math.floor(Date.now() / 1000);
    
    // 2. Criar base string para assinatura
    const path = '/api/v2/auth/token/get';
    const baseString = `${partner_id}${path}${timestamp}`;
    
    console.log('🔐 Base string para assinatura:', baseString);

    // 3. Gerar HMAC-SHA256 signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(partnerKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const message = new TextEncoder().encode(baseString);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, message);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('✅ Signature gerada:', signature);

    // 4. Preparar dados para POST
    const postData = {
      code,
      shop_id: parseInt(shop_id),
      partner_id: parseInt(partner_id)
    };

    // 5. Fazer POST para /api/v2/auth/token/get
    const shopeeUrl = `https://partner.test-stable.shopeemobile.com${path}?partner_id=${partner_id}&timestamp=${timestamp}&sign=${signature}`;
    
    console.log('🌐 URL completa:', shopeeUrl);
    console.log('📦 Dados POST:', postData);

    const response = await fetch(shopeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const responseData = await response.json();
    
    console.log('📨 Resposta da Shopee:', responseData);
    console.log('📊 Status da resposta:', response.status);

    if (!response.ok) {
      console.error('❌ Erro na resposta da Shopee:', responseData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro na API da Shopee',
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se a resposta contém access_token
    if (!responseData.access_token) {
      console.error('❌ Access token não encontrado na resposta:', responseData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access token não encontrado na resposta da Shopee',
          details: responseData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Access token obtido com sucesso!');

    // 6. Retornar access_token e dados complementares
    return new Response(
      JSON.stringify({
        success: true,
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
        expires_in: responseData.expires_in,
        shop_id: responseData.shop_id,
        partner_id: responseData.partner_id,
        merchant_id_list: responseData.merchant_id_list
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro interno na função shopee-get-token:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno no servidor',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});