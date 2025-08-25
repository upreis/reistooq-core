/**
 * 🚀 VIRTUAL SCROLLING TABLE
 * Performance optimization for large datasets (>500 items)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    render: (item: T, index: number) => React.ReactNode;
  }>;
  height?: number;
  itemHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  enableVirtualization?: boolean; // Permite desabilitar para listas pequenas
  threshold?: number; // Limite para ativar virtualização
}

export function VirtualTable<T>({
  data,
  columns,
  height = 600,
  itemHeight = 60,
  className,
  onRowClick,
  enableVirtualization = true,
  threshold = 500
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState<number>(0);

  // Decidir se usar virtualização baseado no tamanho dos dados
  const shouldVirtualize = enableVirtualization && data.length > threshold;

  // Configurar o virtualizador
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    enabled: shouldVirtualize,
    overscan: 10 // Renderizar 10 items extras para smooth scrolling
  });

  // Observar largura da tabela para ajuste responsivo
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry) {
        setTableWidth(entry.contentRect.width);
      }
    });

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calcular larguras das colunas
  const columnWidths = useMemo(() => {
    const totalFixedWidth = columns.reduce((acc, col) => acc + (col.width || 0), 0);
    const flexColumns = columns.filter(col => !col.width);
    const remainingWidth = Math.max(0, tableWidth - totalFixedWidth);
    const flexWidth = flexColumns.length > 0 ? remainingWidth / flexColumns.length : 0;

    return columns.map(col => col.width || Math.max(120, flexWidth));
  }, [columns, tableWidth]);

  if (!shouldVirtualize) {
    // Renderização normal para listas pequenas
    return (
      <div className={cn("border rounded-lg overflow-auto", className)} style={{ height }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-background border-b z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                  style={{ width: columnWidths[index] }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm"
                    style={{ width: columnWidths[colIndex] }}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Renderização virtualizada para listas grandes
  const items = virtualizer.getVirtualItems();

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Header fixo */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key}
              className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-r last:border-r-0"
              style={{ width: columnWidths[index] }}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Container virtualizador */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: height - 60 }} // Subtrair altura do header
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const item = data[virtualItem.index];
            
            return (
              <div
                key={virtualItem.index}
                className={cn(
                  "absolute top-0 left-0 w-full flex border-b hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onRowClick?.(item, virtualItem.index)}
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key}
                    className="px-4 py-3 text-sm border-r last:border-r-0 flex items-center"
                    style={{ width: columnWidths[colIndex] }}
                  >
                    {column.render(item, virtualItem.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de performance */}
      {shouldVirtualize && (
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
          Virtual Scrolling ativo • {data.length.toLocaleString()} itens • 
          Renderizando {items.length} de {data.length}
        </div>
      )}
    </div>
  );
}

export default VirtualTable;