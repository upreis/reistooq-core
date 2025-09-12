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
  // ✅ CORREÇÃO: Usar tags para derivar status baseado nos logs reais
  const tags = (row as any)?.tags || [];
  const orderStatus = tags.includes('not_paid') && tags.includes('not_delivered') ? 'cancelled' :
                     tags.includes('delivered') ? 'paid' :
                     tags.includes('not_delivered') ? 'confirmed' :
                     row.unified?.situacao || 
                     (row as any)?.status || 
                     '—';
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [OrderStatus] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    rawStatus: (row as any)?.status,
    rawOrderStatus: (row as any)?.raw?.status,
    unifiedSituacao: row.unified?.situacao,
    orderStatus: (row as any)?.order?.status,
    finalStatus: orderStatus
  });

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
  // ✅ CORREÇÃO: Usar tags para derivar status de envio baseado nos logs reais
  const tags = (row as any)?.tags || [];
  const shippingStatus = tags.includes('delivered') ? 'delivered' :
                        tags.includes('not_delivered') ? 'pending' :
                        (row as any)?.shipping_status ||
                        '—';
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [ShippingStatus] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    shippingStatus: (row as any)?.shipping?.status,
    rawShippingStatus: (row as any)?.raw?.shipping?.status,
    detailedShippingStatus: (row as any)?.detailed_shipping?.status,
    shippingDetailsStatus: (row as any)?.shipping_details?.status,
    finalStatus: shippingStatus
  });

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
  // ✅ CORREÇÃO: Usar tags para derivar substatus baseado nos logs reais
  const tags = (row as any)?.tags || [];
  const substatus = tags.find(tag => ['pack_order', 'catalog', 'b2b', 'd2c', 'one_shot'].includes(tag)) ||
                   (row as any)?.shipping_substatus ||
                   null;
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [ShippingSubstatus] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    shippingSubstatus: (row as any)?.shipping?.substatus,
    rawShippingSubstatus: (row as any)?.raw?.shipping?.substatus,
    detailedShippingSubstatus: (row as any)?.detailed_shipping?.substatus,
    shippingDetailsSubstatus: (row as any)?.shipping_details?.substatus,
    finalSubstatus: substatus
  });
  
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
  // ✅ BUSCAR: Dados de returns que vem da API
  const returnsData = (row as any)?.returns;
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [ReturnStatus] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    returnsData: returnsData,
    hasReturns: Array.isArray(returnsData) && returnsData.length > 0
  });
  
  if (!returnsData || !Array.isArray(returnsData) || returnsData.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30" />
        <span className="text-xs">Sem Devolução</span>
      </div>
    );
  }
  
  // Pegar o primeiro return (mais recente)
  const returnInfo = returnsData[0];
  const returnStatus = returnInfo?.status || '—';
  const returnDate = returnInfo?.date_created || returnInfo?.created_date || null;
  const refundDate = returnInfo?.refund_date || returnInfo?.date_closed || null;
  const returnReason = returnInfo?.reason || returnInfo?.return_reason || null;
  const returnId = returnInfo?.id || returnInfo?.return_id || null;
  
  const getReturnBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'refunded':
      case 'closed':
        return 'default';
      case 'pending':
      case 'processing':
      case 'open':
        return 'secondary';
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getReturnStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'Concluída',
      pending: 'Pendente', 
      processing: 'Processando',
      refunded: 'Reembolsada',
      cancelled: 'Cancelada',
      rejected: 'Rejeitada',
      open: 'Aberta',
      closed: 'Fechada'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  const content = (
    <div className="flex items-center gap-2">
      <RotateCcw className="h-4 w-4 text-red-500" />
      <Badge variant={getReturnBadgeVariant(returnStatus)} className="text-xs">
        {getReturnStatusText(returnStatus)}
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
          <div className="text-sm space-y-1">
            <div><strong>Status:</strong> {getReturnStatusText(returnStatus)}</div>
            {returnId && <div><strong>ID:</strong> {returnId}</div>}
            {returnDate && <div><strong>Data devolução:</strong> {new Date(returnDate).toLocaleDateString('pt-BR')}</div>}
            {refundDate && <div><strong>Data reembolso:</strong> {new Date(refundDate).toLocaleDateString('pt-BR')}</div>}
            {returnReason && <div><strong>Motivo:</strong> {returnReason}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===== 5️⃣ COLUNA PREVISÃO DE ENTREGA =====
export function DeliveryEstimateColumn({ row, showTooltip = true }: StatusColumnProps) {
  // ✅ CORREÇÃO: Usar dados reais disponíveis 
  const estimatedDelivery = row.unified?.data_prevista ||
                           (row as any)?.unified?.data_criacao || // Usando data de criação como fallback
                           (row as any)?.date_created ||
                           null;
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [DeliveryEstimate] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    leadTimeEstimatedFinal: (row as any)?.shipping?.lead_time?.estimated_delivery_final?.date,
    leadTimeEstimatedTime: (row as any)?.shipping?.lead_time?.estimated_delivery_time?.date,
    leadTimeEstimatedLimit: (row as any)?.shipping?.lead_time?.estimated_delivery_limit?.date,
    detailedShippingLeadTime: (row as any)?.detailed_shipping?.lead_time?.estimated_delivery_final?.date,
    unifiedDataPrevista: row.unified?.data_prevista,
    finalEstimated: estimatedDelivery
  });
  
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

// ===== 6️⃣ COLUNA PACK STATUS DETAIL =====
export function PackStatusDetailColumn({ row, showTooltip = true }: StatusColumnProps) {
  // ✅ CORREÇÃO: Usar pack_id que realmente existe nos logs
  const packId = (row as any)?.pack_id;
  const packStatusDetail = packId ? `Pack ${packId}` :
                          (row as any)?.pack_status_detail ||
                          null;
  
  // Debug: verificar dados disponíveis
  console.log('🐛 [PackStatusDetail] Debug para pedido', (row as any)?.id || row.unified?.numero, {
    packStatusDetail: (row as any)?.pack_status_detail,
    rawPackStatusDetail: (row as any)?.raw?.pack_status_detail,
    shippingPackStatusDetail: (row as any)?.shipping?.pack_status_detail,
    finalPackStatusDetail: packStatusDetail
  });
  
  if (!packStatusDetail) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const content = (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-100">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
      </div>
      <Badge variant="outline" className="text-xs">
        {packStatusDetail}
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
            <p className="font-medium">Detalhe Status do Pack</p>
            <p className="text-muted-foreground">API: {packStatusDetail}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}