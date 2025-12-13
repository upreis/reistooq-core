import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extrair token do header
    const token = authHeader.replace('Bearer ', '');

    // Usar SERVICE_ROLE_KEY para validar JWT e obter usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar o token JWT e obter dados do usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized - Invalid token');
    }

    console.log(`✅ Usuário autenticado: ${user.email}`);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organizacao_id) {
      throw new Error('Organization not found');
    }

    console.log(`🔍 Analisando comportamento para org: ${profile.organizacao_id}`);

    // Buscar session replays recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, title, content, metadata')
      .eq('organization_id', profile.organizacao_id)
      .eq('source', 'session_replay')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionsError) {
      console.error('Erro ao buscar sessões:', sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📊 Nenhuma sessão recente encontrada');
      return new Response(
        JSON.stringify({ 
          message: 'Nenhuma sessão recente para analisar',
          insights: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Analisando ${sessions.length} sessões...`);

    // Preparar dados para análise da IA
    const sessionsData = sessions.map(s => {
      let events: any[] = [];
      try {
        const parsed = JSON.parse(s.content || '[]');
        events = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn(`⚠️ Erro ao parsear eventos da sessão ${s.id}:`, e);
        events = [];
      }
      return {
        id: s.id,
        title: s.title,
        route: s.metadata?.currentRoute || 'unknown',
        events,
        timestamp: s.metadata?.timestamp
      };
    });

    // Agrupar por rota
    const sessionsByRoute: Record<string, any[]> = {};
    sessionsData.forEach(session => {
      const route = session.route;
      if (!sessionsByRoute[route]) {
        sessionsByRoute[route] = [];
      }
      sessionsByRoute[route].push(session);
    });

    // Analisar cada rota com a IA
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const insights = [];

    for (const [route, routeSessions] of Object.entries(sessionsByRoute)) {
      console.log(`🔍 Analisando rota ${route} (${routeSessions.length} sessões)`);

      // Contar ações por sessão - garantir que events é sempre um array
      const sessionStats = routeSessions.map(s => {
        const events = Array.isArray(s.events) ? s.events : [];
        return {
          id: s.id,
          eventCount: events.length,
          clicks: events.filter((e: any) => e?.type === 3 && e?.data?.source === 2).length,
          errors: events.filter((e: any) => 
            e?.data?.tag === 'error' || 
            (typeof e?.data?.message === 'string' && e.data.message.toLowerCase().includes('error'))
          ).length
        };
      });

      const totalClicks = sessionStats.reduce((sum, s) => sum + s.clicks, 0);
      const totalErrors = sessionStats.reduce((sum, s) => sum + s.errors, 0);
      const avgEvents = sessionStats.length > 0 
        ? sessionStats.reduce((sum, s) => sum + s.eventCount, 0) / sessionStats.length 
        : 0;

      // Solicitar análise da IA
      const analysisPrompt = `Analise o comportamento dos usuários nesta rota: ${route}

Estatísticas:
- Total de sessões: ${routeSessions.length}
- Média de eventos por sessão: ${avgEvents.toFixed(0)}
- Total de cliques: ${totalClicks}
- Total de erros: ${totalErrors}

Identifique:
1. Possíveis dificuldades dos usuários
2. Padrões de comportamento problemáticos
3. Sugestões de melhorias na UI/UX
4. Bugs ou problemas técnicos

Retorne APENAS a análise em formato JSON.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em UX que analisa comportamento de usuários. Retorne análises em JSON com: insight_type, priority, title, description, suggested_improvement, confidence_score (0-1).'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "create_insight",
                description: "Cria um insight sobre dificuldades dos usuários",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          insight_type: {
                            type: "string",
                            enum: ["ui_improvement", "feature_request", "bug_pattern", "user_struggle", "workflow_optimization"]
                          },
                          priority: {
                            type: "string",
                            enum: ["low", "medium", "high", "critical"]
                          },
                          title: { type: "string" },
                          description: { type: "string" },
                          suggested_improvement: { type: "string" },
                          confidence_score: { type: "number", minimum: 0, maximum: 1 }
                        },
                        required: ["insight_type", "priority", "title", "description", "suggested_improvement", "confidence_score"]
                      }
                    }
                  },
                  required: ["insights"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "create_insight" } }
          }),
        });

        if (!aiResponse.ok) {
          console.error(`Erro na IA para rota ${route}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall?.function?.arguments) {
          const analysis = JSON.parse(toolCall.function.arguments);
          
          if (analysis.insights && Array.isArray(analysis.insights)) {
            for (const insight of analysis.insights) {
              // Salvar no banco
              const { data: savedInsight, error: insertError } = await supabaseAdmin
                .from('ai_insights')
                .insert({
                  organization_id: profile.organizacao_id,
                  insight_type: insight.insight_type,
                  priority: insight.priority,
                  title: insight.title,
                  description: insight.description,
                  suggested_improvement: insight.suggested_improvement,
                  confidence_score: insight.confidence_score,
                  affected_route: route,
                  user_actions_analyzed: routeSessions.length,
                  session_replay_ids: routeSessions.map(s => s.id),
                  raw_data: {
                    sessionStats,
                    totalClicks,
                    totalErrors,
                    avgEvents
                  }
                })
                .select()
                .single();

              if (insertError) {
                console.error('Erro ao salvar insight:', insertError);
              } else {
                console.log(`✅ Insight criado: ${insight.title}`);
                insights.push(savedInsight);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao analisar rota ${route}:`, error);
      }
    }

    console.log(`✅ Análise completa! ${insights.length} insights gerados`);

    return new Response(
      JSON.stringify({
        success: true,
        insights_count: insights.length,
        insights: insights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-user-behavior:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
