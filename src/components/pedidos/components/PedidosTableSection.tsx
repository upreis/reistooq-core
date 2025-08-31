/**
 * 🎯 SEÇÃO DA TABELA DE PEDIDOS - Componente Extraído
 * Mantém todas as funcionalidades críticas de seleção, mapeamentos e baixa de estoque
 */

import { memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, CheckCircle, AlertTriangle, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { 
  getShippingStatusColor, 
  translateShippingStatus, 
  translateShippingSubstatus, 
  translateShippingMode, 
  translateShippingMethod 
} from '@/utils/pedidos-translations';
import { cn } from '@/lib/utils';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';

interface PedidosTableSectionProps {
  orders: any[];
  total: number;
  loading: boolean;
  error: string | null;
  state: any;
  filters: any;
  actions: any;
  selectedOrders: Set<string>;
  setSelectedOrders: (orders: Set<string>) => void;
  mappingData: Map<string, any>;
  visibleColumns: any;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPedidoProcessado: (order: any) => boolean;
  className?: string;
}

export const PedidosTableSection = memo<PedidosTableSectionProps>(({
  orders,
  total,
  loading,
  error,
  state,
  filters,
  actions,
  selectedOrders,
  setSelectedOrders,
  mappingData,
  visibleColumns,
  currentPage,
  totalPages,
  onPageChange,
  isPedidoProcessado,
  className
}) => {
  console.log('🎯 [PedidosTableSection] Renderizando tabela de pedidos');

  // Função para lidar com seleção de pedidos
  const handleSelectOrder = useCallback((orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  }, [selectedOrders, setSelectedOrders]);

  // Função para selecionar todos os pedidos
  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  }, [orders, selectedOrders.size, setSelectedOrders]);

  // Funções auxiliares memoizadas
  const getReceitaPorEnvio = useCallback((order: any) => {
    return order.shipping?.costs?.receiver?.cost || 0;
  }, []);

  const getValorLiquidoVendedor = useCallback((order: any) => {
    const total = order.valor_total || order.total_amount || 0;
    const fee = order.order_items?.[0]?.sale_fee || order.marketplace_fee || 0;
    return total - fee;
  }, []);

  // Renderizar estado de loading
  if (loading && !state.isRefreshing) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Carregando pedidos...</p>
        <p className="text-xs text-muted-foreground mt-1">
          {state.cachedAt ? 'Verificando atualizações...' : 'Buscando dados...'}
        </p>
      </Card>
    );
  }

  // Renderizar estado vazio
  if (orders.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '') 
            ? "Nenhum pedido encontrado com os filtros aplicados"
            : "Nenhum pedido encontrado"
          }
        </p>
        {Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '') && (
          <Button
            variant="link"
            onClick={actions.clearFilters}
            className="mt-2"
          >
            Limpar filtros
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mensagem de erro */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">⚠️ {error}</p>
        </Card>
      )}

      {/* Indicadores */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Fonte: {state.fonte} | Total: {total} pedidos</span>
          {state.isRefreshing && <span className="ml-2 animate-pulse">• Atualizando...</span>}
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('[DEBUG] === FORÇANDO ATUALIZAÇÃO COMPLETA ===');
              console.log('[DEBUG] Total de pedidos:', orders.length);
              
              if (orders.length > 0) {
                console.log('[DEBUG] Sample order data:', {
                  id: orders[0].id,
                  shipping_mode: orders[0].shipping_mode,
                  forma_entrega: orders[0].forma_entrega,
                  is_fulfillment: orders[0].is_fulfillment,
                  status_detail: orders[0].status_detail,
                  available_fields: Object.keys(orders[0])
                });
              }
              
              localStorage.clear();
              sessionStorage.clear();
              actions.clearFilters();
              actions.refetch();
              
              setTimeout(() => {
                console.log('[DEBUG] Página recarregando para garantir dados frescos...');
                window.location.reload();
              }, 1000);
            }}
            className="text-xs h-6 px-2"
          >
            🔄 Debug & Recarregar
          </Button>
        </div>
        
        {(filters.situacao || filters.dataInicio || filters.dataFim) && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          </div>
        )}
      </div>

      {/* Tabela Principal */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3">
                  <Checkbox
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                
                {/* Cabeçalhos dinâmicos baseados nas colunas visíveis */}
                {visibleColumns.has('situacao') && <th className="p-3">Status</th>}
                {visibleColumns.has('numero') && <th className="p-3">Número</th>}
                {visibleColumns.has('nome_cliente') && <th className="p-3">Cliente</th>}
                {visibleColumns.has('cpf_cnpj') && <th className="p-3">CPF/CNPJ</th>}
                {visibleColumns.has('data_pedido') && <th className="p-3">Data Pedido</th>}
                {visibleColumns.has('last_updated') && <th className="p-3">Última Atualização</th>}
                {visibleColumns.has('skus_produtos') && <th className="p-3">SKUs</th>}
                {visibleColumns.has('quantidade_itens') && <th className="p-3">Qtd Itens</th>}
                {visibleColumns.has('titulo_anuncio') && <th className="p-3">Título Anúncio</th>}
                {visibleColumns.has('valor_total') && <th className="p-3">Valor Total</th>}
                {visibleColumns.has('paid_amount') && <th className="p-3">Valor Pago</th>}
                {visibleColumns.has('frete_pago_cliente') && <th className="p-3">Frete Cliente</th>}
                {visibleColumns.has('receita_flex') && <th className="p-3">Receita Flex</th>}
                {visibleColumns.has('custo_envio_seller') && <th className="p-3">Custo Envio</th>}
                {visibleColumns.has('coupon_amount') && <th className="p-3">Desconto</th>}
                {visibleColumns.has('marketplace_fee') && <th className="p-3">Taxa Marketplace</th>}
                {visibleColumns.has('valor_liquido_vendedor') && <th className="p-3">Valor Líquido</th>}
                {visibleColumns.has('payment_method') && <th className="p-3">Pagamento</th>}
                {visibleColumns.has('shipping_mode') && <th className="p-3">Modo Envio</th>}
                {(visibleColumns.has('cidade') || visibleColumns.has('endereco_cidade')) && <th className="p-3">Cidade</th>}
                {(visibleColumns.has('uf') || visibleColumns.has('endereco_uf')) && <th className="p-3">UF</th>}
                {visibleColumns.has('mapeamento') && <th className="p-3">Mapeamento</th>}
                {visibleColumns.has('sku_estoque') && <th className="p-3">SKU Estoque</th>}
                {visibleColumns.has('sku_kit') && <th className="p-3">SKU KIT</th>}
                {visibleColumns.has('qtd_kit') && <th className="p-3">Qtd KIT</th>}
                {visibleColumns.has('total_itens') && <th className="p-3">Total Itens</th>}
                {visibleColumns.has('status_baixa') && <th className="p-3">Status Baixa</th>}
              </tr>
            </thead>
            
            <tbody>
              {orders.map((order, index) => {
                const isSelected = selectedOrders.has(order.id);
                const isProcessed = isPedidoProcessado(order);
                const mapping = mappingData.get(order.id);
                
                // Extrair SKUs do pedido
                const skus = order.order_items?.map((item: any) => 
                  item.sku || item.item?.sku || item.item?.seller_sku || 'N/A'
                ).filter(Boolean) || [];
                
                const quantidadeItens = order.order_items?.reduce((acc: number, item: any) => 
                  acc + (item.quantity || 1), 0
                ) || 1;

                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-b hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted",
                      isProcessed && "opacity-60 bg-green-50"
                    )}
                  >
                    {/* Checkbox de seleção */}
                    <td className="p-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                        disabled={isProcessed}
                      />
                    </td>

                    {/* Status */}
                    {visibleColumns.has('situacao') && (
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                          {mapApiStatusToLabel(order.situacao || order.status)}
                        </Badge>
                        {isProcessed && (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                        )}
                      </td>
                    )}

                    {/* Número do pedido */}
                    {visibleColumns.has('numero') && (
                      <td className="p-3 font-mono text-sm">
                        {order.numero || order.id?.toString().slice(-8)}
                      </td>
                    )}

                    {/* Nome do cliente */}
                    {visibleColumns.has('nome_cliente') && (
                      <td className="p-3">
                        <div className="max-w-xs truncate" title={order.nome_cliente || order.buyer?.nickname}>
                          {order.nome_cliente || order.buyer?.nickname || '-'}
                        </div>
                      </td>
                    )}

                    {/* CPF/CNPJ */}
                    {visibleColumns.has('cpf_cnpj') && (
                      <td className="p-3 font-mono text-sm">
                        {order.cpf_cnpj ? maskCpfCnpj(order.cpf_cnpj) : '-'}
                      </td>
                    )}

                    {/* Data do pedido */}
                    {visibleColumns.has('data_pedido') && (
                      <td className="p-3">{formatDate(order.data_pedido || order.date_created)}</td>
                    )}

                    {/* Última atualização */}
                    {visibleColumns.has('last_updated') && (
                      <td className="p-3">{order.last_updated ? formatDate(order.last_updated) : '-'}</td>
                    )}

                    {/* SKUs dos produtos */}
                    {visibleColumns.has('skus_produtos') && (
                      <td className="p-3">
                        <div className="max-w-xs truncate" title={skus.join(', ')}>
                          {skus.length > 0 ? skus.join(', ') : '-'}
                        </div>
                      </td>
                    )}

                    {/* Quantidade de itens */}
                    {visibleColumns.has('quantidade_itens') && (
                      <td className="p-3">{quantidadeItens}</td>
                    )}

                    {/* Título do anúncio */}
                    {visibleColumns.has('titulo_anuncio') && (
                      <td className="p-3">
                        <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title || order.titulo_anuncio}>
                          {order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-'}
                        </div>
                      </td>
                    )}

                    {/* Valor total */}
                    {visibleColumns.has('valor_total') && (
                      <td className="p-3">{formatMoney(order.valor_total || order.total_amount || 0)}</td>
                    )}

                    {/* Valor pago */}
                    {visibleColumns.has('paid_amount') && (
                      <td className="p-3">{formatMoney(order.paid_amount || 0)}</td>
                    )}

                    {/* Frete pago pelo cliente */}
                    {visibleColumns.has('frete_pago_cliente') && (
                      <td className="p-3">
                        {formatMoney(
                          order.frete_pago_cliente || 
                          order.payments?.[0]?.shipping_cost ||
                          order.shipping?.costs?.receiver?.cost ||
                          order.valor_frete ||
                          0
                        )}
                      </td>
                    )}

                    {/* Receita Flex */}
                    {visibleColumns.has('receita_flex') && (
                      <td className="p-3">
                        {formatMoney(
                          order.receita_flex || 
                          getReceitaPorEnvio(order)
                        )}
                      </td>
                    )}

                    {/* Custo de envio do seller */}
                    {visibleColumns.has('custo_envio_seller') && (
                      <td className="p-3">
                        {formatMoney(
                          order.custo_envio_seller ||
                          order.shipping?.costs?.senders?.[0]?.cost ||
                          0
                        )}
                      </td>
                    )}

                    {/* Valor do cupom */}
                    {visibleColumns.has('coupon_amount') && (
                      <td className="p-3">{formatMoney(order.coupon_amount || order.coupon?.amount || 0)}</td>
                    )}

                    {/* Taxa do marketplace */}
                    {visibleColumns.has('marketplace_fee') && (
                      <td className="p-3">
                        {(() => {
                          const fee = 
                            order.order_items?.[0]?.sale_fee ||
                            order.raw?.order_items?.[0]?.sale_fee ||
                            order.marketplace_fee || 
                            order.fees?.[0]?.value || 
                            order.raw?.fees?.[0]?.value ||
                            0;
                          return fee > 0 ? formatMoney(fee) : '-';
                        })()}
                      </td>
                    )}

                    {/* Valor líquido do vendedor */}
                    {visibleColumns.has('valor_liquido_vendedor') && (
                      <td className="p-3">{formatMoney(getValorLiquidoVendedor(order))}</td>
                    )}

                    {/* Método de pagamento */}
                    {visibleColumns.has('payment_method') && (
                      <td className="p-3">
                        <span className="text-xs">
                          {order.payments?.[0]?.payment_method_id || 
                           order.payment_method || 
                           order.raw?.payments?.[0]?.payment_method_id || '-'}
                        </span>
                      </td>
                    )}

                    {/* Modo de envio */}
                    {visibleColumns.has('shipping_mode') && (
                      <td className="p-3">
                        <span className="text-xs">
                          {translateShippingMode(order.shipping_mode || order.forma_entrega) || '-'}
                        </span>
                      </td>
                    )}

                    {/* Cidade */}
                    {(visibleColumns.has('cidade') || visibleColumns.has('endereco_cidade')) && (
                      <td className="p-3">{order.cidade || order.shipping?.receiver_address?.city || '-'}</td>
                    )}

                    {/* UF */}
                    {(visibleColumns.has('uf') || visibleColumns.has('endereco_uf')) && (
                      <td className="p-3">{order.uf || order.shipping?.receiver_address?.state || '-'}</td>
                    )}

                    {/* Colunas de mapeamento detalhadas */}
                    {visibleColumns.has('sku_estoque') && (
                      <td className="p-3">
                        {mapping?.skuEstoque || '-'}
                      </td>
                    )}
                    {visibleColumns.has('sku_kit') && (
                      <td className="p-3">
                        {mapping?.skuKit || '-'}
                      </td>
                    )}
                    {visibleColumns.has('qtd_kit') && (
                      <td className="p-3">
                        {mapping?.quantidade ?? '-'}
                      </td>
                    )}
                    {visibleColumns.has('total_itens') && (
                      <td className="p-3">
                        {quantidadeItens * (mapping?.quantidade || 1)}
                      </td>
                    )}
                    {visibleColumns.has('status_baixa') && (
                      <td className="p-3">
                        <Badge 
                          variant={mapping?.statusBaixa === 'sucesso' ? 'default' : 
                                  mapping?.statusBaixa === 'erro' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {mapping?.statusBaixa || 'pendente'}
                        </Badge>
                      </td>
                    )}

                    {/* Status do mapeamento */}
                    {visibleColumns.has('mapeamento') && (
                      <td className="p-3">
                        {mapping ? (
                          <div className="space-y-1">
                            {mapping.skuEstoque && (
                              <div className="text-xs">
                                <span className="font-medium">Estoque:</span> {mapping.skuEstoque}
                              </div>
                            )}
                            {mapping.skuKit && (
                              <div className="text-xs">
                                <span className="font-medium">Kit:</span> {mapping.skuKit}
                              </div>
                            )}
                            {mapping.quantidade && (
                              <div className="text-xs">
                                <span className="font-medium">Qtd:</span> {mapping.quantidade}
                              </div>
                            )}
                            <Badge 
                              variant={mapping.statusBaixa === 'sucesso' ? 'default' : 
                                      mapping.statusBaixa === 'erro' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {mapping.statusBaixa || 'pendente'}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sem mapeamento
                          </Badge>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
});

PedidosTableSection.displayName = 'PedidosTableSection';