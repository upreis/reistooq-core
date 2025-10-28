import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ReclamacoesMensagensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mensagens: any[];
  claimId: string;
}

// Função auxiliar para formatar data e hora
const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
};

export const ReclamacoesMensagensModal: React.FC<ReclamacoesMensagensModalProps> = ({
  open,
  onOpenChange,
  mensagens,
  claimId
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Mensagens da Reclamação #{claimId}</DialogTitle>
          <DialogDescription>
            {mensagens.length} {mensagens.length === 1 ? 'mensagem' : 'mensagens'} na timeline
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {mensagens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mensagem encontrada
              </div>
            ) : (
              mensagens.map((msg: any, idx: number) => {
                const texto = msg.message || msg.text || msg.content || msg.mensagem || msg.body || msg.conteudo;
                const data = msg.date || msg.created_at || msg.timestamp || msg.message_date?.created;
                
                // Identificar remetente
                const fromUserId = msg.from?.user_id || msg.from;
                const toUserId = msg.to?.user_id || msg.to;
                
                // Determinar se é comprador, vendedor ou mediador
                let remetentePt = 'Desconhecido';
                let badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 'outline';
                let emoji = '⚪';
                
                const role = msg.from?.role || msg.role || msg.sender_role;
                
                if (role === 'seller' || role === 'respondent') {
                  remetentePt = 'Vendedor (Você)';
                  badgeVariant = 'secondary';
                  emoji = '🟢';
                } else if (role === 'buyer' || role === 'complainant') {
                  remetentePt = 'Comprador';
                  badgeVariant = 'default';
                  emoji = '🔵';
                } else if (role === 'mediator') {
                  remetentePt = 'Mediador ML';
                  badgeVariant = 'destructive';
                  emoji = '🟡';
                } else if (msg.message_moderation?.source === 'system') {
                  remetentePt = 'Sistema ML';
                  badgeVariant = 'outline';
                  emoji = '🟡';
                } else {
                  remetentePt = 'Comprador';
                  badgeVariant = 'default';
                  emoji = '🔵';
                }
                
                return (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{emoji}</span>
                        <Badge variant={badgeVariant}>
                          {remetentePt}
                        </Badge>
                      </div>
                      {data && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(data)}
                        </span>
                      )}
                    </div>
                    
                    {texto && typeof texto === 'string' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {texto}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Mensagem sem conteúdo de texto
                      </p>
                    )}
                    
                    {/* Metadata adicional se disponível */}
                    {(msg.message_id || msg.id) && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {msg.message_id || msg.id}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
