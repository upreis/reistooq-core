/**
 * 📦 CÉLULAS DE PACK DATA
 * 5 campos de pedidos agrupados
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PackDataCellsProps {
  pack_id?: string | null;
  is_pack?: boolean | null;
  pack_items?: any[] | null;
  cancel_detail?: any | null;
  seller_custom_field?: string | null;
}

export const PackDataCells = ({
  pack_id,
  is_pack,
  pack_items,
  cancel_detail,
  seller_custom_field
}: PackDataCellsProps) => {
  return (
    <>
      {/* Pack ID */}
      <TableCell className="text-sm font-mono">
        {pack_id || '-'}
      </TableCell>

      {/* É Pack? */}
      <TableCell className="text-sm">
        {is_pack ? (
          <Badge variant="default">Sim</Badge>
        ) : (
          <Badge variant="secondary">Não</Badge>
        )}
      </TableCell>

      {/* Pack Items */}
      <TableCell className="text-sm">
        {pack_items && pack_items.length > 0 
          ? `${pack_items.length} itens`
          : '-'
        }
      </TableCell>

      {/* Cancel Detail */}
      <TableCell className="text-sm max-w-[150px] truncate">
        {cancel_detail ? (
          <Badge variant="destructive">Cancelado</Badge>
        ) : '-'}
      </TableCell>

      {/* Seller Custom Field */}
      <TableCell className="text-sm max-w-[150px] truncate">
        {seller_custom_field || '-'}
      </TableCell>
    </>
  );
};
