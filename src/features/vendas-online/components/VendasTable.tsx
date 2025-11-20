/**
 * 📊 VENDAS TABLE
 * Tabela completa com todas as colunas possíveis da API do Mercado Livre
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MLOrder } from '../types/vendas.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getOrderStatusLabel, getShippingStatusLabel, getShippingSubstatusLabel, getShippingSubstatusDescription } from '../utils/statusMapping';
import { formatShippingStatus, formatLogisticType, formatSubstatus } from '@/utils/orderFormatters';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import type { StatusAnalise } from '../types/venda-analise.types';

interface VendasTableProps {
  orders: MLOrder[];
  total: number;
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (orderId: string, newStatus: StatusAnalise) => void;
  activeTab?: 'ativas' | 'historico';
}

export const VendasTable = ({
  orders,
  total,
  loading,
  currentPage,
  itemsPerPage,
  onPageChange,
  onStatusChange,
  activeTab
}: VendasTableProps) => {
  const totalPages = Math.ceil(total / itemsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum pedido encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* ANÁLISE */}
              <TableHead className="min-w-[180px]">📊 Análise</TableHead>
              
              {/* EMPRESA */}
              <TableHead className="min-w-[150px]">Empresa</TableHead>
              
              {/* IDENTIFICAÇÃO */}
              <TableHead className="min-w-[120px]">ID Pedido</TableHead>
              <TableHead className="min-w-[100px]">Pack ID</TableHead>
              
              {/* STATUS */}
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Status Detail</TableHead>
              
              {/* DATAS */}
              <TableHead className="min-w-[150px]">Data Criação</TableHead>
              <TableHead className="min-w-[150px]">Data Fechamento</TableHead>
              <TableHead className="min-w-[150px]">Última Atualização</TableHead>
              <TableHead className="min-w-[150px]">Validade</TableHead>
              
              {/* VALORES */}
              <TableHead className="min-w-[120px]">Total</TableHead>
              <TableHead className="min-w-[120px]">Produto</TableHead>
              <TableHead className="min-w-[120px]">Frete</TableHead>
              <TableHead className="min-w-[120px]">Desconto</TableHead>
              <TableHead className="min-w-[120px]">Taxa ML</TableHead>
              
              {/* COMPRADOR */}
              <TableHead className="min-w-[100px]">ID Comprador</TableHead>
              <TableHead className="min-w-[150px]">Nome Comprador</TableHead>
              
              {/* PRODUTO */}
              <TableHead className="min-w-[100px]">ID Item</TableHead>
              <TableHead className="min-w-[250px]">Título Produto</TableHead>
              <TableHead className="min-w-[80px]">Quantidade</TableHead>
              <TableHead className="min-w-[100px]">SKU</TableHead>
              <TableHead className="min-w-[120px]">Categoria</TableHead>
              <TableHead className="min-w-[120px]">Condição</TableHead>
              <TableHead className="min-w-[100px]">Garantia</TableHead>
              
              {/* PAGAMENTO */}
              <TableHead className="min-w-[120px]">Método Pagamento</TableHead>
              <TableHead className="min-w-[120px]">Tipo Pagamento</TableHead>
              <TableHead className="min-w-[80px]">Parcelas</TableHead>
              <TableHead className="min-w-[120px]">Status Pagamento</TableHead>
              
              {/* ENVIO */}
              <TableHead className="min-w-[120px]">ID Envio</TableHead>
              <TableHead className="min-w-[120px]">Status Envio</TableHead>
              <TableHead className="min-w-[120px]">Tipo Logístico</TableHead>
              <TableHead className="min-w-[120px]">Substatus</TableHead>
              <TableHead className="min-w-[150px]">Método Envio</TableHead>
              <TableHead className="min-w-[200px]">Código Rastreio</TableHead>
              <TableHead className="min-w-[150px]">Transportadora</TableHead>
              <TableHead className="min-w-[150px]">Previsão Entrega</TableHead>
              <TableHead className="min-w-[120px]">Histórico Status</TableHead>
              
              {/* ENDEREÇO */}
              <TableHead className="min-w-[150px]">Cidade</TableHead>
              <TableHead className="min-w-[80px]">Estado</TableHead>
              <TableHead className="min-w-[100px]">CEP</TableHead>
              <TableHead className="min-w-[250px]">Endereço</TableHead>
              
              {/* FULFILLMENT & MEDIAÇÕES */}
              <TableHead className="min-w-[120px]">Fulfillment</TableHead>
              <TableHead className="min-w-[120px]">Mediações</TableHead>
              
              {/* SHIPPING EXTRA */}
              <TableHead className="min-w-[120px]">Custo Frete Listado</TableHead>
              <TableHead className="min-w-[150px]">Dimensões Pacote</TableHead>
              
              
              {/* OUTROS */}
              <TableHead className="w-[350px] min-w-[350px] max-w-[350px]">Tags</TableHead>
              <TableHead className="min-w-[150px]">Tipo Pedido</TableHead>
              <TableHead className="min-w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const firstItem = order.order_items?.[0];
              const buyer = order.buyer;
              const shipping = order.shipping;
              const payment = order.payments?.[0];
              const shippingAddress = shipping?.destination?.shipping_address;

              return (
                <TableRow key={order.id}>
                  {/* ANÁLISE */}
                  <TableCell>
                    {onStatusChange && (
                      <StatusAnaliseSelect
                        value={(order as any).status_analise_local || 'pendente'}
                        onChange={(newStatus) => onStatusChange(order.id.toString(), newStatus)}
                        allowedStatuses={activeTab === 'ativas' 
                          ? ['pendente', 'em_analise', 'aguardando_ml'] 
                          : ['resolvido_sem_dinheiro', 'resolvido_com_dinheiro', 'cancelado']
                        }
                      />
                    )}
                  </TableCell>
                  
                  {/* EMPRESA */}
                  <TableCell>
                    <span className="text-sm font-medium">{(order as any).account_name || '-'}</span>
                  </TableCell>
                  
                  {/* IDENTIFICAÇÃO */}
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell className="font-mono text-xs">{order.pack_id || '-'}</TableCell>
                  
                  {/* STATUS */}
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {order.status_detail 
                      ? (typeof order.status_detail === 'object' 
                          ? order.status_detail?.description || order.status_detail?.code || '-'
                          : order.status_detail)
                      : '-'}
                  </TableCell>
                  
                  {/* DATAS */}
                  <TableCell className="text-xs">{formatDateTime(order.date_created)}</TableCell>
                  <TableCell className="text-xs">{order.date_closed ? formatDateTime(order.date_closed) : '-'}</TableCell>
                  <TableCell className="text-xs">{order.last_updated ? formatDateTime(order.last_updated) : '-'}</TableCell>
                  <TableCell className="text-xs">{order.expiration_date ? formatDateTime(order.expiration_date) : '-'}</TableCell>
                  
                  {/* VALORES */}
                  <TableCell className="font-semibold">{formatCurrency(order.total_amount || 0)}</TableCell>
                  <TableCell>{formatCurrency(order.paid_amount || 0)}</TableCell>
                  <TableCell>{formatCurrency(payment?.shipping_cost || shipping?.lead_time?.cost || 0)}</TableCell>
                  <TableCell>{formatCurrency(order.coupon?.amount || order.coupon_amount || 0)}</TableCell>
                  <TableCell>
                    {formatCurrency(
                      order.order_items?.reduce((sum: number, item: any) => 
                        sum + (item.sale_fee || 0), 0
                      ) || 0
                    )}
                  </TableCell>
                  
                  {/* COMPRADOR */}
                  <TableCell className="font-mono text-xs">{buyer?.id || '-'}</TableCell>
                  <TableCell>{buyer?.nickname || buyer?.first_name || '-'}</TableCell>
                  
                  {/* PRODUTO */}
                  <TableCell className="font-mono text-xs">{firstItem?.item?.id || '-'}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate" title={firstItem?.item?.title}>
                      {firstItem?.item?.title || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{firstItem?.quantity || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{firstItem?.item?.seller_sku || '-'}</TableCell>
                  <TableCell className="text-xs">{firstItem?.item?.category_id || '-'}</TableCell>
                  <TableCell className="text-xs">{firstItem?.item?.condition || '-'}</TableCell>
                  <TableCell className="text-xs">{firstItem?.item?.warranty || '-'}</TableCell>
                  
                  {/* PAGAMENTO */}
                  <TableCell className="text-xs">{payment?.payment_method_id || '-'}</TableCell>
                  <TableCell className="text-xs">{payment?.payment_type || '-'}</TableCell>
                  <TableCell className="text-center">{payment?.installments || '-'}</TableCell>
                  <TableCell>
                    {payment?.status && (
                      <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    )}
                  </TableCell>
                  
                  {/* ENVIO */}
                  <TableCell className="font-mono text-xs">{shipping?.id || '-'}</TableCell>
                  <TableCell>
                    {shipping?.status ? (
                      <Badge variant={getStatusVariant(shipping.status)}>
                        {formatShippingStatus(shipping.status)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatLogisticType(
                      shipping?.logistic?.type || 
                      order.logistic_type || 
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatSubstatus(
                      shipping?.substatus || 
                      order.shipping_substatus || 
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{shipping?.lead_time?.shipping_method?.name || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{shipping?.tracking_number || '-'}</TableCell>
                  <TableCell className="text-xs">{shipping?.tracking_method || '-'}</TableCell>
                  <TableCell className="text-xs">
                    {shipping?.lead_time?.estimated_delivery_time?.date 
                      ? formatDateTime(shipping.lead_time.estimated_delivery_time.date) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {shipping?.status_history && shipping.status_history.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <History className="h-4 w-4 mr-1" />
                            {shipping.status_history.length} eventos
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96" align="start">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Histórico de Status</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {shipping.status_history.map((history: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-primary pl-3 pb-2">
                                  <div className="text-xs font-medium">
                                    {getShippingStatusLabel(history.status)}
                                  </div>
                                  {history.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {history.description}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatDateTime(history.date_time)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : '-'}
                  </TableCell>
                  
                  {/* ENDEREÇO */}
                  <TableCell>{shippingAddress?.city?.name || '-'}</TableCell>
                  <TableCell>{shippingAddress?.state?.id || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{shippingAddress?.zip_code || '-'}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate" title={shippingAddress?.address_line}>
                      {shippingAddress?.address_line || '-'}
                    </div>
                  </TableCell>
                  
                  {/* FULFILLMENT & MEDIAÇÕES */}
                  <TableCell>
                    {order.fulfilled !== null && order.fulfilled !== undefined ? (
                      order.fulfilled ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {order.mediations && order.mediations.length > 0 
                      ? `${order.mediations.length} mediação(ões)` 
                      : '-'}
                  </TableCell>
                  
                  {/* SHIPPING EXTRA */}
                  <TableCell>
                    {shipping?.lead_time?.list_cost
                      ? formatCurrency(shipping.lead_time.list_cost) 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {shipping?.dimensions 
                      ? `${shipping.dimensions.width}x${shipping.dimensions.length}x${shipping.dimensions.height} cm (${shipping.dimensions.weight}g)`
                      : '-'}
                  </TableCell>
                  
                  {/* OUTROS */}
                  <TableCell className="text-xs">
                    {order.tags && order.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {order.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs">{order.order_request?.return ? 'Devolução' : 'Normal'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://www.mercadolivre.com.br/vendas/${order.id}/detalle`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, total)} de {total} pedidos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
