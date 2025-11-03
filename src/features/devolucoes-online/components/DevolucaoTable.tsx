/**
 * 📊 DEVOLUÇÃO TABLE - OTIMIZADA
 * Tabela de devoluções com memoização
 */

import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MLReturn } from '../types/devolucao.types';

interface DevolucaoTableProps {
  devolucoes: MLReturn[];
  isLoading: boolean;
  error: string | null;
}

export const DevolucaoTable = memo(({ devolucoes, isLoading, error }: DevolucaoTableProps) => {

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-destructive">Erro ao carregar devoluções: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!devolucoes || devolucoes.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Nenhuma devolução encontrada</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (statusId: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'label_generated': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'shipped': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'delivered': 'bg-green-500/10 text-green-500 border-green-500/20',
      'cancelled': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      'expired': 'bg-red-500/10 text-red-500 border-red-500/20',
      'not_delivered': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return colors[statusId] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getDestinationLabel = (destination: string | null) => {
    const labels: Record<string, string> = {
      'seller_address': 'Vendedor',
      'warehouse': 'MELI',
    };
    return destination ? labels[destination] || destination : '-';
  };

  const getShipmentTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      'return': 'Devolução',
      'return_from_triage': 'Revisão',
    };
    return type ? labels[type] || type : '-';
  };

  const getContextTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'total': 'Total',
      'partial': 'Parcial',
      'incomplete': 'Incompleto',
    };
    return labels[type] || type;
  };

  const getRefundAtLabel = (refundAt: string | null) => {
    const labels: Record<string, string> = {
      'delivered': 'Após entrega',
      'shipped': 'Após envio',
      'n/a': 'N/A',
    };
    return refundAt ? labels[refundAt] || refundAt : '-';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">ID Devolução</TableHead>
            <TableHead className="font-semibold">Claim ID</TableHead>
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">Item ID</TableHead>
            <TableHead className="font-semibold">Variação ID</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Status $</TableHead>
            <TableHead className="font-semibold">Subtipo</TableHead>
            <TableHead className="font-semibold">Tipo Recurso</TableHead>
            <TableHead className="font-semibold">Contexto</TableHead>
            <TableHead className="font-semibold">Qtd Total</TableHead>
            <TableHead className="font-semibold">Qtd Devolver</TableHead>
            <TableHead className="font-semibold">Shipment ID</TableHead>
            <TableHead className="font-semibold">Status Envio</TableHead>
            <TableHead className="font-semibold">Tipo Envio</TableHead>
            <TableHead className="font-semibold">Destino</TableHead>
            <TableHead className="font-semibold">Rastreio</TableHead>
            <TableHead className="font-semibold">Endereço</TableHead>
            <TableHead className="font-semibold">Cidade</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">CEP</TableHead>
            <TableHead className="font-semibold">Bairro</TableHead>
            <TableHead className="font-semibold">MPT</TableHead>
            <TableHead className="font-semibold">Reviews</TableHead>
            <TableHead className="font-semibold">Reembolso Após</TableHead>
            <TableHead className="font-semibold">Criação</TableHead>
            <TableHead className="font-semibold">Atualização</TableHead>
            <TableHead className="font-semibold">Fechamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev) => {
            const firstOrder = dev.orders?.[0];
            return (
              <TableRow key={dev.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-xs">
                  {dev.id}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.claim_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.order_id || '-'}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {firstOrder?.item_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {firstOrder?.variation_id || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(dev.status?.id || '')}`}
                  >
                    {dev.status?.description || dev.status?.id || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {dev.status_money?.description || dev.status_money?.id || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {dev.subtype?.description || dev.subtype?.id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.resource_type || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {firstOrder ? getContextTypeLabel(firstOrder.context_type) : '-'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-center">
                  {firstOrder?.total_quantity || '-'}
                </TableCell>
                <TableCell className="text-xs text-center font-semibold">
                  {firstOrder?.return_quantity || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.shipment_id || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.shipment_status || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {getShipmentTypeLabel(dev.shipment_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getDestinationLabel(dev.shipment_destination)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {dev.tracking_number || '-'}
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={dev.destination_address || '-'}>
                  {dev.destination_address || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_city || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_state || '-'}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {dev.destination_zip || '-'}
                </TableCell>
                <TableCell className="text-xs">
                  {dev.destination_neighborhood || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={dev.intermediate_check ? "default" : "outline"} className="text-xs">
                    {dev.intermediate_check ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={dev.related_entities?.includes('reviews') ? "default" : "outline"} className="text-xs">
                    {dev.related_entities?.includes('reviews') ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {getRefundAtLabel(dev.refund_at)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.date_created)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.last_updated)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(dev.date_closed)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

DevolucaoTable.displayName = 'DevolucaoTable';
