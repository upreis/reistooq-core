import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row, get, show } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {content.substring(0, maxLength)}...
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs whitespace-pre-wrap">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
  debugInfo
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
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
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
      <div className="rounded-lg border overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableHead key={col.key} className="whitespace-nowrap">
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
                <TableRow
                  key={rowId}
                  className={
                    "border-l-4 " +
                    (temMapeamento
                      ? "border-l-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/10"
                      : "border-l-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10")
                  }>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowId)}
                      onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                      className="rounded border-border bg-background"
                    />
                  </TableCell>
                  
                  {/* Render each visible column */}
                  {visibleColumnConfigs.map((col) => (
                    <TableCell key={col.key}>
                      {(() => {
                        switch (col.key) {
                          // UNIFIED columns with fallbacks
                          case 'numero':
                            const numero = get(row.unified, 'numero') ?? String(get(row.raw, 'id'));
                            return (
                              <div className="flex items-center gap-2">
                                <span>{show(numero)}</span>
                                {temMapeamento ? (
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10">
                                    Mapeado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-amber-500/10">
                                    Sem Map.
                                  </Badge>
                                )}
                              </div>
                            );
                          case 'id_unico':
                            return (
                              <div className="font-mono text-xs">
                                {show(get(row.unified, 'id') ?? get(row.raw, 'id'))}
                              </div>
                            );
                          case 'nome_cliente':
                            return show(get(row.unified, 'nome_cliente') ?? get(row.raw, 'buyer.nickname'));
                          case 'cpf_cnpj':
                            return maskCpfCnpj(get(row.unified, 'cpf_cnpj'));
                          case 'data_pedido':
                            return formatDate(get(row.unified, 'data_pedido') ?? get(row.raw, 'date_created'));
                          case 'data_prevista':
                            return formatDate(get(row.unified, 'data_prevista') ?? get(row.raw, 'date_closed'));
                          case 'situacao':
                            const situacao = get(row.unified, 'situacao') ?? get(row.raw, 'status');
                            return (
                              <Badge variant={getSituacaoVariant(situacao)}>
                                {show(situacao)}
                              </Badge>
                            );
                          case 'valor_total':
                            return formatMoney(get(row.unified, 'valor_total'));
                          case 'valor_frete':
                            return formatMoney(get(row.unified, 'valor_frete') ?? get(row.raw, 'payments.0.shipping_cost'));
                          case 'valor_desconto':
                            return formatMoney(get(row.unified, 'valor_desconto'));
                          case 'numero_ecommerce':
                            return show(get(row.unified, 'numero_ecommerce') ?? get(row.raw, 'id'));
                          case 'numero_venda':
                            return show(get(row.unified, 'numero_venda') ?? get(row.raw, 'id'));
                          case 'empresa':
                            return show(get(row.unified, 'empresa') ?? 'mercadolivre');
                          case 'cidade':
                            return show(get(row.unified, 'cidade') ?? get(row.raw, 'shipping_details.receiver_address.city.name'));
                          case 'uf':
                            return show(get(row.unified, 'uf') ?? get(row.raw, 'shipping_details.receiver_address.state.id'));
                          case 'cep':
                            return show(get(row.raw, 'shipping_details.receiver_address.zip_code'));
                          case 'shipping_status':
                            return show(get(row.raw, 'shipping_details.status'));
                          case 'shipping_mode':
                            return show(get(row.raw, 'shipping_details.shipping_mode'));
                          case 'codigo_rastreamento':
                            return show(get(row.unified, 'codigo_rastreamento') ?? get(row.raw, 'shipping_details.tracking_number'));
                          case 'url_rastreamento':
                            return show(get(row.unified, 'url_rastreamento') ?? get(row.raw, 'shipping_details.tracking_url'));
                          case 'obs':
                            return <TruncatedCell content={get(row.unified, 'obs')} />;
                          case 'obs_interna':
                            return <TruncatedCell content={get(row.unified, 'obs_interna')} />;
                          
                          // RAW columns from ML orders/search
                          case 'pack_id':
                            return show(get(row.raw, 'pack_id'));
                          case 'pickup_id':
                            return show(get(row.raw, 'pickup_id'));
                          case 'manufacturing_ending_date':
                            return formatDate(get(row.raw, 'manufacturing_ending_date'));
                          case 'comment':
                            return <TruncatedCell content={get(row.raw, 'comment')} maxLength={30} />;
                          case 'status_detail':
                            return show(get(row.raw, 'status_detail'));
                          case 'tags':
                            const tags = get(row.raw, 'tags');
                            return Array.isArray(tags) && tags.length ? (
                              <div className="flex flex-wrap gap-1">
                                {tags.slice(0, 2).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{tags.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : show(tags);
                          case 'buyer_id':
                            return show(get(row.raw, 'buyer.id'));
                          case 'seller_id':
                            return show(get(row.raw, 'seller.id'));
                          case 'shipping_id':
                            return show(get(row.raw, 'shipping.id')); // correto: shipping.id
                          case 'date_created':
                            return formatDate(get(row.raw, 'date_created'));
                          case 'date_closed':
                            return formatDate(get(row.raw, 'date_closed'));
                          case 'last_updated':
                            return formatDate(get(row.raw, 'last_updated'));
                          
                          // SKU extraction from order items
                          case 'sku': {
                            const items = get(row.raw, 'order_items');
                            if (Array.isArray(items)) {
                              const skus = items
                                .map((it: any) => get(it, 'item.seller_sku') ?? get(it, 'item.seller_custom_field'))
                                .filter(Boolean) as string[];
                              return <TruncatedCell content={skus.join(', ')} maxLength={24} />;
                            }
                            return '—';
                          }
                          
                          // Legacy columns - fallback to unified or show placeholder
                          case 'quantidade':
                            const items = get(row.raw, 'order_items');
                            return Array.isArray(items) ? items.length : show(get(row.unified, 'total_itens'));
                          
                          default:
                            return '—';
                        }
                      })()}
                    </TableCell>
                  ))}
                </TableRow>
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