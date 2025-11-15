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
        <Button variant="outline">
          <Columns3 className="h-4 w-4 mr-2" />
          Colunas
          <Badge variant="secondary" className="ml-2">
            {visibleColumns.length}/{columns.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colunas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="flex-1">
              Selecionar Todas
            </Button>
            <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1">
              Limpar
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="p-3 space-y-4">
            {Object.entries(filteredGroups).map(([group, cols]) => {
              const groupColumns = cols.map(col => col.id);
              const allVisible = groupColumns.every(id => visibleColumns.includes(id));
              const someVisible = groupColumns.some(id => visibleColumns.includes(id));

              return (
                <div key={group} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allVisible}
                      onCheckedChange={() => toggleGroup(group)}
                      className={someVisible && !allVisible ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                    <span className="font-medium text-sm">{group}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {groupColumns.filter(id => visibleColumns.includes(id)).length}/{groupColumns.length}
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-2">
                    {cols.map((col) => (
                      <div key={col.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={visibleColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <span className="text-sm">{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
