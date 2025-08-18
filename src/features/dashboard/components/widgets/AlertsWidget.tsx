// 🔔 Widget de Alertas
// Central de notificações e alertas do sistema

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, AlertTriangle, Info, CheckCircle, X, 
  Clock, Package, ShoppingCart, TrendingDown,
  ExternalLink, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  category?: 'stock' | 'sales' | 'system' | 'orders';
  link?: string;
}

interface AlertsWidgetProps {
  alerts: DashboardAlert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts
    .filter(alert => !dismissedAlerts.includes(alert.id))
    .filter(alert => filter === 'all' || alert.type === filter)
    .sort((a, b) => {
      // Priorizar por tipo e depois por timestamp
      const typeOrder = { critical: 3, warning: 2, info: 1, success: 0 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[b.type] - typeOrder[a.type];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertIcon = (type: string, category?: string) => {
    if (category === 'stock') return Package;
    if (category === 'orders') return ShoppingCart;
    if (category === 'sales') return TrendingDown;
    
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return Clock;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'success': return 'text-success';
      default: return 'text-info';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'agora';
  };

  const alertCounts = {
    critical: alerts.filter(a => a.type === 'critical' && !dismissedAlerts.includes(a.id)).length,
    warning: alerts.filter(a => a.type === 'warning' && !dismissedAlerts.includes(a.id)).length,
    info: alerts.filter(a => a.type === 'info' && !dismissedAlerts.includes(a.id)).length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
            {filteredAlerts.length > 0 && (
              <Badge variant="outline">{filteredAlerts.length}</Badge>
            )}
          </CardTitle>
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Todos ({filteredAlerts.length})
          </Button>
          {alertCounts.critical > 0 && (
            <Button
              variant={filter === 'critical' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              className="text-xs"
            >
              Crítico ({alertCounts.critical})
            </Button>
          )}
          {alertCounts.warning > 0 && (
            <Button
              variant={filter === 'warning' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
              className="text-xs"
            >
              Aviso ({alertCounts.warning})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <h4 className="font-semibold mb-1">Tudo em ordem!</h4>
            <p className="text-sm text-muted-foreground">
              Não há alertas no momento
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const IconComponent = getAlertIcon(alert.type, alert.category);
                
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      alert.type === 'critical' && "border-destructive/20 bg-destructive/5",
                      alert.type === 'warning' && "border-warning/20 bg-warning/5",
                      alert.type === 'info' && "border-info/20 bg-info/5",
                      alert.type === 'success' && "border-success/20 bg-success/5"
                    )}
                  >
                    <div className={cn("mt-0.5", getAlertColor(alert.type))}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <div className="flex items-center gap-1">
                          <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                            {alert.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(alert.timestamp)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {alert.link && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                          )}
                          
                          {alert.actionRequired && (
                            <Button size="sm" className="h-6 px-2 text-xs">
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Rodapé com estatísticas */}
        {filteredAlerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {alertCounts.critical} críticos, {alertCounts.warning} avisos
              </span>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                Ver todos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}