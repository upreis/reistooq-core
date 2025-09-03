import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileTableColumn {
  key: string;
  label: string;
  primary?: boolean; // Show in card header
  render?: (value: any, item: any) => React.ReactNode;
  sortable?: boolean;
}

interface MobileTableAction {
  label: string;
  onClick: (item: any) => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  icon?: React.ReactNode;
}

interface MobileTableProps {
  data: any[];
  columns: MobileTableColumn[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  keyField?: string;
  actions?: MobileTableAction[];
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export default function MobileTable({
  data,
  columns,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  keyField = "id",
  actions = [],
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  sortBy,
  sortOrder,
  onSort,
}: MobileTableProps) {
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const primaryColumn = columns.find(col => col.primary);
  const secondaryColumns = columns.filter(col => !col.primary);
  const selectableItems = onSelectItem && selectedItems;
  const allSelected = selectableItems && data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectableItems && selectedItems.length > 0 && selectedItems.length < data.length;

  // Desktop table view
  if (!isMobile) {
    // Definir larguras específicas para cada tipo de coluna
    const getColumnWidth = (column: MobileTableColumn) => {
      switch (column.key) {
        case 'nome': return '220px';
        case 'codigo_barras': return '120px';
        case 'sku_interno': return '100px';
        case 'categoria_principal': return '140px';
        case 'categoria_nivel2': return '120px';
        case 'subcategoria': return '120px';
        case 'quantidade_atual': return '100px';
        case 'estoque_range': return '100px';
        case 'precos': return '120px';
        case 'ultima_movimentacao': return '110px';
        default: return '1fr';
      }
    };

    const gridCols = columns.map(col => getColumnWidth(col)).join(' ');
    const fullGridTemplate = `${selectableItems ? '40px ' : ''}${gridCols}${actions.length > 0 ? ' 120px' : ''}`;

    return (
      <div className="w-full -mx-1">
        <div className="min-w-fit px-1">
          {/* Table Header */}
          <div className="grid gap-2 py-3 px-4 bg-muted/50 rounded-lg text-xs font-medium mb-4"
               style={{ gridTemplateColumns: fullGridTemplate }}>
            {selectableItems && (
              <div className="flex items-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = someSelected;
                  }}
                />
              </div>
            )}
            {columns.map((column) => (
              <div 
                key={column.key}
                className={cn(
                  "flex items-center text-xs font-semibold truncate",
                  column.sortable && onSort && "cursor-pointer hover:text-foreground"
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
                title={column.label}
              >
                <span className="truncate">{column.label}</span>
                {column.sortable && sortBy === column.key && (
                  <span className="ml-1 text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            ))}
            {actions.length > 0 && <div className="text-xs font-semibold">Ações</div>}
          </div>

          {/* Table Rows */}
          <div className="space-y-1">
            {data.map((item) => {
              const isSelected = selectableItems ? selectedItems.includes(item[keyField]) : false;
              
              return (
                <div
                  key={item[keyField]}
                  className={cn(
                    "grid gap-2 py-3 px-4 border rounded-lg hover:bg-muted/30 transition-colors",
                    isSelected && "bg-muted/50 border-primary"
                  )}
                  style={{ gridTemplateColumns: fullGridTemplate }}
                >
                  {selectableItems && (
                    <div className="flex items-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectItem(item[keyField])}
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div key={column.key} className="flex items-center min-w-0">
                      <div className="min-w-0 w-full">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : <span className="text-xs truncate block">{item[column.key]}</span>
                        }
                      </div>
                    </div>
                  ))}
                  {actions.length > 0 && (
                    <div className="flex items-center justify-end gap-1">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          onClick={() => action.onClick(item)}
                          className="text-[10px] px-1.5 h-7"
                          title={action.label}
                        >
                          {action.icon}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Mobile card view
  return (
    <div className="space-y-3">
      {/* Selection header on mobile */}
      {selectableItems && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = someSelected;
                  }}
                />
                <span className="text-sm">
                  {selectedItems.length > 0 
                    ? `${selectedItems.length} selecionado(s)`
                    : "Selecionar todos"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards */}
      {data.map((item) => {
        const isSelected = selectableItems ? selectedItems.includes(item[keyField]) : false;
        
        return (
          <Card 
            key={item[keyField]}
            className={cn(
              "transition-colors",
              isSelected && "ring-2 ring-primary bg-primary/5"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {selectableItems && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectItem(item[keyField])}
                      className="mt-0.5"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {primaryColumn && (
                      <h3 className="font-medium text-sm leading-tight mobile-text">
                        {primaryColumn.render 
                          ? primaryColumn.render(item[primaryColumn.key], item)
                          : item[primaryColumn.key]
                        }
                      </h3>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Secondary fields */}
              <div className="space-y-2">
                {secondaryColumns.map((column) => (
                  <div key={column.key} className="flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {column.label}
                    </span>
                    <div className="text-xs font-medium mobile-text">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : item[column.key]
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={() => action.onClick(item)}
                      className="text-xs h-7"
                    >
                      {action.icon && (
                        <span className="mr-1">{action.icon}</span>
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}