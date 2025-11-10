/**
 * 🎬 ACTIONS CELL
 * Exibe ações disponíveis para devolução
 * ⚡ OTIMIZADO: React.memo + useCallback + useMemo
 */

import { memo, useState, useCallback, useMemo } from 'react';
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
import type { AvailableActions, ReviewReason } from '@/features/devolucoes-online/types/devolucao.types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoStore } from '@/features/devolucoes-online/store/useDevolucaoStore';
import { ReviewRejectModal } from '../ReviewRejectModal';

interface ActionsCellProps {
  returnId: number;
  claimId: number;
  availableActions?: AvailableActions;
  availableReasons?: ReviewReason[];
  onActionExecuted?: () => void;
}

const ActionsCellComponent: React.FC<ActionsCellProps> = ({
  returnId, 
  claimId, 
  availableActions,
  availableReasons,
  onActionExecuted 
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const { showConfirmation, dialog } = useConfirmationDialog();
  const { filters } = useDevolucaoStore();

  // Memoize executeAction to prevent recreation
  const executeAction = useCallback(async (actionType: string, actionName: string, actionData?: any) => {
    setLoadingAction(actionType);
    
    try {
      console.log(`🎬 Executando ação ${actionType} para return ${returnId}, claim ${claimId}`);
      
      // Chamar edge function real
      const { data, error } = await supabase.functions.invoke('ml-execute-action', {
        body: { 
          returnId, 
          claimId, 
          actionType,
          actionData,
          integrationAccountId: filters.integrationAccountId 
        }
      });
      
      if (error) {
        console.error('Erro ao executar ação:', error);
        toast.error(`Erro ao executar ação "${actionName}": ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Ação falhou:', data.error);
        toast.error(`Erro: ${data.error}`);
        return;
      }

      console.log(`✅ Ação executada com sucesso:`, data);
      
      // Para print_label, abrir em nova aba
      if (actionType === 'print_label' && data.data?.label_url) {
        window.open(data.data.label_url, '_blank');
        toast.success('Etiqueta aberta em nova aba!');
      } else {
        toast.success(`Ação "${actionName}" executada com sucesso!`);
      }
      
      onActionExecuted?.();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      toast.error(`Erro ao executar ação "${actionName}"`);
    } finally {
      setLoadingAction(null);
    }
  }, [returnId, claimId, filters.integrationAccountId, onActionExecuted]);

  const handleAction = useCallback(async (actionType: string, actionName: string) => {
    // Se for reprovação, mostrar modal
    if (actionType === 'review_fail') {
      setShowRejectModal(true);
      return;
    }

    // Para outras ações, mostrar confirmação padrão
    showConfirmation({
      title: `Confirmar ${actionName}`,
      description: `Tem certeza que deseja executar a ação "${actionName}" para a devolução #${returnId}?`,
      confirmText: 'Executar',
      cancelText: 'Cancelar',
      variant: actionType.includes('appeal') ? 'warning' : 'default',
      onConfirm: () => executeAction(actionType, actionName)
    });
  }, [returnId, executeAction, showConfirmation]);

  const handleRejectConfirm = useCallback(async (reasonId: string, message: string) => {
    await executeAction('review_fail', 'Reprovar Revisão', { reasonId, message });
  }, [executeAction]);

  // Memoize actions configuration
  const actions = useMemo(() => {
    // ✅ FIX: Verificar se availableActions existe antes de acessar propriedades
    if (!availableActions) {
      return [];
    }
    
    return [
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
  }, [availableActions]);

  const availableActionsList = useMemo(
    () => actions.filter(action => action.available),
    [actions]
  );

  if (!availableActions) {
    return (
      <td className="px-3 py-3 text-center">
        <Badge variant="secondary" className="text-xs">
          Nenhuma ação disponível
        </Badge>
      </td>
    );
  }

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
      <ReviewRejectModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        onConfirm={handleRejectConfirm}
        returnId={returnId}
        availableReasons={availableReasons}
      />
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

export const ActionsCell = memo(ActionsCellComponent);
ActionsCell.displayName = 'ActionsCell';
