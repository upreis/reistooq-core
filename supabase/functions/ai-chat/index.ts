import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const validateInput = (data: any) => {
  const errors: string[] = [];
  
  // Validate message
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (data.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (data.message.length > 10000) {
    errors.push('Message must be less than 10,000 characters');
  }
  
  // Validate conversationId (optional, but must be valid UUID if present)
  if (data.conversationId !== undefined && data.conversationId !== null) {
    if (typeof data.conversationId !== 'string') {
      errors.push('ConversationId must be a string');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.conversationId)) {
        errors.push('ConversationId must be a valid UUID');
      }
    }
  }
  
  // Validate context (optional string)
  if (data.context !== undefined && data.context !== null) {
    if (typeof data.context !== 'string') {
      errors.push('Context must be a string');
    } else if (data.context.length > 500) {
      errors.push('Context must be less than 500 characters');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Validate input first
    const validation = validateInput(requestData);
    if (!validation.isValid) {
      console.error('❌ Input validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input: ' + validation.errors.join(', ') }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { message, conversationId, context } = requestData;
    
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

    // Create service role client for all operations (including auth validation)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('🔧 Service role key configured:', serviceRoleKey ? `Yes (${serviceRoleKey.slice(0, 20)}...)` : 'No');
    console.log('🔧 Supabase URL:', supabaseUrl);
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error('❌ Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const supabaseService = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Verify user authentication using service role client with JWT
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error details:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in again' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.id);
    
    // Use the already created service role client for database operations

    // Buscar perfil do usuário com service role (tem GRANT SELECT)
    console.log('🔍 Attempting to read profile for user:', user.id);
    console.log('🔍 Using service_role with direct SELECT (has GRANT permission)');
    
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, organizacao_id, nome_exibicao')
      .eq('id', user.id)
      .single();
    
    console.log('🔍 Profile query result:', { profile, error: profileError });

    // Validar que o perfil existe e tem organization_id
    if (profileError || !profile) {
      console.error('❌ Erro ao buscar perfil do usuário:', JSON.stringify(profileError));
      return new Response(
        JSON.stringify({ 
          error: 'Perfil de usuário não encontrado. Por favor, entre em contato com o suporte.' 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile.organizacao_id) {
      console.error('❌ Usuário sem organization_id:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não está associado a nenhuma organização. Por favor, entre em contato com o suporte.' 
        }), 
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Perfil validado');
    console.log('🔒 Usando Service Role para operações de banco');

    // Buscar conhecimento relevante usando embeddings semânticos
    const searchResponse = await supabase.functions.invoke('semantic-search', {
      body: { 
        query: message,
        limit: 3,
        organizationId: profile.organizacao_id
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

    // SEGURANÇA CRÍTICA: Validar ownership do conversationId antes de usar
    if (conversationId) {
      console.log('🔍 Validando ownership do conversationId:', conversationId);
      
      const { data: conversationOwnership, error: ownershipError } = await supabase
        .from('ai_chat_conversations')
        .select('id, organization_id, user_id')
        .eq('id', conversationId)
        .single();

      if (ownershipError || !conversationOwnership) {
        console.error('❌ Conversa não encontrada:', conversationId);
        return new Response(
          JSON.stringify({ error: 'Conversa não encontrada.' }), 
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar que a conversa pertence à mesma organização E ao mesmo usuário
      if (conversationOwnership.organization_id !== profile.organizacao_id || 
          conversationOwnership.user_id !== user.id) {
        console.error('❌ Tentativa de acesso não autorizado à conversa:', conversationId, 
          'User:', user.id, 'Owner:', conversationOwnership.user_id,
          'Org:', profile.organizacao_id, 'Conv Org:', conversationOwnership.organization_id);
        return new Response(
          JSON.stringify({ error: 'Acesso negado a esta conversa.' }), 
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Ownership validado. Carregando histórico...');
      
      const { data: history, error: historyError } = await supabase
        .from('ai_chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (historyError) {
        console.error('⚠️ Erro ao carregar histórico:', historyError);
      } else if (history) {
        messages = [...messages, ...history];
        console.log(`📜 Histórico carregado: ${history.length} mensagens`);
      }
    }

    messages.push({ role: 'user', content: message });

    // Chamar Lovable AI com timeout
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🤖 Chamando Lovable AI Gateway...');
    
    // Create AbortController for timeout (30 seconds)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

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
      signal: abortController.signal
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Gateway error:', aiResponse.status);
      
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

    console.log('✅ AI Gateway respondeu com sucesso');

    // Save conversation context first
    let finalConversationId = conversationId;
    
    if (!conversationId) {
      console.log('📝 Criando nova conversa...');
      try {
        const { data: newConv, error: convError } = await supabase
          .from('ai_chat_conversations')
          .insert({
            user_id: user.id,
            organization_id: profile.organizacao_id,
            title: message.substring(0, 50)
          })
          .select()
          .single();
        
        if (convError) {
          console.error('❌ Erro ao criar conversa:', convError);
          throw new Error('Falha ao criar nova conversa');
        }
        
        finalConversationId = newConv?.id;
        console.log('✅ Nova conversa criada');
      } catch (error) {
        console.error('❌ Erro crítico ao criar conversa:', error);
        throw error;
      }
    }
    
    // Save user message with error handling
    if (finalConversationId) {
      console.log('💾 Salvando mensagem do usuário...');
      try {
        const { error: msgError } = await supabase.from('ai_chat_messages').insert({
          conversation_id: finalConversationId,
          role: 'user',
          content: message
        });
        
        if (msgError) {
          console.error('❌ Erro ao salvar mensagem do usuário:', msgError);
          throw new Error('Falha ao salvar mensagem');
        }
        
        console.log('✅ Mensagem do usuário salva');
      } catch (error) {
        console.error('❌ Erro crítico ao salvar mensagem:', error);
        throw error;
      }
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

          // Save complete assistant message with proper error handling
          if (finalConversationId && assistantMessage) {
            console.log('💾 Salvando resposta do assistente...');
            try {
              const { error: assistantMsgError } = await supabase.from('ai_chat_messages').insert({
                conversation_id: finalConversationId,
                role: 'assistant',
                content: assistantMessage
              });
              
              if (assistantMsgError) {
                console.error('❌ Erro ao salvar resposta do assistente:', assistantMsgError);
              } else {
                console.log('✅ Resposta do assistente salva');
              }
            } catch (error) {
              console.error('❌ Erro crítico ao salvar resposta:', error);
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('❌ Streaming error:', error);
          // Send error to client via SSE
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: 'Erro durante streaming' 
          })}\n\n`));
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
    // Handle timeout from AbortController
    if (error.name === 'AbortError') {
      console.error('❌ AI Gateway timeout após 30 segundos');
      return new Response(
        JSON.stringify({ error: 'Request timeout. Please try again.' }), 
        { 
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle other errors
    console.error('❌ Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
