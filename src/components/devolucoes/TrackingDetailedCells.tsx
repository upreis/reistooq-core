/**
 * 📦 CÉLULAS DE RASTREAMENTO DETALHADO
 * 10 campos de tracking avançados
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrackingDetailedCellsProps {
  estimated_delivery_limit?: string | null;
  shipment_status?: string | null;
  refund_at?: string | null;
  review_method?: string | null;
  review_stage?: string | null;
  localizacao_atual?: string | null;
  status_transporte_atual?: string | null;
  tracking_history?: any[] | null;
  tracking_events?: any[] | null;
  data_ultima_movimentacao?: string | null;
}

export const TrackingDetailedCells = ({
  estimated_delivery_limit,
  shipment_status,
  refund_at,
  review_method,
  review_stage,
  localizacao_atual,
  status_transporte_atual,
  tracking_history,
  tracking_events,
  data_ultima_movimentacao
}: TrackingDetailedCellsProps) => {
  return (
    <>
      {/* Limite Entrega */}
      <TableCell className="text-sm">
        {estimated_delivery_limit 
          ? format(new Date(estimated_delivery_limit), 'dd/MM/yyyy', { locale: ptBR })
          : '-'
        }
      </TableCell>

      {/* Status Shipment */}
      <TableCell className="text-sm">
        {shipment_status ? (
          <Badge variant="outline">{shipment_status}</Badge>
        ) : '-'}
      </TableCell>

      {/* Refund At */}
      <TableCell className="text-sm">
        {refund_at 
          ? format(new Date(refund_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-'
        }
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

      {/* Localização Atual */}
      <TableCell className="text-sm max-w-[200px] truncate">
        {localizacao_atual || '-'}
      </TableCell>

      {/* Status Transporte */}
      <TableCell className="text-sm">
        {status_transporte_atual ? (
          <Badge variant="outline">{status_transporte_atual}</Badge>
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
        {data_ultima_movimentacao 
          ? format(new Date(data_ultima_movimentacao), 'dd/MM HH:mm', { locale: ptBR })
          : '-'
        }
      </TableCell>
    </>
  );
};
