/**
 * 📦 STATUS DE ENTREGA DO PRODUTO
 * Exibe o status da entrega do produto devolvido
 */

import { Badge } from '@/components/ui/badge';
import { Truck, PackageCheck, PackageX, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DeliveryStatusCellProps {
  statusEnvio: string | null;
  dataChegada: string | null;
  estimatedDeliveryDate: string | null;
}

const STATUS_CONFIG: Record<string, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: any;
  color: string;
}> = {
  delivered: { 
    label: 'Entregue', 
    variant: 'default',
    icon: PackageCheck,
    color: 'text-green-600'
  },
  in_transit: { 
    label: 'Em Trânsito', 
    variant: 'secondary',
    icon: Truck,
    color: 'text-blue-600'
  },
  pending: { 
    label: 'Pendente', 
    variant: 'outline',
    icon: Clock,
    color: 'text-yellow-600'
  },
  cancelled: { 
    label: 'Cancelado', 
    variant: 'destructive',
    icon: PackageX,
    color: 'text-red-600'
  },
  not_delivered: { 
    label: 'Não Entregue', 
    variant: 'destructive',
    icon: AlertCircle,
    color: 'text-orange-600'
  }
};

export const DeliveryStatusCell = ({ 
  statusEnvio, 
  dataChegada,
  estimatedDeliveryDate 
}: DeliveryStatusCellProps) => {
  // Se já chegou, status é "entregue"
  if (dataChegada) {
    const config = STATUS_CONFIG.delivered;
    const Icon = config.icon;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <Badge variant={config.variant}>
                {config.label}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recebido em: {new Date(dataChegada).toLocaleDateString('pt-BR')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Caso contrário, usa o status de envio
  const normalizedStatus = statusEnvio?.toLowerCase() || 'pending';
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {estimatedDeliveryDate ? (
            <p>Previsão: {new Date(estimatedDeliveryDate).toLocaleDateString('pt-BR')}</p>
          ) : (
            <p>Sem previsão de entrega</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
