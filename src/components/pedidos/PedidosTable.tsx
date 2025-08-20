import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchPedidosRealtime, Row } from '@/services/orders';
import { Pedido } from '@/types/pedido';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

// Helper functions for safe data access
const get = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc?.[k] ?? undefined), obj);

const show = (v: any) => (v ?? '—'); // uses nullish coalescing, preserves 0 and false

interface PedidosTableProps {
  integrationAccountId: string;
  hybridData?: {
    rows: Row[];
    total: number;
    fonte: 'banco' | 'tempo-real';
    loading: boolean;
    error: string | null;
    refetch: () => void;
  };
  onSelectionChange?: (selectedRows: Row[]) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  mapeamentosVerificacao?: Map<string, MapeamentoVerificacao>;
  visibleColumns: ColumnConfig[];
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
  integrationAccountId, 
  hybridData, 
  onSelectionChange, 
  currentPage = 1, 
  onPageChange,
  mapeamentosVerificacao = new Map(),
  visibleColumns
}: PedidosTableProps) {
  // Estados locais para quando não usar hybridData
  const [pedidos, setPedidos] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(currentPage);

  // Sincronizar página externa com interna
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Função para verificar se pedido tem mapeamento
  const pedidoTemMapeamento = (row: Row): boolean => {
    const obs = get(row.unified, 'obs') || get(row.raw, 'obs');
    const numero = get(row.unified, 'numero') || get(row.raw, 'id');
    
    if (obs) {
      // Para ML, verificar nos títulos dos produtos
      return obs.split(', ').some((sku: string) => 
        mapeamentosVerificacao.get(sku.trim())?.temMapeamento
      );
    }
    // Para banco, verificar pelo número do pedido como fallback
    return mapeamentosVerificacao.get(numero)?.temMapeamento || false;
  };
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const pageSize = 25;

  const loadPedidos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPedidosRealtime({
        integration_account_id: integrationAccountId,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        enrich: true
      });
      
      setPedidos(result.rows || []);
      setTotalCount(result.total || 0);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só carregar localmente se não tiver hybridData
    if (integrationAccountId && !hybridData) {
      loadPedidos();
    }
  }, [integrationAccountId, page, hybridData]);

  // Usar dados híbridos se disponíveis
  const finalPedidos = hybridData ? hybridData.rows : pedidos;
  const finalLoading = hybridData ? hybridData.loading : loading;
  const finalError = hybridData ? hybridData.error : error;
  const finalTotalCount = hybridData ? hybridData.total : totalCount;
  const finalRefresh = hybridData ? hybridData.refetch : loadPedidos;

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
      const selectedPedidos = finalPedidos.filter(r => {
        const id = get(r.unified, 'id') || get(r.raw, 'id');
        return newSelection.has(id);
      });
      onSelectionChange(selectedPedidos);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? new Set(finalPedidos.map(r => get(r.unified, 'id') || get(r.raw, 'id'))) : new Set<string>();
    setSelectedRows(newSelection);
    
    if (onSelectionChange) {
      const selectedPedidos = selected ? finalPedidos : [];
      onSelectionChange(selectedPedidos);
    }
  };

  const isAllSelected = finalPedidos.length > 0 && selectedRows.size === finalPedidos.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < finalPedidos.length;

  const totalPages = Math.ceil(finalTotalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, finalTotalCount);

  if (finalLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (finalError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <div className="font-medium text-destructive">Erro ao carregar pedidos</div>
        <div className="text-sm text-destructive/80">{finalError}</div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={finalRefresh}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!finalPedidos.length) {
    return (
      <div className="rounded-lg border border-muted bg-muted/30 p-8 text-center">
        <div className="text-lg font-medium text-muted-foreground">
          Nenhum pedido encontrado
        </div>
        <div className="text-sm text-muted-foreground">
          Verifique os filtros ou tente novamente mais tarde.
        </div>
      </div>
    );
  }

  const visibleColumnConfigs = visibleColumns.filter(col => col.visible);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-auto">
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
                  className="rounded border-border"
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
            {finalPedidos.map((row) => {
              const temMapeamento = pedidoTemMapeamento(row);
              const rowId = get(row.unified, 'id') || get(row.raw, 'id');
              return (
                <TableRow 
                  key={rowId}
                  className={temMapeamento 
                    ? "bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400" 
                    : "bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400"
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowId)}
                      onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                      className="rounded border-border"
                    />
                  </TableCell>
                  
                  {/* Special handling for numero column to show mapping badge */}
                  {visibleColumnConfigs.map((col) => (
                    col.key === 'numero' ? (
                      <TableCell key={col.key}>
                        <div className="flex items-center gap-2">
                          <span>{show(get(row.unified, 'numero') ?? get(row.raw, 'id'))}</span>
                          {temMapeamento ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                              Mapeado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                              Sem Map.
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell key={col.key}>
                        {(() => {
                          switch (col.key) {
                            // Raw ML columns
                            case 'pack_id':
                              return show(get(row.raw, 'pack_id'));
                            case 'pickup_id':  
                              return show(get(row.raw, 'pickup_id'));
                            case 'manufacturing_ending_date':
                              return get(row.raw, 'manufacturing_ending_date') ? formatDate(get(row.raw, 'manufacturing_ending_date')) : '—';
                            case 'comment':
                              return <TruncatedCell content={get(row.raw, 'comment')} maxLength={30} />;
                            case 'status_detail':
                              return show(get(row.raw, 'status_detail'));
                            case 'tags':
                              const tags = get(row.raw, 'tags');
                              return Array.isArray(tags) && tags.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {tags.slice(0, 2).map((tag: string, idx: number) => (
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
                              ) : '—';
                            case 'buyer_id':
                              return show(get(row.raw, 'buyer.id'));
                            case 'seller_id':
                              return show(get(row.raw, 'seller.id'));
                            case 'shipping_id':
                              return show(get(row.raw, 'shipping.id'));
                            case 'date_created':
                              return get(row.raw, 'date_created') ? formatDate(get(row.raw, 'date_created')) : '—';
                            case 'date_closed':
                              return get(row.raw, 'date_closed') ? formatDate(get(row.raw, 'date_closed')) : '—';
                            case 'last_updated':
                              return get(row.raw, 'last_updated') ? formatDate(get(row.raw, 'last_updated')) : '—';
                            
                            // Unified columns (22 fields) with fallbacks to raw
                            case 'nome_cliente':
                              return show(get(row.unified, 'nome_cliente') ?? get(row.raw, 'buyer.nickname'));
                            case 'cpf_cnpj':
                              return maskCpfCnpj(get(row.unified, 'cpf_cnpj'));
                            case 'data_pedido':
                              return formatDate(get(row.unified, 'data_pedido') ?? get(row.raw, 'date_created'));
                            case 'data_prevista':
                              return formatDate(get(row.unified, 'data_prevista') ?? get(row.raw, 'date_closed'));
                            case 'situacao':
                              return (
                                <Badge variant={getSituacaoVariant(get(row.unified, 'situacao') ?? get(row.raw, 'status'))}>
                                  {show(get(row.unified, 'situacao') ?? get(row.raw, 'status'))}
                                </Badge>
                              );
                            case 'valor_total':
                              return formatMoney(get(row.unified, 'valor_total') ?? get(row.raw, 'total_amount'));
                            case 'valor_frete':
                              return formatMoney(get(row.unified, 'valor_frete'));
                            case 'valor_desconto':
                              return formatMoney(get(row.unified, 'valor_desconto'));
                            case 'numero_ecommerce':
                              return show(get(row.unified, 'numero_ecommerce') ?? get(row.raw, 'id'));
                            case 'numero_venda':
                              return show(get(row.unified, 'numero_venda') ?? get(row.raw, 'id'));
                            case 'empresa':
                              return show(get(row.unified, 'empresa'));
                            case 'cidade':
                              return show(get(row.unified, 'cidade'));
                            case 'uf':
                              return show(get(row.unified, 'uf'));
                            case 'codigo_rastreamento':
                              return show(get(row.unified, 'codigo_rastreamento'));
                            case 'url_rastreamento':
                              return show(get(row.unified, 'url_rastreamento'));
                            case 'obs':
                              return <TruncatedCell content={get(row.unified, 'obs') ?? get(row.raw, 'obs')} />;
                            case 'obs_interna':
                              return show(get(row.unified, 'obs_interna'));
                            
                            // Legacy columns
                            case 'id_unico':
                              const obs = get(row.unified, 'obs') || get(row.raw, 'obs');
                              const numero = get(row.unified, 'numero') || get(row.raw, 'id');
                              return (
                                <div className="font-mono text-xs">
                                  {`${obs?.split(',')[0]?.trim() || 'SKU'}-${numero}`}
                                </div>
                              );
                            case 'sku':
                              const skuObs = get(row.unified, 'obs') || get(row.raw, 'obs');
                              return (
                                <TruncatedCell content={skuObs?.split(',')[0]?.trim() || '—'} maxLength={20} />
                              );
                            case 'quantidade':
                              const qtyObs = get(row.unified, 'obs') || get(row.raw, 'obs');
                              return qtyObs?.split(',').length || 1;
                            case 'paid_amount':
                              return get(row.raw, 'paid_amount') ? formatMoney(get(row.raw, 'paid_amount')) : '—';
                            case 'currency_id':
                              return show(get(row.raw, 'currency_id'));
                            case 'coupon_amount':
                              return get(row.raw, 'coupon.amount') ? formatMoney(get(row.raw, 'coupon.amount')) : '—';
                            default:
                              return '—';
                          }
                        })()}
                      </TableCell>
                    )
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
          Mostrando {startItem}–{endItem} de {finalTotalCount} pedidos
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