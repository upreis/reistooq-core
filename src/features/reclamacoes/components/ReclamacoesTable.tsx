/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 FASE 3: Integrado com ColumnManager avançado
 */

import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  VisibilityState,
  SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { ReclamacoesColumnSelector } from './ReclamacoesColumnSelector';
import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import type { UseColumnManagerReturn } from '../types/columns.types';

interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
  onDeleteReclamacao?: (claimId: string) => void;
  onOpenAnotacoes?: (claim: any) => void;
  anotacoes?: Record<string, string>;
  onTableReady?: (table: any) => void;
  activeTab?: 'ativas' | 'historico';
  columnManager?: UseColumnManagerReturn; // 🎯 FASE 3: ColumnManager avançado
}

export const ReclamacoesTable = memo(function ReclamacoesTable({
  reclamacoes,
  isLoading,
  error,
  onStatusChange,
  onDeleteReclamacao,
  onOpenAnotacoes,
  anotacoes,
  onTableReady,
  activeTab,
  columnManager // 🎯 FASE 3
}: ReclamacoesTableProps) {
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // 🎯 FASE 3: Sincronizar columnVisibility com columnManager
  const columnVisibility = useMemo<VisibilityState>(() => {
    if (!columnManager) {
      return { reason_id: false, reason_category: false };
    }
    
    const visibility: VisibilityState = {};
    columnManager.definitions.forEach(def => {
      visibility[def.key] = columnManager.state.visibleColumns.has(def.key);
    });
    
    return visibility;
  }, [columnManager]);
  
  const handleOpenMensagens = useCallback((claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
  }, []);

  // ⚡ Memoizar colunas para evitar re-criação
  const columns = useMemo(() => 
    reclamacoesColumns(onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab), 
    [onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes, activeTab]
  );

  const table = useReactTable({
    data: reclamacoes,
    columns,
    getRowId: (row) => row.claim_id || row.id || `row-${Math.random()}`,
    state: {
      globalFilter,
      columnVisibility,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      // 🎯 FASE 3: Sincronizar mudanças de visibilidade com columnManager
      if (!columnManager) return;
      
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
      const visibleKeys = Object.entries(newVisibility)
        .filter(([_, isVisible]) => isVisible)
        .map(([key, _]) => key);
      
      columnManager.actions.setVisibleColumns(visibleKeys);
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Notificar quando a tabela estiver pronta
  useMemo(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

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
    <div className="space-y-4">
      {/* Search bar e Column Selector */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em todas as colunas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <ReclamacoesColumnSelector table={table} columnManager={columnManager} />
      </div>
      
      {/* Tabela */}
      <div className="w-full flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 border rounded-md scroll-smooth">
          <Table className="min-w-max relative">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
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
                  return <OptimizedTableRow key={row.id} row={row} />;
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="text-center py-8 text-muted-foreground">
                    {globalFilter ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhuma reclamação encontrada.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

// ⚡ COMPONENTE OTIMIZADO PARA LINHA DA TABELA (memo evita re-renders desnecessários)
const OptimizedTableRow = memo(function OptimizedTableRow({ row }: { row: any }) {
  return (
    <TableRow className="hover:bg-muted/50">
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
});

OptimizedTableRow.displayName = 'OptimizedTableRow';
