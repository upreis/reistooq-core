/**
 * 🎛️ GERENCIADOR DE COLUNAS - VENDAS COM ENVIO
 * Componente para selecionar quais colunas exibir na tabela
 * Aplica mudanças apenas ao clicar em "Aplicar"
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
import { Settings2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VENDAS_COMENVIO_COLUMN_DEFINITIONS, CATEGORY_LABELS } from '../config/vendas-comenvio-columns-config';
import type { UseColumnManagerReturn } from '@/core/columns';

interface VendasComEnvioColumnManagerProps {
  manager: UseColumnManagerReturn & { visibleColumnKeys?: string[] };
}

export function VendasComEnvioColumnManager({ manager }: VendasComEnvioColumnManagerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const { state, actions, definitions } = manager;
  
  // Estado local temporário para mudanças pendentes
  const [pendingColumns, setPendingColumns] = useState<Set<string>>(new Set(state.visibleColumns));
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar estado local quando o dropdown abre
  useEffect(() => {
    if (open) {
      setPendingColumns(new Set(state.visibleColumns));
      setHasChanges(false);
    }
  }, [open, state.visibleColumns]);

  const pendingArray = Array.from(pendingColumns);

  // Agrupar colunas por categoria
  const groupedColumns = definitions.reduce((acc, col) => {
    const category = col.category || 'basic';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(col);
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
    setPendingColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const toggleGroup = (category: string) => {
    const groupColumns = groupedColumns[category].map(col => col.key);
    const allVisible = groupColumns.every(key => pendingColumns.has(key));
    
    setPendingColumns(prev => {
      const newSet = new Set(prev);
      if (allVisible) {
        groupColumns.forEach(key => newSet.delete(key));
      } else {
        groupColumns.forEach(key => newSet.add(key));
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const selectAll = () => {
    setPendingColumns(new Set(definitions.map(col => col.key)));
    setHasChanges(true);
  };

  const deselectAll = () => {
    setPendingColumns(new Set());
    setHasChanges(true);
  };

  const applyChanges = () => {
    actions.setVisibleColumns(Array.from(pendingColumns));
    setHasChanges(false);
    setOpen(false);
  };

  const cancelChanges = () => {
    setPendingColumns(new Set(state.visibleColumns));
    setHasChanges(false);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Settings2 className="h-4 w-4 mr-2" />
          Colunas ({Array.from(state.visibleColumns).length}/{definitions.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[600px] overflow-y-auto bg-background">
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

        {Object.entries(filteredGroups).map(([category, cols]) => (
          <div key={category}>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                {CATEGORY_LABELS[category] || category}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleGroup(category)}
                className="h-5 text-xs"
              >
                {cols.every(col => pendingColumns.has(col.key)) ? 'Ocultar' : 'Mostrar'}
              </Button>
            </DropdownMenuLabel>
            {cols.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={pendingColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                onSelect={(e) => e.preventDefault()}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}

        {/* Footer com botão Aplicar */}
        <div className="sticky bottom-0 bg-background border-t border-border p-2 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelChanges}
            className="h-8"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={applyChanges}
            disabled={!hasChanges}
            className="h-8"
          >
            <Check className="h-4 w-4 mr-1" />
            Aplicar ({pendingArray.length})
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
