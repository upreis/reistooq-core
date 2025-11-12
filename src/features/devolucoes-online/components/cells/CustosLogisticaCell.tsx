/**
 * 💰 CUSTOS LOGÍSTICA CELL
 * Exibe breakdown detalhado de custos em hover
 * ⚡ OTIMIZADO: React.memo + useCallback + useMemo
 */

import { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { TruckIcon, DollarSignIcon } from 'lucide-react';
import type { ShippingCosts } from '@/features/devolucoes-online/types/devolucao.types';

interface CustosLogisticaCellProps {
  shippingCosts?: ShippingCosts | null;
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

  if (!shippingCosts || shippingCosts.custo_total_logistica === null) {
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
          <Badge variant="default" className="font-mono text-xs">
            {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
          </Badge>
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
              {shippingCosts.breakdown?.forward_shipping && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Frete Ida:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.forward_shipping.amount, shippingCosts.breakdown.forward_shipping.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.return_shipping && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Frete Retorno:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.return_shipping.amount, shippingCosts.breakdown.return_shipping.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.handling_fee && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Manuseio:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.handling_fee.amount, shippingCosts.breakdown.handling_fee.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.insurance && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Seguro:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.insurance.amount, shippingCosts.breakdown.insurance.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.storage_fee && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Armazenagem:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(shippingCosts.breakdown.storage_fee.amount, shippingCosts.breakdown.storage_fee.currency_id)}
                  </span>
                </div>
              )}

              {shippingCosts.breakdown?.other_costs?.map((cost, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">{cost.type}:</span>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {formatCurrency(cost.amount, cost.currency_id)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total:</span>
              <Badge variant="default" className="font-mono text-sm">
                {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
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
