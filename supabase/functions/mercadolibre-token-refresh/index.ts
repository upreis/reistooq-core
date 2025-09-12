import { corsHeaders, fail, ok, getMlConfig, makeClient } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY } from "../_shared/config.ts";

// ============= SISTEMA BLINDADO ML TOKEN REFRESH =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  try {
    const { integration_account_id } = await req.json();
    if (!integration_account_id) {
      return fail('integration_account_id required', 400);
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
      return fail('Failed to fetch secrets', 500, secretsError);
    }

    const secrets = secretData.decrypted_data;

    // Tokens já decriptados automaticamente pela função
    let refreshToken = secrets.refresh_token as string | null;
    let accessToken = secrets.access_token as string | null;

    console.log('[ML Token Refresh] ✅ Tokens obtidos automaticamente via função segura');

    // ✅ 4. VALIDAÇÃO DE SECRETS OBRIGATÓRIA (Sistema Blindado)
    if (!refreshToken) {
      console.error('[ML Token Refresh] ❌ CRITICO: Refresh token não encontrado após todos os fallbacks');
      
      // Verificar se secrets estão configurados (sistema blindado exige)
      if (!CRYPTO_KEY || CRYPTO_KEY.length < 32) {
        console.error('[ML Token Refresh] ❌ CRITICO: APP_ENCRYPTION_KEY ausente ou inválido');
        return fail("APP_ENCRYPTION_KEY not configured", 500, { 
          error_type: 'config_missing',
          required_secret: 'APP_ENCRYPTION_KEY'
        });
      }

      try {
        const { clientId, clientSecret } = getMlConfig();
        if (!clientId || !clientSecret) {
          console.error('[ML Token Refresh] ❌ CRITICO: ML_CLIENT_ID ou ML_CLIENT_SECRET ausentes');
          return fail("ML secrets not configured", 500, { 
            error_type: 'config_missing',
            required_secrets: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET']
          });
        }
      } catch (e) {
        console.error('[ML Token Refresh] ❌ CRITICO: Erro ao verificar ML secrets:', e.message);
        return fail("ML configuration error", 500, { 
          error_type: 'config_error',
          message: e.message
        });
      }

      return fail("Refresh token não encontrado", 404, { 
        error_type: 'no_refresh_token',
        message: 'Conta requer reconexão OAuth',
        account_id: integration_account_id
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
        
      return fail(msg, resp.status, {
        http_status: resp.status,
        body: raw,
        error_type: raw.includes("invalid_grant") ? 'reconnect_required' : 'refresh_failed'
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
      return fail("Falha ao salvar novos tokens", 500, updateError);
    }

    console.log('[ML Token Refresh] ✅ Tokens salvos com sucesso');

    return ok({
      success: true,
      access_token: json.access_token,
      expires_at: newExpiresAt,
      token_type: json.token_type || "Bearer"
    });

  } catch (e) {
    console.error("[ML Token Refresh] Unexpected error:", e);
    return fail(String(e?.message ?? e), 500, {
      error_type: 'unexpected_error',
      message: e?.message || 'Unknown error'
    });
  }
});