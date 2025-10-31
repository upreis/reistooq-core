import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { Package } from 'lucide-react';

interface CadastroInsumoRapidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  skuInsumo: string;
  onSuccess?: () => void;
}

export function CadastroInsumoRapidoModal({ 
  isOpen, 
  onClose, 
  skuInsumo,
  onSuccess 
}: CadastroInsumoRapidoModalProps) {
  const [quantidade, setQuantidade] = useState('0');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToastFeedback();

  const handleCadastrar = async () => {
    if (!descricao.trim()) {
      showError('Por favor, preencha a descrição do insumo');
      return;
    }

    setLoading(true);
    try {
      // Cadastrar o insumo na tabela produtos
      const { error } = await supabase
        .from('produtos')
        .insert({
          descricao: descricao.trim(),
          quantidade_estoque: parseFloat(quantidade) || 0,
          ativo: true
        } as any);

      if (error) {
        console.error('Erro ao cadastrar insumo:', error);
        showError('Erro ao cadastrar insumo: ' + error.message);
        return;
      }

      showSuccess(`Insumo ${skuInsumo} cadastrado com sucesso!`);
      onSuccess?.();
      onClose();
      
      // Limpar campos
      setQuantidade('0');
      setDescricao('');
    } catch (error) {
      console.error('Erro inesperado:', error);
      showError('Erro ao cadastrar insumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <DialogTitle>Cadastro Rápido de Insumo</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre o insumo <strong>{skuInsumo}</strong> para continuar com a baixa de estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU do Insumo</Label>
            <Input 
              id="sku" 
              value={skuInsumo} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input 
              id="descricao" 
              placeholder="Ex: Tecido Oxford 10x15 Branco"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade Inicial</Label>
            <Input 
              id="quantidade" 
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe 0 se não souber a quantidade atual
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCadastrar}
            disabled={loading || !descricao.trim()}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Insumo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
