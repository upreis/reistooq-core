/**
 * 💬 ABA DE MENSAGENS
 * FASE 4.1: Timeline de mensagens do claim
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Paperclip, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReclamacoesMensagensTabProps {
  claimId: string;
  accountId: string;
}

export function ReclamacoesMensagensTab({ claimId, accountId }: ReclamacoesMensagensTabProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [claimId]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);

      // Tentar buscar do banco primeiro
      const { data: cachedMessages } = await supabase
        .from('reclamacoes_mensagens')
        .select('*')
        .eq('claim_id', claimId)
        .order('date_created', { ascending: true });

      if (cachedMessages && cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      // Buscar da API para atualizar
      const { data, error } = await supabase.functions.invoke('ml-claims-messages', {
        body: { claimId, accountId }
      });

      if (error) throw error;

      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (error: any) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar mensagens',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      buyer: { label: 'Comprador', variant: 'default' },
      seller: { label: 'Vendedor', variant: 'secondary' },
      mediator: { label: 'Mediador', variant: 'outline' }
    };
    
    const config = variants[role] || { label: role, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma mensagem encontrada nesta reclamação</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Timeline de Mensagens ({messages.length})
        </h3>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header da mensagem */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {message.sender_role}
                  </span>
                  {getRoleBadge(message.sender_role)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(message.date_created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Conteúdo da mensagem */}
              <div className="prose prose-sm max-w-none">
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>

              {/* Anexos */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Anexos ({message.attachments.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {message.attachments.map((attachment: any, idx: number) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded border hover:bg-accent transition-colors"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs truncate">
                          {attachment.type || 'Anexo'} #{idx + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {message.status && (
                <div className="mt-2 pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {message.status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
