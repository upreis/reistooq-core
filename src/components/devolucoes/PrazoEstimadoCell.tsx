/**
 * ⏰ CÉLULA DE PRAZO ESTIMADO
 * Exibe prazo estimado de entrega com tipo (known/estimated/unknown)
 */

import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrazoEstimadoCellProps {
  estimated_delivery_time: string | null;
  estimated_delivery_time_type?: string | null;
}

export const PrazoEstimadoCell = ({ 
  estimated_delivery_time, 
  estimated_delivery_time_type 
}: PrazoEstimadoCellProps) => {
  if (!estimated_delivery_time) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  try {
    const date = parseISO(estimated_delivery_time);
    const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
    
    const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      known: { label: 'Confirmado', variant: 'default' },
      estimated: { label: 'Estimado', variant: 'secondary' },
      unknown: { label: 'Não definido', variant: 'outline' }
    };
    
    const config = typeConfig[estimated_delivery_time_type || 'estimated'] || typeConfig.estimated;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{formattedDate}</span>
                </div>
                <Badge variant={config.variant} className="text-xs w-fit">
                  {config.label}
                </Badge>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p><strong>Prazo Estimado:</strong> {formattedDate}</p>
              <p><strong>Tipo:</strong> {config.label}</p>
              {estimated_delivery_time_type === 'estimated' && (
                <p className="text-muted-foreground">Prazo calculado, sujeito a mudanças</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } catch (error) {
    return <span className="text-muted-foreground text-sm">Data inválida</span>;
  }
};
