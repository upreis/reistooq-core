/**
 * 🚚 VENDAS SHIPPING DIALOG
 * Dialog para atualizar status de envio
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VendasShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shippingId: string;
  integrationAccountId: string;
  currentStatus?: string;
  onSuccess?: () => void;
}

const SHIPPING_STATUSES = [
  { value: 'pending', label: 'Pendente' },
  { value: 'ready_to_ship', label: 'Pronto para Envio' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'not_delivered', label: 'Não Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
];

export const VendasShippingDialog = ({
  open,
  onOpenChange,
  shippingId,
  integrationAccountId,
  currentStatus,
  onSuccess
}: VendasShippingDialogProps) => {
  const [newStatus, setNewStatus] = useState(currentStatus || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newStatus) {
      toast.error('Selecione um status');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('ml-vendas-unified', {
        body: {
          action: 'update_shipping',
          params: {
            shippingId,
            integrationAccountId,
            newStatus
          }
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar envio');
      }

      toast.success('Status de envio atualizado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao atualizar envio:', error);
      toast.error(error.message || 'Erro ao atualizar envio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Status de Envio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>ID do Envio</Label>
            <p className="text-sm font-mono bg-muted p-2 rounded">{shippingId}</p>
          </div>

          {currentStatus && (
            <div className="space-y-2">
              <Label>Status Atual</Label>
              <p className="text-sm p-2 rounded bg-muted/50">
                {SHIPPING_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Novo Status</Label>
            <Select
              value={newStatus}
              onValueChange={setNewStatus}
              disabled={isSubmitting}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newStatus}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atualizar Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
