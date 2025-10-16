import React, { useState } from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import { DevolucaoDetailsDialog } from './DevolucaoDetailsDialog';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTable = React.memo<DevolucaoTableProps>(({
  devolucoes,
  onViewDetails
}) => {
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);

  return (
    <>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 dark:bg-muted border-b">
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Claim ID</th>
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[140px]">Data</th>
              <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Status</th>
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Comprador</th>
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Produto</th>
              <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Valor</th>
              <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Método Pag.</th>
              <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {devolucoes.map((devolucao) => (
              <DevolucaoTableRow
                key={devolucao.id}
                devolucao={devolucao}
                onViewDetails={(dev) => setSelectedDevolucao(dev)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <DevolucaoDetailsDialog
        devolucao={selectedDevolucao}
        open={!!selectedDevolucao}
        onOpenChange={(open) => !open && setSelectedDevolucao(null)}
      />
    </>
  );
});