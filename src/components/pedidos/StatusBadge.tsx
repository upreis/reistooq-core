import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  substatus?: string;
  type: 'order' | 'shipping';
  className?: string;
}

// Mapeamento de cores e labels para status de orders
const ORDER_STATUS_CONFIG = {
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  payment_required: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  payment_in_process: { label: 'Processando Pagamento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800 border-green-200' },
  closed: { label: 'Fechado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  default: { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800 border-gray-200' }
} as const;

// Mapeamento de cores e labels para status de shipping
const SHIPPING_STATUS_CONFIG = {
  to_be_agreed: { label: 'A Combinar', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  handling: { label: 'Em Preparação', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ready_to_ship: { label: 'Pronto para Enviar', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  shipped: { label: 'A Caminho', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800 border-green-200' },
  not_delivered: { label: 'Não Entregue', color: 'bg-red-100 text-red-800 border-red-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  closed: { label: 'Fechado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  default: { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800 border-gray-200' }
} as const;

// Substatus importantes para exibir junto
const IMPORTANT_SUBSTATUS = {
  // Order substatus
  pack_splitted: 'Dividido',
  fraudulent: 'Fraudulento',
  
  // Shipping substatus
  printed: 'Etiqueta Impressa',
  picked_up: 'Coletado',
  out_for_delivery: 'Saiu para Entrega',
  delivered_ok: 'Entregue com Sucesso',
  receiver_absent: 'Destinatário Ausente',
  refused_delivery: 'Entrega Recusada',
  returning_to_sender: 'Retornando ao Remetente',
  damaged: 'Danificado',
  lost: 'Perdido'
} as const;

export function StatusBadge({ status, substatus, type, className }: StatusBadgeProps) {
  if (!status) return null;

  const config = type === 'order' ? ORDER_STATUS_CONFIG : SHIPPING_STATUS_CONFIG;
  const statusConfig = config[status as keyof typeof config] || config.default;
  
  // Determina se deve mostrar o substatus
  const shouldShowSubstatus = substatus && 
    Object.keys(IMPORTANT_SUBSTATUS).includes(substatus);
  
  const substatusLabel = shouldShowSubstatus ? 
    IMPORTANT_SUBSTATUS[substatus as keyof typeof IMPORTANT_SUBSTATUS] : null;

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant="outline" 
        className={cn(statusConfig.color, "text-xs font-medium", className)}
      >
        {statusConfig.label}
      </Badge>
      {substatusLabel && (
        <Badge 
          variant="outline" 
          className="text-xs bg-gray-50 text-gray-600 border-gray-300"
        >
          {substatusLabel}
        </Badge>
      )}
    </div>
  );
}