/**
 * 🔔 BADGE DE ALERTAS COMPACTO
 * Mostra resumo dos alertas em formato compacto
 */

import { AlertTriangle, Clock, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DevolucaoAlertsBadgeProps {
  alertsByType: {
    prazo_proximo: number;
    atrasado: number;
    mediador_atribuido: number;
  };
}

export const DevolucaoAlertsBadge = ({ alertsByType }: DevolucaoAlertsBadgeProps) => {
  const total = Object.values(alertsByType).reduce((sum, count) => sum + count, 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {alertsByType.atrasado > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {alertsByType.atrasado}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{alertsByType.atrasado} devolução(ões) atrasada(s)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {alertsByType.prazo_proximo > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                <Clock className="h-3 w-3" />
                {alertsByType.prazo_proximo}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{alertsByType.prazo_proximo} prazo(s) se aproximando</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {alertsByType.mediador_atribuido > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400">
                <Scale className="h-3 w-3" />
                {alertsByType.mediador_atribuido}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{alertsByType.mediador_atribuido} mediação(ões) em andamento</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
