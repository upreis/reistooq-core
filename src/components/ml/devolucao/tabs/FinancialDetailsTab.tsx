import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingDown, Calculator, Receipt } from 'lucide-react';
import { formatCurrency } from '@/features/devolucoes/utils/extractDevolucaoData';

interface FinancialDetailsTabProps {
  devolucao: any;
}

export const FinancialDetailsTab: React.FC<FinancialDetailsTabProps> = ({ devolucao }) => {
  const payments = devolucao?.dados_order?.payments || [];
  const orderItems = devolucao?.dados_order?.order_items || [];
  const totalAmount = devolucao?.dados_order?.total_amount || 0;
  const paidAmount = devolucao?.dados_order?.paid_amount || 0;

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa ML</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(orderItems[0]?.sale_fee || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calculator className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Envio</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(devolucao?.custo_envio_devolucao || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detalhes de Pagamentos ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{payment.payment_method_id?.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{payment.payment_type}</p>
                    </div>
                  </div>
                  <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'refunded' ? 'destructive' : 'secondary'}>
                    {payment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Transação</p>
                    <p className="font-semibold">{formatCurrency(payment.transaction_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frete</p>
                    <p className="font-semibold">{formatCurrency(payment.shipping_cost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa Marketplace</p>
                    <p className="font-semibold text-purple-600 dark:text-purple-400">
                      -{formatCurrency(payment.marketplace_fee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parcelas</p>
                    <p className="font-semibold">{payment.installments}x</p>
                  </div>
                </div>

                {payment.date_approved && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Aprovado em:</p>
                    <p className="font-medium">{new Date(payment.date_approved).toLocaleString('pt-BR')}</p>
                  </div>
                )}

                {payment.transaction_amount_refunded > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Valor Reembolsado: {formatCurrency(payment.transaction_amount_refunded)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custos de Devolução/Troca */}
      {(devolucao?.custo_envio_devolucao || devolucao?.valor_compensacao) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Custos de Devolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {devolucao.custo_envio_devolucao && (
                <div>
                  <p className="text-sm text-muted-foreground">Custo de Envio</p>
                  <p className="text-lg font-bold">{formatCurrency(devolucao.custo_envio_devolucao)}</p>
                </div>
              )}
              {devolucao.valor_compensacao && (
                <div>
                  <p className="text-sm text-muted-foreground">Compensação</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(devolucao.valor_compensacao)}
                  </p>
                </div>
              )}
              {devolucao.responsavel_custo && (
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <Badge>{devolucao.responsavel_custo}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes dos Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orderItems.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{item.item?.title}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.item?.seller_sku || 'N/A'}</p>
                    {item.item?.warranty && (
                      <p className="text-xs text-muted-foreground mt-1">Garantia: {item.item.warranty}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(item.unit_price)}</p>
                    <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo Anúncio</p>
                    <Badge variant="outline">{item.listing_type_id}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa Venda</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(item.sale_fee)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preço Cheio</p>
                    <p className="font-semibold">{formatCurrency(item.full_unit_price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Condição</p>
                    <Badge variant="secondary">{item.item?.condition}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
