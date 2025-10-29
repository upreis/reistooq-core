/**
 * 🎛️ SELETOR DE COLUNAS PARA TABELA DE RECLAMAÇÕES
 */

import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Eye, EyeOff } from 'lucide-react';

interface ReclamacoesColumnSelectorProps {
  table: Table<any>;
}

export function ReclamacoesColumnSelector({ table }: ReclamacoesColumnSelectorProps) {
  const allColumns = table.getAllLeafColumns();
  const visibleColumns = allColumns.filter(col => col.getIsVisible());
  
  const columnGroups = {
    'Identificação': ['status_analise', 'empresa', 'claim_id', 'type', 'status', 'stage'],
    'Recurso': ['resource_id', 'resource', 'reason_name', 'reason_detail'],
    'Datas': ['date_created', 'last_updated', 'order_date_created', 'resolution_date'],
    'Cliente & Produto': ['buyer_nickname', 'order_item_title', 'order_item_quantity', 'order_item_unit_price', 'order_item_seller_sku'],
    'Valores': ['amount_value', 'order_total', 'impacto_financeiro'],
    'Resolução': ['resolution_benefited', 'resolution_reason'],
    'Outros': ['site_id', 'tem_trocas', 'tem_mediacao', 'order_id', 'order_status'],
    'Ações': ['actions']
  };

  const handleToggleAll = (show: boolean) => {
    allColumns.forEach(column => {
      if (column.id !== 'status_analise' && column.id !== 'actions') {
        column.toggleVisibility(show);
      }
    });
  };

  const handleResetToDefault = () => {
    allColumns.forEach(column => {
      // Sempre visíveis
      if (['status_analise', 'empresa', 'claim_id', 'type', 'status', 'actions'].includes(column.id)) {
        column.toggleVisibility(true);
      }
      // Escondidos por padrão
      else if (['site_id', 'resource_id'].includes(column.id)) {
        column.toggleVisibility(false);
      }
      // Resto visível
      else {
        column.toggleVisibility(true);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Colunas
          <span className="text-xs text-muted-foreground ml-1">
            ({visibleColumns.length}/{allColumns.length})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[280px] max-h-[500px] overflow-y-auto bg-background z-50"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Gerenciar Colunas</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleToggleAll(true)}
              title="Mostrar todas"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleToggleAll(false)}
              title="Ocultar todas"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleResetToDefault}
          >
            Restaurar Padrão
          </Button>
        </div>

        <DropdownMenuSeparator />

        {Object.entries(columnGroups).map(([groupName, columnIds]) => {
          const groupColumns = allColumns.filter(col => columnIds.includes(col.id));
          
          if (groupColumns.length === 0) return null;

          return (
            <div key={groupName}>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium py-1">
                {groupName}
              </DropdownMenuLabel>
              {groupColumns.map((column) => {
                const columnTitle = typeof column.columnDef.header === 'function' 
                  ? column.id 
                  : String(column.columnDef.header || column.id);
                
                const isFixed = column.id === 'status_analise' || column.id === 'actions';
                
                return (
                  <DropdownMenuItem
                    key={column.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!isFixed) {
                        column.toggleVisibility(!column.getIsVisible());
                      }
                    }}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      disabled={isFixed}
                      className="pointer-events-none"
                    />
                    <span className={`text-sm ${isFixed ? 'text-muted-foreground' : ''}`}>
                      {columnTitle}
                      {isFixed && ' (fixo)'}
                    </span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
