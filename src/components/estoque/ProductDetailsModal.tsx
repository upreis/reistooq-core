import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Tag,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ProductDetailsModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditProduct: (product: Product) => void;
}

export function ProductDetailsModal({
  product,
  open,
  onOpenChange,
  onEditProduct,
}: ProductDetailsModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const getStockStatus = () => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "text-red-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "text-yellow-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual >= product.estoque_maximo) {
      return {
        label: "Estoque alto",
        variant: "outline" as const,
        color: "text-blue-500",
        icon: Package
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "text-green-500",
        icon: Package
      };
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Detalhes do Produto
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditProduct(product)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Imagem e informações básicas */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {product.url_imagem && !imageError ? (
                <img
                  src={product.url_imagem}
                  alt={product.nome}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Package className="w-16 h-16 mb-2" />
                  <span className="text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{product.nome}</h2>
              {product.descricao && (
                <p className="text-muted-foreground text-sm">{product.descricao}</p>
              )}
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="space-y-6">
            {/* Identificação */}
            <div>
              <h3 className="flex items-center text-sm font-medium mb-3">
                <Tag className="w-4 h-4 mr-2" />
                Identificação
              </h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-mono">{product.sku_interno}</span>
                </div>
                {product.codigo_barras && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código de Barras:</span>
                    <span className="font-mono">{product.codigo_barras}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Categorias */}
            <div>
              <h3 className="flex items-center text-sm font-medium mb-3">
                <Package className="w-4 h-4 mr-2" />
                Categorização
              </h3>
              <div className="space-y-2">
                {product.categoria && (
                  <Badge variant="outline" className="text-xs">
                    {product.categoria}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Estoque */}
            <div>
              <h3 className="flex items-center text-sm font-medium mb-3">
                <BarChart3 className="w-4 h-4 mr-2" />
                Estoque
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
                    <Badge variant={stockStatus.variant} className="text-xs">
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Atual</div>
                    <div className="font-semibold text-lg">{product.quantidade_atual}</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Mínimo</div>
                    <div className="font-semibold">{product.estoque_minimo}</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Máximo</div>
                    <div className="font-semibold">{product.estoque_maximo}</div>
                  </div>
                </div>
                {product.localizacao && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Localização:</span>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                      <span>{product.localizacao}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Preços */}
            <div>
              <h3 className="flex items-center text-sm font-medium mb-3">
                <DollarSign className="w-4 h-4 mr-2" />
                Preços
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded">
                  <div className="text-xs text-muted-foreground mb-1">Custo</div>
                  <div className={`font-semibold ${product.preco_custo && product.preco_custo > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formatPrice(product.preco_custo)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded">
                  <div className="text-xs text-muted-foreground mb-1">Venda</div>
                  <div className={`font-semibold ${product.preco_venda && product.preco_venda > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {formatPrice(product.preco_venda)}
                  </div>
                </div>
              </div>
              {product.preco_custo && product.preco_venda && product.preco_custo > 0 && product.preco_venda > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  <span className="text-muted-foreground">Margem: </span>
                  <span className="font-medium">
                    {(((product.preco_venda - product.preco_custo) / product.preco_custo) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações adicionais */}
            <div>
              <h3 className="flex items-center text-sm font-medium mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                Informações Adicionais
              </h3>
              <div className="space-y-2 text-sm">
                {product.unidade_medida_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidade ID:</span>
                    <span>{product.unidade_medida_id}</span>
                  </div>
                )}
                {product.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                )}
                {product.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{formatDate(product.updated_at)}</span>
                  </div>
                )}
                {product.ultima_movimentacao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última movimentação:</span>
                    <span>{formatDate(product.ultima_movimentacao)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}