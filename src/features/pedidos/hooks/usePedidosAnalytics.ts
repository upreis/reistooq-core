/**
 * 🚀 FASE 3: HOOK PARA ANALYTICS
 * Facilita uso de analytics em componentes React
 */

import { useMemo } from 'react';
import { Pedido } from '@/types/pedido';
import { 
  pedidosAnalytics, 
  PedidosMetrics, 
  PedidosInsights,
  formatMetric 
} from '../services/PedidosAnalytics';

interface UsePedidosAnalyticsOptions {
  pedidos: Pedido[];
  historical?: Pedido[];
  enableInsights?: boolean;
}

interface UsePedidosAnalyticsReturn {
  // Métricas
  metrics: PedidosMetrics;
  
  // Insights (opcional)
  insights?: PedidosInsights;
  
  // Helpers de formatação
  formatters: {
    currency: (value: number) => string;
    percentage: (value: number) => string;
    number: (value: number) => string;
  };
  
  // Stats rápidos
  stats: {
    performanceIndicators: Array<{
      label: string;
      value: string;
      trend?: 'up' | 'down' | 'stable';
      severity?: 'success' | 'warning' | 'error';
    }>;
  };
}

/**
 * Hook para analytics de pedidos
 * 
 * ⚠️ NOTA: Hook estrutural da Fase 3
 * - Funcional e seguro para uso
 * - Cálculos locais (não requer API)
 * - Pode ser usado em componentes novos
 * 
 * @example
 * ```tsx
 * function DashboardStats() {
 *   const { metrics, stats, formatters } = usePedidosAnalytics({
 *     pedidos: allOrders,
 *     enableInsights: true
 *   });
 * 
 *   return (
 *     <div>
 *       <h2>Total: {formatters.currency(metrics.valorTotal)}</h2>
 *       <p>Taxa pagamento: {formatters.percentage(metrics.taxaPagamento)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePedidosAnalytics(
  options: UsePedidosAnalyticsOptions
): UsePedidosAnalyticsReturn {
  const { pedidos, historical, enableInsights = false } = options;

  // Calcula métricas (memoizado)
  const metrics = useMemo(
    () => pedidosAnalytics.calculateMetrics(pedidos),
    [pedidos]
  );

  // Calcula insights (memoizado)
  const insights = useMemo(() => {
    if (!enableInsights) return undefined;
    return pedidosAnalytics.analyze(pedidos, historical);
  }, [pedidos, historical, enableInsights]);

  // Formatters prontos para uso
  const formatters = useMemo(() => ({
    currency: (value: number) => formatMetric(value, 'currency'),
    percentage: (value: number) => formatMetric(value, 'percentage'),
    number: (value: number) => formatMetric(value, 'number'),
  }), []);

  // Performance indicators para dashboard
  const stats = useMemo(() => {
    const indicators: Array<{
      label: string;
      value: string;
      trend?: 'up' | 'down' | 'stable';
      severity?: 'success' | 'warning' | 'error';
    }> = [
      {
        label: 'Total de Pedidos',
        value: formatters.number(metrics.totalPedidos),
      },
      {
        label: 'Valor Total',
        value: formatters.currency(metrics.valorTotal),
      },
      {
        label: 'Ticket Médio',
        value: formatters.currency(metrics.ticketMedio),
        trend: metrics.crescimentoMensal > 0 ? 'up' : 'down',
      },
      {
        label: 'Taxa de Pagamento',
        value: formatters.percentage(metrics.taxaPagamento),
        severity: metrics.taxaPagamento > 80 ? 'success' : 
                 metrics.taxaPagamento > 60 ? 'warning' : 'error',
      },
      {
        label: 'Pedidos Pendentes',
        value: String(metrics.pedidosPendentes),
        severity: metrics.pedidosPendentes > 50 ? 'warning' : 'success',
      },
    ];

    // Adiciona indicadores de insights se habilitado
    if (insights) {
      if (insights.anomalies.length > 0) {
        indicators.push({
          label: 'Anomalias',
          value: String(insights.anomalies.length),
          severity: insights.anomalies.some(a => a.severity === 'high') ? 'error' : 'warning',
        });
      }

      if (insights.recommendations.length > 0) {
        indicators.push({
          label: 'Recomendações',
          value: String(insights.recommendations.length),
          severity: 'warning',
        });
      }
    }

    return { performanceIndicators: indicators };
  }, [metrics, insights, formatters]);

  return {
    metrics,
    insights,
    formatters,
    stats,
  };
}

/**
 * Hook simplificado apenas para métricas rápidas
 */
export function usePedidosMetrics(pedidos: Pedido[]): PedidosMetrics {
  return useMemo(
    () => pedidosAnalytics.calculateMetrics(pedidos),
    [pedidos]
  );
}

/**
 * Hook para comparação de períodos
 */
export function usePedidosComparison(
  currentPeriod: Pedido[],
  previousPeriod: Pedido[]
) {
  const currentMetrics = usePedidosMetrics(currentPeriod);
  const previousMetrics = usePedidosMetrics(previousPeriod);

  const comparison = useMemo(() => {
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      volumeChange: calcChange(currentMetrics.totalPedidos, previousMetrics.totalPedidos),
      valorChange: calcChange(currentMetrics.valorTotal, previousMetrics.valorTotal),
      ticketChange: calcChange(currentMetrics.ticketMedio, previousMetrics.ticketMedio),
      taxaPagamentoChange: currentMetrics.taxaPagamento - previousMetrics.taxaPagamento,
    };
  }, [currentMetrics, previousMetrics]);

  return {
    current: currentMetrics,
    previous: previousMetrics,
    comparison,
  };
}
