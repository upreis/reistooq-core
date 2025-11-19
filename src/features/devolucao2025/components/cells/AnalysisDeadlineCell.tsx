/**
 * 📅 CÉLULA PRAZO DE ANÁLISE
 * Calcula e exibe o prazo de 3 dias úteis após chegada do produto
 */

import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateAnalysisDeadline } from '../../utils/businessDays';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';

interface AnalysisDeadlineCellProps {
  arrivalDate: string | null;
}

export const AnalysisDeadlineCell = memo(function AnalysisDeadlineCell({ arrivalDate }: AnalysisDeadlineCellProps) {
  if (!arrivalDate) {
    return (
      <span className="text-muted-foreground text-sm">
        Aguardando chegada
      </span>
    );
  }

  const deadline = calculateAnalysisDeadline(arrivalDate);
  
  if (!deadline) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const now = new Date();
  const isOverdue = isPast(deadline);
  const daysRemaining = differenceInDays(deadline, now);

  const getVariant = () => {
    if (isOverdue) return 'destructive';
    if (daysRemaining <= 1) return 'default';
    return 'outline';
  };

  const getIcon = () => {
    if (isOverdue) return <AlertTriangle className="h-3 w-3" />;
    if (daysRemaining <= 1) return <Clock className="h-3 w-3" />;
    return <Calendar className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (isOverdue) return `ATRASADO ${Math.abs(daysRemaining)}d`;
    if (daysRemaining === 0) return 'HOJE';
    if (daysRemaining === 1) return 'AMANHÃ';
    return `${daysRemaining}d restantes`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {format(deadline, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            <Badge variant={getVariant()} className="gap-1 text-xs w-fit">
              {getIcon()}
              {getStatusText()}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Prazo de Análise</p>
            <p className="text-xs">
              Chegada: {format(new Date(arrivalDate), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-xs">
              Prazo: {format(deadline, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
              3 dias úteis após chegada do produto
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

AnalysisDeadlineCell.displayName = 'AnalysisDeadlineCell';
