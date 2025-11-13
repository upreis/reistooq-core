/**
 * 🚢 CÉLULA DE MÉTODO DE ENVIO
 * Exibe método de envio utilizado (Standard, Express, etc.)
 */

import { Badge } from '@/components/ui/badge';
import { Truck, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetodoEnvioCellProps {
  shipping_method_name: string | null;
  tracking_method?: string | null;
}

export const MetodoEnvioCell = ({ 
  shipping_method_name, 
  tracking_method 
}: MetodoEnvioCellProps) => {
  if (!shipping_method_name) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Definir variante baseada no nome do método
  const isExpress = shipping_method_name.toLowerCase().includes('express') || 
                    shipping_method_name.toLowerCase().includes('next');
  
  const icon = isExpress ? <Zap className="h-3 w-3" /> : <Truck className="h-3 w-3" />;
  const variant = isExpress ? 'default' : 'secondary';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {icon}
            <Badge variant={variant} className="text-xs">
              {shipping_method_name}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Método de Envio:</strong> {shipping_method_name}</p>
            {tracking_method && (
              <p><strong>Rastreamento:</strong> {tracking_method}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
