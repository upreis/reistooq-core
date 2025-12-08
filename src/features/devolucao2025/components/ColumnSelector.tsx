/**
 * 🎛️ SELETOR DE COLUNAS - DEVOLUÇÕES
 * Com estado pendente e botões Cancelar/Aplicar
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface ColumnConfig {
  id: string;
  label: string;
  group: string;
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
}

export const ColumnSelector = ({ 
  columns, 
  visibleColumns, 
  onVisibleColumnsChange 
}: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingColumns, setPendingColumns] = useState<string[]>(visibleColumns);

  // Sincronizar pendingColumns quando visibleColumns mudar externamente
  useEffect(() => {
    if (!open) {
      setPendingColumns(visibleColumns);
    }
  }, [visibleColumns, open]);

  // Resetar pendingColumns ao abrir dropdown
  useEffect(() => {
    if (open) {
      setPendingColumns(visibleColumns);
    }
  }, [open]);

  // Agrupar colunas por grupo
  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.group]) acc[col.group] = [];
    acc[col.group].push(col);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  // Filtrar colunas baseado na busca
  const filteredGroups = Object.entries(groupedColumns).reduce((acc, [group, cols]) => {
    const filtered = cols.filter(col => 
      col.label.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  const toggleColumn = (columnId: string) => {
    setPendingColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleGroup = (group: string) => {
    const groupColumns = groupedColumns[group].map(col => col.id);
    const allVisible = groupColumns.every(id => pendingColumns.includes(id));
    
    if (allVisible) {
      setPendingColumns(prev => prev.filter(id => !groupColumns.includes(id)));
    } else {
      setPendingColumns(prev => [...new Set([...prev, ...groupColumns])]);
    }
  };

  const selectAll = () => {
    setPendingColumns(columns.map(col => col.id));
  };

  const deselectAll = () => {
    setPendingColumns([]);
  };

  const handleApply = () => {
    onVisibleColumnsChange(pendingColumns);
    setOpen(false);
  };

  const handleCancel = () => {
    setPendingColumns(visibleColumns);
    setOpen(false);
  };

  // Verificar se há mudanças pendentes
  const hasChanges = JSON.stringify([...pendingColumns].sort()) !== JSON.stringify([...visibleColumns].sort());

  // Contar colunas
  const validVisibleCount = visibleColumns.filter(id => 
    columns.some(col => col.id === id)
  ).length;

  const pendingCount = pendingColumns.filter(id => 
    columns.some(col => col.id === id)
  ).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Settings2 className="h-4 w-4 mr-2" />
          Colunas ({validVisibleCount}/{columns.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[600px] flex flex-col">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Selecionar Colunas ({pendingCount}/{columns.length})</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs">
              Todas
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="h-6 text-xs">
              Nenhuma
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <div className="px-2 pb-2">
          <Input
            placeholder="Buscar coluna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        
        <DropdownMenuSeparator />

        <div className="overflow-y-auto flex-1 max-h-[400px]">
          {Object.entries(filteredGroups).map(([group, cols]) => (
            <div key={group}>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-xs font-semibold">{group}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGroup(group)}
                  className="h-5 text-xs"
                >
                  {cols.every(col => pendingColumns.includes(col.id)) ? 'Ocultar' : 'Mostrar'}
                </Button>
              </DropdownMenuLabel>
              {cols.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={pendingColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </div>

        {/* Botões Cancelar/Aplicar */}
        <div className="p-2 border-t flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!hasChanges}
            className="h-8"
          >
            <Check className="h-3 w-3 mr-1" />
            Aplicar
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
