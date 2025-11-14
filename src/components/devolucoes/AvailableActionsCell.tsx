/**
 * ⚡ AVAILABLE ACTIONS CELL
 * Exibe as ações disponíveis para o vendedor
 */

import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CheckSquare, AlertTriangle, Calendar } from 'lucide-react';

interface AvailableAction {
  action: string;
  mandatory: boolean;
  due_date: string | null;
}

interface AvailableActionsCellProps {
  actions: AvailableAction[] | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: any }> = {
  return_review_ok: { label: 'Revisar OK', icon: CheckSquare },
  return_review_fail: { label: 'Reportar Falha', icon: AlertTriangle },
  appeal: { label: 'Apelar', icon: AlertTriangle },
  upload_evidence: { label: 'Enviar Evidência', icon: CheckSquare }
};

export function AvailableActionsCell({ actions }: AvailableActionsCellProps) {
  if (!actions || actions.length === 0) {
    return <span className="text-muted-foreground text-sm">Nenhuma ação</span>;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CheckSquare className="h-4 w-4" />
          {actions.length} {actions.length === 1 ? 'Ação' : 'Ações'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Ações Disponíveis</h4>
          <div className="space-y-2">
            {actions.map((action, idx) => {
              const config = ACTION_LABELS[action.action] || { label: action.action, icon: CheckSquare };
              const Icon = config.icon;
              const dueDate = formatDate(action.due_date);

              return (
                <div key={idx} className="flex flex-col gap-1 p-2 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{config.label}</span>
                    {action.mandatory && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatória
                      </Badge>
                    )}
                  </div>
                  {dueDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-6">
                      <Calendar className="h-3 w-3" />
                      Prazo: {dueDate}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
