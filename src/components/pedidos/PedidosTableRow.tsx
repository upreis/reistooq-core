// P3.1: Componente memoizado para linha da tabela - performance otimizada
import React, { memo } from 'react';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
// F4.2: Sistema unificado de mapeamento de status - atualizado
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { translateShippingSubstatus } from '@/utils/pedidos-translations';
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
      {visibleColumns.map((col) => (
        <TableCell key={col.key}>
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
              case 'nome_cliente':
                return show(get(row.unified, 'nome_cliente') ?? get(row.raw, 'buyer.nickname'));
              case 'nome_completo':
                return show(get(row.unified, 'nome_destinatario') ?? get(row.raw, 'shipping.destination.receiver_name') ?? '—');
              case 'cpf_cnpj':
                return maskCpfCnpj(get(row.unified, 'cpf_cnpj'));
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
                // Renderizar status da baixa usando callback personalizado
                return renderStatusBaixa ? renderStatusBaixa(rowId) : <span className="text-xs text-muted-foreground">—</span>;
              case 'status_insumos':
                // Renderizar status dos insumos usando callback personalizado
                return renderStatusInsumos ? renderStatusInsumos(rowId) : <span className="text-xs text-muted-foreground">—</span>;
              
              // Novas colunas de envio
              case 'historico_status':
                const statusHistory = get(row.raw, 'shipping.status_history') || get(row.raw, 'shipping_details.status_history');
                if (statusHistory && Array.isArray(statusHistory) && statusHistory.length > 0) {
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <History className="h-4 w-4 mr-1" />
                          {statusHistory.length} eventos
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="start">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Histórico de Status</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {statusHistory.map((history: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-primary pl-3 pb-2">
                                <div className="text-xs font-medium">
                                  {formatShippingStatus(history.status)}
                                </div>
                                {history.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {history.description}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {history.date_time ? format(new Date(history.date_time), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
                return '-';
              
              case 'transportadora':
                const transportadora = get(row.raw, 'shipping.tracking_method') || get(row.raw, 'shipping_details.tracking_method');
                return <span className="text-xs">{transportadora || '-'}</span>;
              
              case 'status_envio':
                const statusEnvio = get(row.raw, 'shipping.status') || get(row.raw, 'shipping_details.status');
                return statusEnvio ? (
                  <Badge variant={getStatusBadgeVariant(statusEnvio)}>
                    {formatShippingStatus(statusEnvio)}
                  </Badge>
                ) : '-';
              
              case 'tipo_logistico':
                const tipoLogistico = get(row.raw, 'shipping.logistic.type') || get(row.raw, 'logistic_type') || get(row.raw, 'shipping_details.logistic.type');
                return <span className="text-xs">{formatLogisticType(tipoLogistico)}</span>;
              
              case 'substatus':
                const substatus = get(row.raw, 'shipping.substatus') || get(row.raw, 'shipping_substatus') || get(row.raw, 'shipping_details.substatus');
                return <span className="text-xs">{formatSubstatus(substatus)}</span>;
              
              case 'metodo_envio':
                const metodoEnvio = get(row.raw, 'shipping.lead_time.shipping_method.name') || get(row.raw, 'shipping_details.lead_time.shipping_method.name');
                return <span className="text-xs">{metodoEnvio || '-'}</span>;
              
              default:
                return show(get(row.unified, col.key) ?? get(row.raw, col.key));
            }
          })()}
        </TableCell>
      ))}
    </TableRow>
  );
}, areEqual);