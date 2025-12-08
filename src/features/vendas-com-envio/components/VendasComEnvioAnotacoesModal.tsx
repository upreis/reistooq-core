/**
 * 📝 MODAL DE ANOTAÇÕES - VENDAS COM ENVIO
 * Permite adicionar notas e observações sobre pedidos
 * Baseado no ReclamacoesAnotacoesModal
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// ✅ VALIDAÇÃO com Zod - SEGURANÇA CRÍTICA
const anotacaoSchema = z.object({
  texto: z.string()
    .trim()
    .max(5000, { message: "Anotação deve ter no máximo 5000 caracteres" })
    // ✅ Remover caracteres potencialmente perigosos
    .transform(str => str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .optional()
});

interface VendasComEnvioAnotacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  anotacaoAtual?: string;
  onSave: (orderId: string, anotacao: string) => void;
}

export function VendasComEnvioAnotacoesModal({
  open,
  onOpenChange,
  orderId,
  anotacaoAtual = '',
  onSave
}: VendasComEnvioAnotacoesModalProps) {
  const { toast } = useToast();
  const [anotacao, setAnotacao] = useState(anotacaoAtual);
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar anotação quando modal abre com novo valor
  useEffect(() => {
    if (open) {
      setAnotacao(anotacaoAtual);
    }
  }, [open, anotacaoAtual]);

  const handleSave = () => {
    try {
      setIsSaving(true);

      // ✅ Validar input
      const validation = anotacaoSchema.safeParse({ texto: anotacao });
      
      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || 'Erro de validação';
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }

      // ✅ Salvar anotação já validada e sanitizada
      const textoValidado = validation.data?.texto || '';
      onSave(orderId, textoValidado);
      
      toast({
        title: 'Anotação salva',
        description: 'Suas anotações foram salvas com sucesso'
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a anotação',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAnotacao(anotacaoAtual);
    onOpenChange(false);
  };

  const caracteresRestantes = 5000 - anotacao.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Anotações do Pedido</DialogTitle>
          <DialogDescription>
            Pedido: <span className="font-mono font-semibold">{orderId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anotacao">Suas anotações</Label>
            <Textarea
              id="anotacao"
              placeholder="Adicione observações, análises ou informações importantes sobre este pedido..."
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              className="min-h-[300px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {anotacao.length > 0 && `${anotacao.length} caracteres`}
              </span>
              <span className={caracteresRestantes < 100 ? 'text-orange-500 font-medium' : ''}>
                {caracteresRestantes} caracteres restantes
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Anotações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
