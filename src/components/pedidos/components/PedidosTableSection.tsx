/**
 * 🎯 SEÇÃO DA TABELA DE PEDIDOS - Componente Extraído
 * Mantém todas as funcionalidades críticas de seleção, mapeamentos e baixa de estoque
 */

import { memo, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, CheckCircle, AlertTriangle, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { mapApiStatusToLabel } from '@/utils/statusMapping';
import { getStatusBadgeVariant } from '@/utils/mlStatusMapping';
import { StatusBadge } from '@/components/pedidos/StatusBadge';
import { 
  translatePaymentStatus, 
  translatePaymentMethod, 
  translatePaymentType,
  translateShippingStatus,
  translateShippingSubstatus,
  translateShippingMode,
  translateShippingMethod,
  translateShippingMethodType,
  translateLogisticType,
  translateDeliveryType,
  translateMLTags,
  formatText 
} from '@/lib/translations';
import { cn } from '@/lib/utils';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';

// ✅ Helper function para extrair Receita Flex conforme PDF
// Receita Flex (Bônus) = Quando net_cost é NEGATIVO (vendedor RECEBE do ML)
function getReceitaPorEnvio(order: any): number {
  // Se já temos receitaFlex salva, usar ela
  if (order?.unified?.receitaFlex !== undefined && order?.unified?.receitaFlex !== null) {
    return order.unified.receitaFlex;
  }

  const logisticType = String(
    order?.shipping?.logistic_type || 
    order?.unified?.shipping?.logistic?.type ||
    order?.logistic_type || 
    order?.unified?.logistic_type ||
    ''
  ).toLowerCase();
  
  // Verificar se é Flex ou Self Service
  if (logisticType !== 'self_service' && logisticType !== 'flex') {
    return 0;
  }
  
  // Buscar seller_cost_benefit
  const costBenefit = order?.shipping?.seller_cost_benefit ||
                     order?.unified?.shipping?.seller_cost_benefit;
  
  if (!costBenefit) {
    return 0;
  }

  const netCost = costBenefit.net_cost || 0;
  
  // ✅ RECEITA FLEX = quando net_cost é NEGATIVO (vendedor RECEBE)
  // Fórmula do ML: net_cost = shipping_cost - discount
  // Se net_cost < 0, significa que o discount foi MAIOR que o shipping_cost
  // Exemplo: shipping_cost: 15.50, discount: 20.00 → net_cost: -4.50 (você RECEBE R$ 4,50)
  if (netCost < 0) {
    return Math.abs(netCost); // Retorna valor POSITIVO que você recebe
  }
  
  return 0;
}
import { buildIdUnico } from '@/utils/idUnico';

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
  visibleDefinitions?: Array<{ key: string; label: string }>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPedidoProcessado: (order: any) => boolean;
  className?: string;
  renderStatusBaixa?: (pedidoId: string) => React.ReactNode;
  renderStatusInsumos?: (pedidoId: string) => React.ReactNode;
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
  visibleDefinitions,
  currentPage,
  totalPages,
  onPageChange,
  isPedidoProcessado,
  className,
  renderStatusBaixa,
  renderStatusInsumos
}) => {
  // Debug dos dados quando orders mudam
  useEffect(() => {
    if (orders.length > 0) {
      const sampleOrder = orders[0];
      console.log('[DEBUG] Orders updated:', {
        total: orders.length,
        sampleOrder: {
          numero: sampleOrder?.numero,
          id: sampleOrder?.id,
          nome_cliente: sampleOrder?.nome_cliente || sampleOrder?.unified?.nome_cliente,
          cidade: sampleOrder?.cidade || sampleOrder?.unified?.cidade,
          uf: sampleOrder?.uf || sampleOrder?.unified?.uf,
          valor_total: sampleOrder?.valor_total || sampleOrder?.unified?.valor_total,
          has_unified: !!sampleOrder?.unified,
          has_raw: !!sampleOrder?.raw,
          structure: {
            isUnified: typeof sampleOrder?.unified === 'object',
            hasRaw: typeof sampleOrder?.raw === 'object',
            directFields: Object.keys(sampleOrder || {}).slice(0, 10)
          }
        }
      });
    }
  }, [orders]);

  // PedidosTableSection rendering

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
    const total = order.valor_total || order.unified?.valor_total || order.total_amount || 0;
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

        {(filters.situacao || filters.dataInicio || filters.dataFim) && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          </div>
        )}

      {/* Tabela Principal */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 h-12 text-sm text-muted-foreground font-medium text-left">
                  <Checkbox
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {/* Coluna fixa: ID-Único sempre primeiro */}
                <th className="px-4 h-12 text-sm text-muted-foreground font-medium text-left">ID-Único</th>
                {/* Demais cabeçalhos conforme ordem/seleção */}
                {visibleDefinitions?.filter((d) => d.key !== 'id').map((def) => (
                  <th key={def.key} className={cn(
                    "px-4 h-12 text-sm text-muted-foreground font-medium text-left",
                    // Colunas SKU com largura ajustada ao conteúdo
                    (def.key === 'sku_estoque' || def.key === 'sku_kit') && "w-auto whitespace-nowrap"
                  )}>{def.label}</th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {orders.map((order, index) => {
                const isSelected = selectedOrders.has(order.id);
                const isProcessed = isPedidoProcessado(order);
                const mapping = mappingData.get(order.id);

                // Extrair SKUs e quantidade total priorizando API structure
                const orderItems = order.order_items || order.unified?.order_items || order.raw?.order_items || [];
                const skus = orderItems.map((item: any) => 
                  item.sku || 
                  item.item?.sku || 
                  item.item?.seller_sku || 
                  item.seller_sku ||
                  item.item?.id?.toString()
                ).filter(Boolean);
                const quantidadeItens = orderItems.reduce((acc: number, item: any) => 
                  acc + (item.quantity || item.quantidade || 1), 0) || 1;

                const renderCell = (key: string) => {
                  switch (key) {
                    case 'situacao':
                      return (
                        <>
                          <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                            {mapApiStatusToLabel(order.situacao || order.status)}
                          </Badge>
                          {isProcessed && (<CheckCircle className="h-4 w-4 text-green-600 mt-1" />)}
                        </>
                      );
                     case 'numero':
                       return <span className="font-mono text-sm">{order.numero || order.order_number || order.id?.toString() || '-'}</span>;
                    case 'empresa':
                      return <span>{order.empresa || order.integration_account_id || order.account_name || order.seller?.nickname || order.seller?.name || '-'}</span>;
                    case 'nome_completo': {
                      const fullName = (
                        order.nome_completo ||
                        order.shipping?.destination?.receiver_name ||
                        order.unified?.buyer_name ||
                        order.unified?.receiver_name ||
                        order.shipping?.receiver_address?.receiver_name ||
                        order.shipping?.receiver_address?.name ||
                        order.receiver_name ||
                        order.raw?.shipping?.destination?.receiver_name ||
                        order.buyer?.name ||
                        ((order.buyer?.first_name || order.buyer?.last_name)
                          ? `${order.buyer?.first_name ?? ''} ${order.buyer?.last_name ?? ''}`.trim()
                          : undefined) ||
                        order.buyer?.nickname
                      );
                      return (
                        <div className="max-w-xs truncate" title={fullName || ''}>
                          {fullName || '-'}
                        </div>
                      );
                    }
                    case 'cpf_cnpj': {
                      // Buscar CPF/CNPJ de múltiplas fontes e normalizar
                      const rawDoc = order.cpf_cnpj || 
                                   order.unified?.cpf_cnpj || 
                                   order.documento_cliente ||
                                   order.cliente_documento ||
                                   order.buyer?.identification?.number ||
                                   order.raw?.buyer?.identification?.number ||
                                   order.payments?.[0]?.payer?.identification?.number ||
                                   order.unified?.payments?.[0]?.payer?.identification?.number ||
                                   order.raw?.payments?.[0]?.payer?.identification?.number;
                      
                      // Normalizar e limpar antes de mascarar
                      const cleanDoc = rawDoc ? rawDoc.toString().trim() : '';
                      
                      let finalDoc = cleanDoc;
                      
                      // Fallback: varrer o objeto em busca de um CPF/CNPJ (11 ou 14 dígitos)
                      if (!finalDoc) {
                        const seen = new Set<any>();
                        const queue: any[] = [order];
                        const keyPriority = /(cpf|cnpj|doc|document|identif|tax)/i;
                        let found: string | null = null;
                        
                        const pushChildren = (obj: any) => {
                          try {
                            const entries = Object.entries(obj || {});
                            // Priorizar chaves relacionadas a documento
                            const prioritized = entries.filter(([k]) => keyPriority.test(k));
                            const others = entries.filter(([k]) => !keyPriority.test(k));
                            return [...prioritized, ...others];
                          } catch {
                            return [] as any[];
                          }
                        };
                        
                        let steps = 0;
                        while (queue.length && steps < 800 && !found) {
                          const node = queue.shift();
                          steps++;
                          if (!node || seen.has(node)) continue;
                          seen.add(node);
                          
                          if (typeof node === 'string' || typeof node === 'number') {
                            const digits = String(node).replace(/\D/g, '');
                            if (digits.length === 11 || digits.length === 14) { found = digits; break; }
                          } else if (Array.isArray(node)) {
                            for (const child of node) queue.push(child);
                          } else if (typeof node === 'object') {
                            for (const [k, v] of pushChildren(node)) {
                              // Se a chave sugere documento e valor é string/number, tentar direto
                              if (keyPriority.test(k) && (typeof v === 'string' || typeof v === 'number')) {
                                const digits = String(v).replace(/\D/g, '');
                                if (digits.length === 11 || digits.length === 14) { found = digits; break; }
                              }
                              queue.push(v);
                            }
                          }
                        }
                        if (found) finalDoc = found;
                      }
                      
                      return <span className="font-mono text-sm">{finalDoc ? maskCpfCnpj(finalDoc) : '-'}</span>;
                    }
                     case 'data_pedido':
                       return <span>{formatDate(order.data_pedido || order.unified?.data_pedido || order.date_created)}</span>;
                    case 'last_updated':
                      return <span>{formatDate(order.last_updated || order.updated_at || order.date_last_updated || order.unified?.updated_at) || '-'}</span>;
                     case 'skus_produtos':
                       return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{skus.length ? skus.join(', ') : '-'}</div>;
                     case 'quantidade_itens':
                       return <span>{quantidadeItens}</span>;
                     case 'titulo_anuncio':
                       const titulo = order.titulo_anuncio || 
                                    order.order_items?.[0]?.item?.title || 
                                    order.unified?.titulo_anuncio ||
                                    order.raw?.order_items?.[0]?.item?.title ||
                                    order.unified?.order_items?.[0]?.item?.title;
                       return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '300px' }}>{titulo || '-'}</div>;
                     case 'valor_total':
                       return <span>{formatMoney(order.valor_total || order.unified?.valor_total || order.total_amount || 0)}</span>;
                    case 'paid_amount':
                      return <span>{formatMoney(order.paid_amount || order.unified?.paid_amount || order.payments?.[0]?.transaction_amount || order.total_paid_amount || order.valor_total || 0)}</span>;
                     case 'frete_pago_cliente':
                       const fretePagoCliente = order.frete_pago_cliente || 
                                              order.unified?.frete_pago_cliente ||
                                              order.payments?.[0]?.shipping_cost || 
                                              order.shipping?.costs?.receiver?.cost || 
                                              order.valor_frete || 0;
                       return <span>{formatMoney(fretePagoCliente)}</span>;
                     case 'receita_flex':
                       const receitaFlex = order.receita_flex || 
                                         order.unified?.receita_flex ||
                                         getReceitaPorEnvio(order);
                       return <span>{formatMoney(receitaFlex)}</span>;
                    case 'custo_envio_seller':
                      return <span>{formatMoney(order.custo_envio_seller || order.shipping?.costs?.senders?.[0]?.cost || 0)}</span>;
                    case 'coupon_amount':
                      return <span>{formatMoney(order.coupon_amount || order.coupon?.amount || 0)}</span>;
                    case 'marketplace_fee':
                      {
                        const fee = order.order_items?.[0]?.sale_fee || order.raw?.order_items?.[0]?.sale_fee || order.marketplace_fee || order.fees?.[0]?.value || order.raw?.fees?.[0]?.value || 0;
                        return <span>{fee > 0 ? formatMoney(fee) : '-'}</span>;
                      }
                    case 'valor_liquido_vendedor':
                      {
                        // Calcular valor líquido: Valor total - (Frete Pago Cliente + custo envio seller) + Receita Flex (Bônus) - Taxa Marketplace
                        const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || 0;
                        const fretePagoCliente = order.frete_pago_cliente || 
                                               order.unified?.frete_pago_cliente ||
                                               order.shipping?.shipping_items?.[0]?.list_cost || 
                                               order.payments?.[0]?.shipping_cost ||
                                               0;
                        const custoEnvioSeller = order.custo_envio_seller || 
                                               order.unified?.custo_envio_seller ||
                                               order.shipping?.costs?.senders?.[0]?.cost || 
                                               0;
                        const receitaFlex = order.receita_flex || 
                                          order.unified?.receita_flex ||
                                          order.shipping_cost_components?.shipping_method_cost || 
                                          getReceitaPorEnvio(order) ||
                                          0;
                        const taxaMarketplace = order.order_items?.[0]?.sale_fee || 
                                              order.marketplace_fee || 
                                              order.fees?.[0]?.value || 
                                              order.raw?.order_items?.[0]?.sale_fee ||
                                              order.raw?.fees?.[0]?.value ||
                                              0;
                        const valorLiquido = valorTotal - (fretePagoCliente + custoEnvioSeller) + receitaFlex - taxaMarketplace;
                        
                        // 🔍 DEBUG: Log detalhado com valores individuais
                        console.log(`💰 [VALOR LÍQUIDO] Pedido ${order.id || order.numero}`);
                        console.log(`  Valor Total: R$ ${valorTotal.toFixed(2)}`);
                        console.log(`  - Frete Pago Cliente: R$ ${fretePagoCliente.toFixed(2)}`);
                        console.log(`  - Custo Envio Seller: R$ ${custoEnvioSeller.toFixed(2)}`);
                        console.log(`  + Receita Flex: R$ ${receitaFlex.toFixed(2)}`);
                        console.log(`  - Taxa Marketplace: R$ ${taxaMarketplace.toFixed(2)}`);
                        console.log(`  = VALOR LÍQUIDO: R$ ${valorLiquido.toFixed(2)}`);
                        console.log(`  Armazenado: R$ ${(order.valor_liquido_vendedor || 0).toFixed(2)}`);
                        
                        return <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">{formatMoney(valorLiquido)}</span>;
                      }
                     case 'payment_method':
                       return <span className="text-xs">{translatePaymentMethod(order.payments?.[0]?.payment_method_id || order.payment_method || order.raw?.payments?.[0]?.payment_method_id || order.metodo_pagamento || '-')}</span>;
                     case 'payment_status':
                       return <span className="text-xs">{translatePaymentStatus(order.payment_status || order.payments?.[0]?.status || order.raw?.payments?.[0]?.status || order.status_pagamento || '-')}</span>;
                     case 'payment_type':
                       return <span className="text-xs">{translatePaymentType(order.payment_type || order.payments?.[0]?.payment_type || order.raw?.payments?.[0]?.payment_type_id || order.tipo_pagamento || '-')}</span>;
                     case 'order_status':
                       return (
                         <StatusBadge 
                           status={order.order_status || order.status || order.raw?.status || 'unknown'} 
                           substatus={order.order_status_detail || order.status_detail || order.raw?.status_detail}
                           type="order"
                         />
                       );
                     case 'order_status_detail':
                       return <span className="text-xs">{order.order_status_detail || order.status_detail || order.raw?.status_detail || '-'}</span>;
                     case 'shipping_status':
                       return (
                         <StatusBadge 
                           status={order.shipping_status || order.shipping?.status || order.raw?.shipping?.status || order.raw?.shipping_details?.status || 'unknown'} 
                           substatus={order.shipping_substatus || order.shipping?.substatus || order.raw?.shipping?.substatus || order.raw?.shipping_details?.substatus}
                           type="shipping"
                         />
                       );
                      case 'shipping_substatus':
                        const rawSubstatus = order.shipping_substatus || order.shipping?.substatus || order.raw?.shipping?.substatus || order.raw?.shipping_details?.substatus;
                        return (
                          <Badge variant={getStatusBadgeVariant('', rawSubstatus)}>
                            {translateShippingSubstatus(rawSubstatus)}
                          </Badge>
                        );
                     case 'logistic_mode':
                       return <span className="text-xs">{formatText(order.logistic_mode || order.logistic_mode_principal || order.shipping?.logistic?.mode || order.raw?.shipping?.logistic?.mode || order.unified?.logistic?.mode || '-')}</span>;
                     case 'logistic_type':
                       return <span className="text-xs">{translateLogisticType(order.logistic_type || order.tipo_logistico || order.shipping?.logistic?.type || order.raw?.shipping?.logistic?.type || order.unified?.logistic?.type || '-')}</span>;
                     case 'shipping_method_type':
                        return <span className="text-xs">{translateShippingMethodType(
                          order.shipping_method_type ||
                          order.tipo_metodo_envio ||
                          order.shipping?.shipping_method?.type ||
                          order.unified?.shipping?.shipping_method?.type ||
                          order.shipping_details?.shipping_method?.type ||
                          order.raw?.shipping?.shipping_method?.type ||
                          // Fallback para quando a API não traz 'type': usar o 'name'
                          order.metodo_envio_combinado ||
                          order.unified?.shipping?.shipping_method?.name ||
                          order.shipping?.shipping_method?.name ||
                          order.raw?.shipping?.shipping_method?.name ||
                          '-'
                        )}</span>;
                      case 'delivery_type':
                        return <span className="text-xs">{translateDeliveryType(
                          order.delivery_type ||
                          order.tipo_entrega ||
                          order.shipping?.delivery_type ||
                          order.unified?.shipping?.delivery_type ||
                          order.shipping_details?.delivery_type ||
                          order.raw?.shipping?.delivery_type ||
                          '-'
                        )}</span>;
                     case 'substatus_detail':
                       return <span className="text-xs">{translateShippingSubstatus(order.substatus_detail || order.substatus || order.shipping?.substatus || order.raw?.shipping?.substatus || order.shipping?.status_detail || order.status_detail || '-')}</span>;
                     case 'shipping_mode':
                       const shippingModeText = translateShippingMode(order.shipping_mode || order.modo_envio_combinado || order.shipping?.mode || order.raw?.shipping?.mode || '-');
                       return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{shippingModeText}</div>;
                     case 'shipping_method':
                       return <span className="text-xs">{translateShippingMethod(order.shipping_method || order.metodo_envio_combinado || order.shipping?.shipping_method?.name || order.raw?.shipping?.shipping_method?.name || order.shipping?.method?.name || '-')}</span>;
                     case 'cidade':
                     case 'endereco_cidade':
                       return <span>{
                         order.cidade || 
                         order.unified?.cidade ||
                         order.endereco_cidade || 
                         order.shipping?.destination?.shipping_address?.city?.name ||
                         order.shipping?.destination?.shipping_address?.city ||
                         order.shipping?.receiver_address?.city?.name || 
                         order.shipping?.receiver_address?.city || 
                         order.unified?.shipping?.receiver_address?.city?.name ||
                         order.unified?.shipping?.receiver_address?.city ||
                         order.raw?.shipping?.receiver_address?.city?.name ||
                         order.raw?.shipping?.receiver_address?.city ||
                         order.raw?.shipping?.destination?.receiver_address?.city?.name ||
                         order.raw?.shipping?.destination?.receiver_address?.city ||
                         '-'
                       }</span>;
                     case 'uf':
                     case 'endereco_uf':
                       return <span>{
                         order.uf || 
                         order.unified?.uf ||
                         order.endereco_uf || 
                         order.shipping?.destination?.shipping_address?.state?.name ||
                         order.shipping?.destination?.shipping_address?.state?.id ||
                         order.shipping?.destination?.shipping_address?.state ||
                         order.shipping?.receiver_address?.state?.id || 
                         order.shipping?.receiver_address?.state?.name || 
                         order.shipping?.receiver_address?.state || 
                         order.unified?.shipping?.receiver_address?.state?.id ||
                         order.unified?.shipping?.receiver_address?.state?.name ||
                         order.unified?.shipping?.receiver_address?.state ||
                         order.raw?.shipping?.receiver_address?.state?.id ||
                         order.raw?.shipping?.receiver_address?.state?.name ||
                         order.raw?.shipping?.receiver_address?.state ||
                         order.raw?.shipping?.destination?.receiver_address?.state?.id ||
                         order.raw?.shipping?.destination?.receiver_address?.state?.name ||
                         order.raw?.shipping?.destination?.receiver_address?.state ||
                         '-'
                       }</span>;
                    case 'endereco_rua':
                      const ruaText = order.endereco_rua ||
                        order.rua ||
                        order.shipping?.destination?.shipping_address?.street_name ||
                        order.shipping?.destination?.shipping_address?.address_line ||
                        order.shipping?.receiver_address?.street_name ||
                        order.shipping?.receiver_address?.address_line ||
                        order.unified?.shipping?.receiver_address?.street_name ||
                        order.unified?.shipping?.receiver_address?.address_line ||
                        order.raw?.shipping?.receiver_address?.street_name ||
                        order.raw?.shipping?.receiver_address?.address_line ||
                        order.raw?.shipping?.destination?.receiver_address?.street_name ||
                        order.raw?.shipping?.destination?.receiver_address?.address_line ||
                        '-';
                      return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{ruaText}</div>;
                    case 'endereco_numero':
                      return <span>{
                        order.endereco_numero ||
                        order.numero ||
                        order.shipping?.destination?.shipping_address?.street_number ||
                        order.shipping?.receiver_address?.street_number ||
                        order.unified?.shipping?.receiver_address?.street_number ||
                        order.raw?.shipping?.receiver_address?.street_number ||
                        order.raw?.shipping?.destination?.receiver_address?.street_number ||
                        '-'
                      }</span>;
                    case 'endereco_bairro':
                      const bairroText = order.endereco_bairro ||
                        order.bairro ||
                        order.shipping?.destination?.shipping_address?.neighborhood?.name ||
                        order.shipping?.destination?.shipping_address?.neighborhood ||
                        order.shipping?.receiver_address?.neighborhood?.name ||
                        order.shipping?.receiver_address?.neighborhood ||
                        order.unified?.shipping?.receiver_address?.neighborhood?.name ||
                        order.unified?.shipping?.receiver_address?.neighborhood ||
                        order.raw?.shipping?.receiver_address?.neighborhood?.name ||
                        order.raw?.shipping?.receiver_address?.neighborhood ||
                        order.raw?.shipping?.destination?.receiver_address?.neighborhood?.name ||
                        order.raw?.shipping?.destination?.receiver_address?.neighborhood ||
                        '-';
                      return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{bairroText}</div>;
                    case 'endereco_cep':
                      return <span>{
                        order.endereco_cep ||
                        order.cep ||
                        order.shipping?.destination?.shipping_address?.zip_code ||
                        order.shipping?.destination?.shipping_address?.zip ||
                        order.shipping?.receiver_address?.zip_code ||
                        order.shipping?.receiver_address?.zip ||
                        order.unified?.shipping?.receiver_address?.zip_code ||
                        order.unified?.shipping?.receiver_address?.zip ||
                        order.raw?.shipping?.receiver_address?.zip_code ||
                        order.raw?.shipping?.receiver_address?.zip ||
                        order.raw?.shipping?.destination?.receiver_address?.zip_code ||
                        order.raw?.shipping?.destination?.receiver_address?.zip ||
                        '-'
                      }</span>;
                     case 'mapeamento':
                       return (
                         mapping ? (
                           <div className="space-y-1">
                             {mapping.skuEstoque && (
                               <div className="text-xs"><span className="font-medium">Estoque:</span> {mapping.skuEstoque}</div>
                             )}
                             {mapping.skuKit && (
                               <div className="text-xs"><span className="font-medium">Kit:</span> {mapping.skuKit}</div>
                             )}
                             {(typeof mapping.quantidadeKit !== 'undefined' || typeof mapping.quantidade !== 'undefined') && (
                               <div className="text-xs"><span className="font-medium">Qtd:</span> {typeof mapping.quantidadeKit !== 'undefined' ? mapping.quantidadeKit : mapping.quantidade}</div>
                             )}
                              {(() => {
                                  // 🔍 PRIMEIRO: Verificar se já foi baixado (histórico)
                                  const baixado = isPedidoProcessado(order);
                                   if (baixado) {
                                     return (
                                       <Badge variant="default" className="text-xs text-center">
                                         Baixado
                                       </Badge>
                                     );
                                   }
                                   
                                   // 🗂️ SEGUNDO: Verificar mapeamento completo (de-para)
                                   const temMapeamentoCompleto = mapping && (mapping.skuEstoque || mapping.skuKit);
                                   const temMapeamentoIncompleto = mapping && mapping.temMapeamento && !temMapeamentoCompleto;
                                   
                                   let variant: "success" | "destructive" | "warning" | "outline" = "outline";
                                   let texto = "Indefinido";

                                   if (temMapeamentoCompleto) {
                                     variant = "success";
                                     texto = "Pronto p/ Baixar";
                                    } else if (temMapeamentoIncompleto) {
                                      variant = "warning";
                                      texto = "Mapear Incompleto";
                                    } else {
                                      variant = "warning";
                                      texto = "Sem Mapear";
                                    }

                                    return (
                                      <Badge 
                                        variant={variant} 
                                        className={`text-xs text-center ${
                                          (texto === "Mapear Incompleto" || texto === "Sem Mapear") 
                                            ? "cursor-pointer hover:opacity-80 transition-opacity hover:shadow-md border-2 border-dashed border-amber-400" 
                                            : ""
                                        }`}
                                        title={
                                          (texto === "Mapear Incompleto" || texto === "Sem Mapear")
                                            ? "Clique para criar mapeamento"
                                            : undefined
                                        }
                                        onClick={() => {
                                          if (texto === "Mapear Incompleto" || texto === "Sem Mapear") {
                                            console.log('🔗 Abrindo modal de mapeamento para pedido:', {
                                              order,
                                              order_items: order.order_items,
                                              skus_produtos: order.skus_produtos,
                                              titulo_anuncio: order.titulo_anuncio
                                            });
                                            
                                            // Disparar evento para abrir modal de mapeamento
                                            window.dispatchEvent(new CustomEvent('openMapeamentoModal', {
                                              detail: { pedido: order }
                                            }));
                                          }
                                        }}
                                      >
                                        {texto}
                                      </Badge>
                                    );
                                })()}
                           </div>
                         ) : (
                           <Badge variant="warning" className="text-xs">Sem Mapear</Badge>
                         )
                       );
                    case 'sku_estoque':
                      return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{mapping?.skuEstoque || '-'}</div>;
                    case 'sku_kit':
                      return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{mapping?.skuKit || '-'}</div>;
                     case 'qtd_kit':
                       {
                         const qtd = (typeof mapping?.quantidadeKit !== 'undefined' ? mapping?.quantidadeKit : (typeof mapping?.quantidade !== 'undefined' ? mapping?.quantidade : (order.qtd_kit ?? order.quantidade_kit)));
                         return <span>{typeof qtd === 'number' ? qtd : "Sem Mapear"}</span>;
                       }
                      case 'total_itens':
                       {
                         const qtdCalc = Number(mapping?.quantidadeKit ?? mapping?.quantidade ?? order.qtd_kit ?? order.quantidade_kit ?? 1);
                         return <span>{quantidadeItens * (Number.isFinite(qtdCalc) ? qtdCalc : 1)}</span>;
                       }
                      case 'status_baixa':
                        return (() => {
                          // 🔍 PRIMEIRO: Verificar se já foi baixado (histórico)
                          const baixado = isPedidoProcessado(order);
                           if (baixado) {
                             return (
                               <Badge variant="default" className="text-xs text-center">
                                 Baixado
                               </Badge>
                             );
                           }
                           
                           // 🛡️ SEGUNDO: Usar statusBaixa do mapping (sistema centralizado)
                           const statusBaixa = mapping?.statusBaixa;
                           
                           let variant: "success" | "destructive" | "warning" | "outline" = "outline";
                           let texto = "Indefinido";
                           let isClickable = false;

                            // 🛡️ PRIORIDADE 1: SKU não cadastrado no estoque (ERRO CRÍTICO)
                            if (statusBaixa === 'sku_nao_cadastrado') {
                              variant = "destructive";
                              texto = "SKU não cadastrado no estoque";
                              isClickable = false;
                            }
                            // 🛡️ PRIORIDADE 2: Sem composição cadastrada
                            else if (statusBaixa === 'sem_composicao') {
                              variant = "warning";
                              texto = "Sem Composição";
                              isClickable = false;
                            }
                            // 🛡️ PRIORIDADE 3: Sem estoque
                            else if (statusBaixa === 'sem_estoque') {
                              variant = "destructive";
                              texto = "Sem Estoque";
                              isClickable = false;
                            }
                            // ✅ PRIORIDADE 4: Pronto para baixar (tem mapeamento e SKU existe e tem composição)
                            else if (statusBaixa === 'pronto_baixar') {
                              variant = "success";
                              texto = "Pronto p/ Baixar";
                              isClickable = false;
                            }
                            // ⚠️ PRIORIDADE 5: Sem mapear
                            else if (statusBaixa === 'sem_mapear' || !mapping || !mapping.temMapeamento) {
                              variant = "warning";
                              texto = "Sem Mapear";
                              isClickable = true;
                            }
                            // ⚠️ Fallback: Mapeamento incompleto
                            else {
                              variant = "warning";
                              texto = "Mapear Incompleto";
                              isClickable = true;
                            }

                            return (
                              <Badge 
                                variant={variant} 
                                className={`text-xs text-center ${
                                  isClickable
                                    ? "cursor-pointer hover:opacity-80 transition-opacity hover:shadow-md border-2 border-dashed border-amber-400" 
                                    : ""
                                }`}
                                title={
                                  isClickable
                                    ? "Clique para criar mapeamento"
                                    : undefined
                                }
                                onClick={() => {
                                  if (isClickable) {
                                    console.log('🔗 Abrindo modal de mapeamento para pedido (status_baixa):', {
                                      order,
                                      order_items: order.order_items,
                                      skus_produtos: order.skus_produtos,
                                      titulo_anuncio: order.titulo_anuncio
                                    });
                                    
                                    // Disparar evento para abrir modal de mapeamento
                                    window.dispatchEvent(new CustomEvent('openMapeamentoModal', {
                                      detail: { pedido: order }
                                    }));
                                  }
                                }}
                              >
                                {texto}
                              </Badge>
                             );
                        })();
                     case 'status_insumos':
                       // Renderizar status dos insumos usando callback personalizado
                       return renderStatusInsumos ? renderStatusInsumos(order.id) : <span className="text-xs text-muted-foreground">—</span>;
                     case 'date_created':
                       return <span>{formatDate(order.date_created || order.unified?.date_created || order.created_at) || '-'}</span>;
                     case 'pickup_id':
                       return <span className="font-mono text-xs">{order.pickup_id || order.shipping?.pickup_id || order.raw?.shipping?.pickup_id || order.raw?.pickup_id || order.unified?.pickup_id || '-'}</span>;
                     case 'manufacturing_ending_date':
                       return <span>{formatDate(order.manufacturing_ending_date || order.unified?.manufacturing_ending_date || order.raw?.manufacturing_ending_date) || '-'}</span>;
                     case 'comment':
                       return <div className="max-w-xs truncate" title={order.comment || order.unified?.comment || order.obs || order.raw?.comment}>{order.comment || order.unified?.comment || order.obs || order.raw?.comment || '-'}</div>;
                     case 'tags':
                       {
                         const tags = order.tags || order.unified?.tags || order.raw?.tags || [];
                         const translatedTags = translateMLTags(tags);
                         return <div className="break-words whitespace-normal text-sm leading-snug line-clamp-2" style={{ minWidth: '200px' }}>{translatedTags || '-'}</div>;
                       }
                    default:
                       return <span>{String(order[key] ?? order.unified?.[key] ?? order.raw?.[key] ?? '-')}</span>;
                  }
                };

                const idUnico = (order as any).id_unico || buildIdUnico?.(order) || order.id;

                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-b border-border hover:bg-accent/20 transition-colors",
                      isSelected && "bg-accent/30",
                      isProcessed && "opacity-75 bg-success/10"
                    )}
                  >
                    {/* Checkbox de seleção */}
                    <td className="px-4 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                        disabled={isProcessed}
                      />
                    </td>

                    {/* Coluna fixa ID-Único */}
                    <td className="px-4 text-center">
                      <div className="break-words whitespace-normal text-xs leading-tight line-clamp-2" style={{ minWidth: '250px' }}>{idUnico}</div>
                    </td>

                    {/* Demais colunas dinâmicas */}
                    {visibleDefinitions?.filter((d) => d.key !== 'id').map((def) => (
                      <td key={def.key} className={cn(
                        "px-4 text-center",
                        // Colunas SKU com largura ajustada ao conteúdo
                        (def.key === 'sku_estoque' || def.key === 'sku_kit') && "w-auto whitespace-nowrap"
                      )}>
                        <span className="text-xs">{renderCell(def.key)}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t p-4 bg-muted/5">

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage}{totalPages > 1 ? ` de ${totalPages}` : ''} • Total: {total} pedidos
            </div>

            <div className="flex items-center space-x-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        console.log('📄 [Pagination] Clicou em Anterior, indo para página:', Math.max(1, currentPage - 1));
                        onPageChange(Math.max(1, currentPage - 1));
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                    />
                  </PaginationItem>

                  {totalPages > 1 && (
                    <>
                      {/* Primeira página */}
                      {currentPage > 3 && (
                        <>
                           <PaginationItem>
                             <PaginationLink
                               onClick={() => {
                                 console.log('📄 [Pagination] Clicou na página 1');
                                 onPageChange(1);
                               }}
                               className="cursor-pointer hover:bg-accent"
                             >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <span className="px-3 py-2">...</span>
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Páginas vizinhas */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else {
                          // Centralizar páginas ao redor da página atual
                          const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                          page = start + i;
                        }

                        if (page > totalPages) return null;

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => onPageChange(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer hover:bg-accent"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {/* Última página */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <PaginationItem>
                              <span className="px-3 py-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => onPageChange(totalPages)}
                              className="cursor-pointer hover:bg-accent"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        console.log('📄 [Pagination] Clicou em Próximo, indo para página:', currentPage + 1);
                        onPageChange(currentPage + 1);
                      }}
                      className={(orders.length === 0 && !state?.hasNextPage && currentPage >= totalPages) ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            <div className="text-sm text-muted-foreground">
              {((currentPage - 1) * (state?.pageSize || 50)) + 1}-{Math.min(currentPage * (state?.pageSize || 50), total)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

PedidosTableSection.displayName = 'PedidosTableSection';