/**
 * 📊 DEVOLUÇÃO TABLE - OTIMIZADA
 * Tabela de devoluções com memoização
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
}

export const DevolucaoTable = memo(({ devolucoes, isLoading, error, onStatusChange }: DevolucaoTableProps) => {

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

  const getShipmentTypeLabel = (type: string | null) => {
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
              <TableHead className="font-semibold">ID Devolução</TableHead>
              <TableHead className="font-semibold">Claim ID</TableHead>
              <TableHead className="font-semibold">Order ID</TableHead>
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
              <TableHead className="font-semibold">Tipo Envio</TableHead>
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
            <TableHead className="font-semibold">MPT</TableHead>
            <TableHead className="font-semibold">Reviews</TableHead>
            <TableHead className="font-semibold">Reembolso Após</TableHead>
            <TableHead className="font-semibold">Criação</TableHead>
            <TableHead className="font-semibold">Atualização</TableHead>
            <TableHead className="font-semibold">Fechamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev, i) => {
            const firstOrder = dev.orders?.[0];
            const currentStatus = dev.status_analise || ('pendente' as StatusAnalise);
            // Usar dev.id + index como key única para evitar duplicatas
            const uniqueKey = `${dev.id}-${i}`;
            
            return (
              <TableRow key={uniqueKey} className="hover:bg-muted/50 transition-colors">
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
                
                <TableCell className="font-medium text-xs">
                  {dev.id}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.claim_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.order_id || '-'}
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
                  <Badge variant="secondary" className="text-xs">
                    {getShipmentTypeLabel(dev.shipment_type)}
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
                  <Badge variant={dev.intermediate_check ? "default" : "outline"} className="text-xs">
                    {dev.intermediate_check ? 'Sim' : 'Não'}
                  </Badge>
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
