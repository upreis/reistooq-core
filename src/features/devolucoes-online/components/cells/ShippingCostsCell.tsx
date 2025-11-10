/**
 * 💰 SHIPPING COSTS CELL
 * Exibe custos de logística
 * ⚡ OTIMIZADO: React.memo + useCallback + useMemo
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSignIcon, InfoIcon } from 'lucide-react';
import { ShippingCostsModal } from '../modals/ShippingCostsModal';
import type { ShippingCosts } from '@/features/devolucoes-online/types/devolucao.types';

interface ShippingCostsCellProps {
  shippingCosts?: ShippingCosts | null;
  returnId: number;
  claimId: number;
}

const ShippingCostsCellComponent: React.FC<ShippingCostsCellProps> = ({
  shippingCosts,
  returnId,
  claimId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Memoize formatCurrency function
  const formatCurrency = useCallback((amount: number | null, currency: string = 'BRL') => {
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

  if (!shippingCosts) {
    return (
      <td className="px-3 py-3">
        <Badge variant="secondary" className="text-xs">
          Sem dados de custo
        </Badge>
      </td>
    );
  }

  return (
    <td className="px-3 py-3">
      <ShippingCostsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        shippingCosts={shippingCosts}
        returnId={returnId}
        claimId={claimId}
      />
      
      <div className="space-y-2 min-w-[180px]">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total:</span>
          <Badge variant="default" className="font-mono text-xs">
            {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
          </Badge>
        </div>

        {/* Ida */}
        {shippingCosts.custo_envio_ida !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ida:</span>
            <span className="text-xs font-mono">
              {formatCurrency(shippingCosts.custo_envio_ida, shippingCosts.currency_id)}
            </span>
          </div>
        )}

        {/* Retorno */}
        {shippingCosts.custo_envio_retorno !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Retorno:</span>
            <span className="text-xs font-mono">
              {formatCurrency(shippingCosts.custo_envio_retorno, shippingCosts.currency_id)}
            </span>
          </div>
        )}

        {/* Botão de Detalhes */}
        {hasBreakdown && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs gap-1"
            onClick={() => setModalOpen(true)}
          >
            <InfoIcon className="h-3 w-3" />
            Ver Breakdown
          </Button>
        )}
      </div>
    </td>
  );
};

export const ShippingCostsCell = memo(ShippingCostsCellComponent);
ShippingCostsCell.displayName = 'ShippingCostsCell';
