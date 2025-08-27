import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  Upload,
  ArrowUpDown,
  Plus,
  Minus,
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EstoqueTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (productId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onStockMovement: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function EstoqueTable({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEditProduct,
  onDeleteProduct,
  onStockMovement,
  sortBy,
  sortOrder,
  onSort,
}: EstoqueTableProps) {
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementReason, setMovementReason] = useState("");
  const [imageUploadProduct, setImageUploadProduct] = useState<Product | null>(null);

  const getStockStatus = (product: Product) => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "bg-red-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "bg-yellow-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual >= product.estoque_maximo) {
      return {
        label: "Estoque alto",
        variant: "outline" as const,
        color: "bg-blue-500",
        icon: Package
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "bg-green-500",
        icon: Package
      };
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleMovement = () => {
    if (!selectedProductForMovement || movementQuantity <= 0) return;
    
    onStockMovement(
      selectedProductForMovement.id,
      movementType,
      movementQuantity,
      movementReason
    );
    
    setMovementModalOpen(false);
    setSelectedProductForMovement(null);
    setMovementQuantity(0);
    setMovementReason("");
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? "↑" : "↓";
  };

  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground">
          Cadastre produtos para gerenciar o estoque
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[800px] md:min-w-full">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-13 gap-4 py-3 px-4 bg-muted/50 rounded-lg text-sm font-medium">
        <div className="flex items-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            aria-label="Selecionar todos"
            ref={(el) => {
              if (el) (el as any).indeterminate = someSelected;
            }}
          />
        </div>
        <div className="flex items-center cursor-pointer" onClick={() => onSort('codigo_barras')}>
          Código de Barras {getSortIcon('codigo_barras')}
        </div>
        <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSort('nome')}>
          Produto {getSortIcon('nome')}
        </div>
        <div className="flex items-center cursor-pointer" onClick={() => onSort('sku_interno')}>
          SKU {getSortIcon('sku_interno')}
        </div>
        <div className="flex items-center cursor-pointer" onClick={() => onSort('categoria')}>
          Categoria {getSortIcon('categoria')}
        </div>
        <div className="flex items-center cursor-pointer" onClick={() => onSort('quantidade_atual')}>
          Estoque {getSortIcon('quantidade_atual')}
        </div>
        <div className="flex items-center">Mín/Máx</div>
        <div className="flex items-center">Preços</div>
        <div className="flex items-center">Status</div>
        <div className="flex items-center">Última Mov.</div>
        <div className="flex items-center">Ações</div>
      </div>

      {/* Product Rows */}
      <div className="space-y-2">
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const StockIcon = stockStatus.icon;
          const isSelected = selectedProducts.includes(product.id);
          
          return (
            <div
              key={product.id}
              className={`grid grid-cols-13 gap-4 py-4 px-4 border rounded-lg hover:bg-muted/30 transition-colors ${
                isSelected ? 'bg-muted/50 border-primary' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectProduct(product.id)}
                  aria-label={`Selecionar ${product.nome}`}
                />
              </div>

              {/* Código de Barras */}
              <div className="flex items-center">
                {product.codigo_barras ? (
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {product.codigo_barras}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Sem código
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="col-span-3 flex items-center space-x-3">
                <div className="relative w-12 h-12 bg-muted rounded-lg flex items-center justify-center group">
                  {product.url_imagem ? (
                    <img 
                      src={product.url_imagem} 
                      alt={product.nome} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                       onClick={() => setImageUploadProduct(product)}>
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{product.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.descricao || "Sem descrição"}
                  </p>
                </div>
              </div>

              {/* SKU */}
              <div className="flex items-center">
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {product.sku_interno}
                </span>
              </div>

              {/* Category */}
              <div className="flex items-center">
                <span className="text-sm">{product.categoria || "N/A"}</span>
              </div>

              {/* Current Stock */}
              <div className="flex items-center">
                <div className="text-center">
                  <span className="text-lg font-bold block">{product.quantidade_atual}</span>
                  <span className="text-xs text-muted-foreground">unidades</span>
                </div>
              </div>

              {/* Min/Max */}
              <div className="flex items-center">
                <div className="text-xs">
                  <div>Mín: {product.estoque_minimo}</div>
                  <div>Máx: {product.estoque_maximo}</div>
                </div>
              </div>

              {/* Prices */}
              <div className="flex items-center">
                <div className="text-xs">
                  <div>Custo: {formatPrice(product.preco_custo)}</div>
                  <div>Venda: {formatPrice(product.preco_venda)}</div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <Badge variant={stockStatus.variant} className="text-xs">
                  <StockIcon className="w-3 h-3 mr-1" />
                  {stockStatus.label}
                </Badge>
              </div>

              {/* Last Movement */}
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground">
                  {product.ultima_movimentacao 
                    ? formatDate(product.ultima_movimentacao)
                    : "N/A"
                  }
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedProductForMovement(product);
                      setMovementModalOpen(true);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Movimentar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditProduct(product)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Movement Modal */}
      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produto</Label>
              <Input value={selectedProductForMovement?.nome || ""} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estoque Atual</Label>
                <Input value={selectedProductForMovement?.quantidade_atual || 0} disabled />
              </div>
              <div>
                <Label>Localização</Label>
                <Input value={selectedProductForMovement?.localizacao || "N/A"} disabled />
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
                max={movementType === 'saida' ? selectedProductForMovement?.quantidade_atual : undefined}
              />
              {movementType === 'saida' && movementQuantity > (selectedProductForMovement?.quantidade_atual || 0) && (
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
            {selectedProductForMovement && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Resumo da Movimentação:</p>
                <p className="text-sm text-muted-foreground">
                  Estoque atual: {selectedProductForMovement.quantidade_atual} →{" "}
                  Novo estoque: {
                    movementType === 'entrada' 
                      ? selectedProductForMovement.quantidade_atual + movementQuantity
                      : Math.max(0, selectedProductForMovement.quantidade_atual - movementQuantity)
                  }
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMovementModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleMovement}
                disabled={!selectedProductForMovement || movementQuantity <= 0}
              >
                Confirmar Movimentação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}