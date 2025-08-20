import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listPedidos } from '@/services/pedidos';
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

interface PedidosTableProps {
  integrationAccountId: string;
  hybridData?: {
    rows: Pedido[];
    total: number;
    fonte: 'banco' | 'tempo-real';
    loading: boolean;
    error: string | null;
    refetch: () => void;
  };
  onSelectionChange?: (selectedRows: Pedido[]) => void;
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
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(currentPage);

  // Sincronizar página externa com interna
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Função para verificar se pedido tem mapeamento
  const pedidoTemMapeamento = (pedido: Pedido): boolean => {
    if (pedido.obs) {
      // Para ML, verificar nos títulos dos produtos
      return pedido.obs.split(', ').some(sku => 
        mapeamentosVerificacao.get(sku.trim())?.temMapeamento
      );
    }
    // Para banco, verificar pelo número do pedido como fallback
    return mapeamentosVerificacao.get(pedido.numero)?.temMapeamento || false;
  };
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const pageSize = 25;

  const loadPedidos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await listPedidos({
        integrationAccountId,
        page,
        pageSize
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar pedidos');
      }
      
      setPedidos(result.data || []);
      setTotalCount(result.count || 0);
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
  const handleRowSelection = (pedidoId: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(pedidoId);
    } else {
      newSelection.delete(pedidoId);
    }
    setSelectedRows(newSelection);
    
    // Notificar componente pai
    if (onSelectionChange) {
      const selectedPedidos = finalPedidos.filter(p => newSelection.has(p.id));
      onSelectionChange(selectedPedidos);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? new Set(finalPedidos.map(p => p.id)) : new Set<string>();
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
            {finalPedidos.map((pedido) => {
              const temMapeamento = pedidoTemMapeamento(pedido);
              return (
                <TableRow 
                  key={pedido.id}
                  className={temMapeamento 
                    ? "bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400" 
                    : "bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400"
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(pedido.id)}
                      onChange={(e) => handleRowSelection(pedido.id, e.target.checked)}
                      className="rounded border-border"
                    />
                  </TableCell>
                  
                  {/* Special handling for numero column to show mapping badge */}
                  {visibleColumnConfigs.map((col) => (
                    col.key === 'numero' ? (
                      <TableCell key={col.key}>
                        <div className="flex items-center gap-2">
                          <span>{pedido.numero || '—'}</span>
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
                            case 'id_unico':
                              return (
                                <div className="font-mono text-xs">
                                  {pedido.id_unico || `${pedido.obs?.split(',')[0]?.trim() || 'SKU'}-${pedido.numero}`}
                                </div>
                              );
                            case 'nome_cliente':
                              return pedido.nome_cliente || '—';
                            case 'cpf_cnpj':
                              return maskCpfCnpj(pedido.cpf_cnpj);
                            case 'data_pedido':
                              return formatDate(pedido.data_pedido);
                            case 'sku':
                              return (
                                <TruncatedCell content={pedido.obs?.split(',')[0]?.trim() || '—'} maxLength={20} />
                              );
                            case 'quantidade':
                              return pedido.total_itens || pedido.obs?.split(',').length || 1;
                            case 'situacao':
                              return (
                                <Badge variant={getSituacaoVariant(pedido.situacao)}>
                                  {pedido.situacao || '—'}
                                </Badge>
                              );
                            case 'valor_total':
                              return formatMoney(pedido.valor_total);
                            case 'valor_frete':
                              return formatMoney(pedido.valor_frete);
                            case 'valor_desconto':
                              return formatMoney(pedido.valor_desconto);
                            case 'paid_amount':
                              return pedido.paid_amount ? formatMoney(pedido.paid_amount) : '—';
                            case 'currency_id':
                              return pedido.currency_id || '—';
                            case 'coupon_amount':
                              return pedido.coupon?.amount ? formatMoney(pedido.coupon.amount) : '—';
                            case 'numero_ecommerce':
                              return pedido.numero_ecommerce || '—';
                            case 'numero_venda':
                              return pedido.numero_venda || '—';
                            case 'empresa':
                              return pedido.empresa || '—';
                            case 'cidade':
                              return pedido.cidade || '—';
                            case 'uf':
                              return pedido.uf || '—';
                            case 'obs':
                              return <TruncatedCell content={pedido.obs} />;
                            case 'sku_estoque':
                              return pedido.sku_estoque || '—';
                            case 'sku_kit':
                              return pedido.sku_kit || '—';
                            case 'qtd_kit':
                              return pedido.qtd_kit || '—';
                            case 'total_itens':
                              return pedido.total_itens || '—';
                            case 'status_estoque':
                              return (
                                <Badge 
                                  variant={
                                    pedido.status_estoque === 'pronto_baixar' ? 'default' :
                                    pedido.status_estoque === 'sem_estoque' ? 'destructive' : 'secondary'
                                  }
                                >
                                  {pedido.status_estoque === 'pronto_baixar' ? 'Pronto p/ baixar' :
                                   pedido.status_estoque === 'sem_estoque' ? 'Sem estoque' :
                                   pedido.status_estoque === 'pedido_baixado' ? 'Pedido baixado' : 'Pronto p/ baixar'}
                                </Badge>
                              );
                            case 'date_created':
                              return pedido.date_created ? formatDate(pedido.date_created) : '—';
                            case 'date_closed':
                              return pedido.date_closed ? formatDate(pedido.date_closed) : '—';
                            case 'last_updated':
                              return pedido.last_updated ? formatDate(pedido.last_updated) : '—';
                            case 'pack_id':
                              return pedido.pack_id || '—';
                            case 'pickup_id':
                              return pedido.pickup_id || '—';
                            case 'manufacturing_ending_date':
                              return pedido.manufacturing_ending_date ? formatDate(pedido.manufacturing_ending_date) : '—';
                            case 'comment':
                              return <TruncatedCell content={pedido.comment} maxLength={30} />;
                            case 'status_detail':
                              return pedido.status_detail || '—';
                            case 'tags':
                              return pedido.tags?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {pedido.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {pedido.tags.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{pedido.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : '—';
                            case 'buyer_id':
                              return pedido.buyer?.id || '—';
                            case 'seller_id':
                              return pedido.seller?.id || '—';
                            case 'shipping_id':
                              return pedido.shipping?.id || '—';
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