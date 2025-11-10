import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MandatoryActionCellProps {
  devolucao: DevolucaoAvancada;
}

interface AvailableAction {
  action: string;
  mandatory?: boolean;
  due_date?: string | null;
}

export const MandatoryActionCell: React.FC<MandatoryActionCellProps> = ({ devolucao }) => {
  // Extrair available_actions de múltiplas fontes possíveis
  const availableActions: AvailableAction[] = 
    devolucao.available_actions ||
    (devolucao.dados_claim as any)?.players?.find((p: any) => p.role === 'respondent')?.available_actions ||
    [];

  // Procurar ações obrigatórias de revisão
  const mandatoryActions = availableActions.filter((action: AvailableAction) => 
    action.mandatory && 
    (action.action === 'return_review_ok' || action.action === 'return_review_fail')
  );

  if (!mandatoryActions.length) {
    return (
      <td className="px-3 py-3 text-center">
        <Badge variant="outline" className="bg-muted/50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Sem Ação
        </Badge>
      </td>
    );
  }

  // Pegar primeira ação obrigatória
  const primaryAction = mandatoryActions[0];
  const dueDate = primaryAction.due_date;

  // Verificar urgência
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  const isUrgent = dueDate && !isOverdue && 
    (new Date(dueDate).getTime() - Date.now()) < 48 * 60 * 60 * 1000; // < 48h

  const actionLabel = primaryAction.action === 'return_review_ok' 
    ? 'Aprovar Devolução' 
    : 'Reprovar Devolução';

  return (
    <td className="px-3 py-3 text-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Badge 
                variant={isOverdue ? 'destructive' : isUrgent ? 'default' : 'secondary'}
                className={`font-semibold ${isOverdue ? 'animate-pulse' : ''}`}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Ação Obrigatória
              </Badge>
              {dueDate && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(dueDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold text-sm">{actionLabel}</div>
              {dueDate && (
                <div className="text-xs">
                  <span className="font-medium">Prazo:</span>{' '}
                  {format(new Date(dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
              {isOverdue && (
                <div className="text-xs text-destructive font-medium">
                  ⚠️ Prazo vencido!
                </div>
              )}
              {isUrgent && !isOverdue && (
                <div className="text-xs text-orange-500 font-medium">
                  🔥 Menos de 48 horas restantes
                </div>
              )}
              {mandatoryActions.length > 1 && (
                <div className="text-xs text-muted-foreground">
                  +{mandatoryActions.length - 1} ação(ões) adicional(is)
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
  );
};
