import React, { useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme/ThemeProvider';

// Types
interface Column {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

interface PedidosTableVirtualProps {
  data: any[];
  columns: Column[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  height?: number;
  className?: string;
}

export function PedidosTableVirtual({
  data,
  columns,
  total,
  loading,
  error,
  onRefresh,
  onSelectionChange,
  currentPage = 1,
  onPageChange,
  onSort,
  height = 600,
  className
}: PedidosTableVirtualProps) {
  const { theme } = useTheme();
  const actualTheme = theme === 'materialm-dark' ? 'dark' : 'light';
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  
  // Create parent ref for virtualizer
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  // Virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  // Handle row selection
  const handleRowSelection = (rowId: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedRowObjects = data.filter(row => newSelection.has(getRowId(row)));
      onSelectionChange(selectedRowObjects);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? new Set(data.map(row => getRowId(row))) : new Set<string>();
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedRowObjects = selected ? data : [];
      onSelectionChange(selectedRowObjects);
    }
  };

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sortState.column === columnKey) {
      if (sortState.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortState.direction === 'desc') {
        // Reset sort
        setSortState({ column: null, direction: null });
        onSort?.(columnKey, 'asc'); // Reset to default
        return;
      }
    }
    
    setSortState({ column: columnKey, direction: newDirection });
    onSort?.(columnKey, newDirection);
  };

  // Helper to get consistent row ID
  const getRowId = (row: any): string => {
    return row.id || row.numero || String(row.raw?.id) || Math.random().toString();
  };

  // Status badge variant helper
  const getSituacaoVariant = (situacao: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (situacao?.toLowerCase()) {
      case 'entregue':
        return 'default'; // Uses success color
      case 'pago':
      case 'confirmado':
        return 'secondary'; // Uses info color  
      case 'cancelado':
        return 'destructive'; // Uses error color
      default:
        return 'outline'; // Muted
    }
  };

  // Render cell content
  const renderCell = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }

    // Default cell renderers based on column type
    switch (column.key) {
      case 'situacao':
        return (
          <Badge 
            variant={getSituacaoVariant(value)}
            className="text-xs font-medium"
          >
            {value || 'N/A'}
          </Badge>
        );
      
      case 'valor_total':
      case 'valor_frete':
      case 'valor_desconto':
        return (
          <span className="font-mono text-sm">
            {formatMoney(value)}
          </span>
        );
      
      case 'data_pedido':
      case 'data_prevista':
        return (
          <span className="text-sm">
            {formatDate(value)}
          </span>
        );
      
      case 'cpf_cnpj':
        return (
          <span className="font-mono text-xs">
            {maskCpfCnpj(value)}
          </span>
        );
      
      case 'titulo_anuncio':
        // Show up to 2 lines with ellipsis
        return <span className="text-sm line-clamp-2">{value || '—'}</span>;
      
      default:
        return <span className="text-sm">{value || '—'}</span>;
    }
  };

  // Calculate pagination
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  if (loading && data.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-destructive/20 bg-destructive/10 p-4", className)}>
        <div className="font-medium text-destructive">Erro ao carregar pedidos</div>
        <div className="text-sm text-destructive/80">{error}</div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={onRefresh}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-muted bg-muted/30 p-8 text-center", className)}>
        <div className="text-lg font-medium text-muted-foreground">
          Nenhum pedido encontrado
        </div>
        <div className="text-sm text-muted-foreground">
          Verifique os filtros ou tente novamente mais tarde.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Container */}
      <div 
        className={cn(
          "rounded-lg border overflow-hidden",
          "bg-background",
          actualTheme === 'dark' ? 'border-border/50' : 'border-border'
        )}
      >
        {/* Header */}
        <div 
          className={cn(
            "grid grid-cols-[40px_1fr] border-b sticky top-0 z-10",
            "bg-[var(--table-header-bg)]",
            "border-[var(--table-border)]"
          )}
          style={{
            gridTemplateColumns: `40px ${columns.map(col => `${col.width}px`).join(' ')}`
          }}
        >
          {/* Select All Header */}
          <div className="p-3 flex items-center justify-center border-r border-[var(--table-border)]">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
          
          {/* Column Headers */}
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "p-3 border-r border-[var(--table-border)] last:border-r-0",
                "flex items-center justify-between",
                "text-sm font-medium text-foreground",
                column.sortable && "cursor-pointer hover:bg-[var(--table-row-hover)] transition-colors"
              )}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <span>{column.label}</span>
              {column.sortable && (
                <div className="flex flex-col ml-2">
                  {sortState.column === column.key ? (
                    sortState.direction === 'asc' ? (
                      <ChevronUp className="h-3 w-3 text-primary" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-primary" />
                    )
                  ) : (
                    <div className="h-3 w-3 text-muted-foreground/50">
                      <ChevronUp className="h-2 w-2" />
                      <ChevronDown className="h-2 w-2 -mt-1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Virtual List Container */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              const rowId = getRowId(row);
              const isSelected = selectedRows.has(rowId);

              return (
                <div
                  key={virtualRow.key}
                  className={cn(
                    "absolute top-0 left-0 w-full grid border-b",
                    "hover:bg-[var(--table-row-hover)] transition-colors",
                    "border-[var(--table-border)]",
                    isSelected && "bg-[var(--table-row-selected)]"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: `40px ${columns.map(col => `${col.width}px`).join(' ')}`
                  }}
                >
                  {/* Selection Checkbox */}
                  <div className="p-3 flex items-center justify-center border-r border-[var(--table-border)]">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelection(rowId, !!checked)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>

                  {/* Data Cells */}
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        "p-3 border-r border-[var(--table-border)] last:border-r-0 flex overflow-hidden",
                        // Allow text wrapping for specific columns
                        (column.key === 'titulo_anuncio' || column.key === 'shipping_mode' || column.key === 'endereco_rua' || column.key === 'endereco_bairro') ? "items-start" : "items-center"
                      )}
                      style={column.key === 'titulo_anuncio' ? { minWidth: '300px' } : undefined}
                    >
                      <div className={cn(
                        "w-full",
                        column.key === 'titulo_anuncio' 
                          ? "text-sm leading-snug break-words whitespace-normal line-clamp-2"
                          : (column.key === 'shipping_mode' || column.key === 'endereco_rua' || column.key === 'endereco_bairro')
                            ? "line-clamp-2 text-sm leading-tight break-words whitespace-normal"
                            : "truncate text-sm"
                      )}>
                        {renderCell(column, row)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Mostrando {startItem}–{endItem} de {total} pedidos
          {selectedRows.size > 0 && (
            <span className="ml-2 text-primary">
              ({selectedRows.size} selecionados)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="px-3 py-1 bg-muted rounded text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading overlay for subsequent loads */}
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 bg-background border rounded-lg p-3">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm">Carregando...</span>
          </div>
        </div>
      )}
    </div>
  );
}