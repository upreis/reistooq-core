import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY, corsHeaders } from "../_shared/client.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[ML Token Refresh Cron] Starting proactive token refresh check...');

  try {
    const supabase = makeClient(req.headers.get("Authorization"));

    // Find tokens expiring within 30 minutes
    const { data: expiringSoonAccounts, error: queryError } = await supabase.rpc('decrypt_integration_secret', {
      p_account_id: null, // Special: return all accounts
      p_provider: 'mercadolivre',
      p_encryption_key: ENC_KEY,
    });

    if (queryError) {
      console.error('[ML Token Refresh Cron] Failed to query expiring tokens:', queryError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to query tokens' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let refreshed = 0;
    let errors = 0;

    // Check each account for token expiration
    for (const account of expiringSoonAccounts || []) {
      try {
        const expiresAt = new Date(account.expires_at);
        const now = new Date();
        const minutesToExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

        // Refresh if expires within 30 minutes
        if (minutesToExpiry < 30 && minutesToExpiry > 0) {
          console.log(`[ML Token Refresh Cron] Refreshing token for account ${account.integration_account_id}, expires in ${minutesToExpiry.toFixed(1)} minutes`);

          // Call the existing smart-responder function
          const refreshResponse = await supabase.functions.invoke('smart-responder', {
            body: { integration_account_id: account.integration_account_id }
          });

          if (refreshResponse.error) {
            console.error(`[ML Token Refresh Cron] Failed to refresh token for ${account.integration_account_id}:`, refreshResponse.error);
            errors++;
          } else {
            console.log(`[ML Token Refresh Cron] Successfully refreshed token for ${account.integration_account_id}`);
            refreshed++;
          }
        }
      } catch (error) {
        console.error(`[ML Token Refresh Cron] Error processing account ${account.integration_account_id}:`, error);
        errors++;
      }
    }

    console.log(`[ML Token Refresh Cron] Completed: ${refreshed} refreshed, ${errors} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      refreshed,
      errors,
      message: `Proactive token refresh completed: ${refreshed} refreshed, ${errors} errors`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[ML Token Refresh Cron] Unexpected error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error?.message ?? error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});