/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 FASE 3: Integrado com ColumnManager avançado
 * 📌 Sticky Header Clone implementado (igual /devolucoesdevenda)
 */

import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { ReclamacoesStickyHeaderClone } from './ReclamacoesStickyHeaderClone';
import { useStickyTableHeader } from '@/hooks/useStickyTableHeader';

import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { Search } from 'lucide-react';
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
  visibleColumnKeys?: string[]; // 🎯 Array de keys de colunas visíveis
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
  
  // 🔧 Hook de sticky header (igual /devolucoesdevenda)
  const { tableRef, sentinelRef, isSticky } = useStickyTableHeader();
  
  // 📌 Refs para clone e scroll wrapper da tabela
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const fixedHeaderRef = useRef<HTMLDivElement>(null);
  
  // ⚡ Filtrar colunas conforme visibilidade (padrão /pedidos)
  const columns = useMemo(() => {
    const allColumns = reclamacoesColumns(onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab);
    
    // Se não há filtro de colunas, retornar todas
    if (!visibleColumnKeys || visibleColumnKeys.length === 0) {
      console.log('🔍 [ReclamacoesTable] Sem filtro - retornando todas as colunas:', allColumns.length);
      return allColumns;
    }
    
    // ✅ USAR ARRAY.INCLUDES ao invés de Set - força React detectar mudanças
    const filtered = allColumns.filter(col => {
      // Colunas sem id são sempre visíveis (actions, etc)
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

  // 🔄 Sincronizar scroll horizontal via transform (SEM scrollbar no clone)
  // ⚠️ Observação: hoje existem DOIS possíveis scrollers horizontais:
  // - outer (div com overflow-x-auto)
  // - wrapper interno do <Table /> (div com overflow-auto do shadcn)
  // Para evitar regressões, sincronizamos a partir do(s) scroller(s) que realmente rolam.
  const syncCloneFromScroller = useCallback((scroller: HTMLElement) => {
    const cloneRoot = fixedHeaderRef.current;
    if (!cloneRoot) return;

    const cloneInner = cloneRoot.querySelector('[data-sticky-clone-inner]') as HTMLElement | null;
    if (!cloneInner) return;

    const scrollLeft = scroller.scrollLeft;
    cloneInner.style.transform = `translateX(${-scrollLeft}px)`;
    cloneInner.style.willChange = 'transform';
  }, []);

  const getHorizontalScrollers = useCallback((): HTMLElement[] => {
    const outer = scrollWrapperRef.current;
    if (!outer) return [];

    const inner = outer.querySelector(':scope > div') as HTMLElement | null;

    const candidates = [outer, inner].filter(Boolean) as HTMLElement[];
    const unique = Array.from(new Set(candidates));

    // Mantém somente quem realmente pode rolar horizontalmente
    return unique.filter((el) => el.scrollWidth > el.clientWidth + 1);
  }, []);

  // 🔄 Efeito para posicionamento e sincronização de scroll quando sticky está ativo
  useEffect(() => {
    const outer = scrollWrapperRef.current;
    if (!isSticky || !outer) return;

    // 📌 Posicionar o clone sempre que ativar
    if (fixedHeaderRef.current) {
      const wrapperRect = outer.getBoundingClientRect();
      fixedHeaderRef.current.style.left = `${wrapperRect.left}px`;
      fixedHeaderRef.current.style.width = `${wrapperRect.width}px`;
    }

    const scrollers = getHorizontalScrollers();
    const effectiveScrollers = scrollers.length ? scrollers : [outer];

    const handlers = new Map<HTMLElement, EventListener>();
    effectiveScrollers.forEach((el) => {
      const handler: EventListener = () => syncCloneFromScroller(el);
      handlers.set(el, handler);
      el.addEventListener('scroll', handler, { passive: true });
    });

    // Sync imediato
    effectiveScrollers.forEach(syncCloneFromScroller);

    return () => {
      handlers.forEach((handler, el) => {
        el.removeEventListener('scroll', handler);
      });
    };
  }, [isSticky, getHorizontalScrollers, syncCloneFromScroller]);


  // 🔄 Sincronizar larguras das colunas
  const syncColumnWidths = useCallback(() => {
    const originalHeaders = tableRef.current?.querySelectorAll('thead th');
    const cloneHeaders = fixedHeaderRef.current?.querySelectorAll('thead th');

    if (!originalHeaders || !cloneHeaders) return;

    originalHeaders.forEach((originalTh, index) => {
      const cloneTh = cloneHeaders[index] as HTMLElement;
      if (cloneTh) {
        const width = originalTh.getBoundingClientRect().width;
        cloneTh.style.width = `${width}px`;
        cloneTh.style.minWidth = `${width}px`;
        cloneTh.style.maxWidth = `${width}px`;
      }
    });
  }, []);

  useEffect(() => {
    if (!isSticky || !tableRef.current || !fixedHeaderRef.current) return;

    // Aguardar próximo frame para garantir que clone está montado no DOM
    requestAnimationFrame(() => {
      syncColumnWidths();
    });

    // Debounce para ResizeObserver (performance)
    let timeoutId: NodeJS.Timeout;
    const debouncedSync = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(syncColumnWidths, 100);
    };

    const resizeObserver = new ResizeObserver(debouncedSync);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isSticky, syncColumnWidths]);

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
    <div className="w-full">
      {/* 🎯 ELEMENTO SENTINELA - Detecta quando tabela rola para baixo */}
      <div ref={sentinelRef} className="h-0" />
      
      {/* 📌 CLONE FIXO DO CABEÇALHO - Aparece quando isSticky = true */}
      <ReclamacoesStickyHeaderClone
        isVisible={isSticky}
        headerRef={fixedHeaderRef}
        table={table}
      />
      
      {/* Tabela */}
      <div ref={scrollWrapperRef} className="overflow-x-auto border rounded-md">
        <Table ref={tableRef} className="min-w-max relative">
          <TableHeader className="bg-background shadow-sm">
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
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getAllCells(); // ✅ Cache de células
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

