// Tabela virtualizada otimizada para grandes datasets
import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { HistoricoVenda } from '../types/historicoTypes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '../utils/historicoFormatters';
import { Skeleton } from '@/components/ui/skeleton';

interface HistoricoVirtualTableProps {
  data: HistoricoVenda[];
  isLoading?: boolean;
  onRowClick?: (venda: HistoricoVenda) => void;
  height?: number;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function HistoricoVirtualTable({
  data,
  isLoading = false,
  onRowClick,
  height = 600,
  selectedIds = new Set(),
  onSelectionChange
}: HistoricoVirtualTableProps) {
  
  const columns = useMemo<ColumnDef<HistoricoVenda>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            const checked = e.target.checked;
            if (onSelectionChange) {
              if (checked) {
                const allIds = new Set([...selectedIds, ...data.map(row => row.id)]);
                onSelectionChange(allIds);
              } else {
                const remainingIds = new Set([...selectedIds].filter(id => 
                  !data.find(row => row.id === id)
                ));
                onSelectionChange(remainingIds);
              }
            }
          }}
          className="rounded border-input"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={(e) => {
            if (onSelectionChange) {
              const newSelection = new Set(selectedIds);
              if (e.target.checked) {
                newSelection.add(row.original.id);
              } else {
                newSelection.delete(row.original.id);
              }
              onSelectionChange(newSelection);
            }
          }}
          className="rounded border-input"
        />
      ),
      size: 50,
    },
    {
      accessorKey: 'numero_pedido',
      header: 'Pedido',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
      size: 120,
    },
    {
      accessorKey: 'data_pedido',
      header: 'Data',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(getValue() as string)}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: 'cliente_nome',
      header: 'Cliente',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
      size: 200,
    },
    {
      accessorKey: 'sku_produto',
      header: 'SKU',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {getValue() as string}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'quantidade',
      header: 'Qtd',
      cell: ({ getValue }) => (
        <span className="text-center font-medium">{getValue() as number}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'valor_total',
      header: 'Valor',
      cell: ({ getValue }) => (
        <span className="font-semibold text-success">
          {formatCurrency(getValue() as number)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const variant = status === 'concluida' ? 'default' : 
                      status === 'cancelada' ? 'destructive' : 
                      status === 'pendente' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant} className="text-xs">
            {status}
          </Badge>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'cidade',
      header: 'Cidade',
      cell: ({ getValue, row }) => (
        <span className="text-sm text-muted-foreground">
          {getValue() as string}, {row.original.uf}
        </span>
      ),
      size: 140,
    },
  ], [data, selectedIds, onSelectionChange]);

  const table = useReactTable({
    data: isLoading ? Array(20).fill({}) : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => isLoading ? `loading-${index}` : row.id,
  });

  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto rounded-md border"
      style={{ height: `${height}px` }}
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="border-b"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {items.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: `${virtualRow.start}px`,
                    height: `${virtualRow.size}px`,
                    width: '100%',
                  }}
                  className={`
                    cursor-pointer hover:bg-muted/50 transition-colors
                    ${selectedIds.has(row.original?.id) ? 'bg-muted' : ''}
                  `}
                  onClick={() => row.original && onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="border-b"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}