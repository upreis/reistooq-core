/**
 * 📨 ABA MENSAGENS - Lista de mensagens da reclamação
 * FASE 3: Estrutura básica (será implementada completamente na FASE 4)
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, CheckCheck, Paperclip } from 'lucide-react';

interface ReclamacoesMensagensTabProps {
  claimId: string;
}

export function ReclamacoesMensagensTab({ claimId }: ReclamacoesMensagensTabProps) {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMensagens = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('reclamacoes_mensagens')
        .select('*')
        .eq('claim_id', claimId)
        .order('date_created', { ascending: true });

      if (data) {
        setMensagens(data);
      }
      setIsLoading(false);
    };

    fetchMensagens();
  }, [claimId]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      buyer: 'Comprador',
      seller: 'Vendedor',
      mediator: 'Mediador ML'
    };
    return labels[role] || role;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      buyer: 'default',
      seller: 'secondary',
      mediator: 'destructive'
    };
    return <Badge variant={variants[role] || 'outline'}>{getRoleLabel(role)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (mensagens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma mensagem encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mensagens.map((msg) => (
        <Card key={msg.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRoleBadge(msg.sender_role)}
                <span className="text-sm text-muted-foreground">
                  → {getRoleLabel(msg.receiver_role)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {format(new Date(msg.date_created), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </span>
                {msg.date_read && (
                  <CheckCheck className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                <span>{msg.attachments.length} anexo(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
