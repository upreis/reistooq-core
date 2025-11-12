import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface FinancialCellsProps {
  devolucao: DevolucaoAvancada;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value}%`;
};

const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
};

export const FinancialCells: React.FC<FinancialCellsProps> = ({ devolucao }) => {
  const breakdown = devolucao.descricao_custos as any;
  const produto = breakdown?.produto || {};
  const frete = breakdown?.frete || {};
  const taxas = breakdown?.taxas || {};
  
  return (
    <>
      {/* Valor Original */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency(produto.valor_original || devolucao.valor_original_produto)}
      </td>
      
      {/* Reembolso Total */}
      <td className="px-3 py-3 text-right font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
        {formatCurrency(devolucao.valor_reembolso_total)}
      </td>
      
      {/* Reembolso Produto */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency(produto.valor_reembolsado || devolucao.valor_reembolso_produto)}
      </td>
      
      {/* ❌ REMOVIDO: % Reembolsado (calculado) */}
      {/* ❌ REMOVIDO: Impacto Vendedor (calculado) */}
      
      {/* Frete Original */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency(frete.valor_original)}
      </td>
      
      {/* Frete Reembolsado */}
      <td className="px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
        {formatCurrency(frete.valor_reembolsado)}
      </td>
      
      {/* ❌ REMOVIDO: Custo Devolução - vazio */}
      {/* ❌ REMOVIDO: Total Logística (calculado) */}
      
      {/* Taxa ML Original */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency(taxas.taxa_ml_original)}
      </td>
      
      {/* ❌ REMOVIDO: Taxa ML Reembolsada - API não fornece */}
      {/* ❌ REMOVIDO: Taxa ML Retida - API não fornece */}
      
      {/* Valor Retido */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency(devolucao.valor_retido)}
      </td>
      
      {/* 🆕 FASE 3: Data Reembolso */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_reembolso)}
      </td>
      
      {/* 🆕 FASE 3: Data Estimada Reembolso */}
      <td className="px-3 py-3 text-center whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
        {formatDateTime(devolucao.data_estimada_reembolso)}
      </td>
    </>
  );
};
