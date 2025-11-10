/**
 * 📦 CÉLULA: FULFILLMENT INFO
 * Exibe informações de logística e fulfillment
 */

import { Package, Warehouse, MapPin, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FulfillmentInfo } from '../../types/devolucao.types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FulfillmentCellProps {
  fulfillmentInfo?: FulfillmentInfo;
}

const TIPO_LOGISTICA_LABELS: Record<string, string> = {
  'FBM': 'Fulfillment by Merchant',
  'FULL': 'Mercado Livre Full',
  'FLEX': 'Mercado Livre Flex',
  'COLETA': 'Coleta',
  'CROSS_DOCKING': 'Cross Docking',
  'DROP_SHIPPING': 'Drop Shipping',
};

const STATUS_REINGRESSO_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'pending': { label: 'Pendente', variant: 'outline' },
  'received': { label: 'Recebido', variant: 'secondary' },
  'processing': { label: 'Processando', variant: 'default' },
  'restocked': { label: 'Reintegrado', variant: 'default' },
  'rejected': { label: 'Rejeitado', variant: 'destructive' },
};

export function FulfillmentCell({ fulfillmentInfo }: FulfillmentCellProps) {
  if (!fulfillmentInfo) {
    return (
      <div className="text-xs text-muted-foreground">
        Sem informações
      </div>
    );
  }

  const {
    tipo_logistica,
    warehouse_nome,
    centro_distribuicao,
    destino_retorno,
    endereco_retorno,
    status_reingresso,
  } = fulfillmentInfo;

  return (
    <div className="space-y-2">
      {/* Tipo de Logística */}
      {tipo_logistica && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {tipo_logistica}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{TIPO_LOGISTICA_LABELS[tipo_logistica] || tipo_logistica}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Warehouse/CD */}
      {(warehouse_nome || centro_distribuicao) && (
        <div className="flex items-center gap-1.5">
          <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {warehouse_nome || centro_distribuicao}
          </span>
        </div>
      )}

      {/* Destino de Retorno */}
      {(destino_retorno || endereco_retorno) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {destino_retorno || 
                   `${endereco_retorno?.cidade}, ${endereco_retorno?.estado}`}
                </span>
              </div>
            </TooltipTrigger>
            {endereco_retorno && (
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  {endereco_retorno.rua && <p>{endereco_retorno.rua}, {endereco_retorno.numero}</p>}
                  {endereco_retorno.cidade && <p>{endereco_retorno.cidade} - {endereco_retorno.estado}</p>}
                  {endereco_retorno.cep && <p>CEP: {endereco_retorno.cep}</p>}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Status de Reingresso */}
      {status_reingresso && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant={STATUS_REINGRESSO_LABELS[status_reingresso]?.variant || 'outline'} className="text-xs">
            {STATUS_REINGRESSO_LABELS[status_reingresso]?.label || status_reingresso}
          </Badge>
        </div>
      )}
    </div>
  );
}
