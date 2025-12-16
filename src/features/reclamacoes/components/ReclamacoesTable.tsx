/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 * 🎯 FASE 2: Header separado (ReclamacoesHeaderBar)
 * 📌 SEM sticky no thead - header externo sincronizado
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
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { ReclamacoesHeaderBar } from './ReclamacoesHeaderBar';

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
  
  // 📌 Estado para scroll horizontal (sincroniza header)
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // 📌 FASE 3: Estado para larguras medidas das colunas
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  
  // 📌 Refs
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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

  // 🎯 FASE 3: ResizeObserver para medir larguras reais das células do body
  useEffect(() => {
    if (!tableRef.current || reclamacoes.length === 0) return;
    
    const measureWidths = () => {
      const firstRow = tableRef.current?.querySelector('tbody tr');
      if (!firstRow) return;
      
      const cells = firstRow.querySelectorAll('td');
      const widths: number[] = [];
      
      cells.forEach((cell) => {
        widths.push(cell.getBoundingClientRect().width);
      });
      
      // Só atualizar se larguras mudaram
      setColumnWidths(prev => {
        if (prev.length === widths.length && prev.every((w, i) => Math.abs(w - widths[i]) < 1)) {
          return prev;
        }
        return widths;
      });
    };
    
    // Medir após render inicial
    const timer = setTimeout(measureWidths, 100);
    
    // ResizeObserver para detectar mudanças de largura
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measureWidths);
    });
    
    if (tableRef.current) {
      observer.observe(tableRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [reclamacoes.length, columns.length]);
  
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

  // 🧪 Debug mode flag (deve estar ANTES dos early returns para respeitar regras de hooks)
  const debugStickyEnabled = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('debugSticky') === '1';
    } catch {
      return false;
    }
  }, []);

  // 🎯 Handler de scroll horizontal com requestAnimationFrame
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    requestAnimationFrame(() => {
      setScrollLeft(target.scrollLeft);
    });
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
    <div className="w-full">
      {debugStickyEnabled && (
        <div className="fixed bottom-4 right-4 z-[90] rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow">
          StickyDebug ON · v2025-12-16
        </div>
      )}

      {/* 📌 HEADER SEPARADO - position: sticky no container, NÃO no thead */}
      <ReclamacoesHeaderBar 
        table={table} 
        scrollLeft={scrollLeft}
        topOffset={56} // 🎯 Altura do header global (h-14 = 56px)
        columnWidths={columnWidths} // 🎯 FASE 3: Larguras medidas do body
      />

      {/* Tabela com scroll horizontal - APENAS BODY */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto border-x border-b rounded-b-md -mt-px"
        onScroll={handleScroll}
      >
        <Table ref={tableRef} className="min-w-max" disableOverflow>
          {/* 📌 SEM TableHeader aqui - header está no ReclamacoesHeaderBar */}
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
