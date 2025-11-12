/**
 * 💰 CÉLULAS DE DADOS FINANCEIROS DETALHADOS
 * 9 campos financeiros avançados
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FinancialDetailedCellsProps {
  status_dinheiro?: string | null;
  metodo_reembolso?: string | null;
  moeda_reembolso?: string | null;
  percentual_reembolsado?: number | null;
  valor_diferenca_troca?: number | null;
  taxa_ml_reembolso?: number | null;
  custo_devolucao?: number | null;
  parcelas?: number | null;
  valor_parcela?: number | null;
}

export const FinancialDetailedCells = ({
  status_dinheiro,
  metodo_reembolso,
  moeda_reembolso,
  percentual_reembolsado,
  valor_diferenca_troca,
  taxa_ml_reembolso,
  custo_devolucao,
  parcelas,
  valor_parcela
}: FinancialDetailedCellsProps) => {
  return (
    <>
      {/* Status $ */}
      <TableCell className="text-sm">
        {status_dinheiro ? (
          <Badge variant={status_dinheiro === 'refunded' ? 'default' : 'secondary'}>
            {status_dinheiro}
          </Badge>
        ) : '-'}
      </TableCell>

      {/* Método Reembolso */}
      <TableCell className="text-sm">
        {metodo_reembolso || '-'}
      </TableCell>

      {/* Moeda */}
      <TableCell className="text-sm font-mono">
        {moeda_reembolso || '-'}
      </TableCell>

      {/* % Reembolsado */}
      <TableCell className="text-sm">
        {percentual_reembolsado ? `${percentual_reembolsado.toFixed(1)}%` : '-'}
      </TableCell>

      {/* Diferença Troca */}
      <TableCell className="text-sm">
        {valor_diferenca_troca ? `R$ ${valor_diferenca_troca.toFixed(2)}` : '-'}
      </TableCell>

      {/* Taxa ML Reemb. */}
      <TableCell className="text-sm">
        {taxa_ml_reembolso ? `R$ ${taxa_ml_reembolso.toFixed(2)}` : '-'}
      </TableCell>

      {/* Custo Devolução */}
      <TableCell className="text-sm">
        {custo_devolucao ? `R$ ${custo_devolucao.toFixed(2)}` : '-'}
      </TableCell>

      {/* Parcelas */}
      <TableCell className="text-sm">
        {parcelas ? `${parcelas}x` : '-'}
      </TableCell>

      {/* Valor Parcela */}
      <TableCell className="text-sm">
        {valor_parcela ? `R$ ${valor_parcela.toFixed(2)}` : '-'}
      </TableCell>
    </>
  );
};
