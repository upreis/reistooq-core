/**
 * 📊 PERFORMANCE MONITOR
 * Utilities for monitoring and measuring performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = true;

  /**
   * Habilita ou desabilita o monitor (útil para produção)
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Inicia timer para medir duração de operação
   */
  start(name: string): void {
    if (!this.enabled) return;
    this.timers.set(name, performance.now());
  }

  /**
   * Finaliza timer e registra métrica
   */
  end(name: string, metadata?: Record<string, unknown>): number | null {
    if (!this.enabled) return null;

    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] Timer "${name}" não foi iniciado`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Limitar a 100 métricas para evitar memory leak
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    return duration;
  }

  /**
   * Mede duração de função assíncrona
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    this.start(name);
    try {
      const result = await fn();
      const duration = this.end(name, metadata);
      
      if (duration && duration > 1000) {
        console.warn(`[Performance] ${name} demorou ${duration.toFixed(2)}ms`, metadata);
      }
      
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Obtém todas as métricas registradas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Obtém métricas por nome
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Calcula média de duração para métrica específica
   */
  getAverageDuration(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Gera relatório de performance
   */
  getReport(): string {
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      report += `${name}:\n`;
      report += `  Calls: ${durations.length}\n`;
      report += `  Avg: ${avg.toFixed(2)}ms\n`;
      report += `  Min: ${min.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n\n`;
    });

    return report;
  }

  /**
   * Limpa todas as métricas
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

// Exportar instância singleton
export const performanceMonitor = new PerformanceMonitor();

// Desabilitar em produção por padrão
if (import.meta.env.PROD) {
  performanceMonitor.setEnabled(false);
}

export { PerformanceMonitor };
