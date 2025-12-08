/**
 * 📊 DEFINIÇÕES DE COLUNAS - VENDAS COM ENVIO
 * CÓPIA EXATA de VendasTableColumns.tsx de /vendas-canceladas
 */

import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExternalLink, History, FileText, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { VendaComEnvio } from '../types';

const columnHelper = createColumnHelper<VendaComEnvio>();

// Utilitários de formatação
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

const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'paid': 'Pago',
    'pending': 'Pendente',
    'cancelled': 'Cancelado',
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando',
    'invalid': 'Inválido',
  };
  return labels[status] || status;
};

const getShippingStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Pendente',
    'ready_to_ship': 'Pronto para Enviar',
    'handling': 'Em Processamento',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
  };
  return labels[status] || status;
};

const formatLogisticType = (type: string): string => {
  const labels: Record<string, string> = {
    'fulfillment': 'Full',
    'xd_drop_off': 'Coleta',
    'self_service': 'Próprio',
    'drop_off': 'Drop Off',
    'cross_docking': 'Cross Docking',
  };
  return labels[type] || type;
};

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'approved': 'Aprovado',
    'pending': 'Pendente',
    'rejected': 'Rejeitado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'in_mediation': 'Em Mediação',
    'charged_back': 'Estornado',
  };
  return labels[status] || status;
};

// Props compartilhadas
interface ColumnContext {
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onOpenAnotacoes?: (order: VendaComEnvio) => void;
  anotacoes?: Record<string, string>;
}

