import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Embedded crypto functions
async function deriveKey(keyMaterial: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decryptAESGCM(payloadB64: string, keyMaterial: string): Promise<string> {
  try {
    const payload = JSON.parse(atob(payloadB64));
    const key = await deriveKey(keyMaterial);
    const iv = new Uint8Array(payload.iv);
    const ciphertext = new Uint8Array(payload.data);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

function makeUserClient(req: Request) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: auth ? { Authorization: auth } : {} },
  });
}

function isInternal(req: Request) {
  const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN");
  if (!INTERNAL_TOKEN) {
    console.error("CRITICAL: INTERNAL_SHARED_TOKEN not configured");
    return false;
  }
  return req.headers.get("x-internal-call") === "true" && 
         req.headers.get("x-internal-token") === INTERNAL_TOKEN;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { integration_account_id, provider } = await req.json();

    if (!integration_account_id) {
      return new Response(JSON.stringify({ error: 'integration_account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const internal = isInternal(req);
    const serviceClient = makeServiceClient();

    if (!internal) {
      // Chamada externa: validar permissões
      const userClient = makeUserClient(req);
      
      const { data: orgData } = await userClient.rpc('get_current_org_id');
      if (!orgData) {
        return new Response(JSON.stringify({ error: 'Organization not found' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { data: hasPermission } = await userClient.rpc('has_permission', { permission_key: 'integrations:manage' });
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Buscar segredo usando serviceClient (bypass RLS)
    const { data: secretRow, error: fetchError } = await serviceClient
      .from('integration_secrets')
      .select('secret_enc, provider, expires_at, simple_tokens, use_simple')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', provider || 'mercadolivre')
      .maybeSingle();

    // Log da tentativa de acesso
    await serviceClient.rpc('log_secret_access', {
      p_account_id: integration_account_id,
      p_provider: provider || 'mercadolivre',
      p_action: 'get',
      p_function: 'integrations-get-secret',
      p_success: !!secretRow && !fetchError
    });

    if (fetchError) {
      console.error('Fetch secret error:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!secretRow) {
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'No secret found for this account' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      let secret = null;

      // Tentar usar simple_tokens primeiro (implementação mais recente)
      if (secretRow.simple_tokens && secretRow.use_simple) {
        try {
          const { data: decryptResult, error: decryptError } = await serviceClient
            .rpc('decrypt_simple', { 
              encrypted_data: secretRow.simple_tokens 
            });
          
          if (decryptError) {
            console.error('Simple decrypt error:', decryptError);
          } else if (decryptResult) {
            secret = JSON.parse(decryptResult);
          }
        } catch (error) {
          console.warn('Failed to decrypt simple tokens, trying complex method:', error);
        }
      }

      // Fallback para secret_enc (implementação mais antiga)
      if (!secret && secretRow.secret_enc) {
        try {
          // Converter bytea para string se necessário
          let secretString = secretRow.secret_enc;
          if (typeof secretString === 'string' && secretString.startsWith('\\x')) {
            const hexString = secretString.slice(2);
            const matches = hexString.match(/.{1,2}/g);
            if (!matches) throw new Error('Invalid hex string format');
            const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
            secretString = new TextDecoder().decode(bytes);
          }

          const CRYPTO_KEY = Deno.env.get("APP_ENCRYPTION_KEY");
          if (!CRYPTO_KEY) {
            throw new Error('Missing encryption key');
          }
          const decryptedData = await decryptAESGCM(secretString, CRYPTO_KEY);
          secret = JSON.parse(decryptedData);
        } catch (error) {
          console.warn('Failed to decrypt complex encryption:', error);
        }
      }

      if (!secret) {
        return new Response(JSON.stringify({ 
          found: false, 
          message: 'Failed to decrypt secret data - reconnection may be required' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (internal) {
        // Chamada interna: retorna segredo completo
        return new Response(JSON.stringify({
          found: true,
          secret,
          expires_at: secretRow.expires_at
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Chamada externa: retorna versão ofuscada
        return new Response(JSON.stringify({
          found: true,
          has_access_token: !!secret.access_token,
          has_refresh_token: !!secret.refresh_token,
          expires_at: secretRow.expires_at,
          provider: secretRow.provider
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (decryptError) {
      console.error('Decrypt error:', decryptError);
      return new Response(JSON.stringify({ 
        error: 'Failed to decrypt secret - may need to reconnect' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Get secret error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});