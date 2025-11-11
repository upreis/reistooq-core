/**
 * 📊 DEVOLUÇÃO TABLE - OTIMIZADA COM DEADLINES
 * Tabela de devoluções com memoização e prazos
 */

import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MLReturn } from '../types/devolucao.types';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { 
  EstimatedDeliveryCell, 
  DeliveryLimitCell, 
  ShipmentStatusCell, 
  RefundAtCell, 
  ReviewStatusCell, 
  QuantityCell 
} from '@/components/ml/devolucao/cells/DeliveryCells';
import { BuyerInfoCell } from './cells/BuyerInfoCell';
import { ProductInfoCell } from './cells/ProductInfoCell';
import { FinancialInfoCell } from './cells/FinancialInfoCell';
import { OrderInfoCell } from './cells/OrderInfoCell';
import { TrackingInfoCell } from './cells/TrackingInfoCell';
import { ReviewInfoCell } from './cells/ReviewInfoCell';
import { CommunicationInfoCell } from './cells/CommunicationInfoCell';
import { DeadlinesCell } from './cells/DeadlinesCell';
import { SubstatusCell } from './cells/SubstatusCell';
import { ActionsCell } from './cells/ActionsCell';
import { ShippingCostsCell } from './cells/ShippingCostsCell';
import { FulfillmentCell } from './cells/FulfillmentCell';
import {
  translateStatus,
  translateStatusMoney,
  translateSubtype,
  translateResourceType,
  translateShipmentStatus,
  getStatusVariant,
  getStatusMoneyVariant,
  getShipmentStatusVariant
} from '../utils/translations';

interface DevolucaoTableWithAnalise extends MLReturn {
  status_analise?: StatusAnalise;
  empresa?: string;
}

interface DevolucaoTableProps {
  devolucoes: DevolucaoTableWithAnalise[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (devolucaoId: string, newStatus: StatusAnalise) => void;
  onRefresh?: () => void;
}

export const DevolucaoTable = memo(({ devolucoes, isLoading, error, onStatusChange, onRefresh }: DevolucaoTableProps) => {

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-destructive">Erro ao carregar devoluções: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!devolucoes || devolucoes.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Nenhuma devolução encontrada</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (statusId: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'label_generated': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'shipped': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'delivered': 'bg-green-500/10 text-green-500 border-green-500/20',
      'cancelled': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      'expired': 'bg-red-500/10 text-red-500 border-red-500/20',
      'not_delivered': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return colors[statusId] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getDestinationLabel = (destination: string | null) => {
    const labels: Record<string, string> = {
      'seller_address': 'Vendedor',
      'warehouse': 'MELI',
    };
    return destination ? labels[destination] || destination : '-';
  };

  // ✅ Tipo de envio agora vem de tracking_info JSONB
  const getShipmentTypeLabel = (type: string | null | undefined) => {
    const labels: Record<string, string> = {
      'return': 'Devolução',
      'return_from_triage': 'Revisão',
    };
    return type ? labels[type] || type : '-';
  };

  const getContextTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'total': 'Total',
      'partial': 'Parcial',
      'incomplete': 'Incompleto',
    };
    return labels[type] || type;
  };

  const getRefundAtLabel = (refundAt: string | null) => {
    const labels: Record<string, string> = {
      'delivered': 'Após entrega',
      'shipped': 'Após envio',
      'n/a': 'N/A',
    };
    return refundAt ? labels[refundAt] || refundAt : '-';
  };

  const getProductConditionLabel = (condition: string | null) => {
    const labels: Record<string, string> = {
      'saleable': '✅ Vendável',
      'discard': '🗑️ Descarte',
      'unsaleable': '❌ Não vendável',
      'missing': '❓ Faltante',
    };
    return condition ? labels[condition] || condition : '-';
  };

  const getBenefitedLabel = (benefited: string | null) => {
    const labels: Record<string, string> = {
      'both': 'Ambos',
      'buyer': 'Comprador',
      'seller': 'Vendedor',
    };
    return benefited ? labels[benefited] || benefited : '-';
  };

