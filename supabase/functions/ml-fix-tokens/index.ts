import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MLTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar todas as contas ML com tokens expirados
    const { data: secrets, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('integration_account_id, provider, simple_tokens, expires_at')
      .eq('provider', 'mercadolivre')
      .lt('expires_at', new Date().toISOString());

    if (secretsError) {
      throw new Error(`Erro ao buscar secrets: ${secretsError.message}`);
    }

    console.log(`🔍 Encontradas ${secrets?.length || 0} contas com tokens expirados`);

    const results = [];

    for (const secret of secrets || []) {
      try {
        // Extrair refresh_token do simple_tokens
        const simpleTokensStr = secret.simple_tokens as string;
        if (!simpleTokensStr || !simpleTokensStr.startsWith('SALT2024::')) {
          results.push({
            account_id: secret.integration_account_id,
            status: 'error',
            message: 'Formato inválido de simple_tokens'
          });
          continue;
        }

        const base64Payload = simpleTokensStr.replace('SALT2024::', '');
        const jsonStr = atob(base64Payload);
        const tokenData = JSON.parse(jsonStr);

        if (!tokenData.refresh_token) {
          results.push({
            account_id: secret.integration_account_id,
            status: 'error',
            message: 'refresh_token não encontrado'
          });
          continue;
        }

        // 2. Buscar credenciais do ML
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'MERCADOLIVRE_CLIENT_ID')
          .single();

        const { data: configSecret } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'MERCADOLIVRE_CLIENT_SECRET')
          .single();

        if (!configData?.valor || !configSecret?.valor) {
          results.push({
            account_id: secret.integration_account_id,
            status: 'error',
            message: 'Credenciais ML não configuradas'
          });
          continue;
        }

        // 3. Fazer refresh do token com o ML
        console.log(`🔄 Refreshing token para conta: ${secret.integration_account_id}`);
        
        const mlResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: configData.valor,
            client_secret: configSecret.valor,
            refresh_token: tokenData.refresh_token
          })
        });

        if (!mlResponse.ok) {
          const errorText = await mlResponse.text();
          results.push({
            account_id: secret.integration_account_id,
            status: 'error',
            message: `ML API Error: ${mlResponse.status} - ${errorText}`
          });
          continue;
        }

        const newTokens: MLTokenResponse = await mlResponse.json();

        // 4. Atualizar tokens no banco
        const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));
        const newSimpleTokens = `SALT2024::${btoa(JSON.stringify({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token
        }))}`;

        const { error: updateError } = await supabase
          .from('integration_secrets')
          .update({
            simple_tokens: newSimpleTokens,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('integration_account_id', secret.integration_account_id)
          .eq('provider', 'mercadolivre');

        if (updateError) {
          results.push({
            account_id: secret.integration_account_id,
            status: 'error',
            message: `Erro ao atualizar: ${updateError.message}`
          });
          continue;
        }

        // 5. Atualizar token_status na integration_accounts
        await supabase
          .from('integration_accounts')
          .update({ token_status: 'active' })
          .eq('id', secret.integration_account_id);

        results.push({
          account_id: secret.integration_account_id,
          status: 'success',
          message: 'Tokens atualizados com sucesso',
          expires_at: expiresAt.toISOString()
        });

        console.log(`✅ Token atualizado com sucesso para: ${secret.integration_account_id}`);

      } catch (err) {
        results.push({
          account_id: secret.integration_account_id,
          status: 'error',
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processadas ${results.length} contas`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
