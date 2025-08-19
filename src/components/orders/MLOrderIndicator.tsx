import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order } from '@/services/OrderService';

interface MLOrderIndicatorProps {
  order: Order;
  className?: string;
}

export const MLOrderIndicator: React.FC<MLOrderIndicatorProps> = ({ order, className }) => {
  // Check if this is a MercadoLibre order
  const isMLOrder = order.empresa === 'mercadolivre' || 
                   order.id.startsWith('ml_') || 
                   order.numero.startsWith('ML-');

  if (!isMLOrder) return null;

  const handleViewOnML = () => {
    // Extract ML order ID
    let mlOrderId = order.numero_ecommerce || order.numero;
    if (mlOrderId.startsWith('ML-')) {
      mlOrderId = mlOrderId.substring(3);
    }
    
    // Open ML seller panel (approximate URL - actual URL may vary)
    const mlUrl = `https://vendas.mercadolivre.com.br/order/${mlOrderId}`;
    window.open(mlUrl, '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="gap-1 text-yellow-700 bg-yellow-50 border-yellow-200">
        <ShoppingCart className="h-3 w-3" />
        Mercado Livre
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewOnML}
        className="h-6 px-2 text-xs"
        title="Ver no Mercado Livre"
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
};