/**
 * 📸 PRODUCT INFO CELL
 * Exibe informações do produto com imagem thumbnail
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Package } from 'lucide-react';

interface ProductInfo {
  id?: string;
  title?: string;
  price?: number;
  currency_id?: string;
  thumbnail?: string | null;
  permalink?: string;
  sku?: string | null;
  condition?: string;
  available_quantity?: number;
  sold_quantity?: number;
}

interface ProductInfoCellProps {
  productInfo?: ProductInfo | null;
}

export function ProductInfoCell({ productInfo }: ProductInfoCellProps) {
  if (!productInfo || !productInfo.title) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="h-4 w-4" />
        <span className="text-sm">Produto não disponível</span>
      </div>
    );
  }

  const formatPrice = (price?: number, currency?: string) => {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(price);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-3 min-w-[200px]">
            {/* Thumbnail */}
            {productInfo.thumbnail ? (
              <img 
                src={productInfo.thumbnail} 
                alt={productInfo.title}
                className="w-12 h-12 object-cover rounded border border-border flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f0f0f0"/%3E%3Ctext x="24" y="24" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12"%3ESem imagem%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Título + Link ML */}
              <div className="flex items-start gap-1.5 mb-1">
                <a
                  href={productInfo.permalink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-primary transition-colors line-clamp-2 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {productInfo.title}
                </a>
                {productInfo.permalink && (
                  <a
                    href={productInfo.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* SKU + Preço */}
              <div className="flex items-center gap-2 flex-wrap">
                {productInfo.sku && (
                  <Badge variant="secondary" className="text-xs">
                    SKU: {productInfo.sku}
                  </Badge>
                )}
                {productInfo.price !== undefined && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatPrice(productInfo.price, productInfo.currency_id)}
                  </span>
                )}
              </div>

              {/* ID do produto */}
              {productInfo.id && (
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {productInfo.id}
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">{productInfo.title}</p>
            {productInfo.id && (
              <p className="text-xs text-muted-foreground font-mono">ID: {productInfo.id}</p>
            )}
            {productInfo.sku && (
              <p className="text-xs">SKU: {productInfo.sku}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Preço:</span>
              <span className="text-sm font-bold text-green-600">
                {formatPrice(productInfo.price, productInfo.currency_id)}
              </span>
            </div>
            {productInfo.condition && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs">Condição:</span>
                <span className="text-xs">
                  {productInfo.condition === 'new' ? 'Novo' : 'Usado'}
                </span>
              </div>
            )}
            {productInfo.sold_quantity !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs">Vendidos:</span>
                <span className="text-xs font-medium">{productInfo.sold_quantity}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
