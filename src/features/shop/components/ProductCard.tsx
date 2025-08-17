import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Eye, Star, Package } from "lucide-react";
import { ShopProduct } from "../types/shop.types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ShopProduct;
  isSelected?: boolean;
  onSelect?: (productId: string) => void;
  onAddToCart?: (product: ShopProduct) => void;
  onAddToWishlist?: (product: ShopProduct) => void;
  onViewProduct?: (product: ShopProduct) => void;
  showSelection?: boolean;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
  onAddToCart,
  onAddToWishlist,
  onViewProduct,
  showSelection = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const stockBadgeConfig = {
    in_stock: { variant: 'default' as const, label: 'Em Estoque', color: 'bg-success' },
    low_stock: { variant: 'secondary' as const, label: 'Estoque Baixo', color: 'bg-warning' },
    out_of_stock: { variant: 'destructive' as const, label: 'Sem Estoque', color: 'bg-destructive' },
  };

  const stockConfig = stockBadgeConfig[product.stock_status];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={cn(
          "w-3 h-3",
          index < rating 
            ? "text-primary fill-current" 
            : "text-muted-foreground"
        )}
      />
    ));
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(product);
  };

  const getMainImage = () => {
    const mainImage = product.images?.find(img => img.principal);
    return mainImage?.url_imagem || product.url_imagem;
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-300 cursor-pointer",
        isSelected && "ring-2 ring-primary",
        product.stock_status === 'out_of_stock' && "opacity-75"
      )}
      onClick={() => showSelection && onSelect?.(product.id)}
    >
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {/* Product Image */}
          <div className="aspect-square bg-muted">
            {!imageError && getMainImage() ? (
              <img
                src={getMainImage()}
                alt={product.nome}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="secondary"
              className="bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onViewProduct?.(product);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary"
              className={cn(
                "bg-background/80 hover:bg-background",
                isWishlisted && "text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToWishlist();
              }}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
            </Button>
            <Button 
              size="icon" 
              className="bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              disabled={product.stock_status === 'out_of_stock'}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOnSale && product.discount_percentage && (
              <Badge variant="destructive" className="text-xs">
                -{product.discount_percentage}%
              </Badge>
            )}
            <Badge 
              variant={stockConfig.variant}
              className="text-xs"
            >
              {stockConfig.label}
            </Badge>
          </div>

          {/* Stock Count */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="text-xs bg-background/80">
              {product.quantidade_atual} un.
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.nome}
        </h3>

        {/* SKU */}
        <p className="text-xs text-muted-foreground mb-2">
          SKU: {product.sku_interno}
        </p>

        {/* Category */}
        {product.categoria && (
          <Badge variant="outline" className="text-xs mb-2">
            {product.categoria}
          </Badge>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            {renderStars(product.rating)}
            {product.reviews_count && (
              <span className="text-xs text-muted-foreground ml-1">
                ({product.reviews_count})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.preco_venda)}
          </span>
          {product.originalPrice && product.originalPrice > product.preco_venda && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Description */}
        {product.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.descricao}
          </p>
        )}

        {/* Quick Add Button */}
        <Button 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          disabled={product.stock_status === 'out_of_stock'}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock_status === 'out_of_stock' ? 'Sem Estoque' : 'Adicionar'}
        </Button>
      </CardContent>
    </Card>
  );
}