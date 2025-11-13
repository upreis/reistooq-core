import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 [ML Test] Iniciando teste de conexão...');

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar contas ativas do ML
    const { data: accounts, error: accountsError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (accountsError) {
      throw new Error(`Erro ao buscar contas: ${accountsError.message}`);
    }

    console.log(`📊 [ML Test] Encontradas ${accounts?.length || 0} contas ativas`);

    const results = [];

    for (const account of accounts || []) {
      console.log(`🔍 [ML Test] Testando conta: ${account.name} (${account.account_identifier})`);
      
      try {
        // 2. Buscar access token usando integrations-get-secret
        const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN");
        if (!INTERNAL_TOKEN) {
          throw new Error('CRITICAL: INTERNAL_SHARED_TOKEN must be configured in Supabase Edge Function secrets');
        }
        
        const secretResponse = await fetch(
          `${supabaseUrl}/functions/v1/integrations-get-secret`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-call': 'true',
              'x-internal-token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ 
              integration_account_id: account.id,
              provider: 'mercadolivre'
            })
          }
        );

        let secretData = null;
        if (secretResponse.ok) {
          secretData = await secretResponse.json();
        }

        const tokenStatus = secretData?.found ? 
          (secretData?.secret?.access_token ? 'token_valid' : 'token_missing') : 
          'secret_not_found';

        // 3. Se tiver token, testar API do ML
        let apiTest = 'not_tested';
        if (tokenStatus === 'token_valid') {
          try {
            const testUrl = `https://api.mercadolibre.com/users/me`;
            const apiResponse = await fetch(testUrl, {
              headers: {
                'Authorization': `Bearer ${secretData.secret.access_token}`,
                'Content-Type': 'application/json'
              }
            });

            if (apiResponse.ok) {
              apiTest = 'success';
            } else {
              apiTest = `error_${apiResponse.status}`;
            }
          } catch (error) {
            apiTest = `exception: ${error instanceof Error ? error.message : String(error)}`;
          }
        }

        results.push({
          account_id: account.id,
          account_name: account.name,
          account_identifier: account.account_identifier,
          token_status: tokenStatus,
          api_test: apiTest,
          expires_at: secretData?.expires_at || null
        });

      } catch (error) {
        results.push({
          account_id: account.id,
          account_name: account.name,
          account_identifier: account.account_identifier,
          token_status: 'error',
          api_test: 'not_tested',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log('✅ [ML Test] Teste concluído');

    return new Response(JSON.stringify({
      success: true,
      accounts_tested: results.length,
      results: results,
      summary: {
        total_accounts: results.length,
        with_valid_tokens: results.filter(r => r.token_status === 'token_valid').length,
        api_success: results.filter(r => r.api_test === 'success').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [ML Test] Erro no teste:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});