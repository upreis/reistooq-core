/**
 * 🚚 CÉLULA DE TIPO DE LOGÍSTICA
 * Exibe badge colorido com ícone para cada tipo de logística ML
 */

import { Badge } from '@/components/ui/badge';
import { Package, Truck, User, MapPin, RefreshCw, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LogisticTypeCellProps {
  tipo_logistica: string | null;
}

const LOGISTIC_TYPES: Record<string, { 
  label: string; 
  icon: any; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}> = {
  'fulfillment': {
    label: 'Full',
    icon: Package,
    variant: 'default',
    description: 'Mercado Envios Full - Armazém ML'
  },
  'flex': {
    label: 'Flex',
    icon: Truck,
    variant: 'secondary',
    description: 'Mercado Envios Flex - Envio rápido'
  },
  'self_service': {
    label: 'Self Service',
    icon: User,
    variant: 'outline',
    description: 'Envio por conta própria do vendedor'
  },
  'drop_off': {
    label: 'Drop Off',
    icon: MapPin,
    variant: 'outline',
    description: 'Envio por ponto de coleta'
  },
  'cross_docking': {
    label: 'Cross Docking',
    icon: RefreshCw,
    variant: 'secondary',
    description: 'Cross docking - Transferência direta'
  },
  'xd_drop_off': {
    label: 'XD Drop Off',
    icon: MapPin,
    variant: 'secondary',
    description: 'Drop off com cross docking'
  },
};

export const LogisticTypeCell = ({ tipo_logistica }: LogisticTypeCellProps) => {
  if (!tipo_logistica) {
    return <span className="text-muted-foreground">-</span>;
  }

  const logisticConfig = LOGISTIC_TYPES[tipo_logistica];

  if (!logisticConfig) {
    return (
      <Badge variant="outline" className="gap-1">
        <HelpCircle className="h-3 w-3" />
        {tipo_logistica}
      </Badge>
    );
  }

  const Icon = logisticConfig.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={logisticConfig.variant} className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {logisticConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{logisticConfig.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
