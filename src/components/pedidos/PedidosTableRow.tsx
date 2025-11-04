// P3.1: Componente memoizado para linha da tabela - performance otimizada
import React, { memo } from 'react';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
// F4.2: Sistema unificado de mapeamento de status - atualizado
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { translateShippingSubstatus, translateShippingStatus, translateShippingMethod, getShippingStatusColor, translateCondition } from '@/utils/pedidos-translations';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ColumnConfig } from './ColumnSelector';
import { get, show } from '@/services/orders';
import { formatShippingStatus, formatLogisticType, formatSubstatus } from '@/utils/orderFormatters';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidosTableRowProps {
  row: Row;
  isSelected: boolean;
  onSelect: (rowId: string, selected: boolean) => void;
  temMapeamento: boolean;
  visibleColumns: ColumnConfig[];
  rowId: string;
  renderStatusBaixa?: (pedidoId: string) => React.ReactNode;
  renderStatusInsumos?: (pedidoId: string) => React.ReactNode;
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

// P3.1: Comparação memoizada para evitar re-renders desnecessários
const areEqual = (prevProps: PedidosTableRowProps, nextProps: PedidosTableRowProps) => {
  return (
    prevProps.rowId === nextProps.rowId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.temMapeamento === nextProps.temMapeamento &&
    prevProps.visibleColumns.length === nextProps.visibleColumns.length &&
    // Comparar apenas dados superficiais da row
    JSON.stringify(prevProps.row.unified?.id) === JSON.stringify(nextProps.row.unified?.id)
  );
};

export const PedidosTableRow = memo<PedidosTableRowProps>(({
  row,
  isSelected,
  onSelect,
  temMapeamento,
  visibleColumns,
  rowId,
  renderStatusBaixa,
  renderStatusInsumos
}) => {
  return (
    <TableRow
      className={
        "border-l-4 " +
        (temMapeamento
          ? "border-l-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/10"
          : "border-l-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10")
      }>
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(rowId, e.target.checked)}
          className="rounded border-border bg-background"
        />
      </TableCell>
      
      {/* Render each visible column */}
      {visibleColumns.map((col) => {
        // 🔍 Debug: Log todas as colunas sendo renderizadas
        if (col.key === 'conditions') {
          console.log('🔍 [COLUNA ENCONTRADA] Renderizando coluna:', col.key, col);
        }
        
        return (
          <TableCell 
            key={col.key}
            className={
              (col.key === 'logistic_type' || col.key === 'shipping_status') 
                ? 'whitespace-nowrap' 
                : col.key === 'tags'
                  ? 'break-words whitespace-normal'
                  : undefined
            }
            style={(col as any).width ? { minWidth: `${(col as any).width}px`, width: `${(col as any).width}px` } : undefined}
          >
            {(() => {
              switch (col.key) {
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
                    {show(get(row.unified, 'id_unico') ?? get(row.raw, 'id_unico') ?? get(row.unified, 'id') ?? get(row.raw, 'id'))}
                  </div>
                );
              case 'nome_completo':
                return show(get(row.unified, 'nome_destinatario') ?? get(row.raw, 'shipping.destination.receiver_name') ?? '—');
              case 'cpf_cnpj':
                {
                  // ✅ EXTRAÇÃO DIRETA - Priorizar valor já processado
                  const rawDoc = get(row, 'cpf_cnpj') ||
                                get(row.unified, 'cpf_cnpj') || 
                                get(row, 'documento_cliente') ||
                                get(row, 'cliente_documento') ||
                                get(row.raw, 'buyer.identification.number') ||
                                get(row.unified, 'buyer.identification.number') ||
                                get(row.raw, 'payments[0].payer.identification.number') ||
                                '';
                  return <span className="font-mono text-xs">{maskCpfCnpj(rawDoc)}</span>;
                }
              case 'data_pedido':
                return formatDate(get(row.unified, 'data_pedido') ?? get(row.raw, 'date_created'));
              case 'valor_total':
                return formatMoney(get(row.unified, 'valor_total'));
              case 'situacao':
                const situacao = get(row.unified, 'situacao') ?? get(row.raw, 'status');
                // F4.2: Usar sistema unificado de status
                const mappedSituacao = mapApiStatusToLabel(situacao);
                const badgeVariant = getStatusBadgeVariant(situacao);
                return (
                  <Badge variant={badgeVariant}>
                    {mappedSituacao}
                  </Badge>
                );
              case 'shipping_status':
                const shippingStatus = get(row.raw, 'shipping_details.status');
                // F4.2: Usar sistema unificado de status
                const mappedShippingStatus = mapApiStatusToLabel(shippingStatus);
                const shippingBadgeVariant = getStatusBadgeVariant(shippingStatus);
                return (
                  <Badge variant={shippingBadgeVariant}>
                    {mappedShippingStatus}
                  </Badge>
                );
              case 'obs':
                return <TruncatedCell content={get(row.unified, 'obs')} />;
              
              // Colunas de envio - Mesmo mapeamento da página vendas-online
              case 'shipping_status':
                const shipping = get(row.raw, 'shipping') || get(row.raw, 'shipping_details');
                return shipping?.status ? (
                  <Badge variant={getStatusBadgeVariant(shipping.status)}>
                    {formatShippingStatus(shipping.status)}
                  </Badge>
                ) : '-';
              
              case 'logistic_type':
                const shippingData = get(row.raw, 'shipping') || get(row.raw, 'shipping_details');
                const order = row.raw || row.unified;
                return <span className="text-xs">{formatLogisticType(
                  shippingData?.logistic?.type || 
                  order?.logistic_type || 
                  '-'
                )}</span>;
              
              case 'shipping_substatus':
                const shippingForSubstatus = get(row.raw, 'shipping') || get(row.raw, 'shipping_details');
                const orderForSubstatus = row.raw || row.unified;
                return <span className="text-xs">{formatSubstatus(
                  shippingForSubstatus?.substatus || 
                  orderForSubstatus?.shipping_substatus || 
                  '-'
                )}</span>;
              
              case 'tracking_number':
                const trackingNumberValue = get(row.unified, 'codigo_rastreamento') ?? get(row.raw, 'shipping.tracking_number');
                return <TruncatedCell content={trackingNumberValue} maxLength={30} />;
              
              case 'power_seller_status':
                const medalha = get(row.unified, 'power_seller_status') ?? get(row.raw, 'power_seller_status');
                if (!medalha) return <span className="text-xs text-muted-foreground">—</span>;
                
                const medalhaCores: Record<string, string> = {
                  'platinum': 'bg-slate-100 text-slate-800 border-slate-300',
                  'gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                  'silver': 'bg-gray-100 text-gray-800 border-gray-300'
                };
                
                return (
                  <Badge variant="outline" className={medalhaCores[medalha.toLowerCase()] || 'bg-gray-100 text-gray-800'}>
                    {medalha.charAt(0).toUpperCase() + medalha.slice(1)}
                  </Badge>
                );
              
              case 'level_id':
                const reputacao = get(row.unified, 'level_id') ?? get(row.raw, 'level_id');
                if (!reputacao) return <span className="text-xs text-muted-foreground">—</span>;
                
                // level_id formato: "5_green", "4_yellow", etc.
                const [nivel, cor] = String(reputacao).split('_');
                const corReputacao: Record<string, string> = {
                  'green': 'bg-green-100 text-green-800 border-green-300',
                  'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                  'orange': 'bg-orange-100 text-orange-800 border-orange-300',
                  'red': 'bg-red-100 text-red-800 border-red-300',
                  'gray': 'bg-gray-100 text-gray-800 border-gray-300'
                };
                
                return (
                  <Badge variant="outline" className={corReputacao[cor] || 'bg-gray-100 text-gray-800'}>
                    {nivel && cor ? `${nivel} ${cor}` : reputacao}
                  </Badge>
                );
              
              case 'conditions':
                console.group('🔍 [AUDITORIA CONDIÇÃO]');
                console.log('row.unified:', row.unified);
                console.log('row.raw:', row.raw);
                
                const conditionsRaw = get(row.unified, 'conditions') || get(row.raw, 'order_items[0].item.condition');
                console.log('conditionsRaw obtido:', conditionsRaw);
                console.log('Tipo:', typeof conditionsRaw);
                
                if (!conditionsRaw) {
                  console.log('❌ Campo conditions está vazio/null');
                  console.groupEnd();
                  return <span className="text-xs text-muted-foreground">—</span>;
                }
                
                const conditionStr = String(conditionsRaw).toLowerCase();
                console.log('conditionStr (lowercase):', conditionStr);
                
                let conditionText = '—';
                
                if (conditionStr.includes('new')) {
                  conditionText = 'Novo';
                  console.log('✅ Detectou "new", retornando: Novo');
                } else if (conditionStr.includes('used')) {
                  conditionText = 'Usado';
                  console.log('✅ Detectou "used", retornando: Usado');
                } else {
                  console.log('⚠️ Não detectou nem new nem used');
                }
                
                console.log('Texto final a ser exibido:', conditionText);
                console.groupEnd();
                
                return (
                  <Badge variant="outline" className={conditionStr.includes('new') ? 'bg-blue-50 text-blue-700' : ''}>
                    {conditionText}
                  </Badge>
                );
              
              
              // Colunas antigas mantidas para compatibilidade
              case 'codigo_rastreamento':
                const codigoRastreamento = get(row.unified, 'codigo_rastreamento') ?? get(row.raw, 'shipping.tracking_number');
                return <TruncatedCell content={codigoRastreamento} maxLength={30} />;
              
              case 'url_rastreamento':
                const urlRastreamento = get(row.unified, 'url_rastreamento') ?? get(row.raw, 'shipping.tracking_url');
                return urlRastreamento ? (
                  <a 
                    href={urlRastreamento} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Rastrear
                  </a>
                ) : <span>-</span>;
              
              case 'status_baixa':
                return renderStatusBaixa ? renderStatusBaixa(rowId) : <span className="text-xs text-muted-foreground">—</span>;
              
              case 'status_insumos':
                return renderStatusInsumos ? renderStatusInsumos(rowId) : <span className="text-xs text-muted-foreground">—</span>;
              
              case 'valor_liquido_vendedor':
                {
                  // Calcular valor líquido: Valor total - (Frete Pago Cliente + custo envio seller) + Receita Flex (Bônus) - Taxa Marketplace
                  const valorTotal = get(row.unified, 'valor_total') || get(row.raw, 'total_amount') || 0;
                  const fretePagoCliente = get(row.unified, 'frete_pago_cliente') || get(row.raw, 'shipping.shipping_items[0].list_cost') || 0;
                  const custoEnvioSeller = get(row.unified, 'custo_envio_seller') || get(row.raw, 'shipping.costs.senders[0].cost') || 0;
                  const receitaFlex = get(row.unified, 'receita_flex') || get(row.raw, 'shipping_cost_components.shipping_method_cost') || 0;
                  const taxaMarketplace = get(row.raw, 'order_items[0].sale_fee') || get(row.unified, 'marketplace_fee') || get(row.raw, 'fees[0].value') || 0;
                  const valorLiquido = valorTotal - (fretePagoCliente + custoEnvioSeller) + receitaFlex - taxaMarketplace;
                  return <span>{formatMoney(get(row.unified, 'valor_liquido_vendedor') || valorLiquido || 0)}</span>;
                }
              
              default:
                return show(get(row.unified, col.key) ?? get(row.raw, col.key));
            }
          })()}
          </TableCell>
        );
      })}
    </TableRow>
  );
}, areEqual);