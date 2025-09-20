// F5.3: Diálogos de confirmação para ações destrutivas
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X, CheckCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  onConfirm,
  loading = false
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-primary" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <AlertDialogTitle className="text-left">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={getButtonVariant()}
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Processando...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hooks para facilitar o uso
export function useConfirmationDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'warning' | 'default';
    onConfirm?: () => void;
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
  });

  const showConfirmation = React.useCallback((options: Omit<typeof state, 'open'>) => {
    setState({ ...options, open: true });
  }, []);

  const hideConfirmation = React.useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const confirmAndClose = React.useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm();
    }
    hideConfirmation();
  }, [state.onConfirm, hideConfirmation]);

  const dialog = (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={(open) => !open && hideConfirmation()}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
      onConfirm={confirmAndClose}
      loading={state.loading}
    />
  );

  return {
    showConfirmation,
    hideConfirmation,
    dialog,
  };
}

// Confirmações pré-configuradas
export function useDeleteConfirmation() {
  const { showConfirmation, dialog, hideConfirmation } = useConfirmationDialog();

  const confirmDelete = React.useCallback((
    itemName: string,
    onConfirm: () => void
  ) => {
    showConfirmation({
      title: 'Confirmar exclusão',
      description: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm,
    });
  }, [showConfirmation]);

  return { confirmDelete, dialog, hideConfirmation };
}

export function useBulkActionConfirmation() {
  const { showConfirmation, dialog, hideConfirmation } = useConfirmationDialog();

  const confirmBulkAction = React.useCallback((
    action: string,
    count: number,
    onConfirm: () => void
  ) => {
    showConfirmation({
      title: `Confirmar ${action}`,
      description: `Tem certeza que deseja ${action.toLowerCase()} ${count} item(s) selecionado(s)?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: action.includes('excluir') ? 'destructive' : 'warning',
      onConfirm,
    });
  }, [showConfirmation]);

  return { confirmBulkAction, dialog, hideConfirmation };
}