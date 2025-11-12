/**
 * ⚖️ CÉLULAS DE MEDIAÇÃO DETALHADA
 * 6 campos de mediação e troca
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MediationDetailedCellsProps {
  resultado_mediacao?: string | null;
  detalhes_mediacao?: string | null;
  produto_troca_id?: string | null;
  novo_pedido_id?: string | null;
  dias_restantes_acao?: number | null;
  prazo_revisao_dias?: number | null;
}

export const MediationDetailedCells = ({
  resultado_mediacao,
  detalhes_mediacao,
  produto_troca_id,
  novo_pedido_id,
  dias_restantes_acao,
  prazo_revisao_dias
}: MediationDetailedCellsProps) => {
  return (
    <>
      {/* Resultado Mediação */}
      <TableCell className="text-sm max-w-[150px] truncate">
        {resultado_mediacao || '-'}
      </TableCell>

      {/* Detalhes Mediação */}
      <TableCell className="text-sm max-w-[200px] truncate">
        {detalhes_mediacao || '-'}
      </TableCell>

      {/* Produto Troca ID */}
      <TableCell className="text-sm font-mono">
        {produto_troca_id || '-'}
      </TableCell>

      {/* Novo Pedido ID */}
      <TableCell className="text-sm font-mono">
        {novo_pedido_id || '-'}
      </TableCell>

      {/* Dias Restantes Ação */}
      <TableCell className="text-sm">
        {dias_restantes_acao !== null && dias_restantes_acao !== undefined ? (
          <Badge variant={dias_restantes_acao <= 2 ? 'destructive' : 'default'}>
            {dias_restantes_acao} dias
          </Badge>
        ) : '-'}
      </TableCell>

      {/* Prazo Revisão Dias */}
      <TableCell className="text-sm">
        {prazo_revisao_dias !== null && prazo_revisao_dias !== undefined ? (
          <Badge variant={prazo_revisao_dias <= 2 ? 'destructive' : 'secondary'}>
            {prazo_revisao_dias} dias
          </Badge>
        ) : '-'}
      </TableCell>
    </>
  );
};
