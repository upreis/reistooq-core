import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, new_email, new_fantasia } = await req.json();
    
    console.log('[fix-user-email] Request:', { user_id, new_email, new_fantasia });

    if (!user_id || !new_email) {
      return new Response(
        JSON.stringify({ error: "user_id and new_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Update user email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email: new_email,
      user_metadata: {
        fantasia: new_fantasia || new_email.split('.')[0]
      }
    });

    if (error) {
      console.error('[fix-user-email] Error updating user:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[fix-user-email] User updated successfully:', data.user?.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email atualizado de org.reis para ${new_email}`,
        user: data.user 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[fix-user-email] Exception:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
