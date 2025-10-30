/**
 * 📝 MODAL DE OBSERVAÇÕES DA MOVIMENTAÇÃO DE ESTOQUE
 * Permite adicionar notas e observações sobre movimentações de estoque
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ✅ VALIDAÇÃO com Zod - SEGURANÇA CRÍTICA
const observacaoSchema = z.object({
  texto: z.string()
    .trim()
    .max(5000, { message: "Observação deve ter no máximo 5000 caracteres" })
    // ✅ Remover caracteres potencialmente perigosos
    .transform(str => str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .optional()
});

interface MovimentacaoObservacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoId: string;
  skuProduto: string;
  nomeProduto: string;
  observacaoAtual?: string;
  onSave: () => void;
}

export function MovimentacaoObservacoesModal({
  open,
  onOpenChange,
  movimentacaoId,
  skuProduto,
  nomeProduto,
  observacaoAtual = '',
  onSave
}: MovimentacaoObservacoesModalProps) {
  const { toast } = useToast();
  const [observacao, setObservacao] = useState(observacaoAtual);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setObservacao(observacaoAtual);
    }
  }, [open, observacaoAtual]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // ✅ Validar input
      const validation = observacaoSchema.safeParse({ texto: observacao });
      
      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || 'Erro de validação';
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }

      // ✅ Salvar observação já validada e sanitizada
      const textoValidado = validation.data?.texto || '';
      
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .update({ observacoes: textoValidado })
        .eq('id', movimentacaoId);

      if (error) throw error;
      
      toast({
        title: 'Observação salva',
        description: 'Suas observações foram salvas com sucesso'
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a observação',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setObservacao(observacaoAtual);
    onOpenChange(false);
  };

  const caracteresRestantes = 5000 - observacao.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Observações da Movimentação</DialogTitle>
          <DialogDescription>
            SKU: <span className="font-mono font-semibold">{skuProduto}</span>
            {' • '}
            Produto: <span className="font-semibold">{nomeProduto}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="observacao">Suas observações</Label>
            <Textarea
              id="observacao"
              placeholder="Adicione observações, análises ou informações importantes sobre esta movimentação de estoque..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="min-h-[300px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {observacao.length > 0 && `${observacao.length} caracteres`}
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
              {isSaving ? 'Salvando...' : 'Salvar Observações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
