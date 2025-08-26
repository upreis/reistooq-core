import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Download, X, CheckSquare } from "lucide-react";
import { HistoricoItem } from '../services/HistoricoSimpleService';

interface HistoricoBulkActionsProps {
  selectedCount: number;
  selectedItems: HistoricoItem[];
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  isProcessing?: boolean;
}

export function HistoricoBulkActions({
  selectedCount,
  selectedItems,
  onExportSelected,
  onDeleteSelected,
  onClearSelection,
  onSelectAll,
  isProcessing = false
}: HistoricoBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-muted-foreground">
                registros
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-primary hover:text-primary/80"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar todos na página
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelected}
              disabled={isProcessing}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Selecionados
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isProcessing}
              className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Selecionados
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}