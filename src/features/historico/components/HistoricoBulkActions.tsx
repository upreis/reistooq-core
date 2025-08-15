import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Trash2, Edit } from 'lucide-react';

interface HistoricoBulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string, selectedIds: string[]) => void;
  isLoading: boolean;
  totalItems: number;
}

export const HistoricoBulkActions: React.FC<HistoricoBulkActionsProps> = ({
  selectedCount,
  onBulkAction,
  isLoading,
  totalItems
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCount} de {totalItems} itens selecionados
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('export', [])}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('edit', [])}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkAction('delete', [])}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};