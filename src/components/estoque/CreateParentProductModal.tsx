import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";

interface CreateParentProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateParentProductModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateParentProductModalProps) {
  const [skuInterno, setSkuInterno] = useState('');
  const [nome, setNome] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createProduct } = useProducts();

  const handleCreateParent = async () => {
    if (!skuInterno.trim() || !nome.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha SKU e Nome do produto pai.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Buscar unidade padrão "un"
      const { data: unidadePadrao } = await supabase
        .from('unidades_medida')
        .select('id')
        .eq('abreviacao', 'un')
        .eq('ativo', true)
        .limit(1)
        .single();

      if (!unidadePadrao) {
        throw new Error('Unidade de medida padrão (un) não encontrada');
      }

      const newProduct = {
        sku_interno: skuInterno.trim().toUpperCase(),
        nome: nome.trim(),
        quantidade_atual: 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        preco_custo: 0,
        preco_venda: 0,
        localizacao: '',
        codigo_barras: '',
        unidade_medida_id: unidadePadrao.id,
        categoria: null,
        descricao: null,
        status: 'ativo',
        ativo: true,
        sku_pai: null,
        url_imagem: null,
        eh_produto_pai: true, // Marca como produto pai/agrupador
      };

      await createProduct(newProduct);
      
      toast({
        title: "Produto pai criado!",
        description: `SKU ${skuInterno.toUpperCase()} criado com sucesso.`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar produto pai:', error);
      toast({
        title: "Erro ao criar produto pai",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSkuInterno('');
    setNome('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Produto Pai
          </DialogTitle>
          <DialogDescription>
            Crie um produto pai independente. Você poderá agrupar produtos filho posteriormente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-sku">SKU Interno *</Label>
            <Input
              id="parent-sku"
              placeholder="Ex: CAMISETA-BASICA"
              value={skuInterno}
              onChange={(e) => setSkuInterno(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateParent();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-name">Nome do Produto *</Label>
            <Input
              id="parent-name"
              placeholder="Ex: Camiseta Básica"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateParent();
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateParent}
              disabled={isCreating}
            >
              {isCreating ? "Criando..." : "Criar Produto Pai"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
