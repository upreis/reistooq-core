import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row, get, show } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
// F4.2: Usar sistema unificado de mapeamento de status
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { translateShippingSubstatus } from '@/utils/pedidos-translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { PedidosTableRow } from './PedidosTableRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ColumnConfig } from './ColumnSelector';

interface PedidosTableProps {
  rows: Row[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectionChange?: (selectedRows: Row[]) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  mapeamentosVerificacao?: Map<string, MapeamentoVerificacao>;
  visibleColumns: ColumnConfig[];
  debugInfo?: any;
  renderStatusBaixa?: (pedidoId: string) => React.ReactNode;
  renderStatusInsumos?: (pedidoId: string) => React.ReactNode;
}

function getSituacaoVariant(situacao: string): "default" | "secondary" | "destructive" | "outline" {
  switch (situacao?.toLowerCase()) {
    case 'entregue':
      return 'default'; // Green
    case 'pago':
      return 'secondary'; // Blue
    case 'cancelado':
      return 'destructive'; // Red
    default:
      return 'outline'; // Gray
  }
}

function TruncatedCell({ content, maxLength = 50 }: { content?: string | null; maxLength?: number }) {
  if (!content) return <span>-</span>;
  
  if (content.length <= maxLength) {
    return <span>{content}</span>;
  }

  return (
    <span className="cursor-help" title={content}>
      {content.substring(0, maxLength)}...
    </span>
  );
}

export function PedidosTable({ 
  rows,
  total,
  loading,
  error,
  onRefresh,
  onSelectionChange, 
  currentPage = 1, 
  onPageChange,
  mapeamentosVerificacao = new Map(),
  visibleColumns,
  debugInfo,
  renderStatusBaixa,
  renderStatusInsumos
}: PedidosTableProps) {
  const [page, setPage] = useState(currentPage);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const pageSize = 25;

  // Função para verificar se pedido tem mapeamento
  const rowTemMapeamento = (row: Row): boolean => {
    const obs = row.unified?.obs;
    const numero = row.unified?.numero || String(row.raw?.id);
    
    if (obs) {
      // Para ML, verificar nos títulos dos produtos
      return obs.split(', ').some(sku => 
        mapeamentosVerificacao.get(sku.trim())?.temMapeamento
      );
    }
    // Para banco, verificar pelo número do pedido como fallback
    return mapeamentosVerificacao.get(numero)?.temMapeamento || false;
  };

  // Gerenciar seleção
  const handleRowSelection = (rowId: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    
    // Notificar componente pai
    if (onSelectionChange) {
      const selectedRowObjects = rows.filter(r => newSelection.has(getRowId(r)));
      onSelectionChange(selectedRowObjects);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? new Set(rows.map(r => getRowId(r))) : new Set<string>();
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedRowObjects = selected ? rows : [];
      onSelectionChange(selectedRowObjects);
    }
  };

  // Helper to get consistent row ID
  const getRowId = (row: Row): string => {
    return row.unified?.id || String(row.raw?.id) || '';
  };

  const isAllSelected = rows.length > 0 && selectedRows.size === rows.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (loading) {
    return <SkeletonTable rows={10} columns={visibleColumns.length} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
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

  if (!rows.length) {
    const isAuditMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('audit') === '1';
    
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-muted bg-muted/30 p-8 text-center">
          <div className="text-lg font-medium text-muted-foreground">
            Nenhum pedido encontrado
          </div>
          <div className="text-sm text-muted-foreground">
            Verifique os filtros ou tente novamente mais tarde.
          </div>
        </div>

        {isAuditMode && debugInfo && (
          <Alert className="border-amber-200 bg-amber-50 text-left">
            <AlertDescription className="space-y-2">
              <div className="font-medium">Provas (unified-orders)</div>
              <div className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(debugInfo, null, 2)
                  )
                }
              >
                Copiar Provas
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const visibleColumnConfigs = visibleColumns.filter(col => col.visible);

  return (
    <div className="space-y-4 text-foreground">
      <div className="rounded-lg border border-gray-600 overflow-auto bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-muted shadow-sm">
            <TableRow className="hover:bg-muted">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-border bg-background"
                />
              </TableHead>
              {visibleColumnConfigs.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={cn(
                    "whitespace-nowrap",
                    (col.key === 'logistic_type' || col.key === 'shipping_status') && "whitespace-nowrap",
                    col.key === 'tags' && "break-words whitespace-normal"
                  )}
                  style={(col as any).width ? { minWidth: `${(col as any).width}px`, width: `${(col as any).width}px` } : undefined}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const temMapeamento = rowTemMapeamento(row);
              const rowId = getRowId(row);
              
              return (
                <PedidosTableRow
                  key={rowId}
                  row={row}
                  isSelected={selectedRows.has(rowId)}
                  onSelect={handleRowSelection}
                  temMapeamento={temMapeamento}
                  visibleColumns={visibleColumnConfigs}
                  rowId={rowId}
                  renderStatusBaixa={renderStatusBaixa}
                  renderStatusInsumos={renderStatusInsumos}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {startItem}–{endItem} de {total} pedidos
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
              onPageChange?.(newPage);
            }}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.min(totalPages, page + 1);
              setPage(newPage);
              onPageChange?.(newPage);
            }}
            disabled={page >= totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}