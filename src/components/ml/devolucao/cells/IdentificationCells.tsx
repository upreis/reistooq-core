import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface IdentificationCellsProps {
  devolucao: DevolucaoAvancada;
}

const getPlayerRoleBadge = (role: string | null | undefined) => {
  if (!role) return <span className="text-muted-foreground">-</span>;
  const roleMap: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
    'respondent': { variant: 'default', label: 'Respondente' },
    'claimant': { variant: 'secondary', label: 'Reclamante' }
  };
  const config = roleMap[role] || { variant: 'outline' as const, label: role };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const IdentificationCells: React.FC<IdentificationCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* Pedido ID */}
      <td className="px-3 py-3 text-center font-mono text-blue-600 dark:text-blue-400">
        {devolucao.order_id || '-'}
      </td>
      
      {/* Claim ID */}
      <td className="px-3 py-3 text-center font-mono text-purple-600 dark:text-purple-400">
        {devolucao.claim_id || '-'}
      </td>
      
      {/* Return ID */}
      <td className="px-3 py-3 text-center font-mono text-green-600 dark:text-green-400">
        {devolucao.return_id || '-'}
      </td>
      
      {/* ❌ REMOVIDO: Player Role - vazio */}
      {/* ❌ REMOVIDO: Item ID - vazio */}
      
      {/* SKU */}
      <td className="px-3 py-3 text-center font-mono text-foreground">
        {devolucao.sku || '-'}
      </td>
      
      {/* Transação ID */}
      <td className="px-3 py-3 text-center font-mono text-foreground">
        {devolucao.transaction_id || '-'}
      </td>
    </>
  );
};
