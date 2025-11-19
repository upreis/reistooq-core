/**
 * 🎛️ SELETOR DE COLUNAS
 * Permite usuário escolher quais colunas visualizar
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Columns3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // Agrupar colunas por grupo
  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.group]) acc[col.group] = [];
    acc[col.group].push(col);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  // Filtrar colunas pela busca
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
    if (visibleColumns.includes(columnId)) {
      onVisibleColumnsChange(visibleColumns.filter(id => id !== columnId));
    } else {
      onVisibleColumnsChange([...visibleColumns, columnId]);
    }
  };

  const toggleGroup = (group: string) => {
    const groupColumns = groupedColumns[group].map(col => col.id);
    const allVisible = groupColumns.every(id => visibleColumns.includes(id));
    
    if (allVisible) {
      onVisibleColumnsChange(visibleColumns.filter(id => !groupColumns.includes(id)));
    } else {
      const newVisible = [...new Set([...visibleColumns, ...groupColumns])];
      onVisibleColumnsChange(newVisible);
    }
  };

  const selectAll = () => {
    onVisibleColumnsChange(columns.map(col => col.id));
  };

  const deselectAll = () => {
    onVisibleColumnsChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
          <Columns3 className="h-4 w-4" />
          {visibleColumns.length < columns.length && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {visibleColumns.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Colunas Visíveis</h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                Todas
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
                Nenhuma
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar coluna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-6">
            {Object.entries(filteredGroups).map(([group, cols]) => (
              <div key={group} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group}
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group)}
                    className="h-6 text-xs"
                  >
                    {cols.every(col => visibleColumns.includes(col.id)) ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {cols.map((col) => (
                    <div key={col.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${col.id}`}
                        checked={visibleColumns.includes(col.id)}
                        onCheckedChange={() => toggleColumn(col.id)}
                      />
                      <label
                        htmlFor={`col-${col.id}`}
                        className="text-sm leading-none cursor-pointer flex-1"
                      >
                        {col.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
