import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface StatusCellsProps {
  devolucao: DevolucaoAvancada;
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  
  const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
    'completed': { variant: 'default', label: 'Completo' },
    'cancelled': { variant: 'destructive', label: 'Cancelado' },
    'closed': { variant: 'secondary', label: 'Fechado' },
    'opened': { variant: 'outline', label: 'Aberto' },
    'pending': { variant: 'outline', label: 'Pendente' }
  };
  
  const config = statusMap[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getBooleanBadge = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return <Badge variant={value ? 'default' : 'destructive'}>{value ? 'Sim' : 'Não'}</Badge>;
};

export const StatusCells: React.FC<StatusCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* Status */}
      <td className="px-3 py-3 text-center">
        {getStatusBadge(devolucao.status_devolucao)}
      </td>
      
      {/* Etapa */}
      <td className="px-3 py-3 text-center">
        {devolucao.claim_stage ? <Badge variant="outline">{devolucao.claim_stage}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* Resolução */}
      <td className="px-3 py-3 text-center">
        {devolucao.resultado_final ? <Badge variant="secondary">{devolucao.resultado_final}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* Status Rastreio */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_rastreamento_pedido ? (
          <Badge variant="outline">{devolucao.status_rastreamento_pedido}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Status Review */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_status ? (
          <Badge variant="outline">{devolucao.review_status}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Status Moderação */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_moderacao ? (
          <Badge variant="outline">{devolucao.status_moderacao}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </>
  );
};
