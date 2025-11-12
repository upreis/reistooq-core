/**
 * 💰 CUSTOS LOGÍSTICA CELL
 * Exibe breakdown detalhado de custos em hover
 * ⚡ OTIMIZADO: React.memo + useCallback + useMemo
 */

import { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { TruckIcon, DollarSignIcon } from 'lucide-react';

interface ShippingCostsBreakdown {
  shipping?: number;
  handling?: number;
  insurance?: number;
  taxes?: number;
}

interface ShippingCostsData {
  custo_total_logistica: number;
  responsavel_custo: 'buyer' | 'seller' | null;
  currency_id?: string;
  breakdown?: ShippingCostsBreakdown;
}

interface CustosLogisticaCellProps {
  shippingCosts?: ShippingCostsData | null;
}

const CustosLogisticaCellComponent: React.FC<CustosLogisticaCellProps> = ({
  shippingCosts,
}) => {
  // Memoize formatCurrency function
  const formatCurrency = useCallback((amount: number | null | undefined, currency: string = 'BRL') => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Memoize breakdown check
  const hasBreakdown = useMemo(() => 
    shippingCosts?.breakdown && Object.keys(shippingCosts.breakdown).length > 0,
    [shippingCosts]
  );

  // Memoize responsável label
  const responsavelLabel = useMemo(() => {
    if (!shippingCosts?.responsavel_custo) return 'N/A';
    return shippingCosts.responsavel_custo === 'buyer' ? 'Comprador' : 'Vendedor';
  }, [shippingCosts?.responsavel_custo]);

  // Memoize responsável badge variant
  const responsavelVariant = useMemo(() => {
    if (!shippingCosts?.responsavel_custo) return 'secondary';
    return shippingCosts.responsavel_custo === 'seller' ? 'destructive' : 'default';
  }, [shippingCosts?.responsavel_custo]);

  if (!shippingCosts) {
    return (
      <Badge variant="secondary" className="text-xs">
        Sem dados
      </Badge>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <TruckIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <Badge variant="default" className="font-mono text-xs">
              {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
            </Badge>
            <Badge variant={responsavelVariant} className="text-xs">
              {responsavelLabel}
            </Badge>
          </div>
        </div>
      </HoverCardTrigger>

      {hasBreakdown && (
        <HoverCardContent 
          className="w-80 bg-background border border-border shadow-lg z-50"
          side="top"
          align="start"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <DollarSignIcon className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Breakdown de Custos</h4>
            </div>

            {/* Breakdown Items */}
            <div className="space-y-2">
              {shippingCosts.breakdown?.shipping !== undefined && shippingCosts.breakdown.shipping > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Frete:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.shipping, shippingCosts.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.handling !== undefined && shippingCosts.breakdown.handling > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Manuseio:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.handling, shippingCosts.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.insurance !== undefined && shippingCosts.breakdown.insurance > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Seguro:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.insurance, shippingCosts.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.taxes !== undefined && shippingCosts.breakdown.taxes > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Taxas:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.taxes, shippingCosts.currency_id)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total:</span>
              <Badge variant="default" className="font-mono text-sm">
                {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
              </Badge>
            </div>

            {/* Responsável */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Responsável:</span>
              <Badge variant={responsavelVariant} className="text-xs">
                {responsavelLabel}
              </Badge>
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};

export const CustosLogisticaCell = memo(CustosLogisticaCellComponent);
CustosLogisticaCell.displayName = 'CustosLogisticaCell';
