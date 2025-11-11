import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CRYPTO_KEY, SUPABASE_URL, SERVICE_KEY } from "../_shared/config.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { integration_account_id } = await req.json();

    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'integration_account_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 [SYNC BACKGROUND] Iniciando sincronização para conta: ${integration_account_id}`);

    // 1. Buscar ou criar registro de controle
    let { data: syncControl, error: controlError } = await supabase
      .from('sync_control')
      .select('*')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (controlError && controlError.code !== 'PGRST116') {
      throw controlError;
    }

    if (!syncControl) {
      const { data: newControl, error: insertError } = await supabase
        .from('sync_control')
        .insert({
          integration_account_id,
          provider: 'mercadolivre',
          status: 'idle'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      syncControl = newControl;
    }

    // 2. Verificar se já há uma sincronização em andamento
    if (syncControl.status === 'running') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Sincronização já em andamento',
          progress: {
            current: syncControl.progress_current,
            total: syncControl.progress_total
          }
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Marcar como "running"
    await supabase
      .from('sync_control')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        error_message: null,
        progress_current: 0,
        progress_total: 0
      })
      .eq('id', syncControl.id);

    // 4. Executar sincronização em background
    const syncPromise = executarSincronizacao(supabase, integration_account_id, syncControl.id, syncControl.last_sync_date);

    // Não aguardar a promessa - retornar imediatamente
    syncPromise.catch(async (error) => {
      console.error('❌ [SYNC BACKGROUND] Erro na sincronização:', error);
      await supabase
        .from('sync_control')
        .update({
          status: 'error',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncControl.id);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sincronização iniciada em background',
        sync_control_id: syncControl.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [SYNC BACKGROUND] Erro fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executarSincronizacao(
  supabase: any,
  integrationAccountId: string,
  syncControlId: string,
  lastSyncDate: string | null
) {
  console.log(`📊 [SYNC] Executando sincronização para conta ${integrationAccountId}`);
  
  const BATCH_SIZE = 50;
  let offset = 0;
  let hasMore = true;
  let totalProcessed = 0;

  try {
    // ✅ 1. BUSCAR TOKEN DIRETO DO BANCO (padrão unified-orders)
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
    
    const { data: secretRow, error: secretError } = await serviceClient
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at')
      .eq('integration_account_id', integrationAccountId)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    console.log(`🔍 [SYNC] SECRET SEARCH:`, {
      hasRow: !!secretRow,
      hasSimpleTokens: !!secretRow?.simple_tokens,
      useSimple: secretRow?.use_simple,
      hasSecretEnc: !!secretRow?.secret_enc
    });

    if (!secretRow) {
      throw new Error('Token ML não encontrado. Reconecte a integração.');
    }

    let mlAccessToken = '';

    // ✅ 2. DESCRIPTOGRAFAR TOKEN (padrão unified-orders)
    // Primeiro: tentar simple_tokens (nova estrutura)
    if (secretRow.use_simple && secretRow.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          mlAccessToken = tokensData.access_token || '';
          
          console.log(`✅ [SYNC] Token obtido via simple_tokens`);
        }
      } catch (err) {
        console.error(`❌ [SYNC] Erro descriptografia simple_tokens:`, err);
      }
    }

    // Fallback: tentar secret_enc (estrutura antiga)
    if (!mlAccessToken && secretRow.secret_enc) {
      try {
        const decrypted = await decryptAESGCM(secretRow.secret_enc as string);
        const tokensData = JSON.parse(decrypted);
        mlAccessToken = tokensData.access_token || '';
        
        console.log(`✅ [SYNC] Token obtido via secret_enc`);
      } catch (err) {
        console.error(`❌ [SYNC] Erro descriptografia secret_enc:`, err);
      }
    }

    if (!mlAccessToken) {
      throw new Error('Token ML não disponível. Reconecte a integração.');
    }

    // ✅ 3. BUSCAR SELLER_ID
    const { data: accountData } = await serviceClient
      .from('integration_accounts')
      .select('account_identifier')
      .eq('id', integrationAccountId)
      .single();

    if (!accountData?.account_identifier) {
      throw new Error('Seller ID não encontrado');
    }

    const sellerId = accountData.account_identifier;
    console.log(`🆔 [SYNC] Seller ID: ${sellerId}`);

    // ✅ 4. BUSCAR DEVOLUÇÕES DIRETAMENTE DA API ML
    while (hasMore) {
      console.log(`📦 [SYNC] Processando lote ${offset / BATCH_SIZE + 1} (offset: ${offset})`);

      // Chamar API ML diretamente
      const mlApiUrl = `https://api.mercadolibre.com/v1/claims/search`;
      const params = new URLSearchParams({
        seller_id: sellerId,
        limit: String(BATCH_SIZE),
        offset: String(offset),
        sort: 'date_created_desc'
      });

      if (lastSyncDate) {
        params.append('date_created_from', lastSyncDate);
      }

      const mlResponse = await fetch(`${mlApiUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${mlAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error('❌ [SYNC] Erro API ML:', mlResponse.status, errorText);
        throw new Error(`API ML error (${mlResponse.status}): ${errorText}`);
      }

      const mlData = await mlResponse.json();
      const claims = mlData.data || [];
      console.log(`📥 [SYNC] Recebidos ${claims.length} claims da API ML`);

      if (claims.length === 0) {
        hasMore = false;
        break;
      }

      // Salvar no Supabase (upsert)
      if (claims.length > 0) {
        const { error: upsertError } = await supabase
          .from('devolucoes_avancadas')
          .upsert(claims, {
            onConflict: 'claim_id,integration_account_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.error('❌ [SYNC] Erro ao salvar claims:', upsertError);
          throw new Error(`Erro ao salvar no banco: ${upsertError.message}`);
        }

        console.log(`✅ [SYNC] Salvos ${claims.length} claims no Supabase`);
      }

      totalProcessed += claims.length;
      offset += BATCH_SIZE;

      // Atualizar progresso
      await supabase
        .from('sync_control')
        .update({
          progress_current: totalProcessed,
          progress_total: Math.max(totalProcessed, offset)
        })
        .eq('id', syncControlId);

      // Se recebeu menos que o batch size, chegou ao fim
      if (claims.length < BATCH_SIZE) {
        hasMore = false;
      }

      // Pequeno delay para não sobrecarregar a API do ML
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Marcar como concluído
    await supabase
      .from('sync_control')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_sync_date: new Date().toISOString(),
        total_claims: totalProcessed
      })
      .eq('id', syncControlId);

    console.log(`✅ [SYNC] Sincronização concluída! Total processado: ${totalProcessed} claims`);

  } catch (error) {
    console.error('❌ [SYNC] Erro durante sincronização:', error);
    throw error;
  }
}
