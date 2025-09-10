import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    // ✅ 1. SISTEMA BLINDADO: Buscar secrets com validação obrigatória
    const { data: secrets, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('access_token, refresh_token, secret_enc, expires_at, meta, simple_tokens, use_simple')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretsError) {
      console.error('[ML Token Refresh] Erro ao buscar secrets:', secretsError);
      return fail('Failed to fetch secrets', 500, secretsError);
    }

    if (!secrets) {
      console.error('[ML Token Refresh] Nenhum secret encontrado para a conta');
      return fail('No secrets found for account', 404);
    }

    let refreshToken = secrets.refresh_token as string | null;
    let accessToken = secrets.access_token as string | null;

    // ✅ 2. SISTEMA BLINDADO: Verificar simple_tokens primeiro (novo formato)
    if (secrets?.simple_tokens && secrets?.use_simple) {
      console.log('[ML Token Refresh] Usando simple_tokens (formato novo)');
      try {
        // Simple tokens são base64 encoded com prefixo SALT2024::
        let simpleTokensStr = secrets.simple_tokens as string;
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.slice(10); // Remove SALT2024::
          const jsonStr = atob(base64Data);
          const tokens = JSON.parse(jsonStr);
          
          refreshToken = tokens.refresh_token || refreshToken;
          accessToken = tokens.access_token || accessToken;
          
          console.log('[ML Token Refresh] ✅ Simple tokens extraídos com sucesso');
        }
      } catch (e) {
        console.warn('[ML Token Refresh] Falha ao processar simple_tokens:', e.message);
      }
    }

    // ✅ 3. SISTEMA BLINDADO: 4 Fallbacks sequenciais de decriptação (formato antigo)
    if ((!refreshToken || refreshToken.length === 0) && secrets?.secret_enc) {
      console.log('[ML Token Refresh] Access token/refresh_token vazios, iniciando sistema blindado...');
      
      let decrypted = null;
      let fallbackUsed = '';
      
      // FALLBACK 1: Bytea PostgreSQL (\x format)
      try {
        let raw = secrets.secret_enc as any;
        if (typeof raw === 'string' && raw.startsWith('\\x')) {
          console.log('[ML Token Refresh] Tentando FALLBACK 1: Bytea PostgreSQL');
          const hexString = raw.slice(2);
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
          const b64String = new TextDecoder().decode(bytes);
          decrypted = await decryptAESGCM(b64String);
          fallbackUsed = 'bytea';
        }
      } catch (e) { console.warn('[ML Token Refresh] Fallback 1 (bytea) falhou:', e.message); }

      // FALLBACK 2: Buffer objects (Node.js) 
      if (!decrypted) {
        try {
          let raw = secrets.secret_enc as any;
          if (raw && typeof raw === 'object' && (raw as any).type === 'Buffer' && Array.isArray((raw as any).data)) {
            console.log('[ML Token Refresh] Tentando FALLBACK 2: Buffer Node.js');
            const b64String = new TextDecoder().decode(Uint8Array.from((raw as any).data));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'buffer';
          }
        } catch (e) { console.warn('[ML Token Refresh] Fallback 2 (buffer) falhou:', e.message); }
      }

      // FALLBACK 3: Uint8Array direct
      if (!decrypted) {
        try {
          let raw = secrets.secret_enc as any;
          if (raw instanceof Uint8Array || (raw && typeof raw === 'object' && typeof (raw as ArrayBuffer).byteLength === 'number')) {
            console.log('[ML Token Refresh] Tentando FALLBACK 3: Uint8Array');
            const b64String = raw instanceof Uint8Array ? 
              new TextDecoder().decode(raw) : 
              new TextDecoder().decode(new Uint8Array(raw as ArrayBuffer));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'uint8array';
          }
        } catch (e) { console.warn('[ML Token Refresh] Fallback 3 (uint8array) falhou:', e.message); }
      }

      // FALLBACK 4: String simples + validação de integridade
      if (!decrypted) {
        try {
          let raw = secrets.secret_enc as any;
          const payload = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
          if (payload) {
            console.log('[ML Token Refresh] Tentando FALLBACK 4: String simples');
            // Validação de integridade: deve parecer com base64
            if (payload.match(/^[A-Za-z0-9+/]+=*$/)) {
              decrypted = await decryptAESGCM(payload);
              fallbackUsed = 'string';
            } else {
              console.warn('[ML Token Refresh] Payload não parece base64 válido, ignorando');
            }
          }
        } catch (e) { console.warn('[ML Token Refresh] Fallback 4 (string) falhou:', e.message); }
      }

      // Processar resultado da decriptação
      if (decrypted && decrypted.trim()) {
        try {
          const secret = JSON.parse(decrypted);
          refreshToken = secret.refresh_token || refreshToken;
          console.log(`[ML Token Refresh] ✅ Decriptação bem-sucedida via ${fallbackUsed.toUpperCase()}`);
        } catch (e) {
          console.error('[ML Token Refresh] JSON inválido após decriptação:', e.message);
          return fail("Invalid JSON after decryption", 500, { decryption_error: e.message });
        }
      } else {
        console.error('[ML Token Refresh] ❌ TODOS os 4 fallbacks falharam!');
        return fail("All decryption fallbacks failed - reconnect required", 500, { 
          error_type: 'decryption_failed',
          fallbacks_tried: 4
        });
      }
    }

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

    // ✅ 6. Atualizar tokens no banco (manter compatibilidade com ambos os formatos)
    const newTokens = {
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? refreshToken,
      expires_at: newExpiresAt
    };

    // Atualizar simple_tokens se estiver usando o novo formato
    let updateData: any = {
      integration_account_id,
      provider: 'mercadolivre',
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: newTokens.expires_at,
      meta: secrets.meta ?? {},
      updated_at: new Date().toISOString()
    };

    if (secrets?.use_simple) {
      const simpleTokensData = btoa(JSON.stringify(newTokens));
      updateData.simple_tokens = `SALT2024::${simpleTokensData}`;
      updateData.use_simple = true;
    }

    const { error: upErr } = await supabase.from('integration_secrets').upsert(updateData, { 
      onConflict: 'integration_account_id,provider' 
    });

    if (upErr) {
      console.error('[ML Token Refresh] Erro ao salvar tokens:', upErr);
      return fail("Falha ao salvar novos tokens", 500, upErr);
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