// =============================================================================
// SCANNER ACTIONS COMPONENT - Ações rápidas para produtos escaneados
// =============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Minus, 
  Package, 
  Edit, 
  Eye,
  TrendingUp,
  TrendingDown,
  Settings,
  Zap
} from 'lucide-react';
import { ScannedProduct, MovementRequest, ScanAction } from '../types/scanner.types';
import { toast } from 'sonner';

interface ScannerActionsProps {
  product?: ScannedProduct;
  onAction: (action: ScanAction, data?: any) => void;
  className?: string;
}

export const ScannerActions: React.FC<ScannerActionsProps> = ({
  product,
  onAction,
  className = ''
}) => {
  const [movementType, setMovementType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const handleQuickMovement = (type: 'entrada' | 'saida', qty: number = 1) => {
    if (!product) return;

    const movement: MovementRequest = {
      produto_id: product.id,
      tipo_movimentacao: type,
      quantidade: qty,
      motivo: `Movimentação rápida via scanner`,
      observacoes: `Scanner - ${type} de ${qty} unidades`
    };

    onAction(type === 'entrada' ? ScanAction.STOCK_IN : ScanAction.STOCK_OUT, movement);
    
    toast.success(
      `${type === 'entrada' ? 'Entrada' : 'Saída'} de ${qty} unidades registrada`
    );
  };

  const handleDetailedMovement = () => {
    if (!product || !quantity) return;

    const movement: MovementRequest = {
      produto_id: product.id,
      tipo_movimentacao: movementType,
      quantidade: parseInt(quantity),
      motivo: reason || `Movimentação via scanner`,
      observacoes: observations
    };

    onAction(
      movementType === 'entrada' ? ScanAction.STOCK_IN :
      movementType === 'saida' ? ScanAction.STOCK_OUT :
      ScanAction.STOCK_ADJUST,
      movement
    );

    toast.success(`${movementType.charAt(0).toUpperCase() + movementType.slice(1)} registrada com sucesso`);
    
    // Reset form
    setQuantity('1');
    setReason('');
    setObservations('');
    setIsMovementModalOpen(false);
  };

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: 'low', color: 'destructive', text: 'Baixo' };
    if (current >= max) return { status: 'high', color: 'secondary', text: 'Alto' };
    return { status: 'normal', color: 'default', text: 'Normal' };
  };

  if (!product) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p>Escaneie um produto para ver as ações disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stockStatus = getStockStatus(
    product.quantidade_atual,
    product.estoque_minimo,
    product.estoque_maximo
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Product Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            {/* Product Image */}
            <div className="w-12 h-12 bg-background rounded overflow-hidden flex-shrink-0">
              {product.url_imagem ? (
                <img
                  src={product.url_imagem}
                  alt={product.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{product.nome}</div>
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku_interno}
              </div>
              {product.codigo_barras && (
                <div className="text-xs text-muted-foreground">
                  Código: {product.codigo_barras}
                </div>
              )}
            </div>

            {/* Stock Badge */}
            <Badge variant={stockStatus.color as any}>
              {stockStatus.text}
            </Badge>
          </div>

          {/* Stock Info */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold">{product.quantidade_atual}</div>
              <div className="text-xs text-muted-foreground">Atual</div>
            </div>
            <div>
              <div className="text-sm">{product.estoque_minimo}</div>
              <div className="text-xs text-muted-foreground">Mín</div>
            </div>
            <div>
              <div className="text-sm">{product.estoque_maximo}</div>
              <div className="text-xs text-muted-foreground">Máx</div>
            </div>
          </div>
        </div>

        {/* Quick Movement Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Movimentação Rápida</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-16 flex flex-col gap-1"
              onClick={() => handleQuickMovement('entrada', 1)}
            >
              <Plus className="w-5 h-5 text-green-600" />
              <span className="text-xs">Entrada +1</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col gap-1"
              onClick={() => handleQuickMovement('saida', 1)}
              disabled={product.quantidade_atual < 1}
            >
              <Minus className="w-5 h-5 text-red-600" />
              <span className="text-xs">Saída -1</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickMovement('entrada', 10)}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              +10
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickMovement('saida', 10)}
              disabled={product.quantidade_atual < 10}
            >
              <TrendingDown className="w-4 h-4 mr-1" />
              -10
            </Button>
          </div>
        </div>

        {/* Detailed Movement Modal */}
        <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Movimentação Detalhada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Movimentação de Estoque</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="movement-type">Tipo de Movimentação</Label>
                <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Recebimento de mercadoria"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDetailedMovement}
                  className="flex-1"
                  disabled={!quantity || parseInt(quantity) < 1}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Other Actions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Outras Ações</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(ScanAction.VIEW)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Detalhes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(ScanAction.EDIT_PRODUCT)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
        </div>

        {/* Price Info */}
        {(product.preco_custo || product.preco_venda) && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Preços</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.preco_custo && (
                <div>
                  <div className="text-muted-foreground">Custo</div>
                  <div className="font-medium">R$ {product.preco_custo.toFixed(2)}</div>
                </div>
              )}
              {product.preco_venda && (
                <div>
                  <div className="text-muted-foreground">Venda</div>
                  <div className="font-medium">R$ {product.preco_venda.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScannerActions;
