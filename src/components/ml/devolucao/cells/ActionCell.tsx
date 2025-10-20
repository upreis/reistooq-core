import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface ActionCellProps {
  devolucao: DevolucaoAvancada;
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const ActionCell: React.FC<ActionCellProps> = ({ devolucao, onViewDetails }) => {
  return (
    <td className="px-3 py-3 text-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(devolucao)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </td>
  );
};
