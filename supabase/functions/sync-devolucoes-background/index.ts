import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    while (hasMore) {
      console.log(`📦 [SYNC] Processando lote ${offset / BATCH_SIZE + 1} (offset: ${offset})`);

      // Buscar lote de claims da API do ML via ml-api-direct
      const { data: claimsData, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
        body: {
          action: 'buscar-devolucoes',
          integration_account_id: integrationAccountId,
          filters: {
            limit: BATCH_SIZE,
            offset: offset,
            // Sincronização incremental: apenas devoluções atualizadas desde última sync
            date_from: lastSyncDate || undefined
          }
        }
      });

      if (apiError) {
        console.error('❌ [SYNC] Erro ao buscar claims da API:', apiError);
        throw new Error(`Erro na API ML: ${apiError.message}`);
      }

      const claims = claimsData?.devolucoes || [];
      console.log(`📥 [SYNC] Recebidos ${claims.length} claims`);

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
