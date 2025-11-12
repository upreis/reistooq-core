import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { traduzirStatusDevolucao, traduzirResolucao } from '@/utils/mlTranslations';

interface StatusCellsProps {
  devolucao: DevolucaoAvancada;
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  
  const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary" }> = {
    'completed': { variant: 'default' },
    'cancelled': { variant: 'destructive' },
    'closed': { variant: 'secondary' },
    'opened': { variant: 'outline' },
    'pending': { variant: 'outline' }
  };
  
  const config = statusMap[status] || { variant: 'outline' as const };
  return <Badge variant={config.variant}>{traduzirStatusDevolucao(status)}</Badge>;
};

const getBooleanBadge = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return <Badge variant={value ? 'default' : 'destructive'}>{value ? 'Sim' : 'Não'}</Badge>;
};

export const StatusCells: React.FC<StatusCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* Status da Devolução */}
      <td className="px-3 py-3 text-center">
        {getStatusBadge(devolucao.status_devolucao)}
      </td>
      
      {/* ❌ REMOVIDO: Etapa - excluído conforme solicitação do usuário */}
      
      {/* Resolução */}
      <td className="px-3 py-3 text-center">
        {devolucao.resultado_final ? <Badge variant="secondary">{traduzirResolucao(devolucao.resultado_final)}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* ❌ REMOVIDO: Status Rastreio - vazio */}
      {/* ❌ REMOVIDO: Status Review - vazio */}
      {/* ❌ REMOVIDO: Status Moderação - excluído conforme solicitação do usuário */}
    </>
  );
};
