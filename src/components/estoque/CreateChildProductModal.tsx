import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";

interface VariationForm {
  suffix: string;
  quantity: number;
  barcode: string;
}

interface CreateChildProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateChildProductModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateChildProductModalProps) {
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [variations, setVariations] = useState<VariationForm[]>([
    { suffix: '', quantity: 0, barcode: '' }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { getProducts, createProduct } = useProducts();

  useEffect(() => {
    if (open) {
      loadParentProducts();
    }
  }, [open]);

  const loadParentProducts = async () => {
    try {
      const allProducts = await getProducts({ limit: 10000 });
      // Filtrar apenas produtos que não têm sku_pai (são produtos pai)
      const parents = allProducts.filter(p => !p.sku_pai && p.ativo);
      setParentProducts(parents);
    } catch (error) {
      console.error('Erro ao carregar produtos pai:', error);
    }
  };

  const handleAddVariation = () => {
    setVariations([...variations, { suffix: '', quantity: 0, barcode: '' }]);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleVariationChange = (index: number, field: keyof VariationForm, value: string | number) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const handleCreateVariations = async () => {
    if (!selectedParentId) {
      toast({
        title: "Produto pai não selecionado",
        description: "Por favor, selecione um produto pai.",
        variant: "destructive",
      });
      return;
    }

    const invalidVariations = variations.filter(v => !v.suffix.trim());
    if (invalidVariations.length > 0) {
      toast({
        title: "Variações incompletas",
        description: "Todas as variações precisam ter um sufixo.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const parentProduct = parentProducts.find(p => p.id === selectedParentId);
      if (!parentProduct) throw new Error('Produto pai não encontrado');

      // Criar todas as variações
      for (const variation of variations) {
        const childSku = `${parentProduct.sku_interno}-${variation.suffix.trim().toUpperCase()}`;
        
        await createProduct({
          sku_interno: childSku,
          nome: `${parentProduct.nome} - ${variation.suffix}`,
          quantidade_atual: variation.quantity || 0,
          estoque_minimo: parentProduct.estoque_minimo || 0,
          estoque_maximo: parentProduct.estoque_maximo || 0,
          preco_custo: parentProduct.preco_custo || 0,
          preco_venda: parentProduct.preco_venda || 0,
          localizacao: parentProduct.localizacao || '',
          codigo_barras: variation.barcode || '',
          unidade_medida_id: parentProduct.unidade_medida_id,
          categoria: parentProduct.categoria,
          descricao: parentProduct.descricao,
          status: 'ativo',
          ativo: true,
          sku_pai: parentProduct.sku_interno,
          url_imagem: null,
        });
      }

      toast({
        title: "Variações criadas!",
        description: `${variations.length} variação(ões) criada(s) com sucesso.`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar variações:', error);
      toast({
        title: "Erro ao criar variações",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedParentId('');
    setVariations([{ suffix: '', quantity: 0, barcode: '' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Variações (Produtos Filho)
          </DialogTitle>
          <DialogDescription>
            Adicione variações a um produto pai existente (ex: tamanhos, cores)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do Produto Pai */}
          <div className="space-y-2">
            <Label htmlFor="parent-product">Produto Pai *</Label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto pai..." />
              </SelectTrigger>
              <SelectContent>
                {parentProducts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum produto pai disponível
                  </div>
                )}
                {parentProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku_interno} - {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Variações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variações</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Variação
              </Button>
            </div>

            {variations.map((variation, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`suffix-${index}`}>Sufixo *</Label>
                  <Input
                    id={`suffix-${index}`}
                    placeholder="Ex: P, M, G ou AZUL, VERMELHO"
                    value={variation.suffix}
                    onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Qtd Inicial</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={variation.quantity || ''}
                    onChange={(e) => handleVariationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`barcode-${index}`}>Código de Barras</Label>
                  <Input
                    id={`barcode-${index}`}
                    placeholder="Opcional"
                    value={variation.barcode}
                    onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)}
                  />
                </div>
                {variations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVariation(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVariations}
              disabled={isCreating || !selectedParentId}
            >
              {isCreating ? "Criando..." : `Criar ${variations.length} Variação(ões)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
