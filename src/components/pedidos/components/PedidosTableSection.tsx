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
import { 
  translateCondition 
} from '@/utils/pedidos-translations';
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
                  <th 
                    key={def.key} 
                    className={cn(
                      "px-4 h-12 text-sm text-muted-foreground font-medium text-left",
                      // Colunas SKU com largura ajustada ao conteúdo
                      (def.key === 'sku_estoque' || def.key === 'sku_kit') && "w-auto whitespace-nowrap",
                      // Colunas de envio sem quebra de linha
                      (def.key === 'logistic_type' || def.key === 'shipping_status') && "whitespace-nowrap",
                      // Tags com quebra permitida
                      def.key === 'tags' && "break-words"
                    )}
                    style={(def as any).width ? { minWidth: `${(def as any).width}px`, width: `${(def as any).width}px` } : undefined}
                  >
                    {def.label}
                  </th>
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
                      // 🆕 PRIORIDADE: Usar billing_info se disponível
                      const buyerDocType = order.buyer_document_type || order.unified?.buyer_document_type || order.raw?.buyer_document_type;
                      const buyerDocNumber = order.buyer_document_number || order.unified?.buyer_document_number || order.raw?.buyer_document_number;
                      
                      // ✅ EXTRAÇÃO com FALLBACK - Prioriza billing_info, depois campos antigos
                      const rawDoc = buyerDocNumber || 
                                   order.cpf_cnpj || 
                                   order.unified?.cpf_cnpj || 
                                   order.documento_cliente ||
                                   order.cliente_documento ||
                                   order.buyer?.identification?.number ||
                                   order.raw?.buyer?.identification?.number ||
                                   order.payments?.[0]?.payer?.identification?.number ||
                                   order.unified?.payments?.[0]?.payer?.identification?.number ||
                                   order.raw?.payments?.[0]?.payer?.identification?.number;
                      
                      const cleanDoc = rawDoc ? rawDoc.toString().trim() : '';
                      
                      // Formatar CPF/CNPJ baseado no tipo ou tamanho
                      const formatDocument = (doc: string, type?: string) => {
                        if (!doc) return '-';
                        const numOnly = doc.replace(/\D/g, '');
                        
                        // CPF: 000.000.000-00
                        if (type === 'CPF' || (!type && numOnly.length === 11)) {
                          return numOnly.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        }
                        
                        // CNPJ: 00.000.000/0000-00
                        if (type === 'CNPJ' || (!type && numOnly.length === 14)) {
                          return numOnly.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                        }
                        
                        return doc; // Retornar sem formatação se não for CPF nem CNPJ
                      };
                      
                      return (
                        <span className="font-mono text-sm" title={buyerDocType ? `Tipo: ${buyerDocType}` : undefined}>
                          {formatDocument(cleanDoc, buyerDocType)}
                        </span>
                      );
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
                       return <span>{titulo || '-'}</span>;
                      case 'valor_total':
                        {
                          const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || 0;
                          const colorClass = valorTotal > 0 ? 'font-mono text-sm font-semibold text-blue-600 dark:text-blue-400' : '';
                          return <span className={colorClass}>{formatMoney(valorTotal)}</span>;
                        }
                     case 'frete_pago_cliente':
                       const fretePagoCliente = order.frete_pago_cliente || 
                                              order.unified?.frete_pago_cliente ||
                                              order.payments?.[0]?.shipping_cost || 
                                              order.shipping?.costs?.receiver?.cost || 
                                              order.valor_frete || 0;
                       return <span>{formatMoney(fretePagoCliente)}</span>;
                        case 'receita_flex':
                           {
                              // 🔧 HELPER: Processar flex_order_cost - TEMPORARIAMENTE DESABILITADO
                              const getFlexOrderCostProcessed = (order: any): number => {
                                const flexCostOriginal = order.flex_order_cost || order.unified?.flex_order_cost || 0;
                                // ⚠️ CÁLCULO DESABILITADO: Retornando valor bruto da API
                                return flexCostOriginal;
                                
                                /* CÁLCULO ORIGINAL (DESABILITADO):
                                let flexCost = flexCostOriginal;
                                if (flexCost <= 0) return 0;
                                
                                // ✅ Se for 8.90, 13.90, 15.90 ou 15.99 → mantém valor
                                // Caso contrário → divide por 2
                                const valoresFixos = [8.90, 13.90, 15.90, 15.99];
                                if (!valoresFixos.includes(flexCost)) {
                                  flexCost = flexCost / 2;
                                }
                                return flexCost;
                                */
                              };
                             
                             // Pegar o tipo logístico da ordem
                             const logisticType = String(
                               order?.shipping?.logistic?.type || 
                               order?.unified?.shipping?.logistic?.type ||
                               order?.logistic_type || 
                               order?.unified?.logistic_type ||
                               order?.flex_logistic_type ||
                               ''
                             ).toLowerCase();
                             
                              // Se não for 'self_service' (Envios Flex), retornar 0
                              if (logisticType !== 'self_service') {
                                return <span className="">{formatMoney(0)}</span>;
                              }
                             
                              // ✅ NOVA REGRA: Usar Flex: Desconto Especial + condições
                              const flexSpecialDiscount = order.flex_special_discount || order.unified?.flex_special_discount || 0;
                              const flexNetCost = order.flex_net_cost || order.unified?.flex_net_cost || 0;
                              
                              // Valores específicos que devem ser usados diretamente
                              const valoresEspecificos = [8.90, 8.99, 13.90, 13.99, 15.90, 15.99];
                              
                              // Determinar a base do cálculo
                              const flexOrderCostBase = valoresEspecificos.includes(flexSpecialDiscount) 
                                ? flexSpecialDiscount 
                                : flexSpecialDiscount + flexNetCost;
                              
                               // Se não houver valor, retornar 0
                               if (flexOrderCostBase <= 0) {
                                 return <span className="">{formatMoney(0)}</span>;
                               }
                             
                              // ✅ NOVA LÓGICA: Verificar Valor Médio por Item PRIMEIRO
                              const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
                              const quantidadeTotal = order.quantidade_total || 1;
                              const valorMedioPorItem = valorTotal / quantidadeTotal;
                              
                               // Se Valor Médio por Item < 79.00 → usar cálculo normal (100%)
                               if (valorMedioPorItem < 79.00) {
                                 const colorClass = flexOrderCostBase > 0 ? 'font-mono text-sm font-semibold text-blue-600 dark:text-blue-400' : '';
                                 return <span className={colorClass}>{formatMoney(flexOrderCostBase)}</span>;
                               }
                             
                             // Se Valor Médio por Item >= 79.00 → verificar todas as outras condições
                            const conditionRaw = order.unified?.conditions || order.raw?.items?.[0]?.item?.condition || order.conditions || order.condition || order.unified?.condition || '';
                            const condition = String(conditionRaw).toLowerCase();
                            
                            // ✅ CORRIGIDO: Buscar reputation em TODOS os lugares possíveis
                            const reputationRaw = order.level_id || 
                                                 order.seller_reputation?.level_id || 
                                                 order.unified?.seller_reputation?.level_id ||
                                                 order.sellerReputation?.level_id ||
                                                 order.raw?.seller_reputation?.level_id ||
                                                 order.raw?.sellerReputation?.level_id ||
                                                 '';
                            const reputation = String(reputationRaw).toLowerCase();
                            
                             const medalha = order.power_seller_status || 
                                            order.unified?.power_seller_status || 
                                            order.raw?.power_seller_status ||
                                            order.raw?.seller_reputation?.power_seller_status ||
                                            order.raw?.sellerReputation?.power_seller_status ||
                                            order.seller_reputation?.power_seller_status ||
                                            order.unified?.seller_reputation?.power_seller_status ||
                                            null;
                             
                                // ✅ REGRA OFICIAL ML: Acima R$ 79 SÓ recebe bônus se tiver qualificações
                                // Se TODAS as condições forem atendidas → aplicar 10%
                                // Se NÃO tiver qualificações → R$ 0,00 (sem bônus)
                                if (condition === 'new' && reputation.includes('green')) {
                                  const bonusValue = flexOrderCostBase * 0.1;
                                  const colorClass = bonusValue > 0 ? 'font-mono text-sm font-semibold text-blue-600 dark:text-blue-400' : '';
                                  return <span className={colorClass}>{formatMoney(bonusValue)}</span>;
                                }
                                
                                // ✅ CORRIGIDO: Sem qualificações = R$ 0,00
                                return <span className="">{formatMoney(0)}</span>;
                              }
                    case 'custo_envio_seller':
                      {
                        const custoEnvio = order.custo_envio_seller || order.shipping?.costs?.senders?.[0]?.cost || 0;
                        const colorClass = custoEnvio > 0 ? 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400' : '';
                        return <span className={colorClass}>{formatMoney(custoEnvio)}</span>;
                      }
                    
                    case 'marketplace_fee':
                      {
                        const fee = order.order_items?.[0]?.sale_fee || order.raw?.order_items?.[0]?.sale_fee || order.marketplace_fee || order.fees?.[0]?.value || order.raw?.fees?.[0]?.value || 0;
                        const colorClass = fee > 0 ? 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400' : '';
                        return <span className={colorClass}>{fee > 0 ? formatMoney(fee) : '-'}</span>;
                      }
                    case 'valor_liquido_vendedor':
                      {
                        // ✅ NOVA REGRA: Baseado no Tipo Logístico + incluindo Custo Fixo Meli
                        const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
                        
                        const custoEnvioSeller = order.custo_envio_seller || 
                                               order.unified?.custo_envio_seller ||
                                               order.shipping?.costs?.senders?.[0]?.cost || 
                                               order.raw?.shipping?.costs?.senders?.[0]?.cost ||
                                               0;
                        
                        // Calcular Custo Fixo Meli (mesma lógica da coluna separada)
                        const quantidadeTotal = order.quantity || 
                                              order.quantidade || 
                                              order.unified?.quantity || 
                                              order.raw?.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 
                                              1;
                        
                        let custoFixoMeli = 0;
                        if (valorTotal < 79.00) {
                          if (valorTotal <= 12.50) {
                            custoFixoMeli = (valorTotal / 2) * quantidadeTotal;
                          } else if (valorTotal <= 29.00) {
                            custoFixoMeli = 6.25 * quantidadeTotal;
                          } else if (valorTotal <= 50.00) {
                            custoFixoMeli = 6.50 * quantidadeTotal;
                          } else {
                            custoFixoMeli = 6.75 * quantidadeTotal;
                          }
                        }
                        
                        // Receita Flex: Calcular usando a mesma lógica da coluna Receita Flex (Bônus)
                        const logisticTypeForCalc = String(
                          order?.shipping?.logistic?.type || 
                          order?.unified?.shipping?.logistic?.type ||
                          order?.logistic_type || 
                          order?.unified?.logistic_type ||
                          order?.flex_logistic_type ||
                          order?.tipo_logistico ||
                          order?.unified?.tipo_logistico ||
                          order?.raw?.shipping?.logistic_type ||
                          ''
                        ).toLowerCase();
                        
                        // Se não for 'self_service' (Envios Flex), receita flex = 0
                        let receitaFlex = 0;
                        if (logisticTypeForCalc === 'self_service') {
                          // Aplicar mesma lógica da coluna Receita Flex (Bônus)
                          const flexSpecialDiscount = order.flex_special_discount || order.unified?.flex_special_discount || 0;
                          const flexNetCost = order.flex_net_cost || order.unified?.flex_net_cost || 0;
                          const valoresEspecificos = [8.90, 8.99, 13.90, 13.99, 15.90, 15.99];
                          const flexOrderCostBase = valoresEspecificos.includes(flexSpecialDiscount) 
                            ? flexSpecialDiscount 
                            : flexSpecialDiscount + flexNetCost;
                          
                          if (flexOrderCostBase > 0) {
                            const valorMedioPorItem = valorTotal / quantidadeTotal;
                            
                            if (valorMedioPorItem < 79.00) {
                              receitaFlex = flexOrderCostBase;
                            } else {
                              const conditionRaw = order.unified?.conditions || order.raw?.items?.[0]?.item?.condition || order.conditions || order.condition || order.unified?.condition || '';
                              const condition = String(conditionRaw).toLowerCase();
                              const reputationRaw = order.level_id || order.seller_reputation?.level_id || order.unified?.seller_reputation?.level_id || order.sellerReputation?.level_id || order.raw?.seller_reputation?.level_id || order.raw?.sellerReputation?.level_id || '';
                              const reputation = String(reputationRaw).toLowerCase();
                              const cumpreCondicoes = condition === 'new' && reputation.includes('green');
                              receitaFlex = cumpreCondicoes ? flexOrderCostBase * 0.1 : 0;
                            }
                          }
                        }
                        
                        const taxaMarketplace = order.order_items?.[0]?.sale_fee || 
                                              order.marketplace_fee || 
                                              order.fees?.[0]?.value || 
                                              order.raw?.order_items?.[0]?.sale_fee ||
                                              order.raw?.fees?.[0]?.value ||
                                              0;
                        
                        // Determinar se é Flex
                        const isFlex = logisticTypeForCalc === 'self_service' || logisticTypeForCalc.includes('flex');
                        
                        // ✅ NOVA FÓRMULA COM CUSTO FIXO MELI:
                        // Se for Flex: Valor Total + Receita Flex - Taxa Marketplace - Custo Fixo Meli
                        // Se não for Flex: Valor Total + Receita Flex - Taxa Marketplace - Custo Envio Seller - Custo Fixo Meli
                        const valorLiquido = isFlex
                          ? valorTotal + receitaFlex - taxaMarketplace - custoFixoMeli
                          : valorTotal + receitaFlex - taxaMarketplace - custoEnvioSeller - custoFixoMeli;
                        
                         // ✅ Cor condicional: Verde se > 0.01, Vermelho se <= 0.01
                         const colorClass = valorLiquido > 0.01 
                           ? 'font-mono text-sm font-semibold text-green-600 dark:text-green-400' 
                           : 'font-mono text-sm font-semibold text-red-600 dark:text-red-400';
                         
                         return <span className={colorClass}>{formatMoney(valorLiquido)}</span>;
                       }
                     
                     case 'custo_fixo_meli': {
                        // Calcular Custo Fixo Meli
                        const valorTotal = order.total_amount || 
                                         order.valor_total || 
                                         order.unified?.total_amount || 
                                         order.raw?.total_amount || 
                                         0;
                        
                        const quantidadeTotal = order.quantity || 
                                              order.quantidade || 
                                              order.unified?.quantity || 
                                              order.raw?.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 
                                              1;
                        
                        let custoFixoMeli = 0;
                        
                        // Se Valor Total for abaixo de R$ 79, aplicar as faixas
                        if (valorTotal < 79.00) {
                          if (valorTotal <= 12.50) {
                            // Até R$ 12,50: metade do preço do produto por unidade
                            custoFixoMeli = (valorTotal / 2) * quantidadeTotal;
                          } else if (valorTotal <= 29.00) {
                            // Entre R$ 12,50 e R$ 29: R$ 6,25 por unidade
                            custoFixoMeli = 6.25 * quantidadeTotal;
                          } else if (valorTotal <= 50.00) {
                            // Entre R$ 29 e R$ 50: R$ 6,50 por unidade
                            custoFixoMeli = 6.50 * quantidadeTotal;
                          } else {
                            // Entre R$ 50 e R$ 79: R$ 6,75 por unidade
                            custoFixoMeli = 6.75 * quantidadeTotal;
                          }
                        }
                        const colorClass = custoFixoMeli > 0 ? 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400' : '';
                        return <span className={colorClass}>{formatMoney(custoFixoMeli)}</span>;
                      }
                     
                     case 'payment_method':
                       return <span className="text-xs">{translatePaymentMethod(order.payments?.[0]?.payment_method_id || order.payment_method || order.raw?.payments?.[0]?.payment_method_id || order.metodo_pagamento || '-')}</span>;
                     case 'payment_status':
                       return <span className="text-xs">{translatePaymentStatus(order.payment_status || order.payments?.[0]?.status || order.raw?.payments?.[0]?.status || order.status_pagamento || '-')}</span>;
                     case 'payment_type':
                       return <span className="text-xs">{translatePaymentType(order.payment_type || order.payments?.[0]?.payment_type || order.raw?.payments?.[0]?.payment_type_id || order.tipo_pagamento || '-')}</span>;
                     case 'conditions':
                       return <span className="text-xs">{translateCondition(order.unified?.conditions || order.raw?.items?.[0]?.item?.condition || order.conditions || '-')}</span>;
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
                     
                      case 'power_seller_status':
                        {
                         
                         // Buscar em todos os locais possíveis
                         const medalha = order.power_seller_status || 
                                        order.unified?.power_seller_status || 
                                        order.raw?.power_seller_status ||
                                        order.raw?.seller_reputation?.power_seller_status ||
                                        order.raw?.sellerReputation?.power_seller_status;
                         
                         if (!medalha) return <span className="text-xs text-muted-foreground">Sem Medalha</span>;
                         
                         // Mapeamento de medalhas MercadoLíder
                         const medalhaMap: Record<string, { icon: string; color: string }> = {
                           'platinum': { icon: '🏆', color: 'bg-slate-100 text-slate-800 border-slate-300' },
                           'gold': { icon: '🥇', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                           'silver': { icon: '🥈', color: 'bg-gray-100 text-gray-800 border-gray-300' }
                         };
                         
                         const medalhaInfo = medalhaMap[medalha.toLowerCase()];
                         if (!medalhaInfo) return <span className="text-xs text-muted-foreground">Sem Medalha</span>;
                         
                         return (
                           <Badge variant="outline" className={medalhaInfo.color}>
                             {medalhaInfo.icon} {medalha.charAt(0).toUpperCase() + medalha.slice(1)}
                           </Badge>
                         );
                       }
                     
                      case 'level_id':
                        {
                         
                         const levelId = order.level_id || order.unified?.level_id || order.raw?.seller_reputation?.level_id;
                         if (!levelId) return <span className="text-xs text-muted-foreground">—</span>;
                         
                         // Extrair a cor do level_id (formato: "5_green")
                         const parts = String(levelId).split('_');
                         const cor = parts.length > 1 ? parts.slice(1).join('_') : levelId;
                         
                         // Mapeamento de cores com tradução
                         const colorMap: Record<string, { label: string; bgColor: string; textColor: string }> = {
                           'green': { label: 'Verde', bgColor: '#00a650', textColor: '#fff' },
                           'light_green': { label: 'Verde Claro', bgColor: '#aad400', textColor: '#333' },
                           'yellow': { label: 'Amarelo', bgColor: '#fff159', textColor: '#333' },
                           'orange': { label: 'Laranja', bgColor: '#f7942d', textColor: '#fff' },
                           'red': { label: 'Vermelho', bgColor: '#f25346', textColor: '#fff' }
                         };
                         
                         const colorInfo = colorMap[cor] || { label: cor, bgColor: '#e0e0e0', textColor: '#666' };
                         
                         return (
                           <span 
                             className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                             style={{ 
                               backgroundColor: colorInfo.bgColor, 
                               color: colorInfo.textColor 
                             }}
                           >
                             {colorInfo.label}
                           </span>
                         );
                       }
                     
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
                        order.shipping?.destination?.shipping_address?.street_number ||
                        order.shipping?.receiver_address?.street_number ||
                        order.raw?.shipping?.destination?.receiver_address?.street_number ||
                        order.raw?.shipping?.receiver_address?.street_number ||
                        order.unified?.endereco_numero ||
                        order.endereco_numero ||
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
                     
                       case 'marketplace_origem':
                         // 🔍 Detecção de marketplace usando campo marketplace da API
                         const detectMarketplace = (order: any): string => {
                           // 1. Verificar campo marketplace (prioridade - vem da API)
                           const marketplace = (
                             order.marketplace || 
                             order.unified?.marketplace || 
                             order.raw?.marketplace || 
                             ''
                           ).toLowerCase();
                           
                           if (marketplace === 'mercadolivre') return 'Mercado Livre';
                           if (marketplace === 'shopee') return 'Shopee';
                           if (marketplace === 'tiny') return 'Tiny';
                           if (marketplace === 'shopify') return 'Shopify';
                           if (marketplace === 'amazon') return 'Amazon';
                           
                           // 2. Fallback para compatibilidade com dados antigos
                           if (order.integration_account_id) {
                             const empresa = (order.empresa || order.unified?.empresa || order.raw?.empresa || '').toLowerCase();
                             
                             if (empresa.includes('mercado') || empresa.includes('livre')) return 'Mercado Livre';
                             if (empresa.includes('shopee')) return 'Shopee';
                             if (empresa.includes('tiny')) return 'Tiny';
                             if (empresa.includes('shopify')) return 'Shopify';
                             if (empresa.includes('amazon')) return 'Amazon';
                             
                             return 'Marketplace';
                           }
                           
                           return 'Interno';
                         };
                        
                        const marketplace = detectMarketplace(order);
                        const marketplaceColors: Record<string, string> = {
                          'Mercado Livre': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                          'Shopee': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                          'Tiny': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                          'Shopify': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                          'Amazon': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                          'Interno': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        };
                        return (
                          <Badge variant="outline" className={marketplaceColors[marketplace] || marketplaceColors['Interno']}>
                            {marketplace}
                          </Badge>
                        );
                     
                      case 'local_estoque':
                        // Buscar nome do local de estoque enriquecido pelo hook useLocalEstoqueEnriquecimento
                        const localEstoque = order.unified?.local_estoque_nome || order.unified?.local_estoque;
                        
                        if (localEstoque) {
                          return (
                            <Badge variant="secondary">
                              <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                {localEstoque}
                              </span>
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant="outline" className="text-amber-600">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                              Sem Mapeamento
                            </span>
                          </Badge>
                        );
                     
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
                           if (!Array.isArray(tags) || tags.length === 0) {
                             return <span className="text-muted-foreground">-</span>;
                           }
                           
                           // Função para gerar cor baseada no texto da tag
                           const getTagColor = (tag: string, index: number) => {
                             const colors = [
                               'bg-blue-600/80 text-blue-50 dark:bg-blue-900/80 dark:text-blue-300 border-blue-500/50 dark:border-blue-400/60',
                               'bg-green-600/80 text-green-50 dark:bg-green-900/80 dark:text-green-300 border-green-500/50 dark:border-green-400/60',
                               'bg-purple-600/80 text-purple-50 dark:bg-purple-900/80 dark:text-purple-300 border-purple-500/50 dark:border-purple-400/60',
                               'bg-orange-600/80 text-orange-50 dark:bg-orange-900/80 dark:text-orange-300 border-orange-500/50 dark:border-orange-400/60',
                               'bg-pink-600/80 text-pink-50 dark:bg-pink-900/80 dark:text-pink-300 border-pink-500/50 dark:border-pink-400/60',
                               'bg-cyan-600/80 text-cyan-50 dark:bg-cyan-900/80 dark:text-cyan-300 border-cyan-500/50 dark:border-cyan-400/60',
                               'bg-amber-600/80 text-amber-50 dark:bg-amber-900/80 dark:text-amber-300 border-amber-500/50 dark:border-amber-400/60',
                               'bg-indigo-600/80 text-indigo-50 dark:bg-indigo-900/80 dark:text-indigo-300 border-indigo-500/50 dark:border-indigo-400/60',
                             ];
                             // Usa hash simples do texto para consistência de cores
                             const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                             return colors[hash % colors.length];
                           };
                           
                           const translatedTags = translateMLTags(tags);
                           const tagArray = translatedTags.split(', ').filter(Boolean);
                           
                           return (
                             <div className="flex flex-wrap gap-1.5 py-1">
                               {tagArray.map((tag, index) => (
                                 <span
                                   key={`${tag}-${index}`}
                                   className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${getTagColor(tag, index)}`}
                                   title={tag}
                                 >
                                   {tag}
                                 </span>
                               ))}
                             </div>
                           );
                          }
                      case 'url_rastreamento':
                        {
                          const trackingUrl = order.url_rastreamento || 
                                            order.unified?.url_rastreamento || 
                                            order.shipping?.tracking_number_url ||
                                            order.raw?.shipping?.tracking_number_url ||
                                            '';
                          
                          if (!trackingUrl || trackingUrl === '-') {
                            return <span className="text-xs text-muted-foreground">-</span>;
                          }
                          
                          return (
                            <a 
                              href={trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>Rastrear</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                            </a>
                          );
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
                    <td className="px-4 text-left">
                      <div className="break-words whitespace-normal text-xs leading-tight line-clamp-2" style={{ minWidth: '250px' }}>{idUnico}</div>
                    </td>

                    {/* Demais colunas dinâmicas */}
                    {visibleDefinitions?.filter((d) => d.key !== 'id').map((def) => (
                      <td 
                        key={def.key} 
                        className={cn(
                          "px-4 text-left",
                          // Colunas SKU com largura ajustada ao conteúdo
                          (def.key === 'sku_estoque' || def.key === 'sku_kit') && "w-auto whitespace-nowrap",
                          // Colunas de envio sem quebra de linha
                          (def.key === 'logistic_type' || def.key === 'shipping_status') && "whitespace-nowrap"
                        )}
                        style={(def as any).width ? { minWidth: `${(def as any).width}px`, width: `${(def as any).width}px` } : undefined}
                      >
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