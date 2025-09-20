/**
 * 🎯 TABELA COM DRAG & DROP DE COLUNAS
 * Reordenação intuitiva + Virtual Scrolling integrado
 */

import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import VirtualTable from '@/components/ui/virtual-table';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  key: string;
  label: string;
  width?: number;
  visible: boolean;
  sortable?: boolean;
  category?: string;
  render: (item: any, index: number) => React.ReactNode;
}

interface DraggableColumnsTableProps {
  data: any[];
  columns: ColumnConfig[];
  onColumnOrderChange: (newOrder: ColumnConfig[]) => void;
  onColumnVisibilityChange: (columnKey: string, visible: boolean) => void;
  onRowClick?: (item: any, index: number) => void;
  loading?: boolean;
  className?: string;
  enableVirtualization?: boolean;
  height?: number;
}

// Componente para header draggável
function DraggableHeader({ column, isFirst }: { column: ColumnConfig; isFirst: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-muted-foreground bg-background border-r last:border-r-0",
        isDragging && "opacity-50 bg-muted z-50",
        "hover:bg-muted/50 transition-colors"
      )}
      {...attributes}
    >
      {!isFirst && (
        <GripVertical 
          className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" 
          {...listeners}
        />
      )}
      <span className="flex-1">{column.label}</span>
      {column.category && (
        <Badge variant="outline" className="text-xs">
          {column.category}
        </Badge>
      )}
    </div>
  );
}

// Panel de configuração de colunas
function ColumnConfigPanel({ 
  columns, 
  onVisibilityChange, 
  onResetColumns 
}: { 
  columns: ColumnConfig[];
  onVisibilityChange: (columnKey: string, visible: boolean) => void;
  onResetColumns: () => void;
}) {
  const categorizedColumns = useMemo(() => {
    const grouped = columns.reduce((acc, col) => {
      const category = col.category || 'Outras';
      if (!acc[category]) acc[category] = [];
      acc[category].push(col);
      return acc;
    }, {} as Record<string, ColumnConfig[]>);

    return Object.entries(grouped);
  }, [columns]);

  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Configurar Colunas</h4>
          <p className="text-sm text-muted-foreground">
            {visibleCount} de {totalCount} visíveis
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onResetColumns}>
          Resetar
        </Button>
      </div>

      <Separator />

      <div className="space-y-4 max-h-96 overflow-auto">
        {categorizedColumns.map(([category, categoryColumns]) => (
          <div key={category} className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {category}
              <Badge variant="secondary" className="text-xs">
                {categoryColumns.filter(col => col.visible).length}/{categoryColumns.length}
              </Badge>
            </h5>
            
            {categoryColumns.map((column) => (
              <div key={column.key} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={column.visible}
                    onCheckedChange={(checked) => onVisibilityChange(column.key, checked)}
                  />
                  <span className="text-sm">{column.label}</span>
                </div>
                {column.width && (
                  <Badge variant="outline" className="text-xs">
                    {column.width}px
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Separator />
      
      <div className="text-xs text-muted-foreground">
        💡 Arraste os cabeçalhos para reordenar as colunas
      </div>
    </div>
  );
}

export function DraggableColumnsTable({
  data,
  columns,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onRowClick,
  loading = false,
  className,
  enableVirtualization = true,
  height = 600
}: DraggableColumnsTableProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar apenas colunas visíveis
  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  );

  // Handler para reordenação
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = visibleColumns.findIndex(col => col.key === active.id);
      const newIndex = visibleColumns.findIndex(col => col.key === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newVisibleOrder = arrayMove(visibleColumns, oldIndex, newIndex);
        
        // Reconstuir a ordem completa mantendo colunas ocultas
        const newCompleteOrder = [...columns];
        const hiddenColumns = columns.filter(col => !col.visible);
        
        // Atualizar apenas a ordem das colunas visíveis
        let visibleIndex = 0;
        for (let i = 0; i < newCompleteOrder.length; i++) {
          if (newCompleteOrder[i].visible) {
            newCompleteOrder[i] = newVisibleOrder[visibleIndex];
            visibleIndex++;
          }
        }
        
        onColumnOrderChange(newCompleteOrder);
      }
    }
  }, [visibleColumns, columns, onColumnOrderChange]);

  // Reset para ordem padrão
  const handleResetColumns = useCallback(() => {
    const defaultColumns = [...columns].map(col => ({ ...col, visible: true }));
    onColumnOrderChange(defaultColumns);
  }, [columns, onColumnOrderChange]);

  // Preparar colunas para VirtualTable
  const virtualTableColumns = useMemo(() => 
    visibleColumns.map(col => ({
      key: col.key,
      label: col.label,
      width: col.width,
      render: col.render
    })), 
    [visibleColumns]
  );

  if (loading) {
    return (
      <div className={cn("border rounded-lg p-8 text-center", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {data.length.toLocaleString()} pedidos
          </Badge>
          <Badge variant="outline">
            {visibleColumns.length} colunas visíveis
          </Badge>
          {enableVirtualization && data.length > 500 && (
            <Badge variant="secondary">
              Virtual Scrolling ativo
            </Badge>
          )}
        </div>

        <Popover open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Colunas
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="bottom">
            <ColumnConfigPanel
              columns={columns}
              onVisibilityChange={onColumnVisibilityChange}
              onResetColumns={handleResetColumns}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Tabela com Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="border rounded-lg overflow-hidden">
          {/* Header Draggável */}
          <div className="bg-background border-b">
            <SortableContext 
              items={visibleColumns.map(col => col.key)} 
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex">
                {visibleColumns.map((column, index) => (
                  <div key={column.key} style={{ width: column.width || 150 }}>
                    <DraggableHeader 
                      column={column} 
                      isFirst={index === 0} 
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Corpo da tabela - Virtual Table sem header (já renderizado acima) */}
          <div style={{ height: height - 60 }}>
            {data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum pedido encontrado
              </div>
            ) : (
              <VirtualTable
                data={data}
                columns={virtualTableColumns}
                height={height - 60}
                onRowClick={onRowClick}
                enableVirtualization={enableVirtualization}
                threshold={500}
              />
            )}
          </div>
        </div>
      </DndContext>

      {/* Info da Performance */}
      {data.length > 500 && (
        <div className="text-xs text-muted-foreground text-center">
          ⚡ Performance otimizada com Virtual Scrolling e Web Workers
        </div>
      )}
    </div>
  );
}

export default DraggableColumnsTable;