/**
 * 📊 DEFINIÇÕES DE COLUNAS - VENDAS ONLINE
 * TanStack React Table Column Definitions
 */

import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExternalLink, History, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MLOrder } from '../types/vendas.types';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import { getOrderStatusLabel, getShippingStatusLabel } from '../utils/statusMapping';
import { formatShippingStatus, formatLogisticType, formatSubstatus } from '@/utils/orderFormatters';
import type { StatusAnalise } from '../types/venda-analise.types';

const columnHelper = createColumnHelper<MLOrder>();

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

// Props compartilhadas
interface ColumnContext {
  onStatusChange?: (orderId: string, newStatus: StatusAnalise) => void;
  onOpenAnotacoes?: (order: MLOrder) => void;
  anotacoes?: Record<string, string>;
}

export const createVendasColumns = (context: ColumnContext) => [
  // ========== ANÁLISE ==========
  columnHelper.accessor('id', {
    id: 'status_analise',
    header: 'Análise',
    cell: ({ row }) => {
      if (!context.onStatusChange) return null;
      return (
        <StatusAnaliseSelect
          value={(row.original as any).status_analise_local || 'pendente'}
          onChange={(newStatus) => context.onStatusChange!(row.original.id.toString(), newStatus)}
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
      const hasAnotacao = context.anotacoes?.[row.original.id.toString()]?.trim().length > 0;
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
      <span className="font-medium">{(row.original as any).account_name || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== IDENTIFICAÇÃO ==========
  columnHelper.accessor('id', {
    id: 'order_id',
    header: 'ID Pedido',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue()}</span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.accessor('pack_id', {
    id: 'pack_id',
    header: 'Pack ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue() || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  // ========== STATUS ==========
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge variant={getStatusVariant(getValue())}>
        {getOrderStatusLabel(getValue())}
      </Badge>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
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

  columnHelper.accessor('last_updated', {
    id: 'last_updated',
    header: 'Última Atualização',
    cell: ({ getValue }) => (
      <span className="text-xs">{getValue() ? formatDateTime(getValue()) : '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.accessor('expiration_date', {
    id: 'expiration_date',
    header: 'Validade',
    cell: ({ getValue }) => (
      <span className="text-xs">{getValue() ? formatDateTime(getValue()) : '-'}</span>
    ),
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

  columnHelper.accessor('paid_amount', {
    id: 'paid_amount',
    header: 'Produto',
    cell: ({ getValue }) => formatCurrency(getValue() || 0),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'shipping_cost',
    header: 'Frete',
    cell: ({ row }) => {
      const payment = row.original.payments?.[0];
      const shipping = row.original.shipping;
      return formatCurrency(payment?.shipping_cost || shipping?.lead_time?.cost || 0);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'discount',
    header: 'Desconto',
    cell: ({ row }) => formatCurrency(row.original.coupon?.amount || row.original.coupon_amount || 0),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'sale_fee',
    header: 'Taxa ML',
    cell: ({ row }) => {
      const totalFee = row.original.order_items?.reduce((sum: number, item: any) => 
        sum + (item.sale_fee || 0), 0
      ) || 0;
      return formatCurrency(totalFee);
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== COMPRADOR ==========
  columnHelper.display({
    id: 'buyer_id',
    header: 'ID Comprador',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.buyer?.id || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'buyer_name',
    header: 'Nome Comprador',
    cell: ({ row }) => row.original.buyer?.nickname || row.original.buyer?.first_name || '-',
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== PRODUTO ==========
  columnHelper.display({
    id: 'item_id',
    header: 'ID Item',
    cell: ({ row }) => {
      const firstItem = row.original.order_items?.[0];
      return <span className="font-mono text-xs">{firstItem?.item?.id || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'item_title',
    header: 'Título Produto',
    cell: ({ row }) => {
      const firstItem = row.original.order_items?.[0];
      return (
        <div className="max-w-[250px] whitespace-normal break-words">
          {firstItem?.item?.title || '-'}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  columnHelper.display({
    id: 'quantity',
    header: 'Quantidade',
    cell: ({ row }) => {
      const firstItem = row.original.order_items?.[0];
      return <div className="text-center">{firstItem?.quantity || '-'}</div>;
    },
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'seller_sku',
    header: 'SKU',
    cell: ({ row }) => {
      const firstItem = row.original.order_items?.[0];
      return <span className="font-mono text-xs">{firstItem?.item?.seller_sku || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[200px]' }
  }),

  columnHelper.display({
    id: 'category_id',
    header: 'Categoria',
    cell: ({ row }) => {
      const firstItem = row.original.order_items?.[0];
      return <span className="text-xs">{firstItem?.item?.category_id || '-'}</span>;
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== PAGAMENTO ==========
  columnHelper.display({
    id: 'payment_status',
    header: 'Status Pagamento',
    cell: ({ row }) => {
      const payment = row.original.payments?.[0];
      if (!payment?.status) return '-';
      return (
        <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
          {payment.status}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== ENVIO ==========
  columnHelper.display({
    id: 'shipping_id',
    header: 'ID Envio',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.shipping?.id || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'shipping_status',
    header: 'Status Envio',
    cell: ({ row }) => {
      const shipping = row.original.shipping;
      if (!shipping?.status) return '-';
      return (
        <Badge variant={getStatusVariant(shipping.status)}>
          {formatShippingStatus(shipping.status)}
        </Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'logistic_type',
    header: 'Tipo Logístico',
    cell: ({ row }) => {
      const shipping = row.original.shipping;
      return (
        <span className="text-xs">
          {formatLogisticType(shipping?.logistic?.type || row.original.logistic_type || '-')}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'substatus',
    header: 'Substatus',
    cell: ({ row }) => {
      const shipping = row.original.shipping;
      return (
        <span className="text-xs">
          {formatSubstatus(shipping?.substatus || row.original.shipping_substatus || '-')}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'shipping_method',
    header: 'Método Envio',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.shipping?.lead_time?.shipping_method?.name || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'tracking_number',
    header: 'Código Rastreio',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.shipping?.tracking_number || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[200px]' }
  }),

  columnHelper.display({
    id: 'tracking_method',
    header: 'Transportadora',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.shipping?.tracking_method || '-'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'estimated_delivery',
    header: 'Previsão Entrega',
    cell: ({ row }) => {
      const deliveryDate = row.original.shipping?.lead_time?.estimated_delivery_time?.date;
      return (
        <span className="text-xs">{deliveryDate ? formatDateTime(deliveryDate) : '-'}</span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'status_history',
    header: 'Histórico Status',
    cell: ({ row }) => {
      const shipping = row.original.shipping;
      if (!shipping?.status_history || shipping.status_history.length === 0) return '-';
      
      return (
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
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== ENDEREÇO ==========
  columnHelper.display({
    id: 'city',
    header: 'Cidade',
    cell: ({ row }) => row.original.shipping?.destination?.shipping_address?.city?.name || '-',
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  columnHelper.display({
    id: 'state',
    header: 'Estado',
    cell: ({ row }) => row.original.shipping?.destination?.shipping_address?.state?.id || '-',
    meta: { headerClassName: 'min-w-[80px]' }
  }),

  columnHelper.display({
    id: 'zip_code',
    header: 'CEP',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.shipping?.destination?.shipping_address?.zip_code || '-'}
      </span>
    ),
    meta: { headerClassName: 'min-w-[100px]' }
  }),

  columnHelper.display({
    id: 'address_line',
    header: 'Endereço',
    cell: ({ row }) => {
      const address = row.original.shipping?.destination?.shipping_address?.address_line;
      return (
        <div className="max-w-[250px] truncate" title={address}>
          {address || '-'}
        </div>
      );
    },
    meta: { headerClassName: 'min-w-[250px]' }
  }),

  // ========== FULFILLMENT & MEDIAÇÕES ==========
  columnHelper.accessor('fulfilled', {
    id: 'fulfilled',
    header: 'Fulfillment',
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return '-';
      return value ? (
        <Badge variant="default">Sim</Badge>
      ) : (
        <Badge variant="outline">Não</Badge>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'mediations',
    header: 'Mediações',
    cell: ({ row }) => {
      const mediations = row.original.mediations;
      return (
        <span className="text-xs">
          {mediations && mediations.length > 0 ? `${mediations.length} mediação(ões)` : '-'}
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  // ========== SHIPPING EXTRA ==========
  columnHelper.display({
    id: 'list_cost',
    header: 'Custo Frete Listado',
    cell: ({ row }) => {
      const listCost = row.original.shipping?.lead_time?.list_cost;
      return listCost ? formatCurrency(listCost) : '-';
    },
    meta: { headerClassName: 'min-w-[120px]' }
  }),

  columnHelper.display({
    id: 'dimensions',
    header: 'Dimensões Pacote',
    cell: ({ row }) => {
      const dims = row.original.shipping?.dimensions;
      if (!dims) return '-';
      return (
        <span className="text-xs">
          {dims.width}x{dims.length}x{dims.height} cm ({dims.weight}g)
        </span>
      );
    },
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== OUTROS ==========
  columnHelper.display({
    id: 'order_type',
    header: 'Tipo Pedido',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.order_request?.return ? 'Devolução' : 'Normal'}</span>
    ),
    meta: { headerClassName: 'min-w-[150px]' }
  }),

  // ========== AÇÕES ==========
  columnHelper.display({
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(`https://www.mercadolivre.com.br/vendas/${row.original.id}/detalle`, '_blank')}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    ),
    meta: { headerClassName: 'min-w-[80px]' }
  }),
];
