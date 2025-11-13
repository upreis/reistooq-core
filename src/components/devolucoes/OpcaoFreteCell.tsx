/**
 * 📦 CÉLULA DE OPÇÃO DE FRETE
 * Exibe nome da opção de envio selecionada
 */

import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OpcaoFreteCellProps {
  shipping_option_name: string | null;
}

export const OpcaoFreteCell = ({ shipping_option_name }: OpcaoFreteCellProps) => {
  if (!shipping_option_name) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {shipping_option_name}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Opção de frete selecionada para este envio</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
