import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";

interface VariationForm {
  suffix: string;
  quantity: string;
  barcode: string;
}

interface TwoStepProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditVariation: (product: Product) => void;
  onComplete: () => void;
}

export const TwoStepProductModal = ({
  open,
  onOpenChange,
  onEditVariation,
  onComplete,
}: TwoStepProductModalProps) => {
  const { createProduct } = useProducts();
  const { toast } = useToast();
  
  // Etapa 1: SKU PAI
  const [skuInterno, setSkuInterno] = useState("");
  const [nome, setNome] = useState("");
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [parentProduct, setParentProduct] = useState<Product | null>(null);
  
  // Etapa 2: Variações
  const [variations, setVariations] = useState<VariationForm[]>([
    { suffix: "", quantity: "", barcode: "" }
  ]);

  const handleCreateParent = async () => {
    if (!skuInterno.trim() || !nome.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o SKU Interno e Nome do produto pai",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingParent(true);
    try {
      const newProduct = await createProduct({
        sku_interno: skuInterno,
        nome: nome,
        categoria: null,
        descricao: null,
        codigo_barras: null,
        quantidade_atual: 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        preco_custo: null,
        preco_venda: null,
        localizacao: null,
        unidade_medida_id: null,
        status: 'ativo',
        ativo: true,
        url_imagem: null,
        sku_pai: null,
      });

      setParentProduct(newProduct);
      toast({
        title: "SKU PAI criado",
        description: "Agora adicione as variações (SKUs filhos)",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar produto pai",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreatingParent(false);
    }
  };

  const handleAddVariation = () => {
    setVariations([...variations, { suffix: "", quantity: "", barcode: "" }]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (index: number, field: keyof VariationForm, value: string) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
  };

  const handleEditVariation = (index: number) => {
    if (!parentProduct) return;
    
    const variation = variations[index];
    const tempProduct: Product = {
      ...parentProduct,
      id: `temp-variation-${index}`,
      sku_interno: `${parentProduct.sku_interno}${variation.suffix}`,
      nome: `${parentProduct.nome} ${variation.suffix}`,
      sku_pai: parentProduct.sku_interno,
      codigo_barras: variation.barcode || undefined,
    };
    
    onEditVariation(tempProduct);
  };

  const handleFinish = () => {
    if (!parentProduct) {
      toast({
        title: "Erro",
        description: "Crie o SKU PAI primeiro",
        variant: "destructive",
      });
      return;
    }

    const validVariations = variations.filter(v => v.suffix.trim());
    
    if (validVariations.length === 0) {
      toast({
        title: "Aviso",
        description: "Adicione pelo menos uma variação",
        variant: "destructive",
      });
      return;
    }

    handleClose();
    onComplete();
    
    toast({
      title: "Sucesso",
      description: `SKU PAI e ${validVariations.length} variação(ões) prontos para serem finalizados`,
    });
  };

  const handleClose = () => {
    setSkuInterno("");
    setNome("");
    setParentProduct(null);
    setVariations([{ suffix: "", quantity: "", barcode: "" }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto com Variações</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* ETAPA 1: SKU PAI */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Etapa 1: SKU PAI</h3>
              {parentProduct && (
                <span className="text-sm text-green-600 font-medium">✓ Criado</span>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="sku_interno">SKU Interno *</Label>
                <Input
                  id="sku_interno"
                  value={skuInterno}
                  onChange={(e) => setSkuInterno(e.target.value)}
                  placeholder="Ex: PROD-001"
                  disabled={!!parentProduct}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !parentProduct) {
                      handleCreateParent();
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Camiseta Básica"
                  disabled={!!parentProduct}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !parentProduct) {
                      handleCreateParent();
                    }
                  }}
                />
              </div>

              {!parentProduct ? (
                <Button
                  onClick={handleCreateParent}
                  disabled={isCreatingParent}
                  className="w-full"
                >
                  {isCreatingParent ? "Criando..." : "Criar SKU PAI"}
                </Button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-800">SKU PAI: {parentProduct.sku_interno}</p>
                  <p className="text-sm text-green-700">{parentProduct.nome}</p>
                </div>
              )}
            </div>
          </div>

          {/* ETAPA 2: VARIAÇÕES */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Etapa 2: Variações (SKUs Filhos)</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddVariation}
                disabled={!parentProduct}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {!parentProduct ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Crie o SKU PAI primeiro para adicionar variações</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {variations.map((variation, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 space-y-2 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Variação {index + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditVariation(index)}
                          disabled={!variation.suffix}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {variations.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveVariation(index)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Sufixo *</Label>
                      <Input
                        placeholder="Ex: -P, -M, -G"
                        value={variation.suffix}
                        onChange={(e) =>
                          handleVariationChange(index, "suffix", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                      {variation.suffix && (
                        <p className="text-xs text-muted-foreground mt-1">
                          SKU: {parentProduct.sku_interno}{variation.suffix}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={variation.quantity}
                          onChange={(e) =>
                            handleVariationChange(index, "quantity", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Código Barras</Label>
                        <Input
                          placeholder="EAN/UPC"
                          value={variation.barcode}
                          onChange={(e) =>
                            handleVariationChange(index, "barcode", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleFinish}
            disabled={!parentProduct || variations.filter(v => v.suffix.trim()).length === 0}
          >
            Finalizar Cadastro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
