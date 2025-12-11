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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organization_id, limit = 100 } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[BACKFILL] Starting backfill for org ${organization_id}, limit ${limit}`);

    // Buscar vendas sem shipping_state (extrair shipping_id do order_data)
    const { data: vendasSemEstado, error: fetchError } = await supabase
      .from("vendas_hoje_realtime")
      .select("id, order_id, integration_account_id, order_data")
      .eq("organization_id", organization_id)
      .is("shipping_state", null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    console.log(`[BACKFILL] Found ${vendasSemEstado?.length || 0} sales without shipping_state`);

    if (!vendasSemEstado || vendasSemEstado.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No sales to backfill",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Agrupar por integration_account_id para buscar tokens uma vez por conta
    const byAccount = new Map<string, typeof vendasSemEstado>();
    vendasSemEstado.forEach(venda => {
      const accountId = venda.integration_account_id;
      if (!byAccount.has(accountId)) {
        byAccount.set(accountId, []);
      }
      byAccount.get(accountId)!.push(venda);
    });

    let totalProcessed = 0;
    let totalUpdated = 0;

    for (const [accountId, vendas] of byAccount) {
      // Buscar token de acesso
      const { data: secrets } = await supabase
        .from("integration_secrets")
        .select("secret_value")
        .eq("integration_account_id", accountId)
        .eq("secret_key", `SALT2024::${accountId}`)
        .single();

      if (!secrets?.secret_value) {
        console.log(`[BACKFILL] No token for account ${accountId}, skipping ${vendas.length} sales`);
        continue;
      }

      const accessToken = secrets.secret_value;

      // Processar cada venda
      for (const venda of vendas) {
        try {
          // Extrair shipping_id do order_data
          const orderData = venda.order_data as any;
          const shippingId = orderData?.shipping?.id;

          if (!shippingId) {
            console.log(`[BACKFILL] No shipping_id for order ${venda.order_id}`);
            totalProcessed++;
            continue;
          }

          const shipmentResponse = await fetch(
            `https://api.mercadolibre.com/shipments/${shippingId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!shipmentResponse.ok) {
            console.log(`[BACKFILL] Failed to fetch shipment ${shippingId}: ${shipmentResponse.status}`);
            totalProcessed++;
            continue;
          }

          const shipmentData = await shipmentResponse.json();
          let shippingState = shipmentData.receiver_address?.state?.id || 
                             shipmentData.receiver_address?.state?.name;

          // Extrair código do estado (BR-SP -> SP)
          if (shippingState && shippingState.includes("-")) {
            shippingState = shippingState.split("-")[1];
          }

          if (shippingState) {
            const { error: updateError } = await supabase
              .from("vendas_hoje_realtime")
              .update({ shipping_state: shippingState })
              .eq("id", venda.id);

            if (!updateError) {
              totalUpdated++;
            }
          }

          totalProcessed++;
        } catch (err) {
          console.error(`[BACKFILL] Error processing venda ${venda.id}:`, err);
          totalProcessed++;
        }

        // Rate limiting - pequeno delay entre requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`[BACKFILL] Completed: ${totalProcessed} processed, ${totalUpdated} updated`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: totalProcessed,
      updated: totalUpdated,
      remaining: vendasSemEstado.length - totalProcessed
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[BACKFILL] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
