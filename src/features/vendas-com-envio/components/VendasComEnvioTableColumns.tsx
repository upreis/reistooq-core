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
import { formatSubstatus as formatSubstatusUtil, formatLogisticType as formatLogisticTypeUtil } from '@/utils/orderFormatters';

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

// Usar formatadores centralizados importados de @/utils/orderFormatters

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
    header: 'Data do Pedido',
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

  // ========== NOME COMPLETO (padrão /pedidos) ==========
  columnHelper.display({
    id: 'nome_completo',
    header: 'Nome Completo',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      // Mesma lógica de /pedidos: prioriza receiver_name do shipping
      const fullName = (
        orderData?.shipping?.receiver_address?.receiver_name ||
        orderData?.shipping?.receiver_address?.name ||
        orderData?.shipping?.destination?.receiver_name ||
        row.original.buyer_name ||
        ((orderData?.buyer?.first_name || orderData?.buyer?.last_name)
          ? `${orderData?.buyer?.first_name ?? ''} ${orderData?.buyer?.last_name ?? ''}`.trim()
          : undefined) ||
        row.original.buyer_nickname ||
        orderData?.buyer?.nickname
      );
      return (
        <div className="max-w-xs truncate" title={fullName || ''}>
          {fullName || '-'}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[180px]' }
  }),

  columnHelper.accessor('buyer_name', {
    id: 'buyer_name',
    header: 'Nome Comprador',
    cell: ({ row }) => {
      return row.original.buyer_name || row.original.buyer_nickname || '-';
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'buyer_nickname',
    header: 'Nickname',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return row.original.buyer_nickname || orderData?.buyer?.nickname || '-';
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'buyer_email',
    header: 'Email',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      return orderData?.buyer?.email || '-';
    },
    meta: { headerClassName: 'min-w-[180px]' }
  }),

  columnHelper.display({
    id: 'buyer_phone',
    header: 'Telefone',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const phone = orderData?.buyer?.phone?.number || orderData?.buyer?.phone;
      return phone || '-';
    },
    meta: { headerClassName: 'min-w-[120px]' }
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

  columnHelper.display({
    id: 'variation_id',
    header: 'ID Variação',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      return <span className="font-mono text-xs">{firstItem?.item?.variation_id || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'variation_attributes',
    header: 'Variação',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const firstItem = orderData?.order_items?.[0];
      const attrs = firstItem?.item?.variation_attributes;
      if (!attrs || attrs.length === 0) return '-';
      return (
        <span className="text-xs">
          {attrs.map((a: any) => `${a.name}: ${a.value_name}`).join(', ')}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
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
          {formatLogisticTypeUtil(type || '-')}
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
      return <span className="text-xs">{formatSubstatusUtil(substatus || '-')}</span>;
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

  columnHelper.display({
    id: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const tags = orderData?.tags || (row.original as any).tags;
      if (!tags || tags.length === 0) return '-';
      return (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(tags) ? tags : [tags]).slice(0, 3).map((tag: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 text-xs bg-muted rounded">
              {tag}
            </span>
          ))}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== ENDEREÇO ==========
  columnHelper.display({
    id: 'city',
    header: 'Cidade',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const city = orderData?.shipping?.receiver_address?.city?.name;
      return <span className="text-xs">{city || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const state = orderData?.shipping?.receiver_address?.state?.id || orderData?.shipping?.receiver_address?.state?.name;
      return <span className="text-xs">{state || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'zip_code',
    header: 'CEP',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const zipCode = orderData?.shipping?.receiver_address?.zip_code;
      return <span className="font-mono text-xs">{zipCode || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'address_line',
    header: 'Endereço',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const address = orderData?.shipping?.receiver_address;
      if (!address) return '-';
      const line = [address.street_name, address.street_number].filter(Boolean).join(', ');
      return <span className="text-xs max-w-[250px] truncate" title={line}>{line || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  // ========== METADADOS ==========
  columnHelper.display({
    id: 'fulfilled',
    header: 'Fulfillment',
    cell: ({ row }) => {
      const orderData = row.original.order_data as any;
      const isFulfillment = orderData?.shipping?.logistic_type === 'fulfillment' || 
                           orderData?.shipping?.logistic?.type === 'fulfillment' ||
                           orderData?.fulfilled === true;
      return (
        <Badge variant={isFulfillment ? 'default' : 'secondary'}>
          {isFulfillment ? 'Sim' : 'Não'}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
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
