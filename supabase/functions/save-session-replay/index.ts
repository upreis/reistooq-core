import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, events, url, timestamp, duration } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Obter org do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizacao_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organizacao_id) {
      throw new Error("User organization not found");
    }

    // Criar resumo da sessão
    const summary = {
      sessionId,
      url,
      eventCount: events.length,
      duration,
      timestamp,
      userId: user.id,
      userAgent: req.headers.get("user-agent")
    };

    // Salvar na knowledge_base
    const { error: insertError } = await supabase
      .from("knowledge_base")
      .insert({
        organization_id: profile.organizacao_id,
        source: "session_replay",
        title: `Sessão: ${url} - ${new Date(timestamp).toLocaleString('pt-BR')}`,
        content: JSON.stringify({
          summary,
          events: events.slice(0, 100) // Limitar eventos salvos para não sobrecarregar
        }),
        metadata: {
          sessionId,
          url,
          duration,
          eventCount: events.length,
          userId: user.id
        },
        is_active: true
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`✅ Session replay saved: ${sessionId} (${events.length} events)`);

    return new Response(
      JSON.stringify({ success: true, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error saving session replay:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
