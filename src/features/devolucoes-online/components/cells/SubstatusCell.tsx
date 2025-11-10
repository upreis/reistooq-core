/**
 * 🎨 SUBSTATUS CELL - FASE 9
 * Exibe o substatus detalhado do shipment com badges específicos, ícones e tooltips
 */

import { 
  Package, 
  Printer, 
  Truck, 
  Warehouse, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubstatusCellProps {
  status: string;
  substatus?: string | null;
  trackingInfo?: {
    current_substatus?: string | null;
  };
}

interface SubstatusConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: string;
}

const SUBSTATUS_MAP: Record<string, SubstatusConfig> = {
  // ✅ Shipment criado, aguardando ações
  'ready_to_print': {
    label: 'Etiqueta Pronta',
    description: 'Etiqueta de devolução disponível para impressão',
    icon: Printer,
    variant: 'warning',
    className: 'bg-warning/10 text-warning border-warning/20'
  },
  
  // ✅ Em trânsito
  'in_warehouse': {
    label: 'No Depósito',
    description: 'Produto já está no centro de distribuição',
    icon: Warehouse,
    variant: 'default',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  
  'waiting_for_carrier': {
    label: 'Aguardando Coleta',
    description: 'Aguardando a transportadora retirar o produto',
    icon: Clock,
    variant: 'secondary',
    className: 'bg-secondary/10 text-secondary-foreground border-secondary/20'
  },
  
  'in_transit': {
    label: 'Em Trânsito',
    description: 'Produto está a caminho do destino',
    icon: Truck,
    variant: 'default',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  
  // ✅ Problemas e atrasos
  'stale': {
    label: 'Parado',
    description: 'Envio sem movimentação há muito tempo',
    icon: AlertCircle,
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  
  'claim_pending': {
    label: 'Claim Pendente',
    description: 'Aguardando resolução de reclamação',
    icon: HelpCircle,
    variant: 'outline',
    className: 'bg-muted text-muted-foreground border-border'
  },
  
  'return_expired': {
    label: 'Retorno Expirado',
    description: 'Prazo de devolução vencido',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  
  // ✅ Finalizados
  'delivered': {
    label: 'Entregue',
    description: 'Produto entregue ao destinatário',
    icon: CheckCircle,
    variant: 'success',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
  },
  
  'cancelled': {
    label: 'Cancelado',
    description: 'Envio foi cancelado',
    icon: XCircle,
    variant: 'outline',
    className: 'bg-muted text-muted-foreground border-border'
  },
  
  // ✅ Default para substatus desconhecidos
  'unknown': {
    label: 'Status Desconhecido',
    description: 'Substatus não reconhecido pelo sistema',
    icon: Package,
    variant: 'outline',
    className: 'bg-muted text-muted-foreground border-border'
  }
};

export function SubstatusCell({ status, substatus, trackingInfo }: SubstatusCellProps) {
  // Priorizar substatus do tracking_info > substatus direto
  const currentSubstatus = trackingInfo?.current_substatus || substatus;
  
  // Se não tem substatus, mostrar apenas o status principal
  if (!currentSubstatus) {
    return (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground capitalize">
          {status || 'N/A'}
        </span>
      </div>
    );
  }
  
  // Buscar configuração do substatus (ou usar default)
  const config = SUBSTATUS_MAP[currentSubstatus.toLowerCase()] || SUBSTATUS_MAP.unknown;
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            <Badge 
              variant={config.variant}
              className={`flex items-center gap-1.5 font-medium ${config.className || ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {currentSubstatus !== currentSubstatus.toLowerCase() && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Código: {currentSubstatus}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
