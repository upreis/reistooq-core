/**
 * 🏷️ BADGE DE CICLO DE VIDA DA RECLAMAÇÃO
 * Mostra visualmente o status de idade e proximidade de exclusão
 */

import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Trash2, Shield } from 'lucide-react';
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
  const lifecycle = reclamacao._lifecycleStatus;
  
  // Se não tiver status pré-calculado, não renderizar
  if (!lifecycle) return null;
  
  // Não mostrar badge para reclamações normais/novas sem avisos
  if (lifecycle.statusCiclo === 'normal' || lifecycle.statusCiclo === 'nova') {
    return null;
  }
  
  const getIcon = () => {
    if (!lifecycle.podeSerExcluida) return <Shield className="h-3 w-3" />;
    if (lifecycle.seraExcluida) return <Trash2 className="h-3 w-3" />;
    if (lifecycle.statusCiclo === 'critica') return <AlertTriangle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };
  
  const getBadgeText = () => {
    if (compact) {
      return `${lifecycle.diasDesdeAbertura}d`;
    }
    
    if (lifecycle.seraExcluida) {
      return lifecycle.podeSerExcluida ? 'Será excluída' : 'Protegida';
    }
    
    if (lifecycle.diasRestantes !== null) {
      return `${lifecycle.diasRestantes} dias`;
    }
    
    return `${lifecycle.diasDesdeAbertura} dias`;
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className={cn(
              "gap-1 font-medium text-white border-0",
              lifecycle.corBadge,
              className
            )}
          >
            {getIcon()}
            {getBadgeText()}
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
