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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";

interface ProductVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface VariantInput {
  suffix: string;
  quantity: number;
}

export function ProductVariantModal({ open, onOpenChange, onSuccess }: ProductVariantModalProps) {
  const [step, setStep] = useState<'parent' | 'variants'>('parent');
  const [parentProduct, setParentProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<VariantInput[]>([{ suffix: '', quantity: 0 }]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createProduct } = useProducts();

  const handleAddVariant = () => {
    setVariants([...variants, { suffix: '', quantity: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleParentCreated = (product: Product) => {
    setParentProduct(product);
    setStep('variants');
    toast({
      title: "Produto pai criado!",
      description: `SKU ${product.sku_interno} criado. Agora adicione as variações.`,
    });
  };

  const handleCreateVariants = async () => {
    if (!parentProduct) return;

    setIsCreating(true);
    try {
      const validVariants = variants.filter(v => v.suffix.trim() !== '');
      
      if (validVariants.length === 0) {
        toast({
          title: "Nenhuma variação válida",
          description: "Adicione pelo menos uma variação com sufixo.",
          variant: "destructive",
        });
        return;
      }

      for (const variant of validVariants) {
        const variantSku = `${parentProduct.sku_interno}-${variant.suffix}`;
        
        await createProduct({
          ...parentProduct,
          id: undefined as any, // New ID will be generated
          sku_interno: variantSku,
          nome: `${parentProduct.nome} - ${variant.suffix}`,
          quantidade_atual: variant.quantity,
          sku_pai: parentProduct.sku_interno,
          created_at: undefined as any,
          updated_at: undefined as any,
        });
      }

      toast({
        title: "Variações criadas!",
        description: `${validVariants.length} variações criadas com sucesso.`,
      });

      onSuccess();
      handleClose();
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
    setStep('parent');
    setParentProduct(null);
    setVariants([{ suffix: '', quantity: 0 }]);
    onOpenChange(false);
  };

  const handleSkipVariants = () => {
    toast({
      title: "Produto criado!",
      description: "Produto pai criado sem variações.",
    });
    onSuccess();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Adicionar Produto com Variações
          </DialogTitle>
          <DialogDescription>
            {step === 'parent' 
              ? "Passo 1: Crie o produto pai (SKU principal)"
              : "Passo 2: Adicione as variações do produto pai"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent" disabled={step === 'variants'}>
              1. Produto Pai
            </TabsTrigger>
            <TabsTrigger value="variants" disabled={!parentProduct}>
              2. Variações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parent" className="space-y-4">
            {parentProduct ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Produto Pai Criado:</p>
                    <p className="text-lg font-bold">{parentProduct.sku_interno}</p>
                    <p className="text-sm text-muted-foreground">{parentProduct.nome}</p>
                  </div>
                  <Badge variant="default">Criado</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Use o botão "+ Novo Produto" para criar o produto pai primeiro.
                </p>
                <p className="text-sm text-muted-foreground">
                  Após criar o produto pai, você poderá adicionar variações.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {parentProduct && (
              <>
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1">Produto Pai:</p>
                  <p className="text-lg font-bold">{parentProduct.sku_interno} - {parentProduct.nome}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Variações</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Variação
                    </Button>
                  </div>

                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`suffix-${index}`}>Sufixo da Variação</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {parentProduct.sku_interno}-
                          </span>
                          <Input
                            id={`suffix-${index}`}
                            placeholder="AZUL-P, VERM-M, etc."
                            value={variant.suffix}
                            onChange={(e) => handleVariantChange(index, 'suffix', e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>

                      <div className="w-32 space-y-2">
                        <Label htmlFor={`quantity-${index}`}>Qtd Inicial</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="0"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipVariants}
                  >
                    Pular Variações
                  </Button>
                  <Button
                    onClick={handleCreateVariants}
                    disabled={isCreating}
                  >
                    {isCreating ? "Criando..." : "Criar Variações"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
