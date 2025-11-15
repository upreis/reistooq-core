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
    
    // Get authorization from request
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header received:', authHeader ? 'Yes' : 'No');
    
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Token length:', token?.length);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication - pass token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error details:', JSON.stringify(userError));
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in again' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

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
        stream: true
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('AI service unavailable');
    }

    // Save conversation context first
    let finalConversationId = conversationId;
    
    if (!conversationId) {
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
    
    // Save user message
    if (finalConversationId) {
      await supabase.from('ai_chat_messages').insert({
        conversation_id: finalConversationId,
        role: 'user',
        content: message
      });
    }

    // Stream response back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let assistantMessage = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  assistantMessage += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    content,
                    conversationId: finalConversationId 
                  })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }

          // Save complete assistant message
          if (finalConversationId && assistantMessage) {
            await supabase.from('ai_chat_messages').insert({
              conversation_id: finalConversationId,
              role: 'assistant',
              content: assistantMessage
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });


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
