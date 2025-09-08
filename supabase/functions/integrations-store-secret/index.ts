import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptAESGCM } from "../_shared/crypto.ts";

// Standalone helpers
function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function b64ToBytes(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = makeClient(authHeader);
    const payload = await req.json();
    
    console.log('[integrations-store-secret] Request received', {
      hasAuth: !!authHeader,
      accountId: payload?.integration_account_id,
      provider: payload?.provider
    });
    
    if (!payload?.integration_account_id || !payload?.provider) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "integration_account_id e provider são obrigatórios" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verificar se é chamada interna (OAuth callback)
    const isInternal = payload.internal_call === true;
    let organizationId: string;

    if (isInternal) {
      // Chamada interna: apenas buscar organization_id da conta
      const { data: account, error: accountError } = await supabase
        .from('integration_accounts')
        .select('organization_id')
        .eq('id', payload.integration_account_id)
        .single();

      if (accountError || !account) {
        console.error('[store-secret] Account not found:', accountError);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Conta de integração não encontrada' 
        }), { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      organizationId = account.organization_id;
    } else {
      // Chamada externa: verificar autorização completa
      if (!authHeader) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: "Authorization required" 
        }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const userClient = makeClient(authHeader);
      
      // Verificar organização do usuário
      const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('organizacao_id')
        .single();

      if (profileError || !profile?.organizacao_id) {
        console.error('[store-secret] Profile verification failed:', profileError);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: "Perfil de usuário não encontrado" 
        }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      organizationId = profile.organizacao_id;

      // Verificar permissões
      const { data: hasPermission } = await userClient.rpc('has_permission', { 
        permission_key: 'integrations:manage' 
      });

      if (!hasPermission) {
        console.error('[store-secret] Insufficient permissions');
        return new Response(JSON.stringify({ 
          ok: false, 
          error: "Permissões insuficientes" 
        }), { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    // Preparar dados para criptografia
    const secretData = {
      provider: payload.provider,
      client_id: payload.client_id,
      client_secret: payload.client_secret,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
      payload: payload.payload || {}
    };

    // ✅ NOVO: Criptografar usando AES-GCM (mesmo algoritmo do unified-orders)
    const appEncKey = Deno.env.get("APP_ENCRYPTION_KEY");
    if (!appEncKey) {
      console.error('[store-secret] APP_ENCRYPTION_KEY not found');
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Chave de criptografia não configurada" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encryptedData = await encryptAESGCM(JSON.stringify(secretData), appEncKey);
    console.log('[store-secret] Data encrypted with AES-GCM successfully');

    // ✅ NOVO: Salvar secret_enc como string base64 (não bytes)
    // Isso garante compatibilidade total com unified-orders


    // ✅ NOVO: Salvar na tabela integration_secrets com formato padronizado
    const { data: result, error: upsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_account_id: payload.integration_account_id,
        provider: payload.provider,
        organization_id: organizationId,
        simple_tokens: encryptedData, // base64 string
        use_simple: true,
        secret_enc: encryptedData, // MESMO valor como string (não bytes)
        expires_at: payload.expires_at,
        meta: {
          last_updated: new Date().toISOString(),
          encryption_method: 'aes-gcm-unified'
        }
      }, { 
        onConflict: 'integration_account_id,provider',
        ignoreDuplicates: false 
      })
      .select('id');

    if (upsertError) {
      console.error('[store-secret] Upsert failed:', upsertError);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Falha ao salvar dados" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log('[integrations-store-secret] SUCCESS: Tokens persisted', { 
      accountId: payload.integration_account_id, 
      provider: payload.provider, 
      id: result?.[0]?.id 
    });

    // Log de auditoria
    await supabase.rpc('log_secret_access', { 
      p_account_id: payload.integration_account_id, 
      p_provider: payload.provider, 
      p_action: 'store', 
      p_function: 'integrations-store-secret', 
      p_success: true 
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      id: result?.[0]?.id 
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error('[store-secret] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: String(error?.message || error) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});