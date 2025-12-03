/**
 * 🎛️ COLUMN MANAGER - VENDAS ONLINE
 * Seletor de colunas padronizado (padrão /reclamacoes)
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
import { COLUMN_DEFINITIONS, CATEGORY_LABELS } from '../config/columns.config';
import type { UseColumnManagerReturn } from '../types/columns.types';
import { useVendasColumnManager } from '../hooks/useVendasColumnManager';

interface ColumnManagerProps {
  manager?: UseColumnManagerReturn;
  onColumnsChange?: (visibleColumns: string[]) => void;
}

export function ColumnManager({ manager, onColumnsChange }: ColumnManagerProps) {
  const defaultManager = useVendasColumnManager();
  const { state, actions, definitions } = manager || defaultManager;
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Agrupar colunas por categoria
  const groupedColumns = definitions.reduce((acc, col) => {
    const group = CATEGORY_LABELS[col.category] || col.category;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(col);
    return acc;
  }, {} as Record<string, typeof definitions>);

  // Filtrar colunas baseado na busca
  const filteredGroups = Object.entries(groupedColumns).reduce((acc, [group, cols]) => {
    const filtered = cols.filter(col => 
      col.label.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof definitions>);

  const toggleColumn = (key: string) => {
    actions.toggleColumn(key);
  };

  const toggleGroup = (group: string) => {
    const groupColumns = groupedColumns[group].map(col => col.key);
    const allVisible = groupColumns.every(key => state.visibleColumns.has(key));
    
    if (allVisible) {
      groupColumns.forEach(key => actions.hideColumn(key));
    } else {
      groupColumns.forEach(key => actions.showColumn(key));
    }
  };

  const selectAll = () => {
    actions.setVisibleColumns(definitions.map(d => d.key));
  };

  const deselectAll = () => {
    actions.setVisibleColumns([]);
  };

  // Contar apenas colunas visíveis que existem nas definições
  const validVisibleCount = [...state.visibleColumns].filter(key => 
    definitions.some(def => def.key === key)
  ).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Settings2 className="h-4 w-4 mr-2" />
          Colunas ({validVisibleCount}/{definitions.length})
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
                {cols.every(col => state.visibleColumns.has(col.key)) ? 'Ocultar' : 'Mostrar'}
              </Button>
            </DropdownMenuLabel>
            {cols.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={state.visibleColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
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
