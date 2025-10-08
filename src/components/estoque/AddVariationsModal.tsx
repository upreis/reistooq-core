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
import { Package, Plus, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AddVariationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentProduct: Product | null;
  onFinish: () => void;
  onEditVariation: (product: Product) => void;
}

interface VariationForm {
  suffix: string;
  quantity: number;
  barcode: string;
}

export function AddVariationsModal({ 
  open, 
  onOpenChange, 
  parentProduct, 
  onFinish,
  onEditVariation 
}: AddVariationsModalProps) {
  const [variations, setVariations] = useState<VariationForm[]>([
    { suffix: '', quantity: 0, barcode: '' }
  ]);
  const { toast } = useToast();

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

  const handleEditVariation = (index: number) => {
    const variation = variations[index];
    if (!variation.suffix.trim()) {
      toast({
        title: "Sufixo obrigatório",
        description: "Informe o sufixo da variação antes de editar.",
        variant: "destructive",
      });
      return;
    }

    if (!parentProduct) return;

    // Criar produto temporário para editar
    const tempProduct: Product = {
      ...parentProduct,
      id: `temp-${index}`,
      sku_interno: `${parentProduct.sku_interno}-${variation.suffix}`,
      nome: `${parentProduct.nome} - ${variation.suffix}`,
      quantidade_atual: variation.quantity,
      codigo_barras: variation.barcode,
      sku_pai: parentProduct.sku_interno,
    };

    onEditVariation(tempProduct);
  };

  const handleFinish = () => {
    const validVariations = variations.filter(v => v.suffix.trim());
    
    if (validVariations.length === 0) {
      toast({
        title: "Produto pai criado",
        description: "Produto pai criado sem variações.",
      });
    } else {
      toast({
        title: "Variações prontas",
        description: `${validVariations.length} variação(ões) pronta(s) para finalizar.`,
      });
    }
    
    handleClose();
    onFinish();
  };

  const handleClose = () => {
    setVariations([{ suffix: '', quantity: 0, barcode: '' }]);
    onOpenChange(false);
  };

  if (!parentProduct) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Adicionar Variações do Produto Pai
          </DialogTitle>
          <DialogDescription>
            Passo 2: Adicione as variações (SKUs filhos) do produto pai
          </DialogDescription>
        </DialogHeader>

        {/* Info do produto pai */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Produto Pai:</p>
              <p className="text-lg font-bold text-primary">{parentProduct.sku_interno}</p>
              <p className="text-sm text-muted-foreground">{parentProduct.nome}</p>
            </div>
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Criado
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Lista de variações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Variações (SKUs Filhos)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariation}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Variação
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {variations.map((variation, index) => (
              <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Variação {index + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVariation(index)}
                      disabled={!variation.suffix.trim()}
                    >
                      Editar Detalhes
                    </Button>
                    {variations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`suffix-${index}`}>Sufixo *</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {parentProduct.sku_interno}-
                      </span>
                      <Input
                        id={`suffix-${index}`}
                        placeholder="P, M, G, etc"
                        value={variation.suffix}
                        onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Qtd Inicial</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      value={variation.quantity}
                      onChange={(e) => handleVariationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`barcode-${index}`}>Cód. Barras</Label>
                    <Input
                      id={`barcode-${index}`}
                      placeholder="123456789"
                      value={variation.barcode}
                      onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)}
                    />
                  </div>
                </div>

                {variation.suffix && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      SKU completo: <span className="font-mono font-medium text-foreground">
                        {parentProduct.sku_interno}-{variation.suffix}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {variations.filter(v => v.suffix.trim()).length} variação(ões) preenchida(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinish}
            >
              Finalizar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
