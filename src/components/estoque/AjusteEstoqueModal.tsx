/**
 * 📝 MODAL DE MOTIVO DE AJUSTE DE ESTOQUE
 * Permite indicar o motivo e observações ao ajustar quantidade de estoque
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// ✅ VALIDAÇÃO com Zod - SEGURANÇA CRÍTICA
const ajusteEstoqueSchema = z.object({
  motivo: z.string().min(1, { message: "Selecione um motivo para o ajuste" }),
  observacoes: z.string()
    .trim()
    .max(5000, { message: "Observações devem ter no máximo 5000 caracteres" })
    // ✅ Remover caracteres potencialmente perigosos
    .transform(str => str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .optional()
});

export interface AjusteEstoqueData {
  motivo: string;
  observacoes: string;
}

interface AjusteEstoqueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoNome: string;
  quantidadeAnterior: number;
  quantidadeNova: number;
  onConfirm: (data: AjusteEstoqueData) => void;
}

const MOTIVOS_AJUSTE = [
  { value: 'ajuste_inventario', label: 'Ajuste de inventário' },
  { value: 'saida_ajuste_variacao', label: 'Saída Ajuste de Variação' },
  { value: 'entrada_ajuste_variacao', label: 'Entrada Ajuste de Variação' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'bonificacao_brinde', label: 'Bonificação/Brinde' },
  { value: 'avaria', label: 'Avaria' },
  { value: 'uso_interno', label: 'Uso Interno' },
  { value: 'doacao', label: 'Doação' },
  { value: 'venda_direta', label: 'Venda Direta' },
  { value: 'roubo_furto', label: 'Roubo/Furto' },
  { value: 'transferencia_estoque', label: 'Transferência entre Estoque' },
];

export function AjusteEstoqueModal({
  open,
  onOpenChange,
  produtoNome,
  quantidadeAnterior,
  quantidadeNova,
  onConfirm
}: AjusteEstoqueModalProps) {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const diferenca = quantidadeNova - quantidadeAnterior;
  const tipoMovimento = diferenca > 0 ? 'entrada' : 'saida';

  const handleConfirm = () => {
    try {
      setIsSaving(true);

      // ✅ Validar input
      const validation = ajusteEstoqueSchema.safeParse({ 
        motivo, 
        observacoes 
      });
      
      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || 'Erro de validação';
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }

      // ✅ Confirmar ajuste com dados validados
      const dadosValidados = validation.data;
      onConfirm({
        motivo: dadosValidados.motivo,
        observacoes: dadosValidados.observacoes || ''
      });
      
      // Resetar campos
      setMotivo('');
      setObservacoes('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao confirmar',
        description: 'Não foi possível confirmar o ajuste',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMotivo('');
    setObservacoes('');
    onOpenChange(false);
  };

  const caracteresRestantes = 5000 - observacoes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Motivo do Ajuste de Estoque</DialogTitle>
          <DialogDescription>
            Produto: <span className="font-semibold">{produtoNome}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do ajuste */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Detalhes do Ajuste</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantidade Anterior:</span>
                <p className="font-semibold">{quantidadeAnterior}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade Nova:</span>
                <p className="font-semibold">{quantidadeNova}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Diferença:</span>
                <p className={`font-semibold ${diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diferenca > 0 ? '+' : ''}{diferenca}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo do ajuste */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Ajuste *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo">
                <SelectValue placeholder="Selecione o motivo do ajuste" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_AJUSTE.map((motivoItem) => (
                  <SelectItem key={motivoItem.value} value={motivoItem.value}>
                    {motivoItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações ou detalhes sobre este ajuste de estoque..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[200px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {observacoes.length > 0 && `${observacoes.length} caracteres`}
              </span>
              <span className={caracteresRestantes < 100 ? 'text-orange-500 font-medium' : ''}>
                {caracteresRestantes} caracteres restantes
              </span>
            </div>
          </div>

          {/* Botões */}
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
              onClick={handleConfirm}
              disabled={isSaving || !motivo}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Confirmando...' : 'Confirmar Ajuste'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
