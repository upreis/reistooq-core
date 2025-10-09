import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Percent, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";

interface BulkPriceUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  products: Product[];
  onSuccess?: () => void;
}

export function BulkPriceUpdateModal({
  open,
  onOpenChange,
  selectedProductIds,
  products,
  onSuccess
}: BulkPriceUpdateModalProps) {
  const [updateType, setUpdateType] = useState<'fixed' | 'percentage'>('percentage');
  const [priceType, setPriceType] = useState<'cost' | 'sale' | 'both'>('sale');
  const [value, setValue] = useState<number>(0);
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast } = useToast();
  const { updateProduct } = useProducts();

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  const calculateNewPrice = (currentPrice: number): number => {
    if (!currentPrice || currentPrice === 0) return 0;

    switch (updateType) {
      case 'fixed':
        return operation === 'increase' ? currentPrice + value : Math.max(0, currentPrice - value);
      
      case 'percentage':
        const multiplier = operation === 'increase' ? (1 + value / 100) : (1 - value / 100);
        return Math.max(0, currentPrice * multiplier);
      
      default:
        return currentPrice;
    }
  };

  const handleUpdate = async () => {
    if (value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      for (const product of selectedProducts) {
        const updates: any = {};

        if (priceType === 'cost' || priceType === 'both') {
          const newCostPrice = calculateNewPrice(product.preco_custo || 0);
          updates.preco_custo = Math.round(newCostPrice * 100) / 100;
        }

        if (priceType === 'sale' || priceType === 'both') {
          const newSalePrice = calculateNewPrice(product.preco_venda || 0);
          updates.preco_venda = Math.round(newSalePrice * 100) / 100;
        }

        await updateProduct(product.id, updates);
      }

      toast({
        title: "Preços atualizados!",
        description: `${selectedProducts.length} produto${selectedProducts.length > 1 ? 's' : ''} atualizado${selectedProducts.length > 1 ? 's' : ''} com sucesso.`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: "Erro ao atualizar preços",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setValue(0);
    setUpdateType('percentage');
    setPriceType('sale');
    setOperation('increase');
    onOpenChange(false);
  };

  const getPreviewText = () => {
    if (value <= 0) return "Insira um valor para ver a prévia";
    
    const sampleProduct = selectedProducts[0];
    if (!sampleProduct) return "";

    const currentPrice = priceType === 'cost' ? sampleProduct.preco_custo : sampleProduct.preco_venda;
    const newPrice = calculateNewPrice(currentPrice || 0);
    
    const formatPrice = (price: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    return `Exemplo: ${formatPrice(currentPrice || 0)} → ${formatPrice(newPrice)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Atualizar Preços em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-muted/20">
            <Label className="text-sm font-semibold">Produtos Selecionados</Label>
            <div className="mt-2">
              <Badge variant="outline">{selectedProductIds.length} produtos</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipo de Preço</Label>
            <RadioGroup value={priceType} onValueChange={(value: any) => setPriceType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cost" id="cost" />
                <label htmlFor="cost" className="text-sm">Preço de Custo</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sale" id="sale" />
                <label htmlFor="sale" className="text-sm">Preço de Venda</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <label htmlFor="both" className="text-sm">Ambos os Preços</label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipo de Atualização</Label>
            <RadioGroup value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <label htmlFor="percentage" className="text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Percentual
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <label htmlFor="fixed" className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor Fixo
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operação</Label>
              <RadioGroup value={operation} onValueChange={(value: any) => setOperation(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <label htmlFor="increase" className="text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    Aumentar
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <label htmlFor="decrease" className="text-sm flex items-center gap-2">
                    <Minus className="w-4 h-4 text-red-600" />
                    Diminuir
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>
                Valor {updateType === 'percentage' ? '(%)' : '(R$)'}
              </Label>
              <Input
                type="number"
                min="0"
                step={updateType === 'fixed' ? "0.01" : "0.1"}
                value={value || ''}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                placeholder={updateType === 'fixed' ? "0,00" : "0,0"}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-sm font-medium text-blue-700">Prévia da Atualização</Label>
            <p className="text-sm text-blue-600 mt-1">
              {getPreviewText()}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || value <= 0}>
              {isUpdating ? "Atualizando..." : "Atualizar Preços"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
