// 🚨 Widget de Alertas Inteligentes
// Sistema de notificações e alertas automáticos

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, AlertCircle, Info, CheckCircle,
  Bell, Clock, ExternalLink, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

interface AlertsWidgetProps {
  alerts: DashboardAlert[];
  onDismissAlert?: (id: string) => void;
  onActionClick?: (alert: DashboardAlert) => void;
}

export function AlertsWidget({ 
  alerts = [], 
  onDismissAlert,
  onActionClick 
}: AlertsWidgetProps) {
  // Gerar alertas padrão se não houver nenhum
  const defaultAlerts: DashboardAlert[] = [
    {
      id: 'stock-low',
      type: 'warning',
      title: 'Estoque Baixo',
      message: 'Alguns produtos estão com estoque abaixo do mínimo',
      timestamp: new Date(),
      actionRequired: true,
      actionLabel: 'Ver Produtos',
      actionUrl: '/produtos'
    },
    {
      id: 'orders-pending',
      type: 'info',
      title: 'Pedidos Pendentes',
      message: 'Há pedidos aguardando processamento',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
      actionRequired: false
    }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'secondary';
      default: return 'secondary';
    }
  };

  const criticalCount = displayAlerts.filter(a => a.type === 'critical').length;
  const actionRequiredCount = displayAlerts.filter(a => a.actionRequired).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas do Sistema
          <div className="ml-auto flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} críticos</Badge>
            )}
            {actionRequiredCount > 0 && (
              <Badge variant="outline">{actionRequiredCount} ações</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {displayAlerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Tudo certo! Nenhum alerta ativo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border",
                  getAlertColor(alert.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                        {alert.type === 'critical' ? 'Crítico' : 
                         alert.type === 'warning' ? 'Atenção' :
                         alert.type === 'success' ? 'Sucesso' : 'Info'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(alert.timestamp, 'HH:mm', { locale: ptBR })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {alert.actionRequired && alert.actionLabel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => onActionClick?.(alert)}
                          >
                            {alert.actionLabel}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                        
                        {onDismissAlert && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onDismissAlert(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {displayAlerts.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver todos os {displayAlerts.length} alertas
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}