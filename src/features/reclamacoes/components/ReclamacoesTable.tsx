/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 */

import { useState, useMemo, memo, useRef } from 'react';
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
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';
import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { Eye, EyeOff } from 'lucide-react';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { calcularDiasDesdeAtualizacao, getHighlightConfig } from '../utils/highlight-utils';
import { cn } from '@/lib/utils';

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
  
  // Ref para o container da tabela (virtualização)
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const handleOpenMensagens = (claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
  };

  // ⚡ Memoizar colunas para evitar re-criação
  const columns = useMemo(() => reclamacoesColumns(onStatusChange), [onStatusChange]);

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
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // 🚀 VIRTUALIZAÇÃO - Renderizar apenas linhas visíveis
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Altura estimada de cada linha em pixels
    overscan: 5, // Renderizar 5 linhas extras acima/abaixo para scroll suave
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

      {/* Tabela com Virtualização */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap bg-card text-card-foreground">
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
          </Table>
        </div>

        {/* Container Virtualizador */}
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ maxHeight: '600px' }}
        >
          <Table>
            <TableBody>
              {rows.length ? (
                <tr>
                  <td colSpan={table.getAllColumns().length} style={{ padding: 0 }}>
                    <div
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        return (
                          <div
                            key={row.id}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <table style={{ width: '100%', tableLayout: 'fixed' }}>
                              <tbody>
                                <OptimizedTableRow row={row} />
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ) : (
                <TableRow className="bg-card hover:bg-card">
                  <TableCell colSpan={table.getAllColumns().length} className="text-center py-8 text-muted-foreground">
                    {globalFilter ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhuma reclamação encontrada.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Indicador de Performance */}
        {rows.length > 20 && (
          <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
            🚀 Virtual Scrolling ativo • Renderizando {rowVirtualizer.getVirtualItems().length} de {rows.length} linhas
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} até{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de{' '}
            <strong>{pagination.totalItems}</strong> reclamações
          </span>
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

// ⚡ COMPONENTE OTIMIZADO PARA LINHA DA TABELA (memo evita re-renders desnecessários)
const OptimizedTableRow = memo(({ row }: { row: any }) => {
  // 🎨 Memoizar cálculo de highlight (só recalcula se claim mudar)
  const highlightConfig = useMemo(() => {
    const claim = row.original;
    const diasDesdeAtualizacao = calcularDiasDesdeAtualizacao(
      claim.ultima_atualizacao_real || claim.last_updated
    );
    return getHighlightConfig(diasDesdeAtualizacao);
  }, [row.original.ultima_atualizacao_real, row.original.last_updated]);

  return (
    <TableRow 
      className={cn(
        "bg-card text-card-foreground hover:bg-muted/50",
        highlightConfig ? highlightConfig.rowClass : ''
      )}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id} className="bg-card text-card-foreground">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
});
