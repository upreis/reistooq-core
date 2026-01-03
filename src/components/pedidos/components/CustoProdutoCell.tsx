/**
 * 💰 Componente para exibir custo do produto com insumos
 * Usado na coluna "Custo Produto" para pedidos OMS/Orçamento
 */

import React, { memo } from 'react';
import { useCustoProdutoComInsumos } from '@/hooks/useCustoProdutoComInsumos';
import { formatMoney } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

interface CustoProdutoCellProps {
  sku: string | null | undefined;
  localEstoqueId?: string | null;
  localVendaId?: string | null;
  quantidade?: number;
}

export const CustoProdutoCell = memo(function CustoProdutoCell({
  sku,
  localEstoqueId,
  localVendaId,
  quantidade = 1
}: CustoProdutoCellProps) {
  const { custoTotal, custoProduto, custoComponentes, custoInsumos, loading, fonte } = useCustoProdutoComInsumos(
    sku,
    localEstoqueId,
    localVendaId
  );

  if (loading) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  // Custo total multiplicado pela quantidade
  const custoTotalQty = custoTotal * quantidade;

  if (custoTotalQty <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const temComponentes = custoComponentes > 0;
  const temInsumos = custoInsumos > 0;
  const temDetalhes = temComponentes || temInsumos;

  const colorClass = 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400';

  if (!temDetalhes) {
    return <span className={colorClass}>{formatMoney(custoTotalQty)}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${colorClass} cursor-help underline decoration-dotted`}>
            {formatMoney(custoTotalQty)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div className="font-semibold border-b pb-1 mb-1">Detalhamento do Custo</div>
            <div className="flex justify-between gap-4">
              <span>Produto:</span>
              <span className="font-mono">{formatMoney(custoProduto * quantidade)}</span>
            </div>
            {temComponentes && (
              <div className="flex justify-between gap-4">
                <span>Componentes:</span>
                <span className="font-mono">{formatMoney(custoComponentes * quantidade)}</span>
              </div>
            )}
            {temInsumos && (
              <div className="flex justify-between gap-4">
                <span>Insumos:</span>
                <span className="font-mono">{formatMoney(custoInsumos * quantidade)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 font-semibold border-t pt-1 mt-1">
              <span>Total:</span>
              <span className="font-mono">{formatMoney(custoTotalQty)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1">
              Fonte: {fonte === 'local_venda' ? 'Local de Venda' : fonte === 'padrao' ? 'Composição Padrão' : 'Produto'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
