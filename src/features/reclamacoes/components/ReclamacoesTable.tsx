/**
 * 📋 TABELA DE RECLAMAÇÕES - COM ANIMAÇÕES E DESIGN MODERNO
 */

import { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
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
import { reclamacoesColumns } from './ReclamacoesTableColumns';
import { Eye, EyeOff, Download, ChevronDown } from 'lucide-react';

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
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error, 
  pagination, 
  onPageChange, 
  onItemsPerPageChange 
}: ReclamacoesTableProps) {
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  const handleOpenMensagens = (claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
  };

  const table = useReactTable({
    data: reclamacoes,
    columns: reclamacoesColumns,
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
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const exportToCSV = () => {
    const headers = reclamacoesColumns.map((col: any) => 
      typeof col.header === 'string' ? col.header : col.accessorKey
    );
    
    const rows = reclamacoes.map((claim) => 
      reclamacoesColumns.map((col: any) => {
        const value = claim[col.accessorKey];
        return value != null ? String(value) : '';
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reclamacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(reclamacoes, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reclamacoes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setShowExportMenu(false);
  };

  const shouldAnimate = !shouldReduceMotion;

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    }
  };

  const rowVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      y: -5,
      transition: { duration: 0.15 }
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center"
      >
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando reclamações...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 text-center text-destructive"
      >
        <p>Erro: {error}</p>
      </motion.div>
    );
  }

  if (reclamacoes.length === 0 && !globalFilter) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center text-muted-foreground"
      >
        <p>Nenhuma reclamação encontrada</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar em todas as colunas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full transition-all duration-200 focus:ring-2"
          />
        </div>
        
        <div className="flex items-center gap-2">
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
            className="gap-2 transition-all duration-200 hover:scale-105"
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

          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="gap-2 transition-all duration-200 hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Exportar
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-32 bg-background border border-border/50 shadow-lg rounded-md z-20"
                >
                  <button
                    onClick={exportToCSV}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors border-t border-border/30"
                  >
                    JSON
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabela */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-background border border-border/50 overflow-hidden rounded-lg"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/5 border-b border-border/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap text-xs font-medium text-muted-foreground/60">
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
              <AnimatePresence mode="wait">
                {table.getRowModel().rows.length ? (
                  <motion.tbody
                    key={`page-${pagination.currentPage}`}
                    variants={shouldAnimate ? containerVariants : {}}
                    initial={shouldAnimate ? 'hidden' : 'visible'}
                    animate="visible"
                  >
                    {table.getRowModel().rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        variants={shouldAnimate ? rowVariants : {}}
                        className="group border-b border-border/20 bg-muted/5 hover:bg-muted/20 transition-colors duration-150"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))}
                  </motion.tbody>
                ) : (
                  <TableRow>
                    <TableCell colSpan={reclamacoesColumns.length} className="text-center py-8 text-muted-foreground">
                      {globalFilter ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhuma reclamação encontrada.'}
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Paginação */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2"
      >
        <div className="text-xs text-muted-foreground/70">
          Página {pagination.currentPage} de {pagination.totalPages} • {pagination.totalItems} reclamações
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 rounded-md border border-border/50 bg-background px-3 py-1 text-xs hover:bg-muted/30 transition-colors"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              Primeira
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              Última
            </Button>
          </div>
        </div>
      </motion.div>
    
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
