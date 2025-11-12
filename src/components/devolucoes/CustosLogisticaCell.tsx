/**
 * 💰 CÉLULA DE CUSTOS LOGÍSTICA
 * Exibe custo total com breakdown detalhado via tooltip
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Package, TruckIcon, Shield, Receipt } from 'lucide-react';

interface CustosLogisticaCellProps {
  custo_total_logistica?: number | null;
  custo_envio_original?: number | null;
  custo_devolucao?: number | null;
  responsavel_custo_frete?: string | null;
  // Breakdown detalhado
  shipping_fee?: number | null;
  handling_fee?: number | null;
  insurance?: number | null;
  taxes?: number | null;
}

export const CustosLogisticaCell = ({
  custo_total_logistica,
  custo_envio_original,
  custo_devolucao,
  responsavel_custo_frete,
  shipping_fee,
  handling_fee,
  insurance,
  taxes
}: CustosLogisticaCellProps) => {
  // 🐛 DEBUG: Log temporário para verificar props recebidas
  if (custo_total_logistica !== null && custo_total_logistica !== undefined) {
    console.log('💰 CustosLogisticaCell - Props recebidas:', {
      custo_total_logistica,
      custo_envio_original,
      custo_devolucao,
      responsavel_custo_frete,
      breakdown: { shipping_fee, handling_fee, insurance, taxes }
    });
  }
  
  // Se não há custo total, não renderizar
  if (!custo_total_logistica && custo_total_logistica !== 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Determinar variante do badge baseado no responsável
  const getBadgeVariant = () => {
    if (!responsavel_custo_frete) return 'outline';
    
    switch (responsavel_custo_frete.toLowerCase()) {
      case 'buyer':
      case 'comprador':
        return 'default'; // Azul
      case 'seller':
      case 'vendedor':
        return 'destructive'; // Vermelho
      case 'mercadolivre':
      case 'ml':
        return 'secondary'; // Verde/Neutro
      default:
        return 'outline';
    }
  };

  // Ícone baseado no responsável
  const getResponsavelIcon = () => {
    if (!responsavel_custo_frete) return null;
    
    switch (responsavel_custo_frete.toLowerCase()) {
      case 'buyer':
      case 'comprador':
        return <Package className="h-3 w-3" />;
      case 'seller':
      case 'vendedor':
        return <TruckIcon className="h-3 w-3" />;
      case 'mercadolivre':
      case 'ml':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Label do responsável
  const getResponsavelLabel = () => {
    if (!responsavel_custo_frete) return '';
    
    switch (responsavel_custo_frete.toLowerCase()) {
      case 'buyer':
      case 'comprador':
        return 'Comprador';
      case 'seller':
      case 'vendedor':
        return 'Vendedor';
      case 'mercadolivre':
      case 'ml':
        return 'Mercado Livre';
      default:
        return responsavel_custo_frete;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <Badge variant={getBadgeVariant()} className="gap-1">
              {getResponsavelIcon()}
              {formatCurrency(custo_total_logistica)}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3 pointer-events-auto">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b border-border pb-2">
              💰 Breakdown de Custos
            </div>

            {/* Responsável */}
            {responsavel_custo_frete && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Responsável:</span>
                <span className="font-medium flex items-center gap-1">
                  {getResponsavelIcon()}
                  {getResponsavelLabel()}
                </span>
              </div>
            )}

            {/* Frete */}
            {(shipping_fee !== null && shipping_fee !== undefined) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TruckIcon className="h-3 w-3" />
                  Frete:
                </span>
                <span className="font-mono">{formatCurrency(shipping_fee)}</span>
              </div>
            )}

            {/* Manuseio */}
            {(handling_fee !== null && handling_fee !== undefined) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Manuseio:
                </span>
                <span className="font-mono">{formatCurrency(handling_fee)}</span>
              </div>
            )}

            {/* Seguro */}
            {(insurance !== null && insurance !== undefined) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Seguro:
                </span>
                <span className="font-mono">{formatCurrency(insurance)}</span>
              </div>
            )}

            {/* Taxas */}
            {(taxes !== null && taxes !== undefined) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Taxas:
                </span>
                <span className="font-mono">{formatCurrency(taxes)}</span>
              </div>
            )}

            {/* Separador */}
            <div className="border-t border-border pt-2 mt-2">
              {/* Custo Envio Original */}
              {(custo_envio_original !== null && custo_envio_original !== undefined) && (
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Envio Original:</span>
                  <span className="font-mono">{formatCurrency(custo_envio_original)}</span>
                </div>
              )}

              {/* Custo Devolução */}
              {(custo_devolucao !== null && custo_devolucao !== undefined) && (
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Devolução:</span>
                  <span className="font-mono">{formatCurrency(custo_devolucao)}</span>
                </div>
              )}

              {/* Custo Total */}
              <div className="flex items-center justify-between text-sm font-semibold border-t border-border pt-2">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(custo_total_logistica)}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
