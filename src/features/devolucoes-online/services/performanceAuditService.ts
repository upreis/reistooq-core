import { supabase } from '@/integrations/supabase/client';

/**
 * SPRINT 3: Serviço para registrar métricas de performance em audit_logs
 * Permite rastreamento histórico e análise de tendências
 */

export interface PerformanceMetric {
  metric_type: 'query_performance' | 'index_usage' | 'fill_rate' | 'system_alert';
  metric_value: number;
  metric_unit: string;
  threshold_exceeded?: boolean;
  details?: Record<string, any>;
}

export class PerformanceAuditService {
  /**
   * Registra métrica de performance em audit_logs
   * NOTA: Desabilitado temporariamente - usar console.log para debug
   */
  static async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    console.log('[Performance Metric]', {
      type: metric.metric_type,
      value: metric.metric_value,
      unit: metric.metric_unit,
      exceeded: metric.threshold_exceeded
    });
    // TODO: Implementar com organization_id quando disponível
  }

  /**
   * Registra alerta de performance crítico
   * NOTA: Desabilitado temporariamente - usar console.warn para debug
   */
  static async logCriticalAlert(
    alertType: string,
    message: string,
    severity: 'warning' | 'error',
    metadata?: Record<string, any>
  ): Promise<void> {
    const logMethod = severity === 'error' ? console.error : console.warn;
    logMethod(`[Performance Alert] ${alertType}:`, message, metadata);
    // TODO: Implementar com organization_id quando disponível
  }

  /**
   * Busca histórico de métricas dos últimos N dias
   * NOTA: Retorna mock data até integração com audit_logs estar completa
   */
  static async getMetricsHistory(days: number = 7): Promise<any[]> {
    console.log('[Mock] getMetricsHistory called for', days, 'days');
    // TODO: Implementar query real quando audit_logs estiver configurado
    return [];
  }

  /**
   * Busca alertas críticos recentes
   * NOTA: Retorna mock data até integração com audit_logs estar completa
   */
  static async getRecentAlerts(limit: number = 10): Promise<any[]> {
    console.log('[Mock] getRecentAlerts called with limit', limit);
    // TODO: Implementar query real quando audit_logs estiver configurado
    return [];
  }

  /**
   * Analisa métricas e dispara alertas automáticos se necessário
   */
  static async analyzeAndAlert(metrics: any): Promise<void> {
    const { summary, query_performance } = metrics;

    // Alerta: Tempo médio de query alto
    if (summary.avg_query_time > 300) {
      await this.logCriticalAlert(
        'slow_query_performance',
        `Tempo médio de query acima do limite: ${summary.avg_query_time.toFixed(1)}ms`,
        'warning',
        { avg_query_time: summary.avg_query_time, threshold: 300 }
      );
    }

    // Alerta: Query específica muito lenta
    const slowQueries = query_performance.filter((q: any) => q.avg_execution_time_ms > 500);
    if (slowQueries.length > 0) {
      await this.logCriticalAlert(
        'critical_slow_queries',
        `${slowQueries.length} queries com performance crítica detectadas`,
        'error',
        { slow_queries: slowQueries.map((q: any) => q.query_type) }
      );
    }

    // Alerta: Fill rate baixo
    if (summary.avg_fill_rate < 50) {
      await this.logCriticalAlert(
        'low_fill_rate',
        `Taxa de preenchimento JSONB abaixo de 50%: ${summary.avg_fill_rate.toFixed(1)}%`,
        'warning',
        { avg_fill_rate: summary.avg_fill_rate }
      );
    }

    // Registrar métricas gerais
    await this.logPerformanceMetric({
      metric_type: 'query_performance',
      metric_value: summary.avg_query_time,
      metric_unit: 'ms',
      threshold_exceeded: summary.avg_query_time > 300
    });

    await this.logPerformanceMetric({
      metric_type: 'fill_rate',
      metric_value: summary.avg_fill_rate,
      metric_unit: '%',
      threshold_exceeded: summary.avg_fill_rate < 50
    });
  }
}
