/**
 * 💬 CÉLULAS DE COMUNICAÇÃO DETALHADA
 * 6 campos de timeline e comunicação
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunicationDetailedCellsProps {
  timeline_events?: any[] | null;
  marcos_temporais?: any | null;
  data_criacao_claim?: string | null;
  data_inicio_return?: string | null;
  data_fechamento_claim?: string | null;
  historico_status?: any[] | null;
}

export const CommunicationDetailedCells = ({
  timeline_events,
  marcos_temporais,
  data_criacao_claim,
  data_inicio_return,
  data_fechamento_claim,
  historico_status
}: CommunicationDetailedCellsProps) => {
  return (
    <>
      {/* Timeline Events */}
      <TableCell className="text-sm">
        {timeline_events && timeline_events.length > 0 
          ? `${timeline_events.length} eventos`
          : '-'
        }
      </TableCell>

      {/* Marcos Temporais */}
      <TableCell className="text-sm">
        {marcos_temporais 
          ? <Badge variant="secondary">Disponível</Badge>
          : '-'
        }
      </TableCell>

      {/* Data Criação Claim */}
      <TableCell className="text-sm">
        {data_criacao_claim 
          ? format(new Date(data_criacao_claim), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-'
        }
      </TableCell>

      {/* Data Início Return */}
      <TableCell className="text-sm">
        {data_inicio_return 
          ? format(new Date(data_inicio_return), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-'
        }
      </TableCell>

      {/* Data Fechamento Claim */}
      <TableCell className="text-sm">
        {data_fechamento_claim 
          ? format(new Date(data_fechamento_claim), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-'
        }
      </TableCell>

      {/* Histórico Status */}
      <TableCell className="text-sm">
        {historico_status && historico_status.length > 0 
          ? `${historico_status.length} mudanças`
          : '-'
        }
      </TableCell>
    </>
  );
};
