import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Clock, Truck, AlertTriangle, RotateCcw } from 'lucide-react';
import { Row } from '@/services/orders';
import { 
  mapOrderStatusFromFilter,
  mapShippingStatusFromAPI,
  mapShippingSubstatusFromAPI,
  mapReturnStatusFromAPI 
} from '@/utils/orderStatusMapping';
import { getStatusBadgeVariant } from '@/features/orders/types/orders-status.types';

interface StatusColumnProps {
  row: Row;
  showTooltip?: boolean;
}

// ===== 1️⃣ COLUNA STATUS DO PEDIDO =====
export function OrderStatusColumn({ row, showTooltip = true }: StatusColumnProps) {
  const orderStatus = (row as any)?.order?.status || row.unified?.situacao || (row as any)?.compat?.situacao || '—';
  const statusPT = mapOrderStatusFromFilter(orderStatus);
  const variant = getStatusBadgeVariant(statusPT, 'order');

  const content = (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10">
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      <Badge variant={variant} className="text-xs">
        {statusPT}
      </Badge>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Status do Pedido</p>
            <p className="text-muted-foreground">API: {orderStatus}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===== 2️⃣ COLUNA STATUS DE ENVIO =====
export function ShippingStatusColumn({ row, showTooltip = true }: StatusColumnProps) {
  const shippingStatus = (row as any)?.shipping?.status || 
                        (row as any)?.enriched?.shipping?.status || 
                        (row as any)?.compat?.status_envio || 
                        '—';
  const statusPT = mapShippingStatusFromAPI(shippingStatus);
  const variant = getStatusBadgeVariant(statusPT, 'shipping');

  const content = (
    <div className="flex items-center gap-2">
      <Truck className="h-4 w-4 text-blue-500" />
      <Badge variant={variant} className="text-xs">
        {statusPT}
      </Badge>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Status de Envio</p>
            <p className="text-muted-foreground">API: {shippingStatus}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===== 3️⃣ COLUNA SUBSTATUS DE ENVIO =====
export function ShippingSubstatusColumn({ row, showTooltip = true }: StatusColumnProps) {
  const substatus = (row as any)?.shipping?.substatus || 
                   (row as any)?.enriched?.shipping?.substatus || 
                   (row as any)?.compat?.substatus || 
                   null;
  
  if (!substatus) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const substatusPT = mapShippingSubstatusFromAPI(substatus);
  const variant = getStatusBadgeVariant(substatusPT, 'substatus');

  const content = (
    <div className="flex items-center gap-2">
      <Info className="h-4 w-4 text-amber-500" />
      <Badge variant={variant} className="text-xs">
        {substatusPT}
      </Badge>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Detalhes do Envio</p>
            <p className="text-muted-foreground">API: {substatus}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===== 4️⃣ COLUNA STATUS DE DEVOLUÇÃO =====
export function ReturnStatusColumn({ row, showTooltip = true }: StatusColumnProps) {
  const returnStatus = (row as any)?.enriched?.return?.status || 
                      (row as any)?.return?.status || 
                      row.raw?.return?.status || 
                      null;
  
  if (!returnStatus) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30" />
        <span className="text-xs">Sem Devolução</span>
      </div>
    );
  }

  const statusPT = mapReturnStatusFromAPI(returnStatus);
  const variant = getStatusBadgeVariant(statusPT, 'return');

  const content = (
    <div className="flex items-center gap-2">
      <RotateCcw className="h-4 w-4 text-red-500" />
      <Badge variant={variant} className="text-xs">
        {statusPT}
      </Badge>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Status de Devolução</p>
            <p className="text-muted-foreground">API: {returnStatus}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===== 5️⃣ COLUNA PREVISÃO DE ENTREGA =====
export function DeliveryEstimateColumn({ row, showTooltip = true }: StatusColumnProps) {
  const estimatedDelivery = (row as any)?.enriched?.estimated_delivery_time?.date || 
                           (row as any)?.shipping?.estimated_delivery?.date ||
                           row.unified?.data_prevista ||
                           null;
  
  if (!estimatedDelivery) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const deliveryDate = new Date(estimatedDelivery);
  const now = new Date();
  const isOverdue = deliveryDate < now;
  const daysDiff = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const content = (
    <div className="flex items-center gap-2">
      <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-green-500'}`} />
      <div className="text-sm">
        <div className={isOverdue ? 'text-red-600 font-medium' : 'text-green-600'}>
          {deliveryDate.toLocaleDateString('pt-BR')}
        </div>
        {Math.abs(daysDiff) <= 7 && (
          <div className="text-xs text-muted-foreground">
            {isOverdue ? `${Math.abs(daysDiff)} dias atrasado` : `${daysDiff} dias`}
          </div>
        )}
      </div>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Previsão de Entrega</p>
            <p className="text-muted-foreground">
              {isOverdue ? 'Entrega atrasada' : 'Dentro do prazo'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}