import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DatesCellsProps {
  devolucao: DevolucaoAvancada;
}

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

export const DatesCells: React.FC<DatesCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* Data Criação */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_criacao)}
      </td>
      
      {/* Data Criação Claim */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_criacao_claim)}
      </td>
      
      {/* Data Fechamento */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_fechamento_claim)}
      </td>
      
      {/* Início Devolução */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_inicio_return)}
      </td>
      
      {/* Primeira Ação */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_primeira_acao)}
      </td>
      
      {/* Prazo Limite */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.tempo_limite_acao)}
      </td>
      
      {/* Data Estimada Troca */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_estimada_troca)}
      </td>
      
      {/* Data Limite Troca */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_limite_troca)}
      </td>
      
      {/* Vencimento Ação */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_vencimento_acao)}
      </td>
      
      {/* Processamento Reembolso */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_processamento_reembolso)}
      </td>
      
      {/* Última Sync */}
      <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(devolucao.ultima_sincronizacao)}
      </td>
    </>
  );
};