  const formatEstimatedDelivery = (dev: MLReturn) => {
    if (!dev.estimated_delivery_date) return '-';
    
    try {
      const date = format(new Date(dev.estimated_delivery_date), 'dd/MM/yyyy', { locale: ptBR });
      const timeFrame = dev.estimated_delivery_from && dev.estimated_delivery_to
        ? ` (${dev.estimated_delivery_from}-${dev.estimated_delivery_to} dias)`
        : '';
      return `${date}${timeFrame}`;
    } catch {
      return dev.estimated_delivery_date;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold sticky left-0 bg-muted/50 z-10">Análise</TableHead>
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold min-w-[200px]">👤 Comprador</TableHead>
              <TableHead className="font-semibold min-w-[300px]">📦 Produto</TableHead>
              <TableHead className="font-semibold min-w-[220px]">💰 Financeiro</TableHead>
              <TableHead className="font-semibold min-w-[200px]">📋 Pedido</TableHead>
              <TableHead className="font-semibold min-w-[220px]">📍 Tracking</TableHead>
              <TableHead className="font-semibold">ID Devolução</TableHead>
              <TableHead className="font-semibold">Claim ID</TableHead>
              <TableHead className="font-semibold">Item ID</TableHead>
              <TableHead className="font-semibold">Variação ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Status $</TableHead>
              <TableHead className="font-semibold">Subtipo</TableHead>
              <TableHead className="font-semibold">Tipo Recurso</TableHead>
              <TableHead className="font-semibold">Contexto</TableHead>
              <TableHead className="font-semibold">Qtd Total</TableHead>
              <TableHead className="font-semibold">Qtd Devolver</TableHead>
              <TableHead className="font-semibold">Shipment ID</TableHead>
              <TableHead className="font-semibold">Status Envio</TableHead>
              <TableHead className="font-semibold">Destino</TableHead>
              <TableHead className="font-semibold">Rastreio</TableHead>
              {/* ✅ FASE 6: Novas colunas de dados enriquecidos com responsividade */}
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  📅 Previsão Entrega
                </span>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  ⏰ Prazo Limite
                </span>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  🚚 Status Envio
                </span>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  💰 Reembolso
                </span>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  🔍 Revisão
                </span>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  📦 Qtd
                </span>
              </TableHead>
            <TableHead className="font-semibold">Endereço</TableHead>
            <TableHead className="font-semibold">Cidade</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">CEP</TableHead>
            <TableHead className="font-semibold">Bairro</TableHead>
            <TableHead className="font-semibold">País</TableHead>
            <TableHead className="font-semibold">Complemento</TableHead>
            <TableHead className="font-semibold">Motivo</TableHead>
            <TableHead className="font-semibold">Condição Produto</TableHead>
            <TableHead className="font-semibold">Destino Produto</TableHead>
            <TableHead className="font-semibold">Beneficiado</TableHead>
            <TableHead className="font-semibold">Status Review</TableHead>
            <TableHead className="font-semibold">Data Estimada</TableHead>
            <TableHead className="font-semibold">Prazo</TableHead>
            <TableHead className="font-semibold">Atraso?</TableHead>
            <TableHead className="font-semibold">Reviews</TableHead>
            <TableHead className="font-semibold">Reembolso Após</TableHead>
            <TableHead className="font-semibold">Criação</TableHead>
            <TableHead className="font-semibold">Atualização</TableHead>
            <TableHead className="font-semibold">Fechamento</TableHead>
            {/* ✅ FASE 8: Prazos */}
            <TableHead className="font-semibold whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                ⏰ Prazos
              </span>
            </TableHead>
            {/* ✅ FASE 9: Substatus */}
            <TableHead className="font-semibold whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                📍 Substatus
              </span>
            </TableHead>
            {/* ✅ FASE 12: Custos Logística */}
            <TableHead className="font-semibold whitespace-nowrap min-w-[200px]">
              <span className="flex items-center gap-1.5">
                💰 Custos Logística
              </span>
            </TableHead>
            {/* ✅ FASE 13: Fulfillment Info */}
            <TableHead className="font-semibold whitespace-nowrap min-w-[180px]">
              <span className="flex items-center gap-1.5">
                📦 Fulfillment
              </span>
            </TableHead>
            {/* ✅ FASE 11: Ações Disponíveis */}
            <TableHead className="font-semibold whitespace-nowrap min-w-[200px]">
              <span className="flex items-center gap-1.5">
                🎬 Ações Disponíveis
              </span>
            </TableHead>
            <TableHead className="font-semibold">Análise</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev, i) => {
            const firstOrder = dev.orders?.[0];
            const currentStatus = dev.status_analise || ('pendente' as StatusAnalise);
            // Usar dev.id + index como key única para evitar duplicatas
            const uniqueKey = `${dev.id}-${i}`;
            
            // ✅ SPRINT 1: Detectar se devolução é crítica ou urgente
            const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
            const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
            const isCritical = (shipmentHours !== null && shipmentHours < 24) ||
                              (reviewHours !== null && reviewHours < 24);
            const isUrgent = (shipmentHours !== null && shipmentHours >= 24 && shipmentHours < 48) ||
                            (reviewHours !== null && reviewHours >= 24 && reviewHours < 48);
            
            // ✅ SPRINT 1: Classes de destaque visual
            const rowClasses = isCritical 
              ? 'bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/20 border-l-4 border-l-red-500'
              : isUrgent
              ? 'bg-orange-50 dark:bg-orange-950/10 hover:bg-orange-100 dark:hover:bg-orange-950/20 border-l-4 border-l-orange-500'
              : 'hover:bg-muted/50';
            
            return (
              <TableRow key={uniqueKey} className={`transition-colors ${rowClasses}`}>
                <TableCell className="sticky left-0 bg-background z-10">
                  {onStatusChange && (
                    <StatusAnaliseSelect
                      value={currentStatus}
                      onChange={(newStatus) => onStatusChange(String(dev.id), newStatus)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {dev.empresa || '-'}
                </TableCell>
                
                {/* ✅ FASE 1: Dados do Comprador */}
                <TableCell>
                  <BuyerInfoCell buyerInfo={dev.buyer_info} />
                </TableCell>
                
                {/* ✅ FASE 2: Dados do Produto */}
                <TableCell>
                  <ProductInfoCell productInfo={dev.product_info} />
                </TableCell>
                
                {/* ✅ FASE 3: Dados Financeiros */}
                <TableCell>
                  <FinancialInfoCell 
                    financialInfo={dev.financial_info} 
                    statusMoney={dev.status_money?.id}
                  />
                </TableCell>
                
                {/* ✅ FASE 4: Dados do Pedido */}
                <TableCell>
                  {dev.order ? (
                    <OrderInfoCell 
                      orderId={dev.order.id}
                      dateCreated={dev.order.date_created}
                      sellerId={dev.order.seller_id}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Pedido #{dev.order_id || '-'}
                    </div>
                  )}
                </TableCell>
                
                {/* ✅ FASE 5: Dados de Tracking */}
                <TableCell>
                  <TrackingInfoCell trackingInfo={dev.tracking_info} />
                </TableCell>

                <TableCell className="font-medium text-xs">
                  {dev.id}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.claim_id || '-'}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {firstOrder?.item_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {firstOrder?.variation_id || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusVariant(dev.status?.id || null)}
                    className="text-xs"
                  >
                    {translateStatus(dev.status?.id || null)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusMoneyVariant(dev.status_money?.id || null)}
                    className="text-xs"
                  >
                    {translateStatusMoney(dev.status_money?.id || null)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {translateSubtype(dev.subtype?.id || null)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {translateResourceType(dev.resource_type || null)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {firstOrder ? getContextTypeLabel(firstOrder.context_type) : '-'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-center">
                  {firstOrder?.total_quantity || '-'}
                </TableCell>
                <TableCell className="text-xs text-center font-semibold">
                  {firstOrder?.return_quantity || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.shipment_id || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getShipmentStatusVariant(dev.shipment_status || null)}
                    className="text-xs"
                  >
                    {translateShipmentStatus(dev.shipment_status || null)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getDestinationLabel(dev.shipment_destination)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {dev.tracking_number || '-'}
                </TableCell>
                
                {/* ✅ FASE 4: Novas células de dados enriquecidos */}
                <TableCell>
                  <EstimatedDeliveryCell 
                    date={dev.estimated_delivery_date} 
                    hasDelay={dev.has_delay} 
                  />
                </TableCell>
                
                <TableCell>
                  <DeliveryLimitCell date={dev.estimated_delivery_limit} />
                </TableCell>
                
                <TableCell>
                  <ShipmentStatusCell status={dev.shipment_status} />
                </TableCell>
                
                <TableCell>
                  <RefundAtCell refundAt={dev.refund_at} />
                </TableCell>
                
                <TableCell>
                  <ReviewStatusCell 
                    status={dev.review_status}
                    method={dev.review_method}
                    stage={dev.review_stage}
                  />
                </TableCell>
                
                <TableCell>
                  <QuantityCell 
                    returned={dev.return_quantity}
                    total={dev.total_quantity}
                  />
                </TableCell>
                
                <TableCell className="text-xs w-[200px] min-w-[200px]">
                  <div className="whitespace-pre-wrap break-words" title={dev.destination_address || '-'}>
                    {dev.destination_address || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_city || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_state || '-'}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {dev.destination_zip || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_neighborhood || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_country || '-'}
                </TableCell>
                <TableCell className="text-xs max-w-[150px]">
                  <div className="whitespace-pre-wrap break-words" title={dev.destination_comment || '-'}>
                    {dev.destination_comment || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {dev.reason_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {getProductConditionLabel(dev.product_condition)}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.product_destination || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {getBenefitedLabel(dev.benefited)}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.seller_status || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {formatEstimatedDelivery(dev)}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {dev.estimated_delivery_from && dev.estimated_delivery_to 
                    ? `${dev.estimated_delivery_from}-${dev.estimated_delivery_to} dias` 
                    : '-'}
                </TableCell>
                <TableCell>
                  {dev.has_delay ? (
                    <Badge variant="destructive" className="text-xs">Sim</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Não</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={dev.related_entities?.includes('reviews') ? "default" : "outline"} className="text-xs">
                    {dev.related_entities?.includes('reviews') ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {getRefundAtLabel(dev.refund_at)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.date_created)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.last_updated)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.date_closed)}
                </TableCell>
                {/* ✅ FASE 8: Prazos */}
                <TableCell>
                  <DeadlinesCell 
                    deadlines={dev.deadlines}
                    status={dev.status?.id || 'pending'}
                  />
                </TableCell>
                {/* ✅ FASE 9: Substatus */}
                <TableCell>
                  <SubstatusCell 
                    status={dev.shipment_status} 
                    substatus={dev.shipments?.[0]?.substatus}
                    trackingInfo={dev.tracking_info}
                  />
                </TableCell>
                {/* ✅ FASE 12: Custos de Logística */}
                <ShippingCostsCell 
                  shippingCosts={dev.shipping_costs}
                  returnId={dev.id}
                  claimId={dev.claim_id}
                />
                {/* ✅ FASE 13: Fulfillment Info */}
                <TableCell>
                  <FulfillmentCell fulfillmentInfo={dev.fulfillment_info} />
                </TableCell>
                {/* ✅ FASE 11: Ações Disponíveis */}
                <TableCell>
                  <ActionsCell 
                    returnId={dev.id}
                    claimId={dev.claim_id}
                    availableActions={dev.available_actions}
                    onActionExecuted={onRefresh}
                  />
                </TableCell>
                {/* Status Análise */}
                <TableCell>
                  {onStatusChange && (
                    <StatusAnaliseSelect
                      value={dev.status_analise || 'pendente'}
                      onChange={(newStatus) => onStatusChange(String(dev.id), newStatus)}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
        })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
});

DevolucaoTable.displayName = 'DevolucaoTable';
