/**
 * 🚨 ALERTAS PROATIVOS
 * Sistema inteligente de detecção e notificação de problemas
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Eye, 
  Clock,
  TrendingDown,
  Package,
  MapPin,
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProactiveAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'mapping' | 'integration' | 'performance' | 'business';
  title: string;
  description: string;
  details?: string;
  actionRequired: boolean;
  affectedCount?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  metadata?: Record<string, any>;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface ProactiveAlertsProps {
  orders?: any[];
  integrationHealth?: Record<string, number>;
  onAlertAction?: (alert: ProactiveAlert, action: string) => void;
  className?: string;
}

// Hook para detectar problemas automaticamente
function useAlertDetection(orders: any[] = [], integrationHealth: Record<string, number> = {}) {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeProblems = useMemo(() => {
    const detectedAlerts: ProactiveAlert[] = [];

    if (orders.length === 0) return detectedAlerts;

    setIsAnalyzing(true);

    try {
      // 1. DETECÇÃO DE PROBLEMAS DE MAPEAMENTO
      const unmappedOrders = orders.filter(order => {
        // Lógica para detectar pedidos sem mapeamento
        const skus = order.skus || [];
        return skus.length > 0 && !order.temMapeamento;
      });

      if (unmappedOrders.length > 0) {
        const severity = unmappedOrders.length > 10 ? 'critical' : 'warning';
        detectedAlerts.push({
          id: `mapping-${Date.now()}`,
          type: severity,
          category: 'mapping',
          title: 'Pedidos sem Mapeamento Detectados',
          description: `${unmappedOrders.length} pedido(s) não possuem mapeamento de SKU`,
          details: `Produtos sem mapeamento podem causar erro na baixa de estoque automática. Revise os mapeamentos no módulo De-Para.`,
          actionRequired: true,
          affectedCount: unmappedOrders.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: severity === 'critical' ? 1 : 2,
          metadata: { orderIds: unmappedOrders.map(o => o.id) },
          actions: [
            {
              label: 'Ver Pedidos',
              action: () => console.log('Navigate to unmapped orders'),
              variant: 'default'
            },
            {
              label: 'Ir para De-Para',
              action: () => console.log('Navigate to mapping'),
              variant: 'outline'
            }
          ]
        });
      }

      // 2. DETECÇÃO DE PROBLEMAS DE INTEGRAÇÃO
      Object.entries(integrationHealth).forEach(([integration, health]) => {
        if (health < 95) {
          const severity = health < 80 ? 'critical' : health < 90 ? 'warning' : 'info';
          detectedAlerts.push({
            id: `integration-${integration}-${Date.now()}`,
            type: severity,
            category: 'integration',
            title: `Problemas na Integração ${integration}`,
            description: `Health score: ${health.toFixed(1)}% - Abaixo do ideal`,
            details: health < 80 
              ? 'Problemas críticos detectados. Verifique a conectividade e credenciais.'
              : 'Performance degradada. Monitore a situação.',
            actionRequired: health < 90,
            createdAt: new Date(),
            updatedAt: new Date(),
            priority: health < 80 ? 1 : health < 90 ? 2 : 3,
            metadata: { integration, health },
            actions: [
              {
                label: 'Diagnosticar',
                action: () => console.log(`Diagnose ${integration}`),
                variant: 'default'
              }
            ]
          });
        }
      });

      // 3. DETECÇÃO DE PROBLEMAS DE PERFORMANCE
      const oldOrders = orders.filter(order => {
        const orderDate = new Date(order.data_pedido || order.date_created);
        const daysDiff = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7 && !['delivered', 'cancelled'].includes(order.situacao?.toLowerCase());
      });

      if (oldOrders.length > 5) {
        detectedAlerts.push({
          id: `performance-old-orders-${Date.now()}`,
          type: 'warning',
          category: 'business',
          title: 'Pedidos Antigos sem Finalização',
          description: `${oldOrders.length} pedidos há mais de 7 dias sem conclusão`,
          details: 'Pedidos antigos podem indicar problemas operacionais ou de fulfillment.',
          actionRequired: true,
          affectedCount: oldOrders.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 3,
          metadata: { orderIds: oldOrders.map(o => o.id) },
          actions: [
            {
              label: 'Revisar Pedidos',
              action: () => console.log('Navigate to old orders'),
              variant: 'default'
            }
          ]
        });
      }

      // 4. DETECÇÃO DE ANOMALIAS FINANCEIRAS
      const financialAnomalies = orders.filter(order => {
        const total = Number(order.valor_total) || 0;
        return total > 1000 || total < 5; // Valores muito altos ou muito baixos
      });

      if (financialAnomalies.length > 0) {
        detectedAlerts.push({
          id: `financial-anomalies-${Date.now()}`,
          type: 'info',
          category: 'business',
          title: 'Anomalias Financeiras Detectadas',
          description: `${financialAnomalies.length} pedido(s) com valores atípicos`,
          details: 'Valores muito altos ou muito baixos podem indicar problemas nos dados.',
          actionRequired: false,
          affectedCount: financialAnomalies.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 4,
          metadata: { orderIds: financialAnomalies.map(o => o.id) }
        });
      }

      // 5. DETECÇÃO DE CONCENTRAÇÃO GEOGRÁFICA
      const cityCounts = orders.reduce((acc, order) => {
        const city = order.cidade || 'Não informado';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantCity = Object.entries(cityCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (dominantCity && Number(dominantCity[1]) > orders.length * 0.3) {
        detectedAlerts.push({
          id: `geo-concentration-${Date.now()}`,
          type: 'info',
          category: 'business',
          title: 'Concentração Geográfica Alta',
          description: `${dominantCity[1]} pedidos (${((dominantCity[1]/orders.length)*100).toFixed(1)}%) em ${dominantCity[0]}`,
          details: 'Alta concentração pode indicar oportunidades de otimização logística.',
          actionRequired: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 5,
          metadata: { city: dominantCity[0], count: dominantCity[1], percentage: (dominantCity[1]/orders.length)*100 }
        });
      }

    } catch (error) {
      console.error('Erro na análise de problemas:', error);
    } finally {
      setIsAnalyzing(false);
    }

    return detectedAlerts;
  }, [orders, integrationHealth]);

  useEffect(() => {
    setAlerts(analyzeProblems);
  }, [analyzeProblems]);

  return { alerts, isAnalyzing, setAlerts };
}

function AlertIcon({ type }: { type: ProactiveAlert['type'] }) {
  const icons = {
    critical: <AlertTriangle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Zap className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />
  };

  return icons[type];
}

function AlertCard({ 
  alert, 
  onDismiss, 
  onAction 
}: { 
  alert: ProactiveAlert; 
  onDismiss: (id: string) => void;
  onAction?: (alert: ProactiveAlert, action: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = {
    1: 'border-red-500 bg-red-50',
    2: 'border-orange-500 bg-orange-50',
    3: 'border-yellow-500 bg-yellow-50',
    4: 'border-blue-500 bg-blue-50',
    5: 'border-gray-500 bg-gray-50'
  };

  const typeVariants = {
    critical: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
    success: 'border-l-green-500'
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200",
      typeVariants[alert.type],
      alert.priority <= 2 && priorityColors[alert.priority]
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <AlertIcon type={alert.type} />
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {alert.category}
                </Badge>
                {alert.affectedCount && (
                  <Badge variant="secondary" className="text-xs">
                    {alert.affectedCount} afetados
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {alert.description}
              </p>
              
              {isExpanded && alert.details && (
                <div className="mt-2 p-3 bg-muted/30 rounded text-xs">
                  {alert.details}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {alert.createdAt.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {alert.details && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {alert.actions && alert.actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {alert.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.action}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ProactiveAlerts({ 
  orders = [], 
  integrationHealth = {},
  onAlertAction,
  className 
}: ProactiveAlertsProps) {
  const { alerts, isAnalyzing, setAlerts } = useAlertDetection(orders, integrationHealth);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const criticalCount = visibleAlerts.filter(a => a.type === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.type === 'warning').length;

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleDismissAll = () => {
    setDismissedAlerts(new Set(alerts.map(a => a.id)));
  };

  const handleRefresh = () => {
    setDismissedAlerts(new Set());
    // Força nova análise
    window.location.reload();
  };

  if (isAnalyzing) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Analisando problemas...</span>
        </div>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Tudo funcionando perfeitamente!</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Nenhum problema detectado no momento.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Alertas Proativos</h3>
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount} crítico{criticalCount !== 1 && 's'}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
              {warningCount} atenção
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          
          {visibleAlerts.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleDismissAll}>
              Dispensar Todos
            </Button>
          )}
        </div>
      </div>

      {/* Alertas ordenados por prioridade */}
      <div className="space-y-3">
        {visibleAlerts
          .sort((a, b) => a.priority - b.priority)
          .map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onAction={onAlertAction}
            />
          ))}
      </div>

      {/* Estatísticas */}
      <Card className="p-4 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          Sistema de alertas analisou {orders.length} pedido(s) • 
          Última análise: {new Date().toLocaleTimeString()} • 
          {alerts.length - visibleAlerts.length} alerta(s) dispensado(s)
        </div>
      </Card>
    </div>
  );
}

export default ProactiveAlerts;