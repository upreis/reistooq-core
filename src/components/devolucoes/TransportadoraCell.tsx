/**
 * 🚚 CÉLULA DE TRANSPORTADORA
 * Exibe nome da transportadora com link de rastreamento externo
 */

import { Badge } from '@/components/ui/badge';
import { ExternalLink, Truck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransportadoraCellProps {
  carrier_name: string | null;
  carrier_tracking_url?: string | null;
  tracking_number?: string | null;
}

export const TransportadoraCell = ({ 
  carrier_name, 
  carrier_tracking_url,
  tracking_number 
}: TransportadoraCellProps) => {
  if (!carrier_name) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const hasTrackingUrl = carrier_tracking_url && tracking_number;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Truck className="h-3 w-3 text-muted-foreground" />
            {hasTrackingUrl ? (
              <a
                href={carrier_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Badge variant="outline" className="text-xs">
                  {carrier_name}
                </Badge>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Badge variant="outline" className="text-xs">
                {carrier_name}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Transportadora:</strong> {carrier_name}</p>
            {tracking_number && (
              <p><strong>Código:</strong> {tracking_number}</p>
            )}
            {hasTrackingUrl && (
              <p className="text-primary">Clique para rastrear externamente</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
