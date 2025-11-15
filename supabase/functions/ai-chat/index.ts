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
    const { message, conversationId, context } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Usar busca semântica RAG
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    // Buscar conhecimento relevante usando embeddings semânticos
    const searchResponse = await supabase.functions.invoke('semantic-search', {
      body: { 
        query: message,
        limit: 3,
        organizationId: profile?.organizacao_id
      }
    });

    let knowledgeContext = "";
    if (searchResponse.data?.results) {
      knowledgeContext = searchResponse.data.results
        .map((r: any) => `${r.title}:\n${r.content}`)
        .join("\n\n---\n\n");
      
      console.log(`📚 RAG: ${searchResponse.data.results.length} docs relevantes`);
    }

    // Buscar histórico da conversa se existir
    let messages: any[] = [
      {
        role: 'system',
        content: `Você é um assistente inteligente do sistema de gestão integrado. 

Base de conhecimento relevante (busca semântica):
${knowledgeContext || 'Nenhum contexto específico encontrado'}

Contexto do usuário: ${context || 'Usuário está navegando no sistema'}

Instruções:
- Seja direto e objetivo
- Use a base de conhecimento para respostas precisas
- Se não souber, sugira onde o usuário pode encontrar a informação
- Sempre seja educado e prestativo`
      }
    ];

    if (conversationId) {
      const { data: history } = await supabase
        .from('ai_chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (history) {
        messages = [...messages, ...history];
      }
    }

    messages.push({ role: 'user', content: message });

    // Chamar Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: false
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('AI service unavailable');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Salvar conversa no banco
    let finalConversationId = conversationId;

    if (!conversationId) {
      // Criar nova conversa
      const { data: newConv } = await supabase
        .from('ai_chat_conversations')
        .insert({
          user_id: user.id,
          organization_id: profile?.organizacao_id,
          title: message.substring(0, 50)
        })
        .select()
        .single();

      finalConversationId = newConv?.id;
    }

    // Salvar mensagens
    if (finalConversationId) {
      await supabase.from('ai_chat_messages').insert([
        {
          conversation_id: finalConversationId,
          role: 'user',
          content: message
        },
        {
          conversation_id: finalConversationId,
          role: 'assistant',
          content: assistantMessage
        }
      ]);
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: finalConversationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
