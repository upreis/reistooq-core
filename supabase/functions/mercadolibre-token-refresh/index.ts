import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');

  if (!clientId || !clientSecret) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET are required');
  }

  return { clientId, clientSecret, redirectUri };
}

// ============= SISTEMA BLINDADO ML TOKEN REFRESH =============

const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN");
if (!INTERNAL_TOKEN) {
  throw new Error("CRITICAL: INTERNAL_SHARED_TOKEN environment variable must be configured");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { integration_account_id } = await req.json();
    if (!integration_account_id) {
      return new Response(JSON.stringify({ success: false, error: 'integration_account_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ML Token Refresh] Iniciando refresh para account: ${integration_account_id}`);

    const supabase = makeClient(req.headers.get("Authorization"));

    // ✅ 1. BUSCAR SECRETS DIRETAMENTE DO BANCO (sem integrations-get-secret)
    const { data: secretRow, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('simple_tokens, use_simple')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (secretsError || !secretRow) {
      console.error('[ML Token Refresh] Erro ao buscar secrets:', secretsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch secrets',
        details: secretsError || 'Secret not found'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decriptar simple_tokens
    let refreshToken: string | null = null;
    let accessToken: string | null = null;

    if (secretRow.simple_tokens && secretRow.use_simple) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Payload = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Payload);
          const tokenData = JSON.parse(jsonStr);
          refreshToken = tokenData.refresh_token;
          accessToken = tokenData.access_token;
          console.log('[ML Token Refresh] ✅ Tokens decriptados do simple_tokens');
        }
      } catch (err) {
        console.error('[ML Token Refresh] Erro ao decriptar simple_tokens:', err);
      }
    }

    // ✅ 4. VALIDAÇÃO DE SECRETS OBRIGATÓRIA (Sistema Blindado)
    if (!refreshToken) {
      console.error('[ML Token Refresh] ❌ CRITICO: Refresh token não encontrado após todos os fallbacks');
      
      try {
        const { clientId, clientSecret } = getMlConfig();
        if (!clientId || !clientSecret) {
          console.error('[ML Token Refresh] ❌ CRITICO: ML_CLIENT_ID ou ML_CLIENT_SECRET ausentes');
          return new Response(JSON.stringify({ 
            success: false, 
            error: "ML secrets not configured",
            error_type: 'config_missing',
            required_secrets: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET']
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error('[ML Token Refresh] ❌ CRITICO: Erro ao verificar ML secrets:', errorMessage);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "ML configuration error",
          error_type: 'config_error',
          message: errorMessage
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Refresh token não encontrado",
        error_type: 'no_refresh_token',
        message: 'Conta requer reconexão OAuth',
        account_id: integration_account_id
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ 5. Fazer refresh no Mercado Livre
    const { clientId, clientSecret } = getMlConfig();
    
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    console.log('[ML Token Refresh] Enviando request para ML API...');
    
    // Implementar timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const raw = await resp.text();
    
    if (!resp.ok) {
      console.error("[ML Token Refresh] HTTP", resp.status, raw);
      
      // invalid_grant -> refresh vencido: forçará reconectar no app
      const msg = raw.includes("invalid_grant") ? 
        "Refresh token inválido/expirado — reconecte a conta" : 
        "Falha ao renovar token de acesso";
        
      return new Response(JSON.stringify({
        success: false,
        error: msg,
        http_status: resp.status,
        body: raw,
        error_type: raw.includes("invalid_grant") ? 'reconnect_required' : 'refresh_failed'
      }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const json = JSON.parse(raw);
    const newExpiresAt = new Date(Date.now() + (json.expires_in ?? 0) * 1000).toISOString();

    console.log('[ML Token Refresh] ✅ Refresh bem-sucedido, atualizando tokens...');

    // ✅ 6. Atualizar tokens no banco usando função SQL segura
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'refresh_ml_token',
      {
        p_account_id: integration_account_id,
        p_new_access_token: json.access_token,
        p_new_refresh_token: json.refresh_token ?? refreshToken,
        p_expires_at: newExpiresAt
      }
    );

    if (updateError || !updateResult?.success) {
      console.error('[ML Token Refresh] Erro ao salvar tokens:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Falha ao salvar novos tokens",
        details: updateError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ML Token Refresh] ✅ Tokens salvos com sucesso');

    return new Response(JSON.stringify({
      success: true,
      access_token: json.access_token,
      expires_at: newExpiresAt,
      token_type: json.token_type || "Bearer"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error("[ML Token Refresh] Unexpected error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      error_type: 'unexpected_error',
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});