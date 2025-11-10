import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, AlertCircle, CheckCircle2, Bell, BellOff, X } from 'lucide-react';
import { PerformanceAuditService } from '../../services/performanceAuditService';
import { useToast } from '@/hooks/use-toast';

/**
 * SPRINT 3: Painel de Alertas Automáticos de Performance
 * Monitora e exibe alertas críticos em tempo real
 */

interface PerformanceAlert {
  id: string;
  type: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: string;
  metadata?: Record<string, any>;
  dismissed?: boolean;
}

interface PerformanceAlertsPanelProps {
  metrics?: any;
  autoAnalyze?: boolean;
}

export const PerformanceAlertsPanel = memo<PerformanceAlertsPanelProps>(({ 
  metrics,
  autoAnalyze = true 
}) => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { toast } = useToast();

  // Carregar alertas recentes
  const loadAlerts = async () => {
    try {
      setLoading(true);
      const recentAlerts = await PerformanceAuditService.getRecentAlerts(20);
      
      const formattedAlerts: PerformanceAlert[] = recentAlerts.map(log => ({
        id: log.id,
        type: log.action,
        message: log.new_values?.message || 'Alerta de performance',
        severity: log.new_values?.severity || 'info',
        timestamp: log.created_at,
        metadata: log.new_values
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analisar métricas automaticamente
  useEffect(() => {
    if (autoAnalyze && metrics && alertsEnabled) {
      PerformanceAuditService.analyzeAndAlert(metrics).then(() => {
        loadAlerts();
      });
    }
  }, [metrics, autoAnalyze, alertsEnabled]);

  // Carregar alertas iniciais
  useEffect(() => {
    loadAlerts();
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const getAlertVariant = (severity: string): 'default' | 'destructive' => {
    return severity === 'error' ? 'destructive' : 'default';
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.severity === 'error').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Performance
            </CardTitle>
            <CardDescription>
              Monitoramento automático de performance em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {criticalCount} Crítico{criticalCount !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {warningCount} Aviso{warningCount !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando alertas...
          </div>
        ) : activeAlerts.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Tudo funcionando bem!</AlertTitle>
            <AlertDescription>
              Nenhum alerta de performance detectado no momento.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Alert 
                  key={alert.id} 
                  variant={getAlertVariant(alert.severity)}
                  className="relative"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-sm font-semibold">
                          {alert.type.replace(/_/g, ' ').toUpperCase()}
                        </AlertTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <AlertDescription className="text-xs">
                        {alert.message}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            className="flex-1"
          >
            Atualizar Alertas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
              toast({
                title: 'Alertas limpos',
                description: 'Todos os alertas foram marcados como lidos.'
              });
            }}
            className="flex-1"
          >
            Limpar Todos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceAlertsPanel.displayName = 'PerformanceAlertsPanel';
