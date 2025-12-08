/**
 * 📊 DEFINIÇÕES DE COLUNAS - VENDAS COM ENVIO
 * Mapeamento IDÊNTICO a VendasTableColumns.tsx de /vendas-canceladas
 * Acessa order_data para obter dados completos do ML
 */

import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExternalLink, History, FileText, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { VendaComEnvio } from '../types';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import { StatusAnalise } from '../types/venda-analise.types';

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
    return dateString || '-';
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'delivered':
    case 'approved':
      return 'default';
    case 'cancelled':
    case 'rejected':
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
  return labels[status] || status || '-';
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
  return labels[status] || status || '-';
};

const formatLogisticType = (type: string): string => {
  const labels: Record<string, string> = {
    'fulfillment': 'Full',
    'xd_drop_off': 'Coleta',
    'self_service': 'Próprio',
    'drop_off': 'Drop Off',
    'cross_docking': 'Cross Docking',
  };
  return labels[type] || type || '-';
};

const formatSubstatus = (substatus: string): string => {
  const labels: Record<string, string> = {
    'ready_to_print': 'Pronto para Imprimir',
    'printed': 'Etiqueta Impressa',
    'stale': 'Atrasado',
    'in_hub': 'No Hub',
    'waiting_for_withdrawal': 'Aguardando Retirada',
    'in_transit': 'Em Trânsito',
    'out_for_delivery': 'Saiu para Entrega',
    'soon_deliver': 'Em Breve',
  };
  return labels[substatus] || substatus || '-';
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
  return labels[status] || status || '-';
};

// Props compartilhadas
interface ColumnContext {
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onOpenAnotacoes?: (order: VendaComEnvio) => void;
  anotacoes?: Record<string, string>;
  statusAnalise?: Record<string, StatusAnalise>;
  onStatusAnaliseChange?: (orderId: string, newStatus: StatusAnalise) => void;
}

export const createVendasComEnvioColumns = (context: ColumnContext) => [
  // ========== ANÁLISE ==========
  columnHelper.accessor('id', {
    id: 'status_analise',
    header: 'Análise',
    cell: ({ row }) => {
      const statusAnalise = (context.statusAnalise?.[row.original.id] || 'pendente') as StatusAnalise;
      return (
        <StatusAnaliseSelect
          value={statusAnalise}
          onChange={(newStatus) => context.onStatusAnaliseChange?.(row.original.id, newStatus)}
          disabled={false}
        />
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
      <span className="text-xs">{getValue() ? formatDateTime(getValue()) : '-'}</span>
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
      const couponAmount = orderData?.coupon?.amount || orderData?.coupon_amount || 0;
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
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="font-mono text-xs">{orderData?.buyer?.id || row.original.buyer_id || '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'buyer_name',
    header: 'Nome Comprador',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const buyer = orderData?.buyer;
      return buyer?.nickname || buyer?.first_name || row.original.buyer_nickname || row.original.buyer_name || '-';
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== PRODUTO ==========
  columnHelper.display({
    id: 'item_id',
    header: 'ID Item',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
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
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      const items = row.original.items;
      return (
        <div className="max-w-[250px] whitespace-normal break-words">
          {firstItem?.item?.title || items?.[0]?.title || '-'}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  columnHelper.display({
    id: 'quantity',
    header: 'Quantidade',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      return <div className="text-center">{firstItem?.quantity || row.original.items_quantity || '-'}</div>;
    },
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'seller_sku',
    header: 'SKU',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      const items = row.original.items;
      return <span className="font-mono text-xs">{firstItem?.item?.seller_sku || items?.[0]?.sku || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[200px]' }
  }),

  columnHelper.display({
    id: 'category_id',
    header: 'Categoria',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      return <span className="text-xs">{firstItem?.item?.category_id || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== ENVIO ==========
  columnHelper.display({
    id: 'shipping_id',
    header: 'ID Envio',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return (
        <span className="font-mono text-xs">{orderData?.shipping?.id || row.original.shipment_id || '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.accessor('shipping_status', {
    id: 'shipping_status',
    header: 'Status Envio',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const status = orderData?.shipping?.status || row.original.shipping_status;
      if (!status) return '-';
      return (
        <Badge variant={getStatusVariant(status)}>
          {getShippingStatusLabel(status)}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== TIPO LOGÍSTICO (padrão /vendas-canceladas) ==========
  columnHelper.display({
    id: 'logistic_type',
    header: 'Tipo Logístico',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      // Mesmo padrão de /vendas-canceladas: shipping?.logistic?.type || row.original.logistic_type
      const type = orderData?.shipping?.logistic?.type || row.original.logistic_type;
      return (
        <span className="text-xs">
          {formatLogisticType(type || '-')}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== SUBSTATUS (padrão /vendas-canceladas) ==========
  columnHelper.display({
    id: 'substatus',
    header: 'Substatus',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      // Mesmo padrão de /vendas-canceladas: shipping?.substatus
      const substatus = orderData?.shipping?.substatus;
      return <span className="text-xs">{formatSubstatus(substatus || '-')}</span>;
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== CÓDIGO RASTREIO (padrão /vendas-canceladas) ==========
  columnHelper.display({
    id: 'tracking_number',
    header: 'Código Rastreio',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      // Mesmo padrão de /vendas-canceladas: shipping?.tracking_number
      const trackingNumber = orderData?.shipping?.tracking_number || row.original.tracking_number;
      return <span className="font-mono text-xs">{trackingNumber || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[200px]' }
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
