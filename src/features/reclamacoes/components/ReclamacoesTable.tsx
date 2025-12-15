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

// 🔖 Versão para prova visual
const DEBUG_VERSION = '2025-12-15-3';

// Declaração global para debug
declare global {
  interface Window {
    __StickyDebug?: {
      mountedAt: string;
      version: string;
      href: string;
      scrollEvents: Array<{ source: string; scrollTop: number; timestamp: number }>;
      computedTH: {
        position: string;
        top: string;
        zIndex: string;
      } | null;
      ancestors: Array<{
        tag: string;
        className: string;
        overflow: string;
        overflowY: string;
        transform: string;
        contain: string;
      }>;
    };
  }
}

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
  
  // Flag de debug
  const isDebugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugSticky') === '1';

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
      // 🔖 Inicializar variável global
      window.__StickyDebug = {
        mountedAt: new Date().toISOString(),
        version: DEBUG_VERSION,
        href: window.location.href,
        scrollEvents: [],
        computedTH: null,
        ancestors: [],
      };
      
      console.log(`🧷 [StickyDebug] mount ok | v${DEBUG_VERSION} | ${window.location.href} | ${new Date().toISOString()}`);

      // Helper para registrar scroll events (limita a 50)
      const logScrollEvent = (source: string, scrollTop: number) => {
        if (!window.__StickyDebug) return;
        const event = { source, scrollTop, timestamp: Date.now() };
        window.__StickyDebug.scrollEvents.push(event);
        if (window.__StickyDebug.scrollEvents.length > 50) {
          window.__StickyDebug.scrollEvents.shift();
        }
        console.log('🧷 [StickyDebug] scroll:', event);
      };

      // Listener A: window scroll
      const onWindowScroll = () => {
        logScrollEvent('window', window.scrollY);
      };
      window.addEventListener('scroll', onWindowScroll, { passive: true });

      // Listener B: document.scrollingElement
      const scrollingEl = document.scrollingElement;
      const onScrollingElScroll = () => {
        if (scrollingEl) {
          logScrollEvent('document.scrollingElement', scrollingEl.scrollTop);
        }
      };
      if (scrollingEl) {
        scrollingEl.addEventListener('scroll', onScrollingElScroll, { passive: true });
      }

      // Listener C: wrapper da tabela (overflow-x-auto)
      const tableWrapper = tableContainerRef.current?.querySelector('.overflow-x-auto');
      const onTableWrapperScroll = (e: Event) => {
        const el = e.target as HTMLElement;
        logScrollEvent(`tableWrapper(${el.className.slice(0, 30)})`, el.scrollTop);
      };
      if (tableWrapper) {
        tableWrapper.addEventListener('scroll', onTableWrapperScroll, { passive: true });
      }

      // Listener D: Captura global (bubbling) para qualquer scroll
      const onAnyScroll = (e: Event) => {
        const target = e.target as any;
        const el = target?.nodeType === 1 ? (target as HTMLElement) : null;
        if (!el) return;

        const style = window.getComputedStyle(el);
        const info = {
          tag: el.tagName,
          id: el.id,
          class: el.className?.toString().slice(0, 50),
          scrollTop: (el as any).scrollTop,
          overflowY: style.overflowY,
        };

        // log compacto
        console.log('🧷 [StickyDebug] scroll event target:', info);
      };
      document.addEventListener('scroll', onAnyScroll, true);

      // 2) Provar computed style do primeiro TH após timeout
      const t = window.setTimeout(() => {
        const container = tableContainerRef.current;
        const th = container?.querySelector('th');
        if (!th) {
          console.warn('🧷 [StickyDebug] Nenhum <th> encontrado');
          return;
        }

        const cs = window.getComputedStyle(th);
        const computedTH = {
          position: cs.position,
          top: cs.top,
          zIndex: cs.zIndex,
        };
        
        if (window.__StickyDebug) {
          window.__StickyDebug.computedTH = computedTH;
        }
        
        console.log('🧷 [StickyDebug] TH computed:', computedTH);

        // Cadeia de ancestrais até body (resumo)
        const ancestors: Array<{
          tag: string;
          className: string;
          overflow: string;
          overflowY: string;
          transform: string;
          contain: string;
        }> = [];
        
        let cur: HTMLElement | null = th as HTMLElement;
        for (let i = 0; i < 14 && cur; i++) {
          const st = window.getComputedStyle(cur);
          ancestors.push({
            tag: cur.tagName,
            className: cur.className?.toString().slice(0, 60) || '',
            overflow: st.overflow,
            overflowY: st.overflowY,
            transform: st.transform,
            contain: (st as any).contain || 'none',
          });
          cur = cur.parentElement;
        }
        
        if (window.__StickyDebug) {
          window.__StickyDebug.ancestors = ancestors;
        }
        
        console.log('🧷 [StickyDebug] cadeia ancestrais (th → ...):', ancestors);
      }, 350);

      return () => {
        window.clearTimeout(t);
        window.removeEventListener('scroll', onWindowScroll);
        if (scrollingEl) {
          scrollingEl.removeEventListener('scroll', onScrollingElScroll);
        }
        if (tableWrapper) {
          tableWrapper.removeEventListener('scroll', onTableWrapperScroll);
        }
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
      {/* 🔖 Badge de debug visual - prova que build está correta */}
      {isDebugMode && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-yellow-900 text-xs font-mono px-3 py-1.5 rounded-full shadow-lg">
          StickyDebug ON v{DEBUG_VERSION}
        </div>
      )}
      
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

