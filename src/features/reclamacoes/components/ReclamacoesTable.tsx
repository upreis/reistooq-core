/**
 * 📋 TABELA DE RECLAMAÇÕES - COM VIRTUALIZAÇÃO
 */

import { useState, useMemo, memo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
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
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error,
  onStatusChange 
}: ReclamacoesTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
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
  });

  // ⚡ VIRTUALIZAÇÃO - apenas renderizar linhas visíveis
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // altura estimada de cada linha em pixels
    overscan: 10, // quantidade de linhas extras para renderizar fora da tela
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
        {/* Header fixo */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
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

        {/* Container com scroll virtualizado */}
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ height: '600px' }}
        >
          {rows.length ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Table>
                <TableBody>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <OptimizedTableRow 
                        key={row.id} 
                        row={row}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {globalFilter ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhuma reclamação encontrada.'}
            </div>
          )}
        </div>

        {/* Info do total */}
        <div className="border-t px-4 py-3 text-sm text-muted-foreground bg-card">
          <span className="font-medium">
            Total: {rows.length} reclamações
          </span>
          {globalFilter && (
            <span className="ml-2">
              (filtradas de {reclamacoes.length})
            </span>
          )}
          <span className="ml-2 text-xs text-muted-foreground/70">
            • Renderizando apenas {rowVirtualizer.getVirtualItems().length} linhas visíveis
          </span>
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
const OptimizedTableRow = memo(({ row, style }: { row: any; style?: React.CSSProperties }) => {
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
      style={style}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id} className="bg-card text-card-foreground">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
});
