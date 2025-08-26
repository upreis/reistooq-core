/**
 * 🚨 SISTEMA DE ALERTAS INTELIGENTES
 * Componente para alertas automáticos baseados nos dados
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  TrendingDown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  count?: number;
  urgent?: boolean;
}

interface PedidosAlertsProps {
  orders: any[];
  className?: string;
}

export function PedidosAlerts({ orders, className }: PedidosAlertsProps) {
  const alerts = useMemo(() => {
    if (!orders?.length) return [];

    const alertList: Alert[] = [];

    // Alert 1: Pedidos sem estoque
    const semEstoque = orders.filter(order => {
      // Lógica para detectar pedidos que podem ter problemas de estoque
      return order.situacao === 'ready_to_ship' && !order.stock_checked;
    });

    if (semEstoque.length > 0) {
      alertList.push({
        id: 'sem-estoque',
        type: 'warning',
        title: 'Produtos Sem Estoque',
        message: `${semEstoque.length} pedidos podem ter problemas de estoque`,
        action: 'Verificar Estoque',
        count: semEstoque.length,
        urgent: semEstoque.length > 3
      });
    }

    // Alert 2: Pedidos sem mapeamento
    const semMapeamento = orders.filter(order => {
      // Detectar SKUs que podem não ter mapeamento
      return order.skus && order.skus.some((sku: string) => !sku || sku.includes('unmapped'));
    });

    if (semMapeamento.length > 0) {
      alertList.push({
        id: 'sem-mapeamento',
        type: 'error',
        title: 'SKUs Sem Mapeamento',
        message: `${semMapeamento.length} pedidos com SKUs não mapeados`,
        action: 'Configurar Mapeamento',
        count: semMapeamento.length,
        urgent: true
      });
    }

    // Alert 3: Pedidos atrasados
    const atrasados = orders.filter(order => {
      if (!order.data_prevista) return false;
      const dataPrevisao = new Date(order.data_prevista);
      const hoje = new Date();
      return dataPrevisao < hoje && !['delivered', 'cancelled'].includes(order.situacao);
    });

    if (atrasados.length > 0) {
      alertList.push({
        id: 'atrasados',
        type: 'error',
        title: 'Pedidos Atrasados',
        message: `${atrasados.length} pedidos passaram da data prevista`,
        action: 'Revisar Prazos',
        count: atrasados.length,
        urgent: atrasados.length > 5
      });
    }

    // Alert 4: Pronto para baixar
    const prontoParaBaixar = orders.filter(order => {
      return order.situacao === 'paid' || order.situacao === 'ready_to_ship';
    });

    if (prontoParaBaixar.length > 0) {
      alertList.push({
        id: 'pronto-baixar',
        type: 'info',
        title: 'Pronto para Baixar',
        message: `${prontoParaBaixar.length} pedidos prontos para baixa de estoque`,
        action: 'Processar Baixas',
        count: prontoParaBaixar.length
      });
    }

    // Alert 5: Já baixado
    const jaBaixados = orders.filter(order => {
      return order.stock_processed || order.baixa_realizada;
    });

    if (jaBaixados.length > 0) {
      alertList.push({
        id: 'ja-baixado',
        type: 'success',
        title: 'Já Processados',
        message: `${jaBaixados.length} pedidos com estoque já baixado`,
        count: jaBaixados.length
      });
    }

    return alertList;
  }, [orders]);

  if (alerts.length === 0) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'info': return Package;
      case 'success': return CheckCircle2;
      default: return AlertTriangle;
    }
  };

  const getAlertColors = (type: string, urgent?: boolean) => {
    if (urgent) {
      return {
        card: 'border-red-300 bg-red-50',
        icon: 'text-red-600',
        title: 'text-red-800',
        message: 'text-red-700'
      };
    }

    switch (type) {
      case 'warning':
        return {
          card: 'border-yellow-300 bg-yellow-50',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'error':
        return {
          card: 'border-red-300 bg-red-50',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'info':
        return {
          card: 'border-blue-300 bg-blue-50',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      case 'success':
        return {
          card: 'border-green-300 bg-green-50',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700'
        };
      default:
        return {
          card: 'border-gray-300 bg-gray-50',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700'
        };
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-medium text-sm text-muted-foreground">Alertas Automáticos</h4>
      
      {alerts.map((alert) => {
        const IconComponent = getAlertIcon(alert.type);
        const colors = getAlertColors(alert.type, alert.urgent);
        
        return (
          <Card key={alert.id} className={cn("transition-all", colors.card)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconComponent className={cn("h-5 w-5 mt-0.5", colors.icon)} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className={cn("font-medium text-sm", colors.title)}>
                        {alert.title}
                      </h5>
                      {alert.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      )}
                      {alert.count && (
                        <Badge variant="secondary" className="text-xs">
                          {alert.count}
                        </Badge>
                      )}
                    </div>
                    <p className={cn("text-sm", colors.message)}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                
                {alert.action && (
                  <Button variant="outline" size="sm" className="shrink-0">
                    {alert.action}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}