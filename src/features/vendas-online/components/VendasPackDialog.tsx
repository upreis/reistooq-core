/**
 * 📦 VENDAS PACK DIALOG
 * Dialog para visualizar detalhes de um pack
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useVendasStore } from '../store/vendasStore';
import { Package, Calendar, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendasPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packId: string;
}

export const VendasPackDialog = ({
  open,
  onOpenChange,
  packId
}: VendasPackDialogProps) => {
  const { orders } = useVendasStore();
  
  // ✅ Usar dados que já temos no store
  const packOrders = orders.filter(order => String(order.pack_id) === packId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pack #{packId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo do Pack */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de Pedidos</span>
              <span className="text-2xl font-bold">{packOrders.length}</span>
            </div>
            
            {packOrders.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Total</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      packOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="text-sm">
                    {format(new Date(packOrders[0].date_created), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>

                {packOrders[0]?.shipping?.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status Envio</span>
                    <Badge variant="outline">{packOrders[0].shipping.status}</Badge>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lista de Pedidos */}
          {packOrders.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedidos no Pack
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {packOrders.map((order) => (
                  <div key={order.id} className="p-3 bg-muted/30 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">#{order.id}</span>
                      <span className="text-sm font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(order.total_amount || 0)}
                      </span>
                    </div>
                    
                    {order.order_items?.[0]?.item?.title && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.order_items[0].item.title}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.date_created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum pedido encontrado para este pack
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
