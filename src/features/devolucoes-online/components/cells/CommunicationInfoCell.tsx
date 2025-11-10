/**
 * 💬 CELL - COMMUNICATION INFO
 * Exibe informações de comunicação e mensagens da devolução
 * ⚡ OTIMIZADO: React.memo + useCallback + useMemo
 */

import { memo, useMemo, useCallback } from 'react';
import { CommunicationInfo } from '../../types/devolucao.types';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunicationInfoCellProps {
  communication?: CommunicationInfo;
}

const CommunicationInfoCellComponent = ({ communication }: CommunicationInfoCellProps) => {
  // 🐛 FIX 7: Verificação mais robusta - pode ser null, undefined ou ter total_messages = 0
  if (!communication || !communication.total_messages || communication.total_messages === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Sem mensagens
      </div>
    );
  }

  // Memoize helper functions
  const getQualityBadge = useCallback((quality?: string | null) => {
    switch (quality) {
      case 'excellent':
        return <Badge variant="default" className="text-xs">Excelente</Badge>;
      case 'good':
        return <Badge variant="secondary" className="text-xs">Boa</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="text-xs">Moderada</Badge>;
      case 'poor':
        return <Badge variant="destructive" className="text-xs">Ruim</Badge>;
      default:
        return null;
    }
  }, []);

  const getModerationIcon = useCallback((status?: string | null) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'moderated':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  }, []);

  const getSenderLabel = useCallback((role: string) => {
    switch (role) {
      case 'buyer':
        return 'Comprador';
      case 'seller':
        return 'Vendedor';
      case 'mediator':
        return 'Mediador ML';
      default:
        return role;
    }
  }, []);

  // Memoize formatted date
  const formattedLastMessageDate = useMemo(() => {
    if (!communication?.last_message_date) return null;
    try {
      return format(new Date(communication.last_message_date), 'dd/MM/yy HH:mm', { locale: ptBR });
    } catch {
      return communication.last_message_date;
    }
  }, [communication?.last_message_date]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {communication.total_messages} msg
            </span>
            {getModerationIcon(communication.moderation_status)}
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            {getQualityBadge(communication.communication_quality)}
          </div>

          {formattedLastMessageDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formattedLastMessageDate}
            </div>
          )}

          {communication.last_message_sender && (
            <div className="text-xs text-muted-foreground">
              Por: {getSenderLabel(communication.last_message_sender)}
            </div>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Comunicação</DialogTitle>
          <DialogDescription>
            {communication.total_messages} mensagens · {communication.total_interactions} interações
            {communication.has_attachments && ' · Contém anexos'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {communication.total_messages}
            </div>
            <div className="text-xs text-muted-foreground">Mensagens</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {communication.total_interactions}
            </div>
            <div className="text-xs text-muted-foreground">Interações</div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-2">
              {getQualityBadge(communication.communication_quality)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Qualidade</div>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* 🐛 FIX 9: Garantir que messages existe antes de mapear */}
            {communication.messages && communication.messages.length > 0 ? (
              communication.messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`p-4 rounded-lg border ${
                    message.sender_role === 'seller'
                      ? 'bg-primary/5 border-primary/20 ml-8'
                      : message.sender_role === 'mediator'
                      ? 'bg-accent border-accent-foreground/20'
                      : 'bg-muted border-border mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getSenderLabel(message.sender_role)}
                      </Badge>
                      {message.status && (
                        <Badge variant="secondary" className="text-xs">
                          {message.status}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {/* 🐛 FIX 10: Try-catch para data também no modal */}
                      {(() => {
                        try {
                          return format(new Date(message.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
                        } catch {
                          return message.date;
                        }
                      })()}
                    </span>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Anexos ({message.attachments.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.attachments.map((att, attIndex) => (
                          <a
                            key={att.id || attIndex}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {att.filename || `Anexo ${attIndex + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma mensagem para exibir
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const CommunicationInfoCell = memo(CommunicationInfoCellComponent);
CommunicationInfoCell.displayName = 'CommunicationInfoCell';
