// Seletor de colunas para histórico - usando configuração unificada
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Eye, EyeOff } from 'lucide-react';
import { HISTORICO_COLUMN_DEFINITIONS, getDefaultVisibleColumns } from '../config/columns.config';
import type { ColumnDefinition } from '../../pedidos/types/columns.types';

interface ColumnConfig {
  key: string;
  label: string;
  category: 'basic' | 'products' | 'financial' | 'mapping' | 'shipping' | 'meta' | 'ml';
  visible: boolean;
  width?: number;
}

// 🔄 Converter da configuração unificada para o formato do HistoricoColumnSelector
const convertToColumnConfig = (definition: ColumnDefinition): ColumnConfig => ({
  key: definition.key,
  label: definition.label,
  category: definition.category,
  visible: definition.default,
  width: definition.width
});

// ✅ USAR TODAS AS COLUNAS DA CONFIGURAÇÃO UNIFICADA
const defaultColumns: ColumnConfig[] = HISTORICO_COLUMN_DEFINITIONS.map(convertToColumnConfig);

const categoryLabels = {
  basic: 'Básicas',
  products: 'Produtos', 
  financial: 'Financeiras',
  mapping: 'Mapeamento',
  shipping: 'Envio',
  meta: 'Metadados',
  ml: 'Mercado Livre'
};

const categoryColors = {
  basic: 'bg-blue-500',
  products: 'bg-green-500',
  financial: 'bg-purple-500',
  mapping: 'bg-orange-500',
  shipping: 'bg-teal-500',
  meta: 'bg-gray-500',
  ml: 'bg-yellow-500'
};

interface HistoricoColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export function HistoricoColumnSelector({ columns, onColumnsChange }: HistoricoColumnSelectorProps) {
  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>(columns);
  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar tempColumns quando as colunas mudarem
  React.useEffect(() => {
    setTempColumns(columns);
  }, [columns]);

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    setTempColumns(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    );
  };

  const handleSave = () => {
    onColumnsChange(tempColumns);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempColumns(defaultColumns);
  };

  const visibleCount = tempColumns.filter(col => col.visible).length;
  const totalCount = tempColumns.length;

  const groupedColumns = tempColumns.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = [];
    }
    acc[column.category].push(column);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Colunas
          <Badge variant="secondary" className="ml-2">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Selecionar Colunas</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Padrão
              </Button>
              <Button size="sm" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedColumns).map(([category, categoryColumns]) => (
            <Card key={category}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`} />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                  <Badge variant="outline" className="ml-auto">
                    {categoryColumns.filter(col => col.visible).length}/{categoryColumns.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-3">
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={(checked) => 
                        handleColumnToggle(column.key, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {column.visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${column.visible ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {column.label}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {visibleCount} de {totalCount} colunas selecionadas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              Aplicar Colunas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { defaultColumns };
export type { ColumnConfig };