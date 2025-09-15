import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'integration_account_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar permissões do usuário
    const userClient = makeUserClient(req);
    
    const { data: orgData } = await userClient.rpc('get_current_org_id');
    if (!orgData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Organization not found' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { data: hasPermission } = await userClient.rpc('has_permission', { 
      permission_key: 'integrations:read' 
    });
    
    if (!hasPermission) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar o token real usando service client
    const serviceClient = makeServiceClient();
    
    const { data: secretRow, error: fetchError } = await serviceClient
      .from('integration_secrets')
      .select('secret_enc, provider, expires_at, simple_tokens, use_simple')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', provider || 'mercadolivre')
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch secret error:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!secretRow) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No secret found for this account' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let secret = null;

    // Tentar decrypt usando simple_tokens primeiro
    if (secretRow.simple_tokens && secretRow.use_simple) {
      try {
        const { data: decryptResult, error: decryptError } = await serviceClient
          .rpc('decrypt_simple', { 
            encrypted_data: secretRow.simple_tokens 
          });
        
        if (!decryptError && decryptResult) {
          secret = JSON.parse(decryptResult);
        }
      } catch (error) {
        console.warn('Failed to decrypt simple tokens:', error);
      }
    }

    // Fallback para secret_enc se necessário
    if (!secret && secretRow.secret_enc) {
      try {
        // Chamar RPC para decriptar
        const { data: decryptResult, error: decryptError } = await serviceClient
          .rpc('decrypt_secret', { 
            account_id: integration_account_id,
            provider_name: provider || 'mercadolivre'
          });
        
        if (!decryptError && decryptResult) {
          secret = decryptResult;
        }
      } catch (error) {
        console.warn('Failed to decrypt complex encryption:', error);
      }
    }

    if (!secret || !secret.access_token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to decrypt secret data or access token not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log da tentativa de acesso
    await serviceClient.rpc('log_secret_access', {
      p_account_id: integration_account_id,
      p_provider: provider || 'mercadolivre',
      p_action: 'get_token',
      p_function: 'get-ml-token',
      p_success: true
    });

    console.log(`✅ Token real obtido para account ${integration_account_id}`);

    return new Response(JSON.stringify({
      success: true,
      access_token: secret.access_token,
      expires_at: secretRow.expires_at,
      provider: secretRow.provider
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get ML token error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});