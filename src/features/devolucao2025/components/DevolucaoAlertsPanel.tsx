/**
 * 🚨 PAINEL DE ALERTAS DE DEVOLUÇÕES
 * Exibe alertas de prazos, atrasos e mediações
 */

import { useState } from 'react';
import { Bell, AlertTriangle, Clock, Scale, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DevolucaoAlert } from '../hooks/useDevolucaoAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DevolucaoAlertsPanelProps {
  alerts: DevolucaoAlert[];
  totalAlerts: number;
}

export const DevolucaoAlertsPanel = ({ alerts, totalAlerts }: DevolucaoAlertsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      <Card className="w-full max-w-xs">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-3 w-3" />
              Alertas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0 px-3 pb-3">
            <div className="text-center py-4 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum alerta no momento</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-3 w-3" />
            Alertas
            <Badge variant="destructive" className="text-xs h-4 px-1">
              {totalAlerts}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isExpanded && totalAlerts > 0 && (
              <div className="relative">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 px-3 pb-3">
          <ScrollArea className="h-[240px] pr-2">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded-md bg-card border ${getAlertBorderColor(alert.priority)} hover:bg-accent/50 transition-colors`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${getAlertColor(alert.priority)}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-semibold truncate">{alert.title}</h4>
                        <Badge variant="outline" className="text-[9px] px-0.5 py-0 h-3">
                          {alert.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="truncate">Claim: {alert.claim_id}</span>
                        {alert.deadline && (
                          <span className="shrink-0">
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
      )}
    </Card>
  );
};
