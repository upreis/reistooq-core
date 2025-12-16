/**
 * 📌 COMPONENTE - Clone Fixo do Cabeçalho para Reclamações
 * Aparece no topo da tela quando usuário rola para baixo
 * Adaptado para TanStack Table com flexRender
 */

import { RefObject } from 'react';
import { Table as TableType, flexRender } from '@tanstack/react-table';
import { Table, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ReclamacoesStickyHeaderCloneProps {
  isVisible: boolean;
  headerRef: RefObject<HTMLDivElement>;
  table: TableType<any> | null;
}

export const ReclamacoesStickyHeaderClone = ({ 
  isVisible, 
  headerRef, 
  table
}: ReclamacoesStickyHeaderCloneProps) => {
  if (!isVisible || !table) return null;

  return (
    <div 
      ref={headerRef}
      className="fixed top-0 z-[9999] w-full bg-background shadow-md border-b-2 pointer-events-none overflow-hidden"
    >
      {/* Wrapper interno que recebe o transform para sync horizontal */}
      <div data-sticky-clone-inner>
        <Table className="min-w-max">
          <TableHeader className="bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any;
                  return (
                    <TableHead 
                      key={header.id} 
                      className={cn(
                        "whitespace-nowrap",
                        meta?.headerClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
      </div>
    </div>
  );
};
