/**
 * 📜 CÉLULA DE HISTÓRICO DE STATUS
 * Exibe histórico de mudanças de status do shipment
 */

import { Badge } from '@/components/ui/badge';
import { History, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoricoStatusCellProps {
  status_history: any[] | null;
}

export const HistoricoStatusCell = ({ status_history }: HistoricoStatusCellProps) => {
  if (!status_history || status_history.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const latestStatus = status_history[status_history.length - 1];
  const totalChanges = status_history.length;

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <History className="h-3 w-3 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-xs">
                {latestStatus?.status || 'Status desconhecido'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {totalChanges} {totalChanges === 1 ? 'mudança' : 'mudanças'}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="text-xs space-y-2">
            <p className="font-semibold">Histórico de Status ({totalChanges} eventos)</p>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {status_history.slice().reverse().map((entry, index) => (
                  <div key={index} className="border-l-2 border-primary/30 pl-2 py-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">{entry.status}</span>
                    </div>
                    {entry.date_created && (
                      <p className="text-muted-foreground text-xs">
                        {formatDate(entry.date_created)}
                      </p>
                    )}
                    {entry.substatus && (
                      <p className="text-xs">Substatus: {entry.substatus}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
