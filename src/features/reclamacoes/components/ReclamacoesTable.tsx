/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 FASE 3: Integrado com ColumnManager avançado
 * 📌 Sticky Header Real (position: sticky no THEAD)
 */

import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';

import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { cn } from '@/lib/utils';
import type { StatusAnalise } from '../types/devolucao-analise.types';


interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
  onDeleteReclamacao?: (claimId: string) => void;
  onOpenAnotacoes?: (claim: any) => void;
  anotacoes?: Record<string, string>;
  activeTab?: 'ativas' | 'historico';
  visibleColumnKeys?: string[];
  onTableReady?: (table: any) => void;
}

export const ReclamacoesTable = memo(function ReclamacoesTable({
  reclamacoes,
  isLoading,
  error,
  onStatusChange,
  onDeleteReclamacao,
  onOpenAnotacoes,
  anotacoes,
  activeTab,
  visibleColumnKeys = [],
  onTableReady
}: ReclamacoesTableProps) {
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>();
  const [stickyTopPx, setStickyTopPx] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // ⚡ Filtrar colunas conforme visibilidade (padrão /pedidos)
  const columns = useMemo(() => {
    const allColumns = reclamacoesColumns(onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab);
    
    if (!visibleColumnKeys || visibleColumnKeys.length === 0) {
      console.log('🔍 [ReclamacoesTable] Sem filtro - retornando todas as colunas:', allColumns.length);
      return allColumns;
    }
    
    const filtered = allColumns.filter(col => {
      if (!col.id) return true;
      return visibleColumnKeys.includes(col.id as string);
    });
    
    console.log('🔍 [ReclamacoesTable] Colunas filtradas:', {
      total: allColumns.length,
      visible: filtered.length,
      visibleKeys: visibleColumnKeys
    });
    
    return filtered;
  }, [onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab, visibleColumnKeys]);
  
  const handleOpenMensagens = useCallback((claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
  }, []);

  const table = useReactTable({
    data: reclamacoes,
    columns,
    getRowId: (row) => row.claim_id || row.id || `row-${Math.random()}`,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 🔗 Notificar parent quando table está pronta
  useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // 🧭 Sticky offset + diagnóstico runtime (ativar com ?debugSticky=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugSticky = params.get('debugSticky') === '1';

    const computeStickyTop = () => {
      // Header desktop do layout (sticky)
      const headerEl = document.querySelector('div[data-layout-root] header');
      if (!headerEl) {
        setStickyTopPx(0);
        return;
      }

      const rect = headerEl.getBoundingClientRect();
      // Se estiver visível no topo, usamos sua altura como offset (header não é fixed)
      const nextTop = rect.top <= 0 ? Math.round(rect.height) : 0;
      setStickyTopPx(nextTop);

      if (debugSticky) {
        console.log('🧷 [StickyDebug] headerEl:', headerEl);
        console.log('🧷 [StickyDebug] header rect:', { top: rect.top, height: rect.height, nextTop });
      }
    };

    computeStickyTop();
    window.addEventListener('resize', computeStickyTop);

    if (debugSticky) {
      console.log('🧷 [StickyDebug] ReclamacoesTable mount: versão sticky-th-2025-12-15-2');

      // 1) Descobrir quem está scrollando de verdade (captura scroll bubbling)
      const onAnyScroll = (e: Event) => {
        const target = e.target as any;
        const el = target?.nodeType === 1 ? (target as HTMLElement) : null;
        if (!el) return;

        const style = window.getComputedStyle(el);
        const info = {
          tag: el.tagName,
          id: el.id,
          class: el.className,
          scrollTop: (el as any).scrollTop,
          overflowY: style.overflowY,
          overflowX: style.overflowX,
          position: style.position,
        };

        // log compacto
        console.log('🧷 [StickyDebug] scroll event target:', info);
      };

      document.addEventListener('scroll', onAnyScroll, true);

      // 2) Provar computed style do primeiro TH
      const t = window.setTimeout(() => {
        const container = tableContainerRef.current;
        const th = container?.querySelector('th');
        if (!th) {
          console.warn('🧷 [StickyDebug] Nenhum <th> encontrado');
          return;
        }

        const cs = window.getComputedStyle(th);
        console.log('🧷 [StickyDebug] TH computed:', {
          position: cs.position,
          top: cs.top,
          zIndex: cs.zIndex,
        });

        // Cadeia de ancestrais até body (resumo)
        const chain: any[] = [];
        let cur: HTMLElement | null = th as HTMLElement;
        for (let i = 0; i < 14 && cur; i++) {
          const st = window.getComputedStyle(cur);
          chain.push({
            tag: cur.tagName,
            id: cur.id,
            class: cur.className,
            overflow: st.overflow,
            overflowY: st.overflowY,
            transform: st.transform,
            filter: st.filter,
            contain: (st as any).contain,
            position: st.position,
          });
          cur = cur.parentElement;
        }
        console.log('🧷 [StickyDebug] cadeia ancestrais (th → ...):', chain);
      }, 350);

      return () => {
        window.clearTimeout(t);
        document.removeEventListener('scroll', onAnyScroll, true);
        window.removeEventListener('resize', computeStickyTop);
      };
    }

    return () => {
      window.removeEventListener('resize', computeStickyTop);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">Buscando reclamações...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>Erro: {error}</p>
      </div>
    );
  }

  if (reclamacoes.length === 0 && !globalFilter) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Nenhuma reclamação encontrada</p>
      </div>
    );
  }

  return (
    <div className="w-full" ref={tableContainerRef}>
      {/* Wrapper único: apenas scroll horizontal. Scroll vertical continua no body/página. */}
      <div className="overflow-x-auto border rounded-md">
        <Table className="min-w-max">
          <TableHeader className={cn("bg-background", stickyTopPx > 0 && "sticky z-40")} style={stickyTopPx > 0 ? { top: stickyTopPx } : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap sticky z-50 bg-background",
                        meta?.headerClassName
                      )}
                      style={{ top: stickyTopPx }}
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
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {globalFilter ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhuma reclamação encontrada.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Mensagens */}
      {selectedClaim && (
        <ReclamacoesMensagensModal
          open={mensagensModalOpen}
          onOpenChange={setMensagensModalOpen}
          mensagens={selectedClaim.timeline_mensagens || []}
          claimId={String(selectedClaim.claim_id)}
        />
      )}
    </div>
  );
});

ReclamacoesTable.displayName = 'ReclamacoesTable';

