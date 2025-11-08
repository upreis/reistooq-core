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
  width?: string; // Adicionado: suporte para largura customizada
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
  onRowClick?: (item: any) => void;
  rowClassName?: string; // Nova prop para classes customizadas (deprecated)
  getRowClassName?: (item: any, index: number) => string; // Função para determinar classes dinamicamente
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
  onRowClick,
  rowClassName,
  getRowClassName,
}: MobileTableProps) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Carregando...</p>
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

  const selectableItems = !!onSelectItem && !isMobile;
  const allSelected = false; // Removido - não usar seleção no header
  const someSelected = false; // Removido - não usar seleção no header

  const primaryColumn = columns.find(col => col.primary);
  const secondaryColumns = columns.filter(col => !col.primary);

  // Desktop table view
  if (!isMobile) {
    // Definir larguras específicas para cada tipo de coluna
    const getColumnWidth = (column: MobileTableColumn) => {
      // Se a coluna tem uma largura definida nas props, usar ela
      if ((column as any).width) {
        return (column as any).width;
      }
      
      switch (column.key) {
        case 'nome': return '200px';
        case 'codigo_barras': return '110px';
        case 'sku_interno': return '250px';
        case 'categoria_principal': return '130px';
        case 'categoria_nivel2': return '110px';
        case 'subcategoria': return '110px';
        case 'quantidade_atual': return '90px';
        case 'estoque_range': return '90px';
        case 'precos': return '110px';
        case 'ultima_movimentacao': return '100px';
        default: return 'minmax(80px, 1fr)';
      }
    };

    const gridCols = columns.map(col => getColumnWidth(col)).join(' ');
    // Adicionar espaço para checkbox individual, mas não para header
    const fullGridTemplate = `${selectableItems ? '40px ' : ''}${gridCols}${actions.length > 0 ? ' 140px' : ''}`;

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-max">
          {/* Table Header */}
          <div className="grid gap-2 py-3 px-4 bg-black rounded-lg text-xs font-medium mb-4"
               style={{ gridTemplateColumns: fullGridTemplate }}>
            {selectableItems && (
              <div className="flex items-center">
                {/* Espaço vazio - sem checkbox no header */}
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
                  <span className="ml-1 text-xs">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            ))}
            {actions.length > 0 && (
              <div className="text-center text-xs font-semibold">
                Ações
              </div>
            )}
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {data.map((item, index) => {
              const isSelected = selectableItems ? selectedItems.includes(item[keyField]) : false;
              
              // Determinar o className da linha
              const computedRowClassName = getRowClassName 
                ? getRowClassName(item, index)
                : rowClassName || (index % 2 === 0 
                  ? "border-gray-700 bg-[hsl(213_48%_10%)] hover:bg-[hsl(213_48%_12%)]" 
                  : "border-gray-700 bg-[hsl(213_48%_18%)] hover:bg-[hsl(213_48%_20%)]");
              
              return (
                <div
                  key={item[keyField]}
                  className={cn(
                    "grid gap-2 py-3 px-4 rounded-md border-2 transition-colors min-h-[60px]",
                    isSelected 
                      ? "bg-primary/10 border-primary/20" 
                      : computedRowClassName,
                    onRowClick && "cursor-pointer"
                  )}
                  style={{ gridTemplateColumns: fullGridTemplate }}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectableItems && (
                    <div className="flex items-center" onClick={(e) => {
                      console.log('🔍 Div do checkbox clicado');
                      e.stopPropagation();
                    }}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => {
                          console.log('🔍 Checkbox Individual - Item ID:', item[keyField]);
                          console.log('📋 isSelected atual:', isSelected);
                          onSelectItem?.(item[keyField]);
                        }}
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div key={column.key} className="flex items-start min-w-0 py-1">
                      <div className="min-w-0 w-full">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : <span className="text-xs block">{item[column.key]}</span>
                        }
                      </div>
                    </div>
                  ))}
                  {actions.length > 0 && (
                    <div className="flex items-center justify-end gap-1 min-w-[140px]">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(item);
                          }}
                          className="text-[10px] px-1.5 h-7 flex-shrink-0"
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

  // Mobile card view - layout mais compacto
  return (
    <div className="space-y-2">
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
                <span className="text-sm">Selecionar todos</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedItems.length} de {data.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards - layout mais compacto */}
      {data.map((item) => {
        const isSelected = selectableItems ? selectedItems.includes(item[keyField]) : false;
        
        return (
          <Card 
            key={item[keyField]}
            className={cn(
              "transition-colors border-l-4",
              isSelected 
                ? "border-l-primary bg-primary/5 border-primary/20" 
                : "border-l-transparent border-border hover:bg-muted/50",
              onRowClick && "cursor-pointer"
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-2">
              <div className="flex items-start gap-2">
                {selectableItems && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectItem(item[keyField])}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  />
                )}
                
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Primary info - título compacto */}
                  {primaryColumn && (
                    <h3 className="font-medium text-[10px] leading-tight text-foreground">
                      {primaryColumn.render 
                        ? primaryColumn.render(item[primaryColumn.key], item)
                        : item[primaryColumn.key]
                      }
                    </h3>
                  )}
                  
                  {/* Secondary info - grid 2 colunas super compacto */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                    {secondaryColumns.slice(0, 6).map((column) => (
                      <div key={column.key} className="min-w-0">
                        <span className="text-muted-foreground/70 block leading-tight">
                          {column.label}:
                        </span>
                        <div className="text-foreground font-medium leading-tight text-[10px]">
                          {column.render 
                            ? column.render(item[column.key], item)
                            : <span className="truncate block">{item[column.key] || "N/A"}</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions - horizontal na base do card */}
                  {actions.length > 0 && (
                    <div className="flex gap-1 pt-1 border-t border-border/50 mt-1">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(item);
                          }}
                          className="h-6 px-2 text-[9px] flex-1"
                          title={action.label}
                        >
                          <span className="flex items-center gap-1">
                            {action.icon}
                            <span className="hidden xs:inline">{action.label}</span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}