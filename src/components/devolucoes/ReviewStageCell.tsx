/**
 * 🔄 REVIEW STAGE CELL
 * Exibe o stage da review com badge colorido
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react';

interface ReviewStageCellProps {
  stage: string | null;
  status: string | null;
}

const STAGE_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; tooltip: string }> = {
  closed: {
    label: 'Finalizada',
    variant: 'default',
    icon: CheckCircle,
    tooltip: 'A revisão foi finalizada'
  },
  pending: {
    label: 'Pendente',
    variant: 'outline',
    icon: Clock,
    tooltip: 'Revisão de devolução falhada pendente'
  },
  seller_review_pending: {
    label: 'Aguardando Vendedor',
    variant: 'secondary',
    icon: AlertCircle,
    tooltip: 'Revisão de triage que pode ter apelação do vendedor'
  },
  timeout: {
    label: 'Expirada',
    variant: 'destructive',
    icon: Timer,
    tooltip: 'Tempo para análise do produto expirou'
  }
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Produto OK',
  failed: 'Com Problema',
};

export function ReviewStageCell({ stage, status }: ReviewStageCellProps) {
  if (!stage) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.pending;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1">
            <Badge variant={config.variant} className="gap-1 justify-start">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {status && (
              <span className="text-xs text-muted-foreground">
                {STATUS_LABELS[status] || status}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
