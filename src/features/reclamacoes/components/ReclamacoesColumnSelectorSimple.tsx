/**
 * 🎛️ SELETOR DE COLUNAS SIMPLES - RECLAMAÇÕES
 * Baseado no padrão funcionando de /vendas-online
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
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

export function ReclamacoesColumnSelectorSimple({
  columns,
  visibleColumns,
  onVisibleColumnsChange,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Agrupar colunas por grupo
  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.group]) {
      acc[col.group] = [];
    }
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
    const newVisible = visibleColumns.includes(columnId)
      ? visibleColumns.filter(id => id !== columnId)
      : [...visibleColumns, columnId];
    
    console.log('🎛️ [ColumnSelector] Toggle:', {
      columnId,
      wasVisible: visibleColumns.includes(columnId),
      newCount: newVisible.length,
      newVisible
    });
    
    onVisibleColumnsChange(newVisible);
  };

  const toggleGroup = (group: string) => {
    const groupColumns = groupedColumns[group].map(col => col.id);
    const allVisible = groupColumns.every(id => visibleColumns.includes(id));
    
    let newVisible: string[];
    if (allVisible) {
      // Remover todas do grupo
      newVisible = visibleColumns.filter(id => !groupColumns.includes(id));
    } else {
      // Adicionar todas do grupo
      newVisible = [...new Set([...visibleColumns, ...groupColumns])];
    }
    
    onVisibleColumnsChange(newVisible);
  };

  const selectAll = () => {
    onVisibleColumnsChange(columns.map(col => col.id));
  };

  const deselectAll = () => {
    onVisibleColumnsChange([]);
  };

  // Contar apenas colunas visíveis que existem nas definições
  const validVisibleCount = visibleColumns.filter(id => 
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
      <DropdownMenuContent align="end" className="w-80 max-h-[600px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Selecionar Colunas</span>
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
                {cols.every(col => visibleColumns.includes(col.id)) ? 'Ocultar' : 'Mostrar'}
              </Button>
            </DropdownMenuLabel>
            {cols.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleColumns.includes(col.id)}
                onCheckedChange={() => toggleColumn(col.id)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
