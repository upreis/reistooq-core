/**
 * 📌 CLONE FIXO DO CABEÇALHO - RECLAMAÇÕES
 * Position: fixed controlado por getBoundingClientRect
 * Sync horizontal via transform (GPU accelerated)
 */

import { memo, useRef, useEffect } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Table, TableHeader, TableHead, TableRow } from '@/components/ui/table';

interface ReclamacoesStickyHeaderCloneProps {
  isVisible: boolean;
  table: TanStackTable<any>;
  scrollLeft: number;
  left: number;
  width: number;
  topOffset: number;
}

export const ReclamacoesStickyHeaderClone = memo(function ReclamacoesStickyHeaderClone({
  isVisible,
  table,
  scrollLeft,
  left,
  width,
  topOffset,
}: ReclamacoesStickyHeaderCloneProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  // 🎯 Sync horizontal via transform (GPU accelerated) - usando ref direto para performance
  useEffect(() => {
    if (!innerRef.current) return;
    innerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;
  }, [scrollLeft]);

  // Early return após hooks
  if (!isVisible) return null;

  const headerGroups = table.getHeaderGroups();
  
  // Proteção contra headerGroups vazio
  if (!headerGroups || headerGroups.length === 0) return null;

  return (
    <div 
      className="z-[9999] bg-background shadow-md border-b-2 overflow-hidden"
      style={{ 
        position: 'fixed',
        top: topOffset,
        left: left,
        width: width,
        // pointer-events: auto permite interação com sort buttons no header
        pointerEvents: 'auto',
      }}
    >
      {/* Inner wrapper recebe o transform - willChange no JSX para evitar re-render */}
      <div 
        ref={innerRef} 
        data-sticky-clone-inner
        style={{ willChange: 'transform' }}
      >
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
