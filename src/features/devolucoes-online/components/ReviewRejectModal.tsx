/**
 * 🎯 MODAL - REPROVAR REVISÃO
 * Modal para escolher razão e mensagem ao reprovar review
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ReviewReason } from '../types/devolucao.types';

interface ReviewRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasonId: string, message: string) => Promise<void>;
  returnId: number;
  availableReasons?: ReviewReason[];
}

export const ReviewRejectModal: React.FC<ReviewRejectModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  returnId,
  availableReasons = []
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Razões padrão do ML caso não tenha carregado da API
  const defaultReasons: ReviewReason[] = [
    { id: 'SRF2', name: 'Produto danificado ou com defeito', detail: 'O produto retornado está danificado ou apresenta defeitos' },
    { id: 'SRF3', name: 'Produto diferente do anunciado', detail: 'O produto não corresponde ao que foi anunciado' },
    { id: 'SRF4', name: 'Produto incompleto ou faltando partes', detail: 'O produto está incompleto ou faltam componentes' },
    { id: 'SRF5', name: 'Produto usado ou reembalado', detail: 'O produto mostra sinais de uso ou foi reembalado' },
    { id: 'SRF6', name: 'Embalagem danificada', detail: 'A embalagem original está danificada' },
    { id: 'SRF7', name: 'Outro motivo', detail: 'Motivo não listado acima' }
  ];

  const reasons = availableReasons.length > 0 ? availableReasons : defaultReasons;

  const handleSubmit = async () => {
    if (!selectedReason || !message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason, message);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Reprovar Revisão
          </DialogTitle>
          <DialogDescription>
            Devolução #{returnId} - Informe o motivo da reprovação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select de razão */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Reprovação *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{reason.name}</span>
                      <span className="text-xs text-muted-foreground">{reason.detail}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Textarea de mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Observações *</Label>
            <Textarea
              id="message"
              placeholder="Descreva os detalhes da reprovação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} / 500 caracteres
            </p>
          </div>

          {/* Informação */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              Esta ação informará ao Mercado Livre que a revisão foi reprovada. 
              O comprador será notificado sobre o motivo.
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason || !message.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Reprovar Revisão'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
