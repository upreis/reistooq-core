import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Standalone cron function (no _shared import)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[ML Token Refresh Cron] Starting proactive token refresh check...');

  try {
    // ✅ CORREÇÃO: Usar SERVICE_ROLE_KEY direto, sem passar Authorization header do cron
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false }
    });

    // ✅ SISTEMA BLINDADO: Refresh preventivo - tokens que expiram em até 4 horas (Documentação ML: tokens duram 6h)
    const threshold4hours = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    
    // Buscar contas ativas do Mercado Livre com tokens que podem precisar de refresh
    const { data: activeAccounts, error: accountsError } = await supabase
      .from('integration_accounts')
      .select('id')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (accountsError) {
      console.error('[ML Token Refresh Cron] Failed to query active accounts:', accountsError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to query accounts' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const accountIds = activeAccounts?.map(acc => acc.id) || [];
    console.log(`[ML Token Refresh Cron] Checking ${accountIds.length} active ML accounts`);

    // Buscar tokens que expiram em até 1 hora
    const { data: expiringSoon, error: queryError } = await supabase
      .from('integration_secrets')
      .select('integration_account_id, expires_at, provider, simple_tokens, use_simple')
      .eq('provider', 'mercadolivre')
      .in('integration_account_id', accountIds)
      .not('expires_at', 'is', null)
      .lte('expires_at', threshold4hours);

    console.log(`[ML Token Refresh Cron] Encontrados ${expiringSoon?.length || 0} tokens para refresh preventivo`);

    if (queryError) {
      console.error('[ML Token Refresh Cron] Failed to query expiring tokens:', queryError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to query tokens' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let refreshed = 0;
    let errors = 0;

    for (const row of expiringSoon || []) {
      const accountId = row.integration_account_id;
      try {
        const { data, error } = await supabase.functions.invoke('mercadolibre-token-refresh', {
          body: { integration_account_id: accountId },
        });
        if (error || !data?.success) {
          console.error(`[ML Token Refresh Cron] Refresh failed for ${accountId}:`, error || data);
          errors++;
        } else {
          console.log(`[ML Token Refresh Cron] Token refreshed for ${accountId}`);
          refreshed++;
        }
      } catch (e) {
        console.error(`[ML Token Refresh Cron] Error refreshing ${accountId}:`, e);
        errors++;
      }
    }

    console.log(`[ML Token Refresh Cron] Completed: ${refreshed} refreshed, ${errors} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      refreshed,
      errors,
      checked: expiringSoon?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[ML Token Refresh Cron] Unexpected error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});