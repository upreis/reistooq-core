/**
 * 📌 HEADER BAR SEPARADO - RECLAMAÇÕES
 * 🎯 FASE 3: Sincronização de larguras com ResizeObserver
 * 
 * - NÃO usa position: sticky no thead
 * - Usa transform: translate3d para sincronizar scroll horizontal
 * - Renderiza mesmas colunas do TanStack table
 * - Recebe larguras medidas do body para alinhamento perfeito
 */

import { memo, useRef, useEffect } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface ReclamacoesHeaderBarProps {
  table: TanStackTable<any>;
  scrollLeft: number;
  /** Altura do header global do app (para posicionar corretamente) */
  topOffset?: number;
  /** Larguras medidas das colunas do body (opcional) */
  columnWidths?: number[];
}

export const ReclamacoesHeaderBar = memo(function ReclamacoesHeaderBar({
  table,
  scrollLeft,
  topOffset = 0,
  columnWidths,
}: ReclamacoesHeaderBarProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  // 🎯 Aplicar transform com requestAnimationFrame para performance
  useEffect(() => {
    if (!innerRef.current) return;
    
    // Usar translate3d para GPU acceleration
    innerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;
    innerRef.current.style.willChange = 'transform';
  }, [scrollLeft]);

  const headerGroups = table.getHeaderGroups();

  return (
    <div
      className={cn(
        "sticky z-50 bg-background border-x border-t border-b shadow-sm rounded-t-md",
        "overflow-hidden" // NÃO ter scroll próprio
      )}
      style={{ top: topOffset }}
    >
      {/* Inner wrapper que recebe o transform */}
      <div ref={innerRef} className="min-w-max">
        {headerGroups.map((headerGroup) => (
          <div
            key={headerGroup.id}
            className="flex"
          >
            {headerGroup.headers.map((header, index) => {
              const meta = header.column.columnDef.meta as any;
              
              // 🎯 FASE 3: Usar largura medida do body se disponível, senão fallback para TanStack
              const measuredWidth = columnWidths?.[index];
              const tanstackWidth = header.getSize();
              const width = measuredWidth || (tanstackWidth !== 150 ? tanstackWidth : undefined);
              
              return (
                <div
                  key={header.id}
                  className={cn(
                    "h-12 px-4 flex items-center text-left font-medium text-muted-foreground whitespace-nowrap bg-background",
                    "[&:has([role=checkbox])]:pr-0",
                    meta?.headerClassName
                  )}
                  style={{
                    width: width ? `${width}px` : 'auto',
                    minWidth: width ? `${width}px` : 'auto',
                    flexShrink: 0,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

ReclamacoesHeaderBar.displayName = 'ReclamacoesHeaderBar';
