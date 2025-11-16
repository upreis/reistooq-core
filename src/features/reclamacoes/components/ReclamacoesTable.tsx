/**
 * 📋 TABELA DE RECLAMAÇÕES - COM TANSTACK TABLE
 */

import { useState, useMemo, memo, useEffect } from 'react';
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
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { calcularDiasDesdeAtualizacao, getHighlightConfig } from '../utils/highlight-utils';
import { cn } from '@/lib/utils';

interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void;
  onDeleteReclamacao?: (claimId: string) => void;
  onOpenAnotacoes?: (claim: any) => void;
  anotacoes?: Record<string, string>;
  onTableReady?: (table: any) => void;
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error, 
  onStatusChange,
  onDeleteReclamacao,
  onOpenAnotacoes,
  anotacoes,
  onTableReady
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
      {/* Barra de Ferramentas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todas as colunas..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border rounded-lg bg-card">
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
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                return <OptimizedTableRow key={row.id} row={row} />;
              })
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

      {/* Informação de total de reclamações */}
      <div className="flex justify-center py-2 text-sm text-muted-foreground">
        <span>
          Total: <strong>{reclamacoes.length}</strong> reclamações
        </span>
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
