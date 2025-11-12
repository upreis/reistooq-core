/**
 * 🏷️ CÉLULA DE SUBTIPO DE DEVOLUÇÃO
 * Exibe badge colorido para cada subtipo de devolução ML
 */

import { Badge } from '@/components/ui/badge';
import { DollarSign, Package, PackageX } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubtipoCellProps {
  subtipo_claim: string | null;
}

const SUBTIPO_CONFIG: Record<string, { 
  label: string; 
  icon: any; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  description: string;
}> = {
  'low_cost': {
    label: 'Baixo Custo',
    icon: DollarSign,
    variant: 'secondary',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    description: 'Devolução automática de baixo custo'
  },
  'return_partial': {
    label: 'Parcial',
    icon: Package,
    variant: 'outline',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    description: 'Devolução parcial do pedido'
  },
  'return_total': {
    label: 'Total',
    icon: PackageX,
    variant: 'destructive',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    description: 'Devolução total do pedido'
  },
};

export const SubtipoCell = ({ subtipo_claim }: SubtipoCellProps) => {
  if (!subtipo_claim) {
    return <span className="text-muted-foreground">-</span>;
  }

  const config = SUBTIPO_CONFIG[subtipo_claim];

  // Se não encontrar configuração, exibir valor bruto
  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        {subtipo_claim}
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
