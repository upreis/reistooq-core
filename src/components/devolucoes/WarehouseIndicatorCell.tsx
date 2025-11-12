/**
 * 🏭 INDICADOR DE TRIAGEM ML
 * Mostra badge de alerta quando devolução está em warehouse ML aguardando triagem
 */

import { Badge } from '@/components/ui/badge';
import { Warehouse, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WarehouseIndicatorCellProps {
  destino_devolucao?: string | null;
  tipo_envio_devolucao?: string | null;
  status_shipment?: string | null;
}

export const WarehouseIndicatorCell = ({
  destino_devolucao,
  tipo_envio_devolucao,
  status_shipment
}: WarehouseIndicatorCellProps) => {
  
  // Verificar se está em warehouse
  const isWarehouse = destino_devolucao === 'warehouse';
  const isReturnFromTriage = tipo_envio_devolucao === 'return_from_triage';
  
  // Se não está em warehouse, não exibir nada
  if (!isWarehouse && !isReturnFromTriage) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Definir mensagem baseada no status
  let message = 'Devolução em depósito ML';
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let icon = Warehouse;
  
  if (isReturnFromTriage) {
    message = 'Retornando do depósito de triagem ML';
    variant = 'outline';
  } else if (status_shipment === 'pending' || status_shipment === 'ready_to_ship') {
    message = 'Aguardando processamento no depósito ML';
    variant = 'destructive';
    icon = AlertTriangle;
  } else if (status_shipment === 'shipped') {
    message = 'Em trânsito do depósito ML';
    variant = 'secondary';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1.5 cursor-pointer">
            {icon === Warehouse ? (
              <Warehouse className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">
              {isReturnFromTriage ? 'Triagem' : 'Depósito ML'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{message}</p>
          {(status_shipment === 'pending' || status_shipment === 'ready_to_ship') && (
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ Requer atenção - processamento pendente
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
