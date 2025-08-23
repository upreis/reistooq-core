import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, CreditCard, Truck, User, Tag, Calendar, DollarSign } from 'lucide-react';
import { MercadoLivreOrderService, MLOrderDetailResponse } from '@/services/MercadoLivreOrderService';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MLOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  integrationAccountId: string;
}

export function MLOrderDetailModal({ isOpen, onClose, orderId, integrationAccountId }: MLOrderDetailModalProps) {
  const [includeShipping, setIncludeShipping] = useState(true);

  const { data: orderDetail, isLoading, error } = useQuery({
    queryKey: ['ml-order-detail', orderId, integrationAccountId, includeShipping],
    queryFn: () => MercadoLivreOrderService.getOrderDetail({
      integration_account_id: integrationAccountId,
      order_id: orderId,
      include_shipping: includeShipping
    }),
    enabled: isOpen && !!orderId && !!integrationAccountId,
  });

  const formatCurrency = (amount: number, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'payment_required': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando detalhes do pedido...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erro ao carregar pedido</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <Button onClick={onClose} className="mt-4 w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orderDetail?.raw_order) {
    return null;
  }

  const order = orderDetail.raw_order;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes do Pedido ML-{order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e informações gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="font-semibold">{formatCurrency(order.total_amount, order.currency_id)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Criação</label>
                  <p>{formatDate(order.date_created)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pack ID</label>
                  <p>{order.pack_id || 'N/A'}</p>
                </div>
              </div>

              {order.tags && order.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do comprador */}
          {order.buyer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Comprador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p>{order.buyer.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Apelido</label>
                    <p>{order.buyer.nickname || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itens do pedido */}
          {order.order_items && order.order_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido ({order.order_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Produto</label>
                          <p className="font-medium">{item.item.title}</p>
                          <p className="text-sm text-muted-foreground">ID: {item.item.id}</p>
                          {item.item.seller_sku && (
                            <p className="text-sm text-muted-foreground">SKU: {item.item.seller_sku}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                          <p>{item.quantity}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Preço Unitário</label>
                          <p>{formatCurrency(item.unit_price, order.currency_id)}</p>
                          {item.full_unit_price !== item.unit_price && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.full_unit_price, order.currency_id)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamentos */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamentos ({order.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.payments.map((payment: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Método</label>
                          <p>{payment.payment_method_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Valor</label>
                          <p>{formatCurrency(payment.transaction_amount, order.currency_id)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Data Aprovação</label>
                          <p>{payment.date_approved ? formatDate(payment.date_approved) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações de envio */}
          {order.shipping && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Envio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Envio</label>
                    <p>{order.shipping.id}</p>
                  </div>
                  {order.shipping_detail && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Código de Rastreamento</label>
                        <p>{order.shipping_detail.tracking_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status do Envio</label>
                        <p>{order.shipping_detail.status || 'N/A'}</p>
                      </div>
                      {order.shipping_detail.receiver_address && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Endereço de Entrega</label>
                          <p>
                            {order.shipping_detail.receiver_address.city?.name}, {order.shipping_detail.receiver_address.state?.name}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados brutos (para debug) */}
          <details className="border rounded-lg">
            <summary className="p-4 cursor-pointer font-medium">Dados Brutos (Debug)</summary>
            <div className="p-4 border-t bg-muted/50">
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(order, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}