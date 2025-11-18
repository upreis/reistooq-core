/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 */

import { useState, useMemo, memo } from 'react';
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
import { CustomHorizontalScrollbar } from './CustomHorizontalScrollbar';
import { Search } from 'lucide-react';
import type { StatusAnalise } from '../types/devolucao-analise.types';

interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
  onDeleteReclamacao?: (claimId: string) => void;
  onOpenAnotacoes?: (claim: any) => void;
  anotacoes?: Record<string, string>;
  onTableReady?: (table: any) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement>;
  // Paginação
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scrollWidth: number;
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error, 
  onStatusChange,
  onDeleteReclamacao,
  onOpenAnotacoes,
  anotacoes = {},
  onTableReady,
  tableContainerRef,
  currentPage,
  totalPages,
  onPageChange,
  scrollWidth
}: ReclamacoesTableProps) {
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    reason_id: false,
    reason_category: false,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const handleOpenMensagens = (claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
  };

  // ⚡ Memoizar colunas para evitar re-criação
  const columns = useMemo(() => 
    reclamacoesColumns(onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes), 
    [onStatusChange, onDeleteReclamacao, onOpenAnotacoes, anotacoes]
  );

  const table = useReactTable({
    data: reclamacoes,
    columns,
    state: {
      globalFilter,
      columnVisibility,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
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
      {/* Tabela */}
      <div className="w-full flex-1 flex flex-col min-h-0">
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto overflow-y-auto flex-1 border rounded-md scroll-smooth"
        >
          <Table className="min-w-max relative">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
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

      {/* Rodapé da Tabela: Scrollbar + Paginação - Sticky Bottom */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-background border-t z-30">
          {/* Scrollbar Horizontal Customizado */}
          <CustomHorizontalScrollbar
            scrollWidth={scrollWidth}
            containerRef={tableContainerRef}
          />

          {/* Paginação */}
          <div className="flex justify-between items-center px-4 md:px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({reclamacoes.length} reclamações)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}
    
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
}

// ⚡ COMPONENTE OTIMIZADO PARA LINHA DA TABELA (memo evita re-renders desnecessários)
const OptimizedTableRow = memo(({ row }: { row: any }) => {
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
