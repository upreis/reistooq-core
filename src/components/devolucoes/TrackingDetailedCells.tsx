/**
 * 📦 CÉLULAS DE RASTREAMENTO DETALHADO
 * 10 campos de tracking avançados
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to safely format dates
const formatSafeDate = (dateValue: any, formatStr: string = 'dd/MM/yyyy HH:mm'): string => {
  if (!dateValue) return '-';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatStr, { locale: ptBR });
  } catch {
    return '-';
  }
};

interface TrackingDetailedCellsProps {
  estimated_delivery_limit?: string | null;
  shipment_status?: string | null;
  refund_at?: string | null;
  review_method?: string | null;
  review_stage?: string | null;
  tracking_history?: any[] | null;
  tracking_events?: any[] | null;
  data_ultima_movimentacao?: string | null;
  data_ultima_atualizacao_return?: string | null;
}

export const TrackingDetailedCells = ({
  estimated_delivery_limit,
  shipment_status,
  refund_at,
  review_method,
  review_stage,
  tracking_history,
  tracking_events,
  data_ultima_movimentacao,
  data_ultima_atualizacao_return
}: TrackingDetailedCellsProps) => {
  return (
    <>
      {/* Limite Entrega */}
      <TableCell className="text-sm">
        {formatSafeDate(estimated_delivery_limit, 'dd/MM/yyyy')}
      </TableCell>

      {/* Status Shipment */}
      <TableCell className="text-sm">
        {shipment_status ? (
          <Badge variant="outline">{shipment_status}</Badge>
        ) : '-'}
      </TableCell>

      {/* Refund At */}
      <TableCell className="text-sm">
        {formatSafeDate(refund_at)}
      </TableCell>

      {/* Review Method */}
      <TableCell className="text-sm">
        {review_method || '-'}
      </TableCell>

      {/* Review Stage */}
      <TableCell className="text-sm">
        {review_stage ? (
          <Badge variant="secondary">{review_stage}</Badge>
        ) : '-'}
      </TableCell>

      {/* Tracking History */}
      <TableCell className="text-sm">
        {tracking_history && tracking_history.length > 0 
          ? `${tracking_history.length} eventos`
          : '-'
        }
      </TableCell>

      {/* Tracking Events */}
      <TableCell className="text-sm">
        {tracking_events && tracking_events.length > 0 
          ? `${tracking_events.length} eventos`
          : '-'
        }
      </TableCell>

      {/* Última Movimentação */}
      <TableCell className="text-sm">
        {formatSafeDate(data_ultima_movimentacao, 'dd/MM HH:mm')}
      </TableCell>

      {/* Última Atualização Return */}
      <TableCell className="text-sm">
        {formatSafeDate(data_ultima_atualizacao_return, 'dd/MM HH:mm')}
      </TableCell>
    </>
  );
};
