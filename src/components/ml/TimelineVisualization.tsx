import React from 'react';
import { Clock, Package, MessageSquare, AlertTriangle, CheckCircle, Truck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineEvent {
  data: string;
  tipo: string;
  descricao: string;
  fonte: string;
  metadados?: any;
}

interface TimelineVisualizationProps {
  timelineData: {
    timeline_events: TimelineEvent[];
    timeline_consolidado?: any;
    metricas_temporais?: any;
  };
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ timelineData }) => {
  const { timeline_events, metricas_temporais } = timelineData;

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'order_criado':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'claim_criado':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'return_criado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'movimentacao_produto':
        return <Truck className="w-4 h-4 text-purple-600" />;
      case 'sistema_message':
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'order_criado':
        return 'border-blue-200 bg-blue-50';
      case 'claim_criado':
        return 'border-orange-200 bg-orange-50';
      case 'return_criado':
        return 'border-green-200 bg-green-50';
      case 'movimentacao_produto':
        return 'border-purple-200 bg-purple-50';
      case 'sistema_message':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatEventDescription = (evento: TimelineEvent) => {
    let description = evento.descricao;
    
    if (evento.metadados) {
      const meta = evento.metadados;
      if (meta.location) description += ` - 📍 ${meta.location}`;
      if (meta.status) description += ` (${meta.status})`;
      if (meta.valor) description += ` - R$ ${meta.valor}`;
    }
    
    return description;
  };

  if (!timeline_events || timeline_events.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum evento de timeline disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas de Resumo */}
      {metricas_temporais && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card rounded-lg border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {timeline_events.length}
            </div>
            <div className="text-sm text-muted-foreground">Eventos</div>
          </div>
          
          {metricas_temporais.dias_ate_resolucao && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metricas_temporais.dias_ate_resolucao}
              </div>
              <div className="text-sm text-muted-foreground">Dias</div>
            </div>
          )}
          
          {metricas_temporais.eficiencia_resolucao && (
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                metricas_temporais.eficiencia_resolucao === 'rapida' ? 'text-green-600' :
                metricas_temporais.eficiencia_resolucao === 'normal' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metricas_temporais.eficiencia_resolucao}
              </div>
              <div className="text-sm text-muted-foreground">Eficiência</div>
            </div>
          )}
          
          {metricas_temporais.tempo_total_resolucao && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metricas_temporais.tempo_total_resolucao}h
              </div>
              <div className="text-sm text-muted-foreground">Duração</div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Visual */}
      <div className="relative">
        {/* Linha vertical do timeline */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-4">
          {timeline_events.map((evento, index) => (
            <div key={index} className="relative flex items-start space-x-4">
              {/* Ícone do evento */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-background border-2 border-border rounded-full">
                {getEventIcon(evento.tipo)}
              </div>
              
              {/* Conteúdo do evento */}
              <div className={`flex-1 p-4 rounded-lg border ${getEventColor(evento.tipo)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {formatEventDescription(evento)}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fonte: {evento.fonte}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <time className="text-sm font-medium text-foreground">
                      {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </time>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(evento.data), 'HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                {/* Metadados expandidos */}
                {evento.metadados && Object.keys(evento.metadados).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(evento.metadados).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium text-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;