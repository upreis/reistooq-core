import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  item_ids: string[];
  integration_account_id: string;
}

async function fetchProductThumbnail(itemId: string, accessToken: string): Promise<string> {
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch item ${itemId}: ${response.status}`);
      return '';
    }
    
    const data = await response.json();
    return data.thumbnail || '';
  } catch (error) {
    console.error(`Error fetching thumbnail for ${itemId}:`, error);
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

    const { item_ids, integration_account_id }: RequestBody = await req.json();

    if (!item_ids || item_ids.length === 0) {
      return new Response(JSON.stringify({ error: "No item_ids provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Limitar a 10 itens por request para evitar timeout
    const limitedItemIds = item_ids.slice(0, 10);

    console.log(`[enrich-thumbnails] Enriching ${limitedItemIds.length} items for account ${integration_account_id}`);

    // Buscar access token da conta
    const { data: secretData, error: secretError } = await supabase
      .from("integration_secrets")
      .select("access_token")
      .eq("integration_account_id", integration_account_id)
      .single();

    if (secretError || !secretData?.access_token) {
      console.warn(`[enrich-thumbnails] No token found for account ${integration_account_id} - skipping enrichment`);
      // Retornar sucesso vazio ao invés de erro para evitar runtime errors no frontend
      return new Response(JSON.stringify({ 
        success: true, 
        thumbnails: {}, 
        enriched: 0,
        skipped: true,
        reason: "No token available for this account"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const accessToken = secretData.access_token;

    // Buscar thumbnails em paralelo
    const thumbnailPromises = limitedItemIds.map(async (itemId) => {
      const thumbnail = await fetchProductThumbnail(itemId, accessToken);
      return { item_id: itemId, thumbnail };
    });

    const results = await Promise.all(thumbnailPromises);
    const thumbnailMap: Record<string, string> = {};

    // Atualizar no banco os que têm thumbnail
    for (const result of results) {
      if (result.thumbnail) {
        thumbnailMap[result.item_id] = result.thumbnail;
        
        // Atualizar todos os registros com este item_id que não têm thumbnail
        const { error: updateError } = await supabase
          .from("vendas_hoje_realtime")
          .update({ item_thumbnail: result.thumbnail })
          .eq("item_id", result.item_id)
          .is("item_thumbnail", null)
          .or("item_thumbnail.eq.");

        if (updateError) {
          console.warn(`[enrich-thumbnails] Failed to update ${result.item_id}:`, updateError);
        } else {
          console.log(`[enrich-thumbnails] Updated thumbnail for ${result.item_id}`);
        }
      }
    }

    console.log(`[enrich-thumbnails] Enriched ${Object.keys(thumbnailMap).length}/${limitedItemIds.length} items`);

    return new Response(JSON.stringify({ 
      success: true, 
      thumbnails: thumbnailMap,
      enriched: Object.keys(thumbnailMap).length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[enrich-thumbnails] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
