/**
 * 📦 MODAL DE MOVIMENTAÇÃO DE ESTOQUE
 * Modal para registrar entradas, saídas e ajustes de estoque
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
}

export function StockMovementModal({ 
  open, 
  onOpenChange, 
  product,
  onConfirm 
}: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementReason, setMovementReason] = useState("");

  const handleConfirm = () => {
    if (!product || movementQuantity <= 0) return;
    
    onConfirm(product.id, movementType, movementQuantity, movementReason);
    
    // Reset
    setMovementQuantity(0);
    setMovementReason("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setMovementQuantity(0);
    setMovementReason("");
    onOpenChange(false);
  };

  const newStock = product ? (
    movementType === 'entrada' 
      ? product.quantidade_atual + movementQuantity
      : Math.max(0, product.quantidade_atual - movementQuantity)
  ) : 0;

  const hasError = movementType === 'saida' && product && movementQuantity > product.quantidade_atual;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentação de Estoque</DialogTitle>
          <DialogDescription>
            Registre entradas, saídas ou ajustes no estoque do produto selecionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Produto</Label>
            <Input value={product?.nome || ""} disabled />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estoque Atual</Label>
              <Input value={product?.quantidade_atual || 0} disabled />
            </div>
            <div>
              <Label>Localização</Label>
              <Input value={product?.localizacao || "N/A"} disabled />
            </div>
          </div>
          
          <div>
            <Label>Tipo de Movimentação</Label>
            <Select value={movementType} onValueChange={(value: 'entrada' | 'saida') => setMovementType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2 text-green-500" />
                    Entrada (Compra, Devolução, Ajuste +)
                  </div>
                </SelectItem>
                <SelectItem value="saida">
                  <div className="flex items-center">
                    <Minus className="w-4 h-4 mr-2 text-red-500" />
                    Saída (Venda, Perda, Ajuste -)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Quantidade</Label>
            <Input 
              type="number" 
              value={movementQuantity}
              onChange={(e) => setMovementQuantity(Number(e.target.value))}
              min="1"
              max={movementType === 'saida' ? product?.quantidade_atual : undefined}
            />
            {hasError && (
              <p className="text-xs text-destructive mt-1">
                Quantidade não pode ser maior que o estoque disponível
              </p>
            )}
          </div>
          
          <div>
            <Label>Motivo</Label>
            <Textarea 
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              placeholder="Ex: Compra de fornecedor, Venda para cliente, Ajuste de inventário..."
            />
          </div>
          
          {product && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Resumo da Movimentação:</p>
              <p className="text-sm text-muted-foreground">
                Estoque atual: {product.quantidade_atual} → Novo estoque: {newStock}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!product || movementQuantity <= 0 || hasError}
            >
              Confirmar Movimentação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
