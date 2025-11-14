/**
 * 💵 DATA REEMBOLSO CELL
 * Exibe data estimada ou real de reembolso
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Calendar } from 'lucide-react';

interface DataReembolsoCellProps {
  data: string | null;
  isEstimated?: boolean;
}

export function DataReembolsoCell({ data, isEstimated = false }: DataReembolsoCellProps) {
  if (!data) {
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

  const date = new Date(data);
  const now = new Date();
  const isPast = date < now;
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const daysText = isPast
    ? `Há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`
    : diff === 0
    ? 'Hoje'
    : diff === 1
    ? 'Amanhã'
    : `Em ${diff} dia${diff !== 1 ? 's' : ''}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium">{formatDate(data)}</span>
            </div>
            <div className="flex items-center gap-1">
              {isEstimated && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Estimativa
                </Badge>
              )}
              {!isEstimated && isPast && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Processado
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {daysText}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">
            {isEstimated ? 'Data Estimada de Reembolso' : 'Data de Reembolso'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEstimated 
              ? 'Previsão baseada no prazo de análise + 7 dias úteis'
              : 'Data real do processamento do reembolso'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
