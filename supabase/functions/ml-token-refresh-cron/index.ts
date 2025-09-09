import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[ML Token Refresh Cron] Starting proactive token refresh check...');

  try {
    const supabase = makeClient(req.headers.get("Authorization"));

    // ✅ SISTEMA BLINDADO: Refresh preventivo 5-10 minutos antes da expiração
    const threshold5min = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const threshold10min = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    // Buscar tokens que expiram entre 5-10 minutos (prevenção ativa)
    const { data: expiringSoon, error: queryError } = await supabase
      .from('integration_secrets')
      .select('integration_account_id, expires_at, provider, access_token, refresh_token')
      .eq('provider', 'mercadolivre')
      .not('expires_at', 'is', null)
      .gte('expires_at', threshold10min)  // Não muito cedo
      .lte('expires_at', threshold5min);  // Não muito tarde

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
    return new Response(JSON.stringify({ success: false, error: String(error?.message ?? error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});