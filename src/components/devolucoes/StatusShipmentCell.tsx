/**
 * 🚚 STATUS SHIPMENT CELL
 * Badge laranja mostrando status do envio
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Truck, PackageCheck, PackageX, Clock, Circle } from 'lucide-react';

interface StatusShipmentCellProps {
  status?: string | null;
}

const statusConfig: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
  description: string;
}> = {
  pending: {
    label: 'Pendente',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300',
    icon: <Clock className="h-3 w-3" />,
    description: 'Quando o envio é gerado'
  },
  ready_to_ship: {
    label: 'Pronto para Envio',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-300',
    icon: <Circle className="h-3 w-3" />,
    description: 'Etiqueta pronta para envio'
  },
  shipped: {
    label: 'Enviado',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300',
    icon: <Truck className="h-3 w-3" />,
    description: 'Produto em trânsito'
  },
  not_delivered: {
    label: 'Não Entregue',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300',
    icon: <PackageX className="h-3 w-3" />,
    description: 'Envio não foi entregue'
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300',
    icon: <PackageCheck className="h-3 w-3" />,
    description: 'Produto entregue no destino'
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <PackageX className="h-3 w-3" />,
    description: 'Envio foi cancelado'
  }
};

export function StatusShipmentCell({ status }: StatusShipmentCellProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <Truck className="h-3 w-3" />,
    description: 'Status desconhecido'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
            {config.icon}
            <span className="font-medium">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">Status do Envio</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
