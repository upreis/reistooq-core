import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, MapPin, Calendar, Clock, ExternalLink } from 'lucide-react';
import { formatDate } from '@/features/devolucoes/utils/extractDevolucaoData';

interface TrackingTabProps {
  devolucao: any;
}

export const TrackingTab: React.FC<TrackingTabProps> = ({ devolucao }) => {
  const shipmentHistory = devolucao?.shipment_history?.data || devolucao?.shipment_history;
  const trackingHistory = devolucao?.tracking_history || [];
  const trackingEvents = devolucao?.tracking_events || [];

  const getStatusColor = (status: string) => {
    const statusMap: any = {
      delivered: 'bg-green-500',
      shipped: 'bg-blue-500',
      ready_to_ship: 'bg-yellow-500',
      cancelled: 'bg-red-500',
      pending: 'bg-gray-500'
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Informações Principais de Rastreamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Código de Rastreamento</p>
                <p className="font-mono font-semibold text-sm">
                  {devolucao?.codigo_rastreamento || shipmentHistory?.tracking_number || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Transportadora</p>
                <p className="font-semibold">
                  {devolucao?.transportadora || shipmentHistory?.tracking_method || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor(devolucao?.status_rastreamento || shipmentHistory?.status)}`}>
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-1">
                  {devolucao?.status_rastreamento || shipmentHistory?.status || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link de Rastreamento */}
      {(devolucao?.url_rastreamento || shipmentHistory?.tracking_url) && (
        <Card>
          <CardContent className="p-4">
            <a
              href={devolucao.url_rastreamento || shipmentHistory.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="font-medium">Rastrear Pacote no Site da Transportadora</span>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Histórico Detalhado do Shipment */}
      {shipmentHistory?.date_history && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Datas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipmentHistory.date_history.date_created && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Criado</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_created)}</p>
                  </div>
                </div>
              )}
              {shipmentHistory.date_history.date_ready_to_ship && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pronto para Envio</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_ready_to_ship)}</p>
                  </div>
                </div>
              )}
              {shipmentHistory.date_history.date_shipped && (
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Enviado</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_shipped)}</p>
                  </div>
                </div>
              )}
              {shipmentHistory.date_history.date_delivered && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Entregue</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_delivered)}</p>
                  </div>
                </div>
              )}
              {shipmentHistory.date_history.date_first_printed && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Primeira Impressão</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_first_printed)}</p>
                  </div>
                </div>
              )}
              {shipmentHistory.date_history.date_cancelled && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cancelado</p>
                    <p className="text-sm text-muted-foreground">{formatDate(shipmentHistory.date_history.date_cancelled)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de Eventos de Rastreamento */}
      {(trackingEvents.length > 0 || trackingHistory.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Eventos de Rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(trackingEvents.length > 0 ? trackingEvents : trackingHistory).map((event: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    {index < (trackingEvents.length || trackingHistory.length) - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{event.status || event.description || 'Atualização'}</p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        {event.date && <p>{formatDate(event.date)}</p>}
                        {event.time && <p className="text-xs">{event.time}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipmentHistory?.mode && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Modo de Envio</p>
              <Badge variant="outline">{shipmentHistory.mode}</Badge>
            </CardContent>
          </Card>
        )}
        {shipmentHistory?.service_id && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">ID do Serviço</p>
              <p className="font-mono text-sm">{shipmentHistory.service_id}</p>
            </CardContent>
          </Card>
        )}
        {devolucao?.localizacao_atual && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Localização Atual</p>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {devolucao.localizacao_atual}
              </p>
            </CardContent>
          </Card>
        )}
        {devolucao?.data_ultima_movimentacao && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Última Movimentação</p>
              <p className="font-medium">{formatDate(devolucao.data_ultima_movimentacao)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
