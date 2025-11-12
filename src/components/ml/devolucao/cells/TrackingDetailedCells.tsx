/**
 * 📦 CÉLULAS DE RASTREAMENTO DETALHADO
 * 15 campos de logística e tracking que estavam sendo mapeados mas não exibidos
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Truck, Calendar, Clock, Package } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface TrackingDetailedCellsProps {
  devolucao: DevolucaoAvancada;
}

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
};

const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
};

export function TrackingDetailedCells({ devolucao }: TrackingDetailedCellsProps) {
  return (
    <>
      {/* Estimated Delivery Limit */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDate(devolucao.estimated_delivery_limit)}</span>
        </div>
      </td>

      {/* Shipment Status */}
      <td className="px-3 py-3 text-center">
        {devolucao.shipment_status ? (
          <Badge 
            variant={
              devolucao.shipment_status === 'delivered' ? 'default' :
              devolucao.shipment_status === 'in_transit' ? 'outline' :
              devolucao.shipment_status === 'cancelled' ? 'destructive' :
              'secondary'
            }
          >
            <Truck className="h-3 w-3 mr-1" />
            {devolucao.shipment_status === 'delivered' ? 'Entregue' :
             devolucao.shipment_status === 'in_transit' ? 'Em Trânsito' :
             devolucao.shipment_status === 'cancelled' ? 'Cancelado' :
             devolucao.shipment_status}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Refund At */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDate(devolucao.refund_at)}</span>
        </div>
      </td>

      {/* Review Method */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_method ? (
          <Badge variant="outline">{devolucao.review_method}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Review Stage */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_stage ? (
          <Badge variant="secondary">{devolucao.review_stage}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Localização Atual */}
      <td className="px-3 py-3 text-left">
        {devolucao.localizacao_atual ? (
          <div className="flex items-center gap-1 max-w-[200px]">
            <MapPin className="h-3 w-3 text-blue-600 flex-shrink-0" />
            <span className="text-sm truncate">{devolucao.localizacao_atual}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Status Transporte Atual */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_transporte_atual ? (
          <Badge variant="outline">
            <Package className="h-3 w-3 mr-1" />
            {devolucao.status_transporte_atual}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Tracking History */}
      <td className="px-3 py-3 text-center">
        {devolucao.tracking_history && Array.isArray(devolucao.tracking_history) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-pointer">
                  {devolucao.tracking_history.length} eventos
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {devolucao.tracking_history.slice(0, 5).map((event: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <strong>{formatDateTime(event.date)}</strong>: {event.description || event.status}
                    </div>
                  ))}
                  {devolucao.tracking_history.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{devolucao.tracking_history.length - 5} eventos...
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Tracking Events */}
      <td className="px-3 py-3 text-center">
        {devolucao.tracking_events && Array.isArray(devolucao.tracking_events) ? (
          <Badge variant="outline">
            {devolucao.tracking_events.length} eventos
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Data Última Movimentação */}
      <td className="px-3 py-3 text-center">
        <span className="text-sm">{formatDateTime(devolucao.data_ultima_movimentacao)}</span>
      </td>
    </>
  );
}
