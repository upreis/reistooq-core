/**
 * 📝 MODAL DE ANOTAÇÕES - DEVOLUÇÕES
 * Permite adicionar/editar anotações em devoluções com validação e sanitização
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import DOMPurify from 'dompurify';

const anotacaoSchema = z.object({
  anotacao: z.string()
    .max(5000, 'Anotação não pode ter mais de 5000 caracteres')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))
});

interface Devolucao2025AnotacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentAnotacao?: string;
  onSave: (orderId: string, anotacao: string) => void;
}

export function Devolucao2025AnotacoesModal({
  open,
  onOpenChange,
  orderId,
  currentAnotacao = '',
  onSave
}: Devolucao2025AnotacoesModalProps) {
  const [anotacao, setAnotacao] = useState(currentAnotacao);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAnotacao(currentAnotacao);
    }
  }, [open, currentAnotacao]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validação
      const validatedData = anotacaoSchema.parse({ anotacao });

      // Salvar anotação
      onSave(orderId, validatedData.anotacao);

      toast.success('Anotação salva com sucesso!');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error('Erro ao salvar anotação');
        console.error('Erro ao salvar anotação:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>📝 Anotações da Devolução</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">Pedido #{orderId}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anotacao">Anotação</Label>
            <Textarea
              id="anotacao"
              placeholder="Digite suas observações sobre esta devolução..."
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              className="min-h-[200px]"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">
              {anotacao.length}/5000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Anotação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
