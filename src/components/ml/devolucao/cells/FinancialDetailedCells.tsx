/**
 * 💰 CÉLULAS FINANCEIRAS DETALHADAS
 * Campos financeiros adicionais que complementam FinancialCell
 */

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Percent, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FinancialDetailedCellsProps {
  status_dinheiro?: string;
  metodo_pagamento?: string;
  moeda_reembolso?: string;
  percentual_reembolsado?: number;
  valor_diferenca_troca?: number;
  custo_devolucao?: number;
  custo_envio_original?: number;
  responsavel_custo_frete?: string;
  shipping_fee?: number;
  handling_fee?: number;
  insurance?: number;
  taxes?: number;
}

const formatCurrency = (value?: number, currency: string = 'BRL') => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
};

const statusDinheiroConfig: Record<string, { className: string; label: string }> = {
  approved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Aprovado' },
  pending: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Pendente' },
  rejected: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Rejeitado' },
  refunded: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Reembolsado' },
};

export function FinancialDetailedCells({
  status_dinheiro,
  metodo_pagamento,
  moeda_reembolso,
  percentual_reembolsado,
  valor_diferenca_troca,
  custo_devolucao,
  custo_envio_original,
  responsavel_custo_frete,
  shipping_fee,
  handling_fee,
  insurance,
  taxes
}: FinancialDetailedCellsProps) {
  return (
    <>
      {/* STATUS DINHEIRO */}
      <TableCell className="text-sm">
        {status_dinheiro ? (
          <Badge 
            variant="secondary"
            className={statusDinheiroConfig[status_dinheiro]?.className || 'bg-gray-100 text-gray-800'}
          >
            {statusDinheiroConfig[status_dinheiro]?.label || status_dinheiro}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* MÉTODO PAGAMENTO */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate max-w-[120px]">{metodo_pagamento || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Método de pagamento usado na compra original</p>
              {metodo_pagamento && <p className="text-xs font-mono mt-1">{metodo_pagamento}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* MOEDA REEMBOLSO */}
      <TableCell className="text-xs font-mono">
        {moeda_reembolso || '-'}
      </TableCell>

      {/* PERCENTUAL REEMBOLSADO */}
      <TableCell className="text-sm">
        {percentual_reembolsado !== null && percentual_reembolsado !== undefined ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{percentual_reembolsado.toFixed(1)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Percentual do valor total que será reembolsado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* VALOR DIFERENÇA TROCA */}
      <TableCell className="text-sm">
        {valor_diferenca_troca !== null && valor_diferenca_troca !== undefined ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{formatCurrency(valor_diferenca_troca, moeda_reembolso || 'BRL')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Diferença de valor em caso de troca por produto mais caro/barato</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* CUSTO DEVOLUÇÃO */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatCurrency(custo_devolucao, moeda_reembolso || 'BRL')}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Custo do frete de devolução</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* CUSTO ENVIO ORIGINAL */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{formatCurrency(custo_envio_original, moeda_reembolso || 'BRL')}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Custo do frete no envio original para o comprador</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* RESPONSÁVEL CUSTO FRETE */}
      <TableCell className="text-sm">
        {responsavel_custo_frete ? (
          <Badge variant="secondary" className="gap-1">
            {responsavel_custo_frete === 'buyer' && '👤 Comprador'}
            {responsavel_custo_frete === 'seller' && '🏪 Vendedor'}
            {responsavel_custo_frete === 'marketplace' && '🏬 ML'}
            {!['buyer', 'seller', 'marketplace'].includes(responsavel_custo_frete) && responsavel_custo_frete}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </>
  );
}
