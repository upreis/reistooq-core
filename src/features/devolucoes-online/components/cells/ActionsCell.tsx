import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Scale,
  Package,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { AvailableActions } from '@/features/devolucoes-online/types/devolucao.types';
import { toast } from 'sonner';

interface ActionsCellProps {
  returnId: number;
  claimId: number;
  availableActions?: AvailableActions;
  onActionExecuted?: () => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({ 
  returnId, 
  claimId, 
  availableActions,
  onActionExecuted 
}) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const { showConfirmation, dialog } = useConfirmationDialog();

  if (!availableActions) {
    return (
      <td className="px-3 py-3 text-center">
        <Badge variant="secondary" className="text-xs">
          Nenhuma ação disponível
        </Badge>
      </td>
    );
  }

  const handleAction = async (actionType: string, actionName: string) => {
    showConfirmation({
      title: `Confirmar ${actionName}`,
      description: `Tem certeza que deseja executar a ação "${actionName}" para a devolução #${returnId}?`,
      confirmText: 'Executar',
      cancelText: 'Cancelar',
      variant: actionType.includes('fail') || actionType.includes('appeal') ? 'warning' : 'default',
      onConfirm: async () => {
        setLoadingAction(actionType);
        
        try {
          // TODO: Implementar chamada para edge function que executará a ação
          // const { error } = await supabase.functions.invoke('ml-execute-action', {
          //   body: { returnId, claimId, actionType }
          // });
          
          // Simulação temporária
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          toast.success(`Ação "${actionName}" executada com sucesso!`);
          onActionExecuted?.();
        } catch (error) {
          console.error('Erro ao executar ação:', error);
          toast.error(`Erro ao executar ação "${actionName}"`);
        } finally {
          setLoadingAction(null);
        }
      }
    });
  };

  const actions = [
    {
      key: 'review_ok',
      available: availableActions.can_review_ok,
      icon: CheckCircle2,
      label: 'Aprovar Revisão',
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      key: 'review_fail',
      available: availableActions.can_review_fail,
      icon: XCircle,
      label: 'Reprovar Revisão',
      variant: 'destructive' as const,
      className: 'bg-red-600 hover:bg-red-700 text-white'
    },
    {
      key: 'print_label',
      available: availableActions.can_print_label,
      icon: Printer,
      label: 'Imprimir Etiqueta',
      variant: 'outline' as const,
      className: ''
    },
    {
      key: 'appeal',
      available: availableActions.can_appeal,
      icon: Scale,
      label: 'Apelar',
      variant: 'outline' as const,
      className: ''
    },
    {
      key: 'ship',
      available: availableActions.can_ship,
      icon: Package,
      label: 'Enviar',
      variant: 'default' as const,
      className: ''
    },
    {
      key: 'refund',
      available: availableActions.can_refund,
      icon: DollarSign,
      label: 'Reembolsar',
      variant: 'outline' as const,
      className: ''
    }
  ];

  const availableActionsList = actions.filter(action => action.available);

  if (availableActionsList.length === 0) {
    return (
      <td className="px-3 py-3 text-center">
        <Badge variant="secondary" className="text-xs">
          Nenhuma ação disponível
        </Badge>
      </td>
    );
  }

  return (
    <td className="px-3 py-3">
      {dialog}
      <div className="flex flex-col gap-2 min-w-[180px]">
        {availableActionsList.map((action) => {
          const Icon = action.icon;
          const isLoading = loadingAction === action.key;
          
          return (
            <Button
              key={action.key}
              variant={action.variant}
              size="sm"
              className={`w-full justify-start gap-2 ${action.className}`}
              onClick={() => handleAction(action.key, action.label)}
              disabled={isLoading || loadingAction !== null}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </td>
  );
};
