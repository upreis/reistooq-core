/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 Sticky via position:fixed + getBoundingClientRect (viewport-based)
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
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { ReclamacoesStickyHeaderClone } from './ReclamacoesStickyHeaderClone';

import { reclamacoesColumns } from './ReclamacoesTableColumns';
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

// 📌 Altura do header global (fixo no topo)
const TOP_OFFSET = 56;

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
  
  // 📌 Estados para sticky viewport-based
  const [isSticky, setIsSticky] = useState(false);
  const [stickyRect, setStickyRect] = useState({ left: 0, width: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // 📌 Refs
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerMeasureRef = useRef<HTMLTableSectionElement>(null);
  const rafRef = useRef<number>(0);
  
  // ⚡ Filtrar colunas conforme visibilidade
  const columns = useMemo(() => {
    const allColumns = reclamacoesColumns(onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab);
    
    if (!visibleColumnKeys || visibleColumnKeys.length === 0) {
      return allColumns;
    }
    
    const filtered = allColumns.filter(col => {
      if (!col.id) return true;
      return visibleColumnKeys.includes(col.id as string);
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

  // 🎯 NOVO: Motor de sticky via getBoundingClientRect (viewport-based)
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const header = headerMeasureRef.current;
    if (!wrapper) return;

    const updateSticky = () => {
      const rect = wrapper.getBoundingClientRect();
      const headerH = header?.getBoundingClientRect().height ?? 48;
      
      // Mostrar clone quando: topo da tabela passou do offset E ainda há conteúdo visível
      const shouldSticky = rect.top < TOP_OFFSET && rect.bottom > TOP_OFFSET + headerH;
      
      setIsSticky(shouldSticky);
      
      if (shouldSticky) {
        setStickyRect({
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // Listeners
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    
    // Verificação inicial
    updateSticky();

    return () => {
      window.removeEventListener('scroll', updateSticky);
      window.removeEventListener('resize', updateSticky);
    };
  }, [reclamacoes.length]); // Re-attach quando dados mudam

  // 🎯 Handler de scroll horizontal com requestAnimationFrame
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollLeft(scrollContainer.scrollLeft);
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
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

  const headerGroups = table.getHeaderGroups();

  return (
    <div ref={tableWrapperRef} className="w-full">
      {/* 📌 CLONE FIXO - Aparece quando isSticky = true */}
      <ReclamacoesStickyHeaderClone
        isVisible={isSticky}
        table={table}
        scrollLeft={scrollLeft}
        left={stickyRect.left}
        width={stickyRect.width}
        topOffset={TOP_OFFSET}
      />

      {/* Tabela com scroll horizontal */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto border rounded-md"
      >
        <Table className="min-w-max">
          {/* 📌 HEADER ORIGINAL - ref para medir altura */}
          <TableHeader ref={headerMeasureRef} className="bg-background">
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
