/**
 * 📦 PRODUTO INFO CELL
 * Exibe dados do produto com thumbnail e link para o anúncio ML
 */

import { ExternalLink, Package } from 'lucide-react';
import { ProductInfo } from '../../types/devolucao.types';
import { Badge } from '@/components/ui/badge';
import { EmptyFieldIndicator } from '../EmptyFieldIndicator';
import { getEmptyFieldInfo } from '../../utils/emptyFieldDetector';

interface ProductInfoCellProps {
  productInfo?: ProductInfo | null;
  rawData?: any;
}

export const ProductInfoCell = ({ productInfo, rawData }: ProductInfoCellProps) => {
  if (!productInfo) {
    const analysis = getEmptyFieldInfo('produto_titulo', null, rawData || {});
    
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="h-4 w-4" />
        <EmptyFieldIndicator analysis={analysis} fieldName="Produto" />
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(price);
  };

  return (
    <div className="flex items-start gap-3 min-w-[300px] max-w-[400px]">
      {/* Thumbnail */}
      {productInfo.thumbnail ? (
        <img 
          src={productInfo.thumbnail} 
          alt={productInfo.title}
          className="w-12 h-12 object-cover rounded border border-border flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center flex-shrink-0">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Informações do produto */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Título com link */}
        <div className="flex items-start gap-1.5">
          <a
            href={productInfo.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
            title={productInfo.title}
          >
            {productInfo.title}
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
        </div>

        {/* SKU e Preço */}
        <div className="flex items-center gap-2 flex-wrap">
          {productInfo.sku ? (
            <Badge variant="secondary" className="text-xs font-mono">
              SKU: {productInfo.sku}
            </Badge>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">SKU:</span>
              <EmptyFieldIndicator 
                analysis={getEmptyFieldInfo('sku', null, rawData || {})} 
                fieldName="SKU"
              />
            </div>
          )}
          <span className="text-sm font-semibold text-primary">
            {formatPrice(productInfo.price, productInfo.currency_id)}
          </span>
        </div>

        {/* Item ID */}
        <div className="text-xs text-muted-foreground font-mono">
          ID: {productInfo.id}
        </div>

        {/* Condição e estoque (se disponível) */}
        {(productInfo.condition || productInfo.sold_quantity > 0) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {productInfo.condition && (
              <span className="capitalize">
                {productInfo.condition === 'new' ? 'Novo' : 'Usado'}
              </span>
            )}
            {productInfo.sold_quantity > 0 && (
              <span>
                • {productInfo.sold_quantity} vendido{productInfo.sold_quantity !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
