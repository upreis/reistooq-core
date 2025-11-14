/**
 * 💰 RETURN COST CELL
 * Exibe o custo de devolução cobrado pelo ML
 */

import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface ReturnCostCellProps {
  custo_ml: number | null;
  custo_ml_usd: number | null;
  moeda: string | null;
}

export function ReturnCostCell({ custo_ml, custo_ml_usd, moeda }: ReturnCostCellProps) {
  if (!custo_ml || custo_ml === 0) {
    return <span className="text-muted-foreground text-sm">Sem custo</span>;
  }

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD'
    }).format(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          {formatCurrency(custo_ml, moeda || 'BRL')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold">Custo de Devolução ML</h4>
          </div>

          <div className="space-y-2">
            {/* Valor na moeda local */}
            <div className="p-3 bg-muted/30 rounded-md">
              <span className="text-xs text-muted-foreground block">Valor em {moeda || 'BRL'}</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(custo_ml, moeda || 'BRL')}
              </span>
            </div>

            {/* Valor em USD se disponível */}
            {custo_ml_usd && (
              <div className="p-3 bg-muted/30 rounded-md">
                <span className="text-xs text-muted-foreground block">Valor em USD</span>
                <span className="text-lg font-medium text-blue-600">
                  {formatCurrency(custo_ml_usd, 'USD')}
                </span>
              </div>
            )}

            {/* Informação adicional */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>
                Este é o custo oficial de envio da devolução cobrado pelo Mercado Livre.
                {custo_ml_usd && ' O valor em USD é calculado automaticamente pela API.'}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
