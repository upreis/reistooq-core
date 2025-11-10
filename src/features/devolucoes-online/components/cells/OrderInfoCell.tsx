/**
 * 📋 ORDER INFO CELL - FASE 4
 * Exibe dados do pedido com link para o ML
 */

import { ExternalLink, ShoppingCart, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderInfoCellProps {
  orderId: number;
  dateCreated: string;
  sellerId?: number;
}

export const OrderInfoCell = ({ orderId, dateCreated, sellerId }: OrderInfoCellProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Link para o pedido no Mercado Livre
  const orderUrl = `https://www.mercadolibre.com.br/vendas/${orderId}/detalle`;

  return (
    <div className="space-y-1.5 min-w-[200px]">
      {/* Order ID com link */}
      <div className="flex items-start gap-2">
        <ShoppingCart className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1 group"
            title={`Pedido ${orderId}`}
          >
            <span className="truncate">#{orderId}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      {/* Data de criação */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span className="truncate" title={formatDate(dateCreated)}>
          {formatDate(dateCreated)}
        </span>
      </div>

      {/* Seller ID (opcional) */}
      {sellerId && (
        <div className="text-xs text-muted-foreground">
          Vendedor: {sellerId}
        </div>
      )}
    </div>
  );
};
