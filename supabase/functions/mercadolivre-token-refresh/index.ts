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
    const { account_id, internal_call } = await req.json();

    if (!account_id) {
      return new Response(JSON.stringify({ error: 'account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ML Token Refresh] Iniciando refresh para account: ${account_id}`);

    const serviceClient = makeServiceClient();

    // 1. Buscar dados da conta
    const { data: account, error: accountError } = await serviceClient
      .from('integration_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (accountError || !account) {
      throw new Error('Conta não encontrada');
    }

    // 2. Buscar secret atual
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN");
    if (!INTERNAL_TOKEN) {
      throw new Error('CRITICAL: INTERNAL_SHARED_TOKEN must be configured in Supabase Edge Function secrets');
    }
    
    const secretResponse = await serviceClient.functions.invoke('integrations-get-secret', {
      body: { 
        integration_account_id: account_id,
        provider: 'mercadolivre'
      },
      headers: {
        'x-internal-call': 'true',
        'x-internal-token': INTERNAL_TOKEN
      }
    });

    if (secretResponse.error) {
      console.error('[ML Token Refresh] Erro ao buscar secrets:', secretResponse.error);
      throw new Error('Erro ao buscar secrets');
    }

    const secretData = secretResponse.data;
    if (!secretData?.found || !secretData?.secret?.refresh_token) {
      throw new Error('Refresh token não encontrado');
    }

    const refreshToken = secretData.secret.refresh_token;
    console.log('[ML Token Refresh] Refresh token obtido');

    // 3. Fazer chamada para renovar token na API do ML
    const ML_CLIENT_ID = Deno.env.get("ML_CLIENT_ID");
    const ML_CLIENT_SECRET = Deno.env.get("ML_CLIENT_SECRET");

    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      throw new Error('Credenciais ML não configuradas');
    }

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: refreshToken
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[ML Token Refresh] Erro na API ML:', errorText);
      throw new Error(`Erro na API ML: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('[ML Token Refresh] Novos tokens obtidos');

    // 4. Calcular data de expiração (6 horas)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 21600) * 1000);

    // 5. Usar função do banco para atualizar tokens
    const { error: refreshError } = await serviceClient
      .rpc('refresh_ml_token', {
        p_account_id: account_id,
        p_new_access_token: tokenData.access_token,
        p_new_refresh_token: tokenData.refresh_token,
        p_expires_at: expiresAt.toISOString()
      });

    if (refreshError) {
      console.error('[ML Token Refresh] Erro ao salvar tokens:', refreshError);
      throw new Error('Erro ao salvar novos tokens');
    }

    // 6. Atualizar status da conta
    await serviceClient
      .from('integration_accounts')
      .update({ 
        token_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id);

    console.log(`[ML Token Refresh] ✅ Tokens renovados com sucesso para account: ${account_id}`);

    return new Response(JSON.stringify({
      success: true,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ML Token Refresh] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});