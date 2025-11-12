/**
 * 📊 CÉLULAS DE METADADOS
 * 3 campos de metadados e evidências
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MetadataDetailedCellsProps {
  usuario_ultima_acao?: string | null;
  total_evidencias?: number | null;
  anexos_ml?: any[] | null;
}

export const MetadataDetailedCells = ({
  usuario_ultima_acao,
  total_evidencias,
  anexos_ml
}: MetadataDetailedCellsProps) => {
  return (
    <>
      {/* Usuário Última Ação */}
      <TableCell className="text-sm font-mono">
        {usuario_ultima_acao || '-'}
      </TableCell>

      {/* Total Evidências */}
      <TableCell className="text-sm">
        {total_evidencias !== null && total_evidencias !== undefined ? (
          <Badge variant={total_evidencias > 0 ? 'default' : 'secondary'}>
            {total_evidencias} evidências
          </Badge>
        ) : '-'}
      </TableCell>

      {/* Anexos ML */}
      <TableCell className="text-sm">
        {anexos_ml && anexos_ml.length > 0 
          ? `${anexos_ml.length} anexos`
          : '-'
        }
      </TableCell>
    </>
  );
};
