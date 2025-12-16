/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 Header fixo + body scrollável com sync horizontal
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
  
  // 📌 Ref para sincronização de scroll horizontal
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  
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

  // 🔄 Sincronizar scroll horizontal: body scrolla, header move via transform
  useEffect(() => {
    const bodyEl = bodyScrollRef.current;
    const headerInner = headerInnerRef.current;
    if (!bodyEl || !headerInner) return;

    const handleBodyScroll = () => {
      headerInner.style.transform = `translateX(${-bodyEl.scrollLeft}px)`;
    };

    bodyEl.addEventListener('scroll', handleBodyScroll, { passive: true });
    return () => bodyEl.removeEventListener('scroll', handleBodyScroll);
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
    <div className="w-full flex flex-col border rounded-md">
      {/* 📌 HEADER FIXO - overflow-hidden, move via transform */}
      <div className="overflow-hidden flex-shrink-0">
        <div ref={headerInnerRef} style={{ willChange: 'transform' }}>
          <Table className="min-w-max">
            <TableHeader className="bg-background">
              {headerGroups.map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as any;
                    return (
                      <TableHead
                        key={header.id}
                        className={`bg-background ${meta?.headerClassName || ''}`}
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

      {/* 📌 BODY SCROLLÁVEL - scroll horizontal e vertical */}
      <div 
        ref={bodyScrollRef}
        className="overflow-auto flex-1"
        style={{ maxHeight: 'calc(100vh - 380px)' }}
      >
        <Table className="min-w-max">
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
