/**
 * 📍 TRACKING INFO CELL - FASE 5
 * Exibe dados de tracking do shipment com histórico
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Truck, Clock, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ShipmentTracking } from '../../types/devolucao.types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrackingInfoCellProps {
  trackingInfo?: ShipmentTracking | null;
}

export const TrackingInfoCell = memo<TrackingInfoCellProps>(({ trackingInfo }) => {
  // Se não temos dados de tracking
  if (!trackingInfo) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Package className="w-3 h-3" />
        <span>Tracking indisponível</span>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      'ready_to_ship': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'shipped': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      'in_transit': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      'delivered': 'bg-green-500/10 text-green-600 dark:text-green-400',
      'not_delivered': 'bg-red-500/10 text-red-600 dark:text-red-400',
      'cancelled': 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };
    return colors[status.toLowerCase()] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'ready_to_ship': 'Pronto',
      'shipped': 'Enviado',
      'in_transit': 'Em Trânsito',
      'delivered': 'Entregue',
      'not_delivered': 'Não Entregue',
      'cancelled': 'Cancelado',
    };
    return labels[status.toLowerCase()] || status;
  };

  // Criar conteúdo do histórico para tooltip
  const historyContent = (
    <div className="space-y-2 max-w-xs">
      <div className="font-semibold text-xs border-b pb-1">Histórico de Rastreamento</div>
      {trackingInfo.tracking_history.length === 0 ? (
        <div className="text-xs text-muted-foreground">Sem eventos registrados</div>
      ) : (
        trackingInfo.tracking_history.slice(0, 5).map((event, idx) => (
          <div key={idx} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{formatDate(event.date)}</span>
            </div>
            <div className="text-muted-foreground pl-4">{event.description}</div>
            {event.location && (
              <div className="flex items-center gap-1 text-muted-foreground pl-4">
                <MapPin className="w-2.5 h-2.5" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        ))
      )}
      {trackingInfo.tracking_history.length > 5 && (
        <div className="text-xs text-muted-foreground italic pt-1 border-t">
          + {trackingInfo.tracking_history.length - 5} eventos anteriores
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-1.5 min-w-[220px]">
      {/* Status Atual com Tooltip de Histórico */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <Badge className={`text-xs ${getStatusColor(trackingInfo.current_status)}`}>
                <Package className="w-3 h-3 mr-1" />
                {getStatusLabel(trackingInfo.current_status)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-h-96 overflow-y-auto">
            {historyContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Descrição do Status */}
      {trackingInfo.current_status_description && (
        <div className="text-xs text-muted-foreground truncate" title={trackingInfo.current_status_description}>
          {trackingInfo.current_status_description}
        </div>
      )}

      {/* Localização Atual */}
      {trackingInfo.current_location && (
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate" title={trackingInfo.current_location}>
            {trackingInfo.current_location}
          </span>
        </div>
      )}

      {/* Transportadora */}
      {trackingInfo.carrier && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="w-3 h-3 flex-shrink-0" />
          <span className="truncate" title={trackingInfo.carrier}>
            {trackingInfo.carrier}
          </span>
        </div>
      )}

      {/* Código de Rastreio */}
      {trackingInfo.tracking_number && (
        <div className="flex items-center gap-1.5 text-xs">
          <Navigation className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <code className="font-mono text-xs bg-muted px-1 rounded truncate">
            {trackingInfo.tracking_number}
          </code>
        </div>
      )}

      {/* Última Atualização */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">
          Atualizado: {formatDate(trackingInfo.last_update)}
        </span>
      </div>

      {/* Badge com quantidade de eventos */}
      {trackingInfo.tracking_history.length > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {trackingInfo.tracking_history.length} evento{trackingInfo.tracking_history.length !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
});

TrackingInfoCell.displayName = 'TrackingInfoCell';
