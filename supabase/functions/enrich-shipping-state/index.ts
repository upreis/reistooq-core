import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_ids, integration_account_id } = await req.json();

    if (!order_ids?.length || !integration_account_id) {
      return new Response(
        JSON.stringify({ error: "order_ids and integration_account_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar token de acesso
    const { data: secretData, error: secretError } = await supabase
      .from("integration_secrets")
      .select("access_token")
      .eq("integration_account_id", integration_account_id)
      .single();

    if (secretError || !secretData?.access_token) {
      console.log("Token not found for account:", integration_account_id);
      return new Response(
        JSON.stringify({ error: "Token not found", states: {} }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = secretData.access_token;
    const states: Record<string, string> = {};

    // Buscar shipping info para cada order
    for (const orderId of order_ids.slice(0, 50)) { // Limitar a 50 por chamada
      try {
        // Primeiro buscar o pack_id ou shipping_id do order
        const orderRes = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!orderRes.ok) continue;
        const orderData = await orderRes.json();
        
        const shippingId = orderData.shipping?.id;
        if (!shippingId) continue;

        // Buscar dados de shipping
        const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${shippingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!shipRes.ok) continue;
        const shipData = await shipRes.json();
        
        const stateId = shipData.receiver_address?.state?.id;
        if (stateId) {
          states[orderId] = stateId;
          
          // Atualizar no banco de dados
          await supabase
            .from("vendas_hoje_realtime")
            .update({ 
              order_data: supabase.sql`
                jsonb_set(
                  COALESCE(order_data, '{}'::jsonb), 
                  '{shipping,receiver_address,state}', 
                  '{"id": "${stateId}"}'::jsonb
                )
              `
            })
            .eq("order_id", orderId);
        }
      } catch (err) {
        console.error(`Error fetching shipping for order ${orderId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, states, enriched: Object.keys(states).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
