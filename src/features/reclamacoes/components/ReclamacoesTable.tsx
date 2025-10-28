/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 */

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  VisibilityState,
  SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { Eye, EyeOff } from 'lucide-react';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { calcularDiasDesdeAtualizacao, getHighlightConfig } from '../utils/highlight-utils';

interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error, 
  pagination, 
  onPageChange, 
  onItemsPerPageChange,
  onStatusChange 
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

  const table = useReactTable({
    data: reclamacoes,
    columns: reclamacoesColumns(onStatusChange),
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
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando reclamações...</p>
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
      {/* Barra de Ferramentas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar em todas as colunas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => {
            const keys = table.getAllLeafColumns().map((col) => col.id);
            const allVisible = keys.every(key => columnVisibility[key] !== false);
            setColumnVisibility(
              keys.reduce((acc, key) => {
                acc[key] = !allVisible;
                return acc;
              }, {} as VisibilityState)
            );
          }}
          className="gap-2"
        >
          {Object.keys(columnVisibility).length > 0 && 
           Object.values(columnVisibility).some(v => v === false) ? (
            <>
              <Eye className="h-4 w-4" />
              Mostrar Todas
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar Todas
            </>
          )}
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                // 🎨 HIGHLIGHT de linhas atualizadas
                const claim = row.original;
                const diasDesdeAtualizacao = calcularDiasDesdeAtualizacao(
                  claim.ultima_atualizacao_real || claim.last_updated
                );
                const highlightConfig = getHighlightConfig(diasDesdeAtualizacao);

                return (
                  <TableRow 
                    key={row.id}
                    className={highlightConfig ? highlightConfig.rowClass : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
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

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-sm text-muted-foreground">
          Página {pagination.currentPage} de {pagination.totalPages} • Total: {pagination.totalItems} reclamações
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              Primeira
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Última
            </Button>
          </div>
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
}
