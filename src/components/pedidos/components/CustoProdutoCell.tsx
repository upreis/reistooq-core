/**
 * 💰 Componente para exibir custo do produto com insumos
 * Segue a mesma lógica da página /estoque/composicoes
 * 
 * Custo Total = Composição Padrão + Insumos Local de Venda
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
  const { 
    custoTotal, 
    custoComposicaoPadrao, 
    custoInsumosLocal, 
    loading, 
    fonte,
    detalhes 
  } = useCustoProdutoComInsumos(sku, localEstoqueId, localVendaId);

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

  const temComposicao = custoComposicaoPadrao > 0;
  const temInsumos = custoInsumosLocal > 0;
  const temDetalhes = temComposicao || temInsumos;

  const colorClass = 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400';

  // Sem detalhes, mostra valor simples
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
        <TooltipContent side="top" className="max-w-sm">
          <div className="text-xs space-y-1">
            <div className="font-semibold border-b pb-1 mb-1">
              Custo por Unidade: {formatMoney(custoTotal)}
            </div>
            
            {/* Composição Padrão */}
            {detalhes.componentesPadrao.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-muted-foreground text-[10px] uppercase">Composição Padrão</div>
                {detalhes.componentesPadrao.map((comp, idx) => (
                  <div key={idx} className="flex justify-between gap-4">
                    <span className="truncate max-w-[140px]" title={comp.sku}>
                      {comp.sku} ×{comp.quantidade}
                    </span>
                    <span className="font-mono">{formatMoney(comp.custoTotal)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Insumos do Local de Venda */}
            {detalhes.insumosLocal.length > 0 && (
              <div className="space-y-0.5 pt-1">
                <div className="text-muted-foreground text-[10px] uppercase">Insumos Local</div>
                {detalhes.insumosLocal.map((ins, idx) => (
                  <div key={idx} className="flex justify-between gap-4">
                    <span className="truncate max-w-[140px]" title={ins.sku}>
                      {ins.sku} ×{ins.quantidade}
                    </span>
                    <span className="font-mono">{formatMoney(ins.custoTotal)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Total (quantidade > 1) */}
            {quantidade > 1 && (
              <div className="flex justify-between gap-4 font-semibold border-t pt-1 mt-1">
                <span>Total ({quantidade}×):</span>
                <span className="font-mono">{formatMoney(custoTotalQty)}</span>
              </div>
            )}
            
            {/* Fonte */}
            <div className="text-[10px] text-muted-foreground pt-1 border-t mt-1">
              Fonte: {fonte === 'local_venda' ? 'Local de Venda' : fonte === 'padrao' ? 'Composição Padrão' : 'Sem composição'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
