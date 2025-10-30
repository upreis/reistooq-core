/**
 * 🗑️ DIÁLOGO - CONFIRMAÇÃO DE EXCLUSÃO
 * Confirmar exclusão de insumo
 */

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
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';

interface InsumoDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  insumo: ComposicaoInsumoEnriquecida | null;
}

export function InsumoDeleteDialog({ open, onClose, onConfirm, insumo }: InsumoDeleteDialogProps) {
  if (!insumo) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Você tem certeza que deseja excluir este insumo?</p>
              
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Produto:</strong>
                    <div className="font-mono text-xs">{insumo.sku_produto}</div>
                    <div className="text-muted-foreground">{insumo.nome_produto}</div>
                  </div>
                  <div>
                    <strong>Insumo:</strong>
                    <div className="font-mono text-xs">{insumo.sku_insumo}</div>
                    <div className="text-muted-foreground">{insumo.nome_insumo}</div>
                  </div>
                </div>
              </div>

              <p className="text-destructive text-sm">
                ⚠️ Esta ação não pode ser desfeita.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
