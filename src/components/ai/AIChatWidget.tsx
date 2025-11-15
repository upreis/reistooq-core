import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente inteligente. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showError } = useToastFeedback();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Verificar autenticação e obter token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError('Por favor, faça login para usar o assistente.');
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      // Fazer chamada à edge function com header de autorização explícito
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          conversationId,
          context: `Usuário está em: ${window.location.pathname}`
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        if (response.error.message.includes('Rate limit')) {
          showError('Limite de requisições excedido. Tente novamente mais tarde.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (response.error.message.includes('credits')) {
          showError('Créditos insuficientes. Adicione créditos para continuar.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('Nenhuma resposta recebida do assistente');
      }

      // A resposta já vem completamente processada do backend
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }

      if (response.data.content) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.content 
        }]);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
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
                  "max-w-[80%] rounded-lg p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
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
