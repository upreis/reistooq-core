/**
 * 💰 CÉLULAS DE DADOS FINANCEIROS DETALHADOS
 * 8 campos financeiros avançados
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResponsavelFreteCell } from './ResponsavelFreteCell';

interface FinancialDetailedCellsProps {
  status_dinheiro?: string | null;
  metodo_reembolso?: string | null;
  moeda_reembolso?: string | null;
  percentual_reembolsado?: number | null;
  valor_diferenca_troca?: number | null;
  custo_devolucao?: number | null;
  custo_envio_original?: number | null;
  responsavel_custo_frete?: string | null;
}

export const FinancialDetailedCells = ({
  status_dinheiro,
  metodo_reembolso,
  moeda_reembolso,
  percentual_reembolsado,
  valor_diferenca_troca,
  custo_devolucao,
  custo_envio_original,
  responsavel_custo_frete
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

      {/* Custo Devolução */}
      <TableCell className="text-sm">
        {custo_devolucao ? `R$ ${custo_devolucao.toFixed(2)}` : '-'}
      </TableCell>

      {/* Custo Envio Original */}
      <TableCell className="text-sm">
        {custo_envio_original ? `R$ ${custo_envio_original.toFixed(2)}` : '-'}
      </TableCell>

      {/* Responsável Frete */}
      <TableCell>
        <ResponsavelFreteCell responsavel_custo_frete={responsavel_custo_frete} />
      </TableCell>
    </>
  );
};
