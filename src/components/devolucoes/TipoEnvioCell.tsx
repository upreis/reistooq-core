/**
 * 📮 CÉLULA DE TIPO DE ENVIO DA DEVOLUÇÃO
 * Exibe badge para tipo de envio: return (vendedor) ou return_from_triage (triagem)
 */

import { Badge } from '@/components/ui/badge';
import { Home, Warehouse } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TipoEnvioCellProps {
  tipo_envio_devolucao: string | null;
  destino_devolucao?: string | null;
}

const TIPO_ENVIO_CONFIG: Record<string, { 
  label: string; 
  icon: any; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  description: string;
}> = {
  'return': {
    label: 'Retorno Vendedor',
    icon: Home,
    variant: 'default',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    description: 'Devolução com destino ao endereço do vendedor'
  },
  'return_from_triage': {
    label: 'Retorno Triagem',
    icon: Warehouse,
    variant: 'secondary',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    description: 'Devolução retornando do depósito de triagem do ML'
  },
};

export const TipoEnvioCell = ({ tipo_envio_devolucao, destino_devolucao }: TipoEnvioCellProps) => {
  if (!tipo_envio_devolucao) {
    return <span className="text-muted-foreground">-</span>;
  }

  const config = TIPO_ENVIO_CONFIG[tipo_envio_devolucao];

  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        {tipo_envio_devolucao}
      </Badge>
    );
  }

  const Icon = config.icon;

  // Descrição completa com destino
  const fullDescription = destino_devolucao 
    ? `${config.description} (${destino_devolucao === 'warehouse' ? 'Depósito ML' : 'Endereço Vendedor'})`
    : config.description;

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
          <p className="text-sm">{fullDescription}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
