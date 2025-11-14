/**
 * 🚚 LOGISTIC TYPE CELL
 * Exibe o tipo de logística com badge formatado
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Truck } from 'lucide-react';

interface LogisticTypeCellProps {
  logisticType?: string | null;
}

export function LogisticTypeCell({ logisticType }: LogisticTypeCellProps) {
  if (!logisticType) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Truck className="h-4 w-4" />
        <span className="text-sm">-</span>
      </div>
    );
  }

  const formatLogisticType = (type: string): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; description: string } => {
    const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; description: string }> = {
      'self_service': {
        label: 'Envios Flex',
        variant: 'default',
        description: 'Envio por conta do vendedor (Full ou Correios)'
      },
      'fulfillment': {
        label: 'Full',
        variant: 'secondary',
        description: 'Mercado Livre Full - Estoque gerenciado pelo ML'
      },
      'cross_docking': {
        label: 'Cross Docking',
        variant: 'outline',
        description: 'Cross Docking - Produto passa pelo centro de distribuição ML'
      },
      'xd_drop_off': {
        label: 'Drop Off',
        variant: 'outline',
        description: 'Drop Off - Vendedor deixa em ponto de coleta'
      },
      'not_specified': {
        label: 'Não Especificado',
        variant: 'outline',
        description: 'Tipo de logística não especificado'
      }
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || {
      label: type,
      variant: 'outline',
      description: `Tipo: ${type}`
    };
  };

  const { label, variant, description } = formatLogisticType(logisticType);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Badge variant={variant} className="text-xs">
              {label}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-xs font-mono text-muted-foreground mt-2">
              Tipo original: {logisticType}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
