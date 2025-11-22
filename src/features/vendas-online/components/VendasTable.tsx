/**
 * 📊 VENDAS TABLE - TanStack React Table
 * Tabela integrada com gerenciador de colunas
 */

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { MLOrder } from '../types/vendas.types';
import { createVendasColumns } from './VendasTableColumns';
import type { StatusAnalise } from '../types/venda-analise.types';
import type { UseColumnManagerReturn } from '../types/columns.types';

interface VendasTableProps {
  orders: MLOrder[];
  total: number;
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (orderId: string, newStatus: StatusAnalise) => void;
  onOpenAnotacoes?: (order: MLOrder) => void;
  anotacoes?: Record<string, string>;
  activeTab?: 'ativas' | 'historico';
  columnManager?: UseColumnManagerReturn; // 🎯 FASE 3
}

export const VendasTable = ({
  orders,
  total,
  loading,
  currentPage,
  itemsPerPage,
  onPageChange,
  onStatusChange,
  onOpenAnotacoes,
  anotacoes,
  activeTab,
  columnManager
}: VendasTableProps) => {
  const totalPages = Math.ceil(total / itemsPerPage);

  // Criar colunas com contexto
  const columns = useMemo(() => {
    return createVendasColumns({
      onStatusChange,
      onOpenAnotacoes,
      anotacoes
    });
  }, [onStatusChange, onOpenAnotacoes, anotacoes]);

  // Filtrar colunas visíveis usando columnManager
  const visibleColumns = useMemo(() => {
    if (!columnManager) return columns;
    
    const visibleKeys = new Set(columnManager.state.visibleColumns);
    return columns.filter(col => visibleKeys.has(col.id as string));
  }, [columns, columnManager]);

  // Configurar TanStack Table
  const table = useReactTable({
    data: orders,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum pedido encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className={(header.column.columnDef.meta as any)?.headerClassName}
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getAllCells();
                return (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, total)} de {total} pedidos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
