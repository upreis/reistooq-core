import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  organization_id?: string;
  batch_size?: number;
  days_back?: number;
}

async function fetchProductThumbnail(itemId: string, accessToken: string): Promise<string> {
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`[backfill-thumbnails] Failed to fetch item ${itemId}: ${response.status}`);
      return '';
    }
    
    const data = await response.json();
    return data.thumbnail || '';
  } catch (error) {
    console.error(`[backfill-thumbnails] Error fetching thumbnail for ${itemId}:`, error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 100, 500);
    const daysBack = body.days_back || 60;
    const organizationId = body.organization_id;

    console.log(`[backfill-thumbnails] Starting backfill - batch_size: ${batchSize}, days_back: ${daysBack}, org: ${organizationId || 'all'}`);

    // Calcular data limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysBack);
    const dateLimitISO = dateLimit.toISOString();

    // Buscar itens únicos sem thumbnail
    let query = supabase
      .from("vendas_hoje_realtime")
      .select("item_id, integration_account_id")
      .gte("date_created", dateLimitISO)
      .or("item_thumbnail.is.null,item_thumbnail.eq.")
      .limit(batchSize * 10); // Buscar mais para ter diversidade de accounts

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: itemsWithoutThumbnails, error: fetchError } = await query;

    if (fetchError) {
      console.error("[backfill-thumbnails] Error fetching items:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!itemsWithoutThumbnails || itemsWithoutThumbnails.length === 0) {
      console.log("[backfill-thumbnails] No items found without thumbnails");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No items need thumbnail enrichment",
        enriched: 0,
        total_checked: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Agrupar por integration_account_id e pegar itens únicos
    const itemsByAccount = new Map<string, Set<string>>();
    for (const item of itemsWithoutThumbnails) {
      if (!item.item_id || !item.integration_account_id) continue;
      
      if (!itemsByAccount.has(item.integration_account_id)) {
        itemsByAccount.set(item.integration_account_id, new Set());
      }
      itemsByAccount.get(item.integration_account_id)!.add(item.item_id);
    }

    console.log(`[backfill-thumbnails] Found ${itemsWithoutThumbnails.length} items without thumbnails across ${itemsByAccount.size} accounts`);

    let totalEnriched = 0;
    let totalProcessed = 0;
    const errors: string[] = [];

    // Processar cada conta
    for (const [accountId, itemIds] of itemsByAccount.entries()) {
      if (totalProcessed >= batchSize) break;

      // Buscar token da conta
      const { data: secretData, error: secretError } = await supabase
        .from("integration_secrets")
        .select("access_token")
        .eq("integration_account_id", accountId)
        .single();

      if (secretError || !secretData?.access_token) {
        console.warn(`[backfill-thumbnails] No token for account ${accountId}, skipping`);
        errors.push(`No token for account ${accountId}`);
        continue;
      }

      const accessToken = secretData.access_token;
      const itemsToProcess = Array.from(itemIds).slice(0, batchSize - totalProcessed);

      console.log(`[backfill-thumbnails] Processing ${itemsToProcess.length} items for account ${accountId}`);

      // Processar em paralelo com limite de concorrência
      const chunkSize = 10;
      for (let i = 0; i < itemsToProcess.length; i += chunkSize) {
        const chunk = itemsToProcess.slice(i, i + chunkSize);
        
        const results = await Promise.all(
          chunk.map(async (itemId) => {
            const thumbnail = await fetchProductThumbnail(itemId, accessToken);
            return { item_id: itemId, thumbnail };
          })
        );

        // Atualizar no banco
        for (const result of results) {
          totalProcessed++;
          
          if (result.thumbnail) {
            const { error: updateError } = await supabase
              .from("vendas_hoje_realtime")
              .update({ item_thumbnail: result.thumbnail })
              .eq("item_id", result.item_id)
              .or("item_thumbnail.is.null,item_thumbnail.eq.");

            if (!updateError) {
              totalEnriched++;
              console.log(`[backfill-thumbnails] ✅ Updated thumbnail for ${result.item_id}`);
            } else {
              console.warn(`[backfill-thumbnails] Failed to update ${result.item_id}:`, updateError);
            }
          }
        }
      }
    }

    const summary = {
      success: true,
      total_checked: itemsWithoutThumbnails.length,
      total_processed: totalProcessed,
      total_enriched: totalEnriched,
      accounts_processed: itemsByAccount.size,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`[backfill-thumbnails] ✅ Completed: ${totalEnriched}/${totalProcessed} enriched`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[backfill-thumbnails] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
