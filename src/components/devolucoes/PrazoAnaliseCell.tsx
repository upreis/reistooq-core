/**
 * ⏰ PRAZO ANÁLISE CELL
 * Exibe prazo limite para análise com urgência visual
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertTriangle } from 'lucide-react';

interface PrazoAnaliseCellProps {
  prazo: string | null;
}

export function PrazoAnaliseCell({ prazo }: PrazoAnaliseCellProps) {
  if (!prazo) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const date = new Date(prazo);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isExpired = diff < 0;
  const isUrgent = diff >= 0 && diff <= 2;
  const isNear = diff > 2 && diff <= 5;

  const variant = isExpired ? "destructive" : isUrgent ? "destructive" : isNear ? "secondary" : "outline";
  const Icon = (isExpired || isUrgent) ? AlertTriangle : Clock;

  const daysText = isExpired 
    ? `Expirado há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`
    : diff === 0
    ? 'Vence hoje'
    : diff === 1
    ? 'Vence amanhã'
    : `${diff} dia${diff !== 1 ? 's' : ''} restante${diff !== 1 ? 's' : ''}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1">
            <Badge variant={variant} className="gap-1.5 justify-start">
              <Icon className="h-3 w-3" />
              {formatDate(prazo)}
            </Badge>
            <span className={`text-xs ${isExpired || isUrgent ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {daysText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">Prazo para Análise</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isExpired 
              ? 'Prazo vencido! Ação urgente necessária.'
              : isUrgent
              ? 'Prazo crítico! Analisar imediatamente.'
              : 'Prazo para revisão e aprovação do produto.'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
