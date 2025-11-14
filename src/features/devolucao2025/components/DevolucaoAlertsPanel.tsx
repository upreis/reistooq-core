/**
 * 🚨 PAINEL DE ALERTAS DE DEVOLUÇÕES
 * Exibe alertas de prazos, atrasos e mediações
 */

import { Bell, AlertTriangle, Clock, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DevolucaoAlert } from '../hooks/useDevolucaoAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DevolucaoAlertsPanelProps {
  alerts: DevolucaoAlert[];
  totalAlerts: number;
}

export const DevolucaoAlertsPanel = ({ alerts, totalAlerts }: DevolucaoAlertsPanelProps) => {
  const getAlertIcon = (type: DevolucaoAlert['type']) => {
    switch (type) {
      case 'prazo_proximo':
        return <Clock className="h-4 w-4" />;
      case 'atrasado':
        return <AlertTriangle className="h-4 w-4" />;
      case 'mediador_atribuido':
        return <Scale className="h-4 w-4" />;
    }
  };

  const getAlertColor = (priority: DevolucaoAlert['priority']) => {
    switch (priority) {
      case 'alta':
        return 'bg-destructive text-destructive-foreground';
      case 'media':
        return 'bg-yellow-500 text-yellow-950 dark:bg-yellow-600 dark:text-yellow-50';
      case 'baixa':
        return 'bg-blue-500 text-blue-950 dark:bg-blue-600 dark:text-blue-50';
    }
  };

  const getAlertBorderColor = (priority: DevolucaoAlert['priority']) => {
    switch (priority) {
      case 'alta':
        return 'border-l-4 border-l-destructive';
      case 'media':
        return 'border-l-4 border-l-yellow-500';
      case 'baixa':
        return 'border-l-4 border-l-blue-500';
    }
  };

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum alerta no momento</p>
            <p className="text-xs mt-1">Todas as devoluções estão dentro do prazo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas
          <Badge variant="destructive" className="ml-auto">
            {totalAlerts}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg bg-card border ${getAlertBorderColor(alert.priority)} hover:bg-accent/50 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getAlertColor(alert.priority)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {alert.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Claim: {alert.claim_id}</span>
                      {alert.deadline && (
                        <span>
                          {alert.type === 'atrasado' ? 'Venceu' : 'Vence'} {formatDistanceToNow(alert.deadline, { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
