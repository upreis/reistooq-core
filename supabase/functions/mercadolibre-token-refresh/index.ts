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

    // ✅ 1. SISTEMA BLINDADO: Buscar secrets via função segura
    const { data: secretData, error: secretsError } = await supabase.functions.invoke(
      'integrations-get-secret',
      {
        body: {
          integration_account_id,
          provider: 'mercadolivre'
        }
      }
    );

    if (secretsError || !secretData?.decrypted_data) {
      console.error('[ML Token Refresh] Erro ao buscar secrets:', secretsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch secrets',
        details: secretsError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const secrets = secretData.decrypted_data;

    // Tokens já decriptados automaticamente pela função
    let refreshToken = secrets.refresh_token as string | null;
    let accessToken = secrets.access_token as string | null;

    console.log('[ML Token Refresh] ✅ Tokens obtidos automaticamente via função segura');

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
        console.error('[ML Token Refresh] ❌ CRITICO: Erro ao verificar ML secrets:', e.message);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "ML configuration error",
          error_type: 'config_error',
          message: e.message
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
    
    const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString()
    });

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
    return new Response(JSON.stringify({
      success: false,
      error: String(e?.message ?? e),
      error_type: 'unexpected_error',
      message: e?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});