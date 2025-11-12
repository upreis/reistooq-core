/**
 * 💰 CÉLULAS DE DADOS FINANCEIROS DETALHADOS
 * 12 campos financeiros que estavam sendo mapeados mas não exibidos
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, Percent, CreditCard } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface FinancialDetailedCellsProps {
  devolucao: DevolucaoAvancada;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
};

export function FinancialDetailedCells({ devolucao }: FinancialDetailedCellsProps) {
  // 🐛 DEBUG: Ver campos financeiros
  console.log('🔍 FinancialDetailedCells - status_dinheiro:', devolucao.status_dinheiro);
  console.log('🔍 FinancialDetailedCells - metodo_reembolso:', devolucao.metodo_reembolso);
  
  return (
    <>
      {/* Status $ */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_dinheiro ? (
          <Badge 
            variant={
              devolucao.status_dinheiro === 'refunded' ? 'default' : 
              devolucao.status_dinheiro === 'pending' ? 'outline' : 
              'destructive'
            }
          >
            <DollarSign className="h-3 w-3 mr-1" />
            {devolucao.status_dinheiro === 'refunded' ? 'Reembolsado' :
             devolucao.status_dinheiro === 'pending' ? 'Pendente' :
             devolucao.status_dinheiro === 'retained' ? 'Retido' : 'Não Reembolsado'}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Método Reembolso */}
      <td className="px-3 py-3 text-center">
        {devolucao.metodo_reembolso ? (
          <Badge variant="outline">
            <CreditCard className="h-3 w-3 mr-1" />
            {devolucao.metodo_reembolso}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Moeda Reembolso */}
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-mono">
          {devolucao.moeda_reembolso || 'BRL'}
        </span>
      </td>

      {/* % Reembolsado */}
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Percent className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">
            {formatPercentage(devolucao.percentual_reembolsado)}
          </span>
        </div>
      </td>

      {/* Valor Diferença Troca */}
      <td className="px-3 py-3 text-right">
        {devolucao.valor_diferenca_troca ? (
          <span className={`font-semibold ${devolucao.valor_diferenca_troca > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(devolucao.valor_diferenca_troca)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Taxa ML Reembolsada */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-mono">
          {formatCurrency(devolucao.taxa_ml_reembolso)}
        </span>
      </td>

      {/* Custo Devolução */}
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <TrendingDown className="h-3 w-3 text-red-600" />
          <span className="font-mono">
            {formatCurrency(devolucao.custo_devolucao)}
          </span>
        </div>
      </td>

      {/* Parcelas */}
      <td className="px-3 py-3 text-center">
        {devolucao.parcelas ? (
          <Badge variant="outline">{devolucao.parcelas}x</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Valor Parcela */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-mono">
          {formatCurrency(devolucao.valor_parcela)}
        </span>
      </td>
    </>
  );
}
