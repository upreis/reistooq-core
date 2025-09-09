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
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
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
  className
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

      {/* Indicadores */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Fonte: {state.fonte} | Total: {total} pedidos</span>
          {state.isRefreshing && <span className="ml-2 animate-pulse">• Atualizando...</span>}
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('[DEBUG] === ATUALIZAÇÃO (sem limpar sessão) ===');
              console.log('[DEBUG] Total de pedidos:', orders.length);
              if (orders.length > 0) {
                console.log('[DEBUG] Sample order data:', {
                  id: orders[0].id,
                  shipping_mode: orders[0].shipping_mode,
                  forma_entrega: orders[0].forma_entrega,
                  is_fulfillment: orders[0].is_fulfillment,
                  status_detail: orders[0].status_detail,
                  shipping_destination_receiver_name: orders[0]?.shipping?.destination?.receiver_name,
                  available_fields: Object.keys(orders[0])
                });
              }
              // Apenas refaz a busca sem limpar storage para evitar logout
              actions.refetch();
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

                // Extrair SKUs e quantidade total
                const skus = (order.order_items?.map((item: any) => item.sku || item.item?.sku || item.item?.seller_sku).filter(Boolean)) || [];
                const quantidadeItens = order.order_items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 1;

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
                       return <span className="font-mono text-sm">{order.numero || order.order_number || order.id?.toString() || order.pack_id || '-'}</span>;
                    case 'empresa':
                      return <span>{order.empresa || order.integration_account_id || order.account_name || order.seller?.nickname || order.seller?.name || '-'}</span>;
                    case 'nome_cliente':
                      return <div className="max-w-xs truncate" title={order.nome_cliente || order.unified?.nome_cliente || order.buyer?.nickname}>
                        {order.nome_cliente || order.unified?.nome_cliente || order.buyer?.nickname || '-'}
                      </div>;
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
                      return <span>{order.last_updated ? formatDate(order.last_updated) : '-'}</span>;
                    case 'skus_produtos':
                      return <div className="max-w-xs truncate" title={skus.join(', ')}>{skus.length ? skus.join(', ') : '-'}</div>;
                    case 'quantidade_itens':
                      return <span>{quantidadeItens}</span>;
                    case 'titulo_anuncio':
                      return <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title || order.titulo_anuncio}>{order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-'}</div>;
                     case 'valor_total':
                       return <span>{formatMoney(order.valor_total || order.unified?.valor_total || order.total_amount || 0)}</span>;
                    case 'paid_amount':
                      return <span>{formatMoney(order.paid_amount || 0)}</span>;
                    case 'frete_pago_cliente':
                      return <span>{formatMoney(order.frete_pago_cliente || order.payments?.[0]?.shipping_cost || order.shipping?.costs?.receiver?.cost || order.valor_frete || 0)}</span>;
                    case 'receita_flex':
                      return <span>{formatMoney(order.receita_flex || getReceitaPorEnvio(order))}</span>;
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
                      return <span>{formatMoney((order as any).valor_liquido_vendedor || 0)}</span>;
                     case 'payment_method':
                       return <span className="text-xs">{translatePaymentMethod(order.payments?.[0]?.payment_method_id || order.payment_method || order.raw?.payments?.[0]?.payment_method_id || '-')}</span>;
                     case 'payment_status':
                       return <span className="text-xs">{translatePaymentStatus(order.payment_status || order.payments?.[0]?.status || '-')}</span>;
                     case 'payment_type':
                       return <span className="text-xs">{translatePaymentType(order.payment_type || order.payments?.[0]?.payment_type || '-')}</span>;
                    case 'shipping_status':
                      return <span className="text-xs">{translateShippingStatus(order.shipping_status || order.shipping?.status) || '-'}</span>;
                     case 'logistic_mode':
                       return <span className="text-xs">{formatText(order.logistic_mode || order.unified?.logistic?.mode || order.shipping?.logistic?.mode || order.raw?.shipping?.logistic?.mode || '-')}</span>;
                     case 'logistic_type':
                       return <span className="text-xs">{translateLogisticType(order.logistic_type || order.shipping_details?.logistic_type || order.shipping?.logistic?.type || order.raw?.shipping?.logistic?.type || order.unified?.logistic?.type || '-')}</span>;
                     case 'shipping_method_type':
                       return <span className="text-xs">{translateShippingMethodType(order.shipping_method_type || order.shipping?.shipping_method?.type || order.raw?.shipping?.shipping_method?.type || '-')}</span>;
                     case 'delivery_type':
                       return <span className="text-xs">{translateDeliveryType(order.delivery_type || order.shipping?.delivery_type || order.raw?.shipping?.delivery_type || '-')}</span>;
                     case 'substatus_detail':
                       return <span className="text-xs">{translateShippingSubstatus(order.substatus_detail || order.shipping?.substatus || order.raw?.shipping?.substatus || order.shipping?.status_detail || order.status_detail) || '-'}</span>;
                     case 'shipping_mode':
                       return <span className="text-xs">{translateShippingMode(order.shipping_mode || order.forma_entrega || order.shipping?.mode || order.raw?.shipping?.mode) || '-'}</span>;
                     case 'shipping_method':
                       return <span className="text-xs">{translateShippingMethod(order.shipping_method || order.shipping?.shipping_method?.name || order.raw?.shipping?.shipping_method?.name || order.shipping?.method?.name) || '-'}</span>;
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
                      return <span>{
                        order.endereco_rua ||
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
                        '-'
                      }</span>;
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
                      return <span>{
                        order.endereco_bairro ||
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
                        '-'
                      }</span>;
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
                      return <span>{mapping?.skuEstoque || '-'}</span>;
                    case 'sku_kit':
                      return <span>{mapping?.skuKit || '-'}</span>;
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
                    case 'date_created':
                      return <span>{order.date_created ? formatDate(order.date_created) : '-'}</span>;
                    case 'pack_id':
                      return <span className="font-mono text-xs">{order.pack_id || '-'}</span>;
                    case 'pickup_id':
                      return <span className="font-mono text-xs">{order.pickup_id || order.shipping?.pickup_id || order.raw?.shipping?.pickup_id || '-'}</span>;
                    case 'manufacturing_ending_date':
                      return <span>{order.manufacturing_ending_date ? formatDate(order.manufacturing_ending_date) : order.raw?.manufacturing_ending_date ? formatDate(order.raw.manufacturing_ending_date) : '-'}</span>;
                    case 'comment':
                      return <div className="max-w-xs truncate" title={order.comment || order.raw?.comment}>{order.comment || order.raw?.comment || '-'}</div>;
                     case 'tags':
                       return <div className="max-w-xs truncate" title={translateMLTags(order.tags || [])}>{translateMLTags(order.tags || [])}</div>;
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
                      <span className="text-xs font-mono">{idUnico}</span>
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

        {/* Paginação - Debug info */}
        <div className="border-t p-4 bg-muted/5">
          <div className="text-xs text-muted-foreground mb-2 bg-yellow-100 p-2 rounded">
            DEBUG: currentPage={currentPage}, totalPages={totalPages}, total={total}, hasPrev={state?.hasPrevPage ? 'yes' : 'no'}, hasNext={state?.hasNextPage ? 'yes' : 'no'}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage}{totalPages > 1 ? ` de ${totalPages}` : ''} • Total: {total} pedidos
            </div>

            <div className="flex items-center space-x-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                              onClick={() => onPageChange(1)}
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
                      onClick={() => onPageChange(currentPage + 1)}
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