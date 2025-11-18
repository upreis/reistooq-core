/**
 * 🏷️ BADGE DE URGÊNCIA DO CICLO DE VIDA
 * Substituição VISUAL do sistema de cores de linhas
 */

import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Trash2, Shield, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReclamacaoLifecycleBadgeProps {
  reclamacao: any;
  compact?: boolean;
  className?: string;
}

export function ReclamacaoLifecycleBadge({ 
  reclamacao, 
  compact = false,
  className 
}: ReclamacaoLifecycleBadgeProps) {
  // ⚡ USAR STATUS PRÉ-CALCULADO (_lifecycleStatus)
  const lifecycle = reclamacao._lifecycleStatus || reclamacao.lifecycle_status;
  
  if (!lifecycle) return null;
  
  // Se status normal ou novo, não mostrar badge (evitar poluição visual)
  if (lifecycle.statusCiclo === 'normal' || lifecycle.statusCiclo === 'nova') {
    return null;
  }

  // 🎨 BADGES DE URGÊNCIA VISUAL (substituindo cores de linhas)
  const getBadgeConfig = () => {
    switch (lifecycle.statusCiclo) {
      case 'critica':
        return {
          icon: lifecycle.seraExcluida ? Trash2 : Shield,
          label: lifecycle.seraExcluida ? 'EXCLUSÃO IMINENTE' : 'PROTEGIDA',
          variant: 'outline' as const,
          className: lifecycle.seraExcluida 
            ? 'bg-red-600 text-white border-red-700 font-bold animate-pulse' 
            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
        };
      case 'urgente':
        return {
          icon: Flame,
          label: `URGENTE - ${lifecycle.diasRestantes}d`,
          variant: 'outline' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900/30 dark:text-orange-300 font-semibold'
        };
      case 'atencao':
        return {
          icon: Clock,
          label: `ATENÇÃO - ${lifecycle.diasRestantes}d`,
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={cn("gap-1.5 px-3 py-1", config.className, className)}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span className="text-xs font-semibold">{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              {lifecycle.diasDesdeAbertura} dias desde abertura
            </p>
            {lifecycle.mensagemAviso && (
              <p className="text-sm">{lifecycle.mensagemAviso}</p>
            )}
            {!lifecycle.podeSerExcluida && (
              <p className="text-xs text-muted-foreground mt-2">
                Esta reclamação está protegida contra exclusão automática
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
