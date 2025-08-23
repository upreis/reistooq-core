import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Package, RefreshCw } from 'lucide-react';
import { useMLOrderDetail } from '@/hooks/useMLOrderDetail';
import { MLOrderDetailModal } from '@/components/orders/MLOrderDetailModal';
import { MercadoLivreOrderService } from '@/services/MercadoLivreOrderService';

/**
 * Página de demonstração para buscar e visualizar detalhes de orders do MercadoLivre
 * 
 * Como usar:
 * - /ml-order-details?account_id=UUID&order_id=2000012345678
 * - Ou usar os campos de entrada para testar
 */
export default function MLOrderDetailsPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || '');
  const [accountId, setAccountId] = useState(searchParams.get('account_id') || '');
  const [includeShipping, setIncludeShipping] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');

  // Query principal para buscar o order
  const { 
    data: orderDetail, 
    isLoading, 
    error,
    refetch 
  } = useMLOrderDetail({
    integration_account_id: accountId,
    order_id: orderId,
    include_shipping: includeShipping
  }, {
    enabled: !!accountId && !!orderId
  });

  const handleSearch = () => {
    if (searchOrderId && accountId) {
      setOrderId(searchOrderId);
    }
  };

  const formatCurrency = (amount: number, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detalhes de Orders ML</h1>
        <Badge variant="outline">API Individual Orders</Badge>
      </div>

      {/* Formulário de busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_id">Integration Account ID</Label>
              <Input
                id="account_id"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="UUID da conta de integração"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <div className="flex gap-2">
                <Input
                  id="order_id"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="2000012345678"
                />
                <Button onClick={handleSearch} disabled={!searchOrderId || !accountId}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="include_shipping"
              checked={includeShipping}
              onCheckedChange={setIncludeShipping}
            />
            <Label htmlFor="include_shipping">Incluir dados de envio detalhados</Label>
          </div>

          {orderId && accountId && (
            <div className="flex gap-2">
              <Button onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={() => setModalOpen(true)} variant="outline">
                Abrir Modal Detalhado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando order...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <p className="text-destructive">
                Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {orderDetail?.raw_order && (
        <div className="space-y-6">
          {/* Resumo do order */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order ML-{orderDetail.raw_order.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(orderDetail.raw_order.status)}>
                    {orderDetail.raw_order.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                  <p className="font-semibold">
                    {formatCurrency(orderDetail.raw_order.total_amount, orderDetail.raw_order.currency_id)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Comprador</Label>
                  <p>{orderDetail.raw_order.buyer?.nickname || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pack ID</Label>
                  <p>{orderDetail.raw_order.pack_id || 'Nenhum'}</p>
                </div>
              </div>

              <Separator />

              {/* Summary extraído */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Resumo Extraído</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="text-sm">
                    {JSON.stringify(
                      MercadoLivreOrderService.extractOrderSummary(orderDetail.raw_order), 
                      null, 
                      2
                    )}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos específicos que agora conseguimos acessar */}
          <Card>
            <CardHeader>
              <CardTitle>Campos Adicionais Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações do Order */}
                <div className="space-y-3">
                  <h4 className="font-medium">Informações do Order</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Buying Mode:</strong> {orderDetail.raw_order.buying_mode || 'N/A'}</div>
                    <div><strong>Fulfilled:</strong> {orderDetail.raw_order.fulfilled ? 'Sim' : 'Não'}</div>
                    <div><strong>Manufacturing Ending:</strong> {orderDetail.raw_order.manufacturing_ending_date || 'N/A'}</div>
                    <div><strong>Shipping Cost:</strong> {formatCurrency(orderDetail.raw_order.shipping_cost || 0)}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <h4 className="font-medium">Tags ({orderDetail.raw_order.tags?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1">
                    {orderDetail.raw_order.tags?.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    )) || <span className="text-sm text-muted-foreground">Nenhuma tag</span>}
                  </div>
                </div>

                {/* Order Items Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">Items ({orderDetail.raw_order.order_items?.length || 0})</h4>
                  {orderDetail.raw_order.order_items?.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-sm">
                      <div><strong>SKU:</strong> {item.item.seller_sku || 'N/A'}</div>
                      <div><strong>Sale Fee:</strong> {formatCurrency(item.sale_fee || 0)}</div>
                      <div><strong>Listing Type:</strong> {item.listing_type_id}</div>
                    </div>
                  ))}
                </div>

                {/* Payments */}
                <div className="space-y-3">
                  <h4 className="font-medium">Pagamentos ({orderDetail.raw_order.payments?.length || 0})</h4>
                  {orderDetail.raw_order.payments?.slice(0, 2).map((payment: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-sm">
                      <div><strong>Método:</strong> {payment.payment_method_id}</div>
                      <div><strong>Marketplace Fee:</strong> {formatCurrency(payment.marketplace_fee || 0)}</div>
                      <div><strong>Parcelas:</strong> {payment.installments}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados brutos completos */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Brutos Completos</CardTitle>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer font-medium mb-4">
                  Clique para expandir JSON completo
                </summary>
                <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded">
                  {JSON.stringify(orderDetail.raw_order, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal detalhado */}
      {modalOpen && orderId && accountId && (
        <MLOrderDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orderId={orderId}
          integrationAccountId={accountId}
        />
      )}
    </div>
  );
}