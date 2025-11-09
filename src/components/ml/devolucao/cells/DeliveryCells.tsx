/**
 * 📦 CÉLULAS DE ENTREGA - DEVOLUÇÕES ML
 * Componentes para exibir dados de entrega, status e quantidades
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Calendar, Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import { 
  translateShipmentStatus, 
  translateRefundAt, 
  translateReviewStatus,
  getShipmentStatusVariant,
  getRefundAtVariant,
  getReviewStatusVariant
} from '@/features/devolucoes/utils/translations';

interface DeliveryCellsProps {
  estimated_delivery_date?: string | null;
  estimated_delivery_limit?: string | null;
  has_delay?: boolean;
  shipment_status?: string | null;
  refund_at?: string | null;
  review_status?: string | null;
  review_method?: string | null;
  review_stage?: string | null;
  return_quantity?: number | null;
  total_quantity?: number | null;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
};

/**
 * Coluna 1: Previsão de Entrega
 * Mostra estimated_delivery_date + badge vermelho se has_delay
 */
export const EstimatedDeliveryCell = ({ 
  date, 
  hasDelay 
}: { 
  date?: string | null; 
  hasDelay?: boolean;
}) => {
  if (!date) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">{formatDate(date)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Previsão de entrega</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {hasDelay && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 animate-pulse">
                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                Atraso
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>⚠️ Há atraso na entrega</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

/**
 * Coluna 2: Prazo Limite
 * Mostra estimated_delivery_limit
 */
export const DeliveryLimitCell = ({ 
  date 
}: { 
  date?: string | null;
}) => {
  if (!date) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 min-w-[130px]">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm whitespace-nowrap">{formatDate(date)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Data limite para entrega</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Coluna 3: Status de Envio
 * Mostra shipment_status traduzido com badge colorido
 */
export const ShipmentStatusCell = ({ 
  status 
}: { 
  status?: string | null;
}) => {
  if (!status) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const translated = translateShipmentStatus(status);
  const variant = getShipmentStatusVariant(status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="whitespace-nowrap text-xs font-medium">
            {translated}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Status original: <span className="font-mono">{status}</span></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Coluna 4: Reembolso Quando
 * Mostra refund_at traduzido (delivered/shipped/n/a)
 */
export const RefundAtCell = ({ 
  refundAt 
}: { 
  refundAt?: string | null;
}) => {
  if (!refundAt) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const translated = translateRefundAt(refundAt);
  const variant = getRefundAtVariant(refundAt);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="whitespace-nowrap text-xs font-medium">
            {translated}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>💰 Momento do reembolso</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Coluna 5: Revisão
 * Mostra status da review quando existir
 */
export const ReviewStatusCell = ({ 
  status,
  method,
  stage
}: { 
  status?: string | null;
  method?: string | null;
  stage?: string | null;
}) => {
  if (!status) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const translated = translateReviewStatus(status);
  const variant = getReviewStatusVariant(status);

  const tooltipContent = [
    status && `Status: ${translated}`,
    method && `Método: ${method}`,
    stage && `Etapa: ${stage}`,
  ].filter(Boolean).join('\n');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="whitespace-nowrap text-xs font-medium">
            {translated}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="whitespace-pre-line text-xs">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Coluna 6: Quantidade
 * Mostra return_quantity/total_quantity (ex: "2/5")
 */
export const QuantityCell = ({ 
  returned,
  total
}: { 
  returned?: number | null;
  total?: number | null;
}) => {
  if (!returned && !total) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const returnedQty = returned || 0;
  const totalQty = total || 0;
  const isPartial = returnedQty < totalQty && totalQty > 0;
  const isTotal = returnedQty === totalQty && totalQty > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 min-w-[60px]">
            <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              {returnedQty}/{totalQty}
            </span>
            {isPartial && (
              <AlertCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 animate-pulse" />
            )}
            {isTotal && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isPartial
              ? `⚠️ Devolução parcial: ${returnedQty} de ${totalQty} itens`
              : isTotal
              ? `✅ Devolução total: ${totalQty} itens`
              : `${returnedQty} devolvidos de ${totalQty} totais`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Componente principal que renderiza todas as células
 */
export const DeliveryCells = (props: DeliveryCellsProps) => {
  return (
    <>
      <td className="px-4 py-3">
        <EstimatedDeliveryCell 
          date={props.estimated_delivery_date} 
          hasDelay={props.has_delay} 
        />
      </td>
      
      <td className="px-4 py-3">
        <DeliveryLimitCell date={props.estimated_delivery_limit} />
      </td>
      
      <td className="px-4 py-3">
        <ShipmentStatusCell status={props.shipment_status} />
      </td>
      
      <td className="px-4 py-3">
        <RefundAtCell refundAt={props.refund_at} />
      </td>
      
      <td className="px-4 py-3">
        <ReviewStatusCell 
          status={props.review_status}
          method={props.review_method}
          stage={props.review_stage}
        />
      </td>
      
      <td className="px-4 py-3">
        <QuantityCell 
          returned={props.return_quantity}
          total={props.total_quantity}
        />
      </td>
    </>
  );
};
