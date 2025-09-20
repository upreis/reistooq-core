import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface VirtualTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    width?: number;
    render?: (item: T, index: number) => React.ReactNode;
  }[];
  height?: number;
  itemHeight?: number;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  loading = false,
  onRowClick,
  className = ''
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize rendered rows for performance
  const renderedRows = useMemo(() => {
    return virtualItems.map((virtualRow) => {
      const item = data[virtualRow.index];
      return (
        <TableRow
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={virtualizer.measureElement}
          className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
          onClick={() => onRowClick?.(item, virtualRow.index)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {columns.map((column) => (
            <TableCell key={column.key} style={{ width: column.width }}>
              {column.render ? column.render(item, virtualRow.index) : item[column.key]}
            </TableCell>
          ))}
        </TableRow>
      );
    });
  }, [virtualItems, data, columns, onRowClick, virtualizer.measureElement]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} style={{ width: column.width }}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Table>
              <TableBody>
                {renderedRows}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Performance info in development */}
      {import.meta.env.DEV && (
        <div className="text-xs text-muted-foreground mt-2">
          Mostrando {virtualItems.length} de {data.length} itens 
          (Virtual scrolling ativo)
        </div>
      )}
    </div>
  );
}

// Hook para usar virtual table com dados paginados
export const useVirtualTable = <T,>(
  data: T[],
  options: {
    pageSize?: number;
    threshold?: number; // When to enable virtual scrolling
  } = {}
) => {
  const { pageSize = 50, threshold = 100 } = options;
  
  const shouldUseVirtual = data.length > threshold;
  
  const paginatedData = useMemo(() => {
    if (shouldUseVirtual) {
      return data; // Use all data with virtual scrolling
    }
    return data.slice(0, pageSize); // Use pagination for smaller datasets
  }, [data, shouldUseVirtual, pageSize]);

  return {
    data: paginatedData,
    shouldUseVirtual,
    totalItems: data.length,
    isVirtualized: shouldUseVirtual
  };
};