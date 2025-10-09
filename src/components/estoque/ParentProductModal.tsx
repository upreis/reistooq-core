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

interface ParentProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParentCreated: (product: Product) => void;
}

export function ParentProductModal({ open, onOpenChange, onParentCreated }: ParentProductModalProps) {
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
        unidade_medida_id: null,
        categoria: null,
        descricao: null,
        status: 'ativo',
        ativo: true,
        eh_produto_pai: true,
        sku_pai: null,
        url_imagem: null,
      };

      const createdProduct = await createProduct(newProduct);
      
      toast({
        title: "Produto pai criado!",
        description: `SKU ${createdProduct.sku_interno} criado. Complete os dados do produto.`,
      });

      handleClose();
      onParentCreated(createdProduct);
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
            Passo 1: Informe o SKU e nome do produto pai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-sku">SKU Interno *</Label>
            <Input
              id="parent-sku"
              placeholder="Ex: FL-12345"
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
              placeholder="Ex: CAMISETA"
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
              {isCreating ? "Criando..." : "Criar e Continuar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
