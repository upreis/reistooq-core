import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { supabase } from "@/integrations/supabase/client";
import { useAIChat } from "@/contexts/AIChatContext";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isInsightContext?: boolean;
}

export function AIChatWidget() {
  const { pendingInsight, clearPendingInsight } = useAIChat();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Sou o assistente de ajuda do Reistoq.

Posso explicar como usar as telas e o que fazer em cada situação.

Não faço alterações nem executo ações por você.

Como posso ajudar?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [insightProcessed, setInsightProcessed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showError } = useToastFeedback();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Processar insight automaticamente quando chegar
  useEffect(() => {
    if (pendingInsight && !insightProcessed) {
      setInsightProcessed(true);
      processInsight();
    }
  }, [pendingInsight]);

  const processInsight = async () => {
    if (!pendingInsight) return;

    // Adicionar contexto do insight como mensagem do sistema
    const insightMessage = `🎯 **Insight Aprovado para Implementação**

**Problema:** ${pendingInsight.title}

**Descrição:** ${pendingInsight.description}

**Rota Afetada:** ${pendingInsight.affectedRoute || 'Não especificada'}

**Sugestão de Melhoria:** ${pendingInsight.suggestedImprovement}

---

Vou analisar este problema e propor uma solução. Aguarde...`;

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: insightMessage,
      isInsightContext: true
    }]);

    // Enviar automaticamente para a IA processar
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showError('Por favor, faça login para usar o assistente.');
        return;
      }

      // ===== PROMPT INSIGHT - MODO SAC (sem exposição técnica) =====
      const promptToProcess = `O usuário identificou uma oportunidade de melhoria no sistema:

📌 PROBLEMA: ${pendingInsight.title}
📝 DESCRIÇÃO: ${pendingInsight.description}
📍 ÁREA AFETADA: ${pendingInsight.affectedRoute || 'Não especificada'}
💡 SUGESTÃO DO USUÁRIO: ${pendingInsight.suggestedImprovement}

Por favor:
1. Confirme que entendeu o problema do usuário
2. Explique em linguagem simples o que pode estar acontecendo
3. Sugira ações práticas que o usuário pode tomar agora (se houver)
4. Informe que o feedback foi registrado e será analisado pela equipe técnica

⚠️ IMPORTANTE: Não forneça detalhes técnicos, código ou nomes de arquivos. Responda como um atendente de suporte.`;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          message: promptToProcess,
          conversationId,
          context: `Processando insight aprovado. Rota afetada: ${pendingInsight.affectedRoute || window.location.pathname}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Erro ao chamar a função');
      }

      // Processar streaming SSE
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível iniciar o streaming');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      let receivedConversationId: string | null = null;

      // Adicionar mensagem vazia do assistente para atualizar progressivamente
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.content) {
              assistantContent += parsed.content;
              
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent
                };
                return newMessages;
              });
            }

            if (parsed.conversationId && !receivedConversationId) {
              receivedConversationId = parsed.conversationId;
              setConversationId(parsed.conversationId);
            }
          } catch (e) {
            console.warn('Erro ao parsear chunk SSE:', e);
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar insight:', error);
      showError(error instanceof Error ? error.message : 'Falha ao processar insight');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showError('Por favor, faça login para usar o assistente.');
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          context: pendingInsight 
            ? `Continuando resolução do insight: ${pendingInsight.title}. Rota: ${pendingInsight.affectedRoute || window.location.pathname}`
            : `Usuário está em: ${window.location.pathname}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        
        if (response.status === 429) {
          showError('Limite de requisições excedido. Tente novamente mais tarde.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (response.status === 402) {
          showError('Créditos insuficientes. Adicione créditos para continuar.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (response.status === 401) {
          showError('Sessão expirada. Por favor, faça login novamente.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        
        throw new Error(errorData.error || 'Erro ao chamar a função');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível iniciar o streaming');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      let receivedConversationId: string | null = null;

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.content) {
              assistantContent += parsed.content;
              
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent
                };
                return newMessages;
              });
            }

            if (parsed.conversationId && !receivedConversationId) {
              receivedConversationId = parsed.conversationId;
              setConversationId(parsed.conversationId);
            }
          } catch (e) {
            console.warn('Erro ao parsear chunk SSE:', e);
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      showError(error instanceof Error ? error.message : 'Falha ao enviar mensagem');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMarkAsResolved = () => {
    clearPendingInsight();
    setInsightProcessed(false);
    setMessages([{
      role: 'assistant',
      content: '✅ Insight marcado como resolvido! Posso ajudar com algo mais?'
    }]);
    setConversationId(null);
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Insight Context Banner */}
      {pendingInsight && (
        <div className="flex-shrink-0 p-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {pendingInsight.title}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAsResolved}
              className="flex-shrink-0 text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolvido
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex w-full",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.isInsightContext
                    ? 'bg-yellow-500/10 border border-yellow-500/30 text-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {message.isInsightContext && (
                  <Badge variant="outline" className="mb-2 text-xs border-yellow-500/50 text-yellow-600">
                    Contexto do Insight
                  </Badge>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {pendingInsight ? 'Analisando problema...' : 'Pensando...'}
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={pendingInsight ? "Pergunte sobre a solução..." : "Digite sua mensagem..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
