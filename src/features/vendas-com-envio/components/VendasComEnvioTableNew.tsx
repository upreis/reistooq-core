/**
 * 📊 VENDAS COM ENVIO TABLE - TanStack React Table
 * CÓPIA EXATA de VendasTable.tsx de /vendas-canceladas
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
  ColumnDef,
} from '@tanstack/react-table';
import type { VendaComEnvio } from '../types';
import { createVendasComEnvioColumns } from './VendasComEnvioTableColumns';

interface VendasComEnvioTableNewProps {
  orders: VendaComEnvio[];
  total: number;
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onOpenAnotacoes?: (order: VendaComEnvio) => void;
  anotacoes?: Record<string, string>;
  visibleColumnKeys?: string[];
}

export const VendasComEnvioTableNew = ({
  orders,
  total,
  loading,
  currentPage,
  itemsPerPage,
  onPageChange,
  onStatusChange,
  onOpenAnotacoes,
  anotacoes,
  visibleColumnKeys = []
}: VendasComEnvioTableNewProps) => {
  const totalPages = Math.ceil(total / itemsPerPage);

  // 🗺️ MAPEAMENTO COMPLETO: keys do config são iguais aos IDs das colunas
  // Apenas pass-through direto - nenhuma tradução necessária pois config usa mesmas keys

  // Criar TODAS as colunas com contexto
  const allColumns = useMemo(() => {
    return createVendasComEnvioColumns({
      onStatusChange,
      onOpenAnotacoes,
      anotacoes
    });
  }, [onStatusChange, onOpenAnotacoes, anotacoes]);

  // 🎯 FILTRAR colunas baseado em visibleColumnKeys
  // Keys do config são iguais aos IDs das colunas - pass-through direto
  const columns = useMemo(() => {
    // Se não há keys definidas, mostrar todas
    if (visibleColumnKeys.length === 0) {
      return allColumns;
    }
    
    // Filtrar apenas colunas visíveis (keys = column IDs)
    const filtered = allColumns.filter(col => visibleColumnKeys.includes(col.id as string));
    
    return filtered;
  }, [allColumns, visibleColumnKeys]);

  // Configurar TanStack Table com columns PRÉ-FILTRADAS
  const table = useReactTable({
    data: orders,
    columns: columns as ColumnDef<VendaComEnvio>[],
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
        Nenhum pedido encontrado. Clique em "Aplicar Filtros" para buscar.
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