export const createVendasComEnvioColumns = (context: ColumnContext) => [
  // ========== ANÁLISE ==========
  columnHelper.accessor('id', {
    id: 'status_analise',
    header: 'Análise',
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="text-xs">
          Pendente
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[180px]' }
  }),

  // ========== ANOTAÇÕES ==========
  columnHelper.display({
    id: 'anotacoes',
    header: 'Anotações',
    cell: ({ row }) => {
      const hasAnotacao = context.anotacoes?.[row.original.id]?.trim().length > 0;
      return (
        <div className="text-center">
          <Button
            variant={hasAnotacao ? 'default' : 'ghost'}
            size="sm"
            onClick={() => context.onOpenAnotacoes?.(row.original)}
            className="h-8 w-8 p-0"
            title={hasAnotacao ? 'Ver/Editar anotações' : 'Adicionar anotações'}
          >
            <FileText className={`h-4 w-4 ${hasAnotacao ? '' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      );
    },
    meta: { headerClassName: 'text-center min-w-[80px]' }
  }),

  // ========== EMPRESA ==========
  columnHelper.display({
    id: 'account_name',
    header: 'Empresa',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.account_name || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== IDENTIFICAÇÃO ==========
  columnHelper.accessor('order_id', {
    id: 'order_id',
    header: 'ID Pedido',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue()}</span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'pack_id',
    header: 'Pack ID',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="font-mono text-xs">{orderData?.pack_id || '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  // ========== STATUS ==========
  columnHelper.accessor('order_status', {
    id: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge variant={getStatusVariant(getValue())}>
        {getOrderStatusLabel(getValue())}
      </Badge>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== TIPO PEDIDO ==========
  columnHelper.display({
    id: 'order_type',
    header: 'Tipo Pedido',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const orderType = orderData?.manufacturing_ending_date ? 'Sob Encomenda' : 'Normal';
      return <span className="text-xs">{orderType}</span>;
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== DATAS ==========
  columnHelper.accessor('date_created', {
    id: 'date_created',
    header: 'Data Criação',
    cell: ({ getValue }) => (
      <span className="text-xs">{formatDateTime(getValue())}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'last_updated',
    header: 'Última Atualização',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="text-xs">
          {orderData?.last_updated ? formatDateTime(orderData.last_updated) : '-'}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'expiration_date',
    header: 'Validade',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="text-xs">
          {orderData?.expiration_date ? formatDateTime(orderData.expiration_date) : '-'}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== VALORES ==========
  columnHelper.accessor('total_amount', {
    id: 'total_amount',
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-semibold">{formatCurrency(getValue() || 0)}</span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'paid_amount',
    header: 'Produto',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return formatCurrency(orderData?.paid_amount || row.original.total_amount || 0);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'shipping_cost',
    header: 'Frete',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const payment = orderData?.payments?.[0];
      const shipping = orderData?.shipping;
      return formatCurrency(payment?.shipping_cost || shipping?.lead_time?.cost || 0);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'discount',
    header: 'Desconto',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const couponAmount = orderData?.coupon?.amount || 0;
      return formatCurrency(couponAmount);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'sale_fee',
    header: 'Taxa ML',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const totalFee = orderData?.order_items?.reduce((sum: number, item: any) => 
        sum + (item.sale_fee || 0), 0
      ) || 0;
      return formatCurrency(totalFee);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'payment_status',
    header: 'Status Pagamento',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const payment = orderData?.payments?.[0];
      if (!payment?.status) return '-';
      return (
        <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
          {getPaymentStatusLabel(payment.status)}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'list_cost',
    header: 'Custo Frete Listado',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const listCost = orderData?.shipping?.shipping_option?.list_cost || 0;
      return formatCurrency(listCost);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== COMPRADOR ==========
  columnHelper.display({
    id: 'buyer_id',
    header: 'ID Comprador',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.buyer_id || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'buyer_name',
    header: 'Nome Comprador',
    cell: ({ row }) => row.original.buyer_nickname || row.original.buyer_name || '-',
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== PRODUTO ==========
  columnHelper.display({
    id: 'item_id',
    header: 'ID Item',
    cell: ({ row }) => {
      const items = row.original.items as any[];
      const firstItem = items?.[0];
      return (
        <span className="font-mono text-xs">{firstItem?.item?.id || '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'item_title',
    header: 'Título Produto',
    cell: ({ row }) => {
      const items = row.original.items as any[];
      const firstItem = items?.[0];
      return (
        <div className="max-w-[250px] whitespace-normal break-words">
          {firstItem?.title || firstItem?.item?.title || '-'}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  columnHelper.display({
    id: 'quantity',
    header: 'Quantidade',
    cell: ({ row }) => (
      <div className="text-center">{row.original.items_quantity || '-'}</div>
    ),
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'seller_sku',
    header: 'SKU',
    cell: ({ row }) => {
      const items = row.original.items as any[];
      const firstItem = items?.[0];
      return <span className="font-mono text-xs">{firstItem?.sku || firstItem?.item?.seller_sku || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[200px]' }
  }),

  columnHelper.display({
    id: 'category_id',
    header: 'Categoria',
    cell: ({ row }) => {
      const items = row.original.items as any[];
      const firstItem = items?.[0];
      return <span className="text-xs">{firstItem?.item?.category_id || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== ENVIO ==========
  columnHelper.display({
    id: 'shipping_id',
    header: 'ID Envio',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.shipment_id || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.accessor('shipping_status', {
    id: 'shipping_status',
    header: 'Status Envio',
    cell: ({ getValue }) => {
      const status = getValue();
      if (!status) return '-';
      return (
        <Badge variant={getStatusVariant(status)}>
          {getShippingStatusLabel(status)}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.accessor('logistic_type', {
    id: 'logistic_type',
    header: 'Tipo Logístico',
    cell: ({ getValue }) => (
      <span className="text-xs">
        {formatLogisticType(getValue() || '-')}
      </span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'substatus',
    header: 'Substatus',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return <span className="text-xs">{orderData?.shipping?.substatus || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'shipping_method',
    header: 'Método Envio',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return <span className="text-xs">{orderData?.shipping?.shipping_method?.name || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'tracking_number',
    header: 'Código Rastreio',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.tracking_number || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[200px]' }
  }),

  columnHelper.display({
    id: 'tracking_method',
    header: 'Transportadora',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.carrier || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'estimated_delivery',
    header: 'Previsão Entrega',
    cell: ({ row }) => {
      const deadline = row.original.shipping_deadline;
      return (
        <span className="text-xs">{deadline ? formatDateTime(deadline) : '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'status_history',
    header: 'Histórico Status',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const history = orderData?.shipping?.status_history;
      if (!history?.length) return '-';
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <History className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Histórico de Status</h4>
              {history.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="text-xs border-b pb-1">
                  <span className="font-medium">{item.status}</span>
                  {item.date_created && (
                    <span className="text-muted-foreground ml-2">
                      {formatDateTime(item.date_created)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== ENDEREÇO ==========
  columnHelper.display({
    id: 'city',
    header: 'Cidade',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return orderData?.shipping?.destination?.shipping_address?.city?.name || '-';
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return orderData?.shipping?.destination?.shipping_address?.state?.id || '-';
    },
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'zip_code',
    header: 'CEP',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="font-mono text-xs">
          {orderData?.shipping?.destination?.shipping_address?.zip_code || '-'}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'address_line',
    header: 'Endereço',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const addr = orderData?.shipping?.destination?.shipping_address;
      if (!addr) return '-';
      return (
        <span className="text-xs max-w-[250px] truncate block">
          {addr.address_line || `${addr.street_name || ''} ${addr.street_number || ''}`}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  // ========== METADADOS ==========
  columnHelper.display({
    id: 'fulfilled',
    header: 'Fulfillment',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const isFulfilled = orderData?.fulfilled || row.original.logistic_type === 'fulfillment';
      return (
        <div className="text-center">
          {isFulfilled ? (
            <Badge variant="default" className="text-xs">
              <Check className="h-3 w-3 mr-1" /> Sim
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <X className="h-3 w-3 mr-1" /> Não
            </Badge>
          )}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'mediations',
    header: 'Mediações',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const mediations = orderData?.mediations || [];
      return (
        <div className="text-center">
          <Badge variant={mediations.length > 0 ? 'destructive' : 'outline'} className="text-xs">
            {mediations.length}
          </Badge>
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'dimensions',
    header: 'Dimensões Pacote',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const dim = orderData?.shipping?.dimensions;
      if (!dim) return '-';
      return (
        <span className="text-xs">
          {dim.length}x{dim.width}x{dim.height}cm ({dim.weight}kg)
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== AÇÕES ==========
  columnHelper.display({
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.open(`https://www.mercadolivre.com.br/vendas/${row.original.order_id}/detalhe`, '_blank')}
          title="Ver no Mercado Livre"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    ),
    meta: { headerClassName: 'min-w-[80px]' }
  }),
];
