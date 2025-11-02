/**
 * 📋 VENDAS ONLINE TABLE
 * Tabela principal de vendas do Mercado Livre
 */

import { useState } from 'react';
import { useVendasStore } from '../store/vendasStore';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package, User, Calendar, DollarSign, MessageSquare, Star, Info, Truck } from 'lucide-react';
import { getOrderStatusLabel, getOrderStatusColor } from '../utils/statusMapping';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VendasNoteDialog } from './VendasNoteDialog';
import { VendasFeedbackDialog } from './VendasFeedbackDialog';
import { VendasPackDialog } from './VendasPackDialog';
import { VendasShippingDialog } from './VendasShippingDialog';
import { useVendasFilters } from '../hooks/useVendasFilters';
import { useVendasData } from '../hooks/useVendasData';

const getBadgeVariant = (color: string) => {
  const variantMap: Record<string, any> = {
    blue: 'default',
    green: 'default',
    yellow: 'secondary',
    red: 'destructive',
    gray: 'outline',
    purple: 'default'
  };
  return variantMap[color] || 'default';
};

export const VendasOnlineTable = () => {
  const { orders, isLoading, pagination } = useVendasStore();
  const { filters } = useVendasFilters();
  const { refresh } = useVendasData();
  
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; packId: string } | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; orderId: string } | null>(null);
  const [packDialog, setPackDialog] = useState<{ open: boolean; packId: string } | null>(null);
  const [shippingDialog, setShippingDialog] = useState<{ open: boolean; shippingId: string; currentStatus?: string } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
        <p className="text-muted-foreground">
          Selecione uma conta do Mercado Livre para visualizar as vendas.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com total */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando <strong>{orders.length}</strong> de <strong>{pagination.total}</strong> vendas
        </p>
      </div>

      {/* Lista de Orders */}
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Header da Order */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Pedido #{order.id}</h3>
                    <Badge variant={getBadgeVariant(getOrderStatusColor(order.status))}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                    {order.pack_id && (
                      <Badge variant="outline">Pack #{order.pack_id}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.date_created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {order.total_amount.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: order.currency_id 
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.payments.length} pagamento(s)
                  </p>
                </div>
              </div>

              {/* Comprador */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.buyer.nickname}</span>
                {order.buyer.email && (
                  <span className="text-muted-foreground">• {order.buyer.email}</span>
                )}
              </div>

              {/* Itens */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Itens ({order.order_items.length})
                </p>
                <div className="grid gap-2">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.item.title}</p>
                        {item.item.seller_sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.item.seller_sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.quantity}x {item.unit_price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: item.currency_id
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFeedbackDialog({ open: true, orderId: order.id.toString() })}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Feedback
                </Button>
                
                {order.pack_id && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPackDialog({ open: true, packId: order.pack_id.toString() })}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Ver Pack
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNoteDialog({ open: true, packId: order.pack_id.toString() })}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Nota
                    </Button>
                  </>
                )}
                
                {order.shipping?.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShippingDialog({ 
                      open: true, 
                      shippingId: order.shipping.id.toString(),
                      currentStatus: order.shipping.status
                    })}
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Envio
                  </Button>
                )}
              </div>

              {/* Shipping Info */}
              {order.shipping && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Envio ID: <span className="font-mono">{order.shipping.id}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {noteDialog && (
        <VendasNoteDialog
          open={noteDialog.open}
          onOpenChange={(open) => !open && setNoteDialog(null)}
          packId={noteDialog.packId}
          integrationAccountId={filters.integrationAccountId}
          onSuccess={() => refresh()}
        />
      )}
      
      {feedbackDialog && (
        <VendasFeedbackDialog
          open={feedbackDialog.open}
          onOpenChange={(open) => !open && setFeedbackDialog(null)}
          orderId={feedbackDialog.orderId}
          integrationAccountId={filters.integrationAccountId}
          onSuccess={() => refresh()}
        />
      )}
      
      {packDialog && (
        <VendasPackDialog
          open={packDialog.open}
          onOpenChange={(open) => !open && setPackDialog(null)}
          packId={packDialog.packId}
        />
      )}
      
      {shippingDialog && (
        <VendasShippingDialog
          open={shippingDialog.open}
          onOpenChange={(open) => !open && setShippingDialog(null)}
          shippingId={shippingDialog.shippingId}
          currentStatus={shippingDialog.currentStatus}
          integrationAccountId={filters.integrationAccountId}
          onSuccess={() => refresh()}
        />
      )}
    </div>
  );
};
