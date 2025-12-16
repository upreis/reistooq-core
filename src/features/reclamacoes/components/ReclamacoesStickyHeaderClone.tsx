/**
 * 📌 CLONE FIXO DO CABEÇALHO - RECLAMAÇÕES
 * Aparece no topo da tela quando usuário rola para baixo
 * Sync horizontal via transform (NÃO scrollbar)
 */

import { memo, useRef, useEffect } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Table, TableHeader, TableHead, TableRow } from '@/components/ui/table';

interface ReclamacoesStickyHeaderCloneProps {
  isVisible: boolean;
  table: TanStackTable<any>;
  scrollLeft: number;
}

export const ReclamacoesStickyHeaderClone = memo(function ReclamacoesStickyHeaderClone({
  isVisible,
  table,
  scrollLeft,
}: ReclamacoesStickyHeaderCloneProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  // 🎯 Sync horizontal via transform (GPU accelerated)
  useEffect(() => {
    if (!innerRef.current) return;
    innerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;
    innerRef.current.style.willChange = 'transform';
  }, [scrollLeft]);

  if (!isVisible) return null;

  const headerGroups = table.getHeaderGroups();

  return (
    <div 
      className="fixed top-14 left-0 right-0 z-[9999] bg-background shadow-md border-b-2 overflow-hidden"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Inner wrapper recebe o transform */}
      <div ref={innerRef} data-sticky-clone-inner>
        <Table className="min-w-max">
          <TableHeader className="bg-background">
            {headerGroups.map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any;
                  return (
                    <TableHead
                      key={header.id}
                      className={meta?.headerClassName}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        minWidth: header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
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
});

ReclamacoesStickyHeaderClone.displayName = 'ReclamacoesStickyHeaderClone';
