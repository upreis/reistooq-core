import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gera embedding para a query usando Lovable AI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
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
      input: query,
      model: "text-embedding-3-small"
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate query embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, organizationId } = await req.json();

    if (!query) {
      throw new Error("Query is required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Gerar embedding da query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Busca semântica usando pgvector
    // Usamos RPC para fazer a busca por similaridade
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Similaridade mínima
      match_count: limit,
      filter_org_id: organizationId
    });

    if (error) {
      console.error("Search error:", error);
      throw error;
    }

    console.log(`🔍 Semantic search: "${query}" -> ${data?.length || 0} results`);

    return new Response(
      JSON.stringify({ results: data || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in semantic search:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
