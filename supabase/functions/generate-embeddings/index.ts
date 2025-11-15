import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gera embeddings para textos usando Lovable AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small" // Modelo de embeddings da OpenAI
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Embedding error:", error);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { knowledgeId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Se especificou ID, processar apenas esse item
    if (knowledgeId) {
      const { data: item } = await supabase
        .from("knowledge_base")
        .select("*")
        .eq("id", knowledgeId)
        .single();

      if (!item) {
        throw new Error("Knowledge item not found");
      }

      // Gerar embedding
      const textToEmbed = `${item.title}\n\n${item.content}`;
      const embedding = await generateEmbedding(textToEmbed);

      // Atualizar no banco
      await supabase
        .from("knowledge_base")
        .update({ embedding })
        .eq("id", item.id);

      console.log(`✅ Embedding generated for: ${item.title}`);

      return new Response(
        JSON.stringify({ success: true, id: item.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar todos os itens sem embedding
    const { data: items } = await supabase
      .from("knowledge_base")
      .select("*")
      .is("embedding", null)
      .eq("is_active", true);

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No items to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 Processing ${items.length} knowledge items...`);

    let processed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const textToEmbed = `${item.title}\n\n${item.content}`;
        const embedding = await generateEmbedding(textToEmbed);

        await supabase
          .from("knowledge_base")
          .update({ embedding })
          .eq("id", item.id);

        processed++;
        console.log(`✅ ${processed}/${items.length}: ${item.title}`);

        // Rate limiting: pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failed++;
        console.error(`❌ Failed for ${item.title}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        failed,
        total: items.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating embeddings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
