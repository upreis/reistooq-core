/**
 * 🚀 FASE 3: SISTEMA DE ANALYTICS AVANÇADO
 * Coleta, agregação e análise de dados de pedidos
 */

import { Pedido } from '@/types/pedido';

/**
 * Métricas agregadas de pedidos
 */
export interface PedidosMetrics {
  // Volume
  totalPedidos: number;
  pedidosHoje: number;
  pedidosSemana: number;
  pedidosMes: number;
  
  // Valores
  valorTotal: number;
  valorMedio: number;
  ticketMedio: number;
  
  // Status
  pedidosPendentes: number;
  pedidosPagos: number;
  pedidosCancelados: number;
  pedidosEntregues: number;
  
  // Taxa de conversão
  taxaPagamento: number;
  taxaCancelamento: number;
  taxaEntrega: number;
  
  // Tendências
  crescimentoDiario: number;
  crescimentoSemanal: number;
  crescimentoMensal: number;
}

/**
 * Insights e anomalias detectadas
 */
export interface PedidosInsights {
  anomalies: Array<{
    type: 'spike' | 'drop' | 'unusual_value' | 'unusual_pattern';
    severity: 'low' | 'medium' | 'high';
    message: string;
    data: any;
    timestamp: Date;
  }>;
  
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    significance: 'low' | 'medium' | 'high';
  }>;
  
  predictions: Array<{
    metric: string;
    predictedValue: number;
    confidence: number;
    timeframe: string;
  }>;
  
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action?: string;
  }>;
}

/**
 * Serviço de analytics para pedidos
 */
class PedidosAnalyticsService {
  /**
   * Calcula métricas agregadas de uma lista de pedidos
   */
  calculateMetrics(pedidos: Pedido[]): PedidosMetrics {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtros por período
    const pedidosHoje = pedidos.filter(p => 
      new Date(p.data_pedido) >= today
    );
    const pedidosSemana = pedidos.filter(p => 
      new Date(p.data_pedido) >= weekAgo
    );
    const pedidosMes = pedidos.filter(p => 
      new Date(p.data_pedido) >= monthAgo
    );

    // Valores
    const valorTotal = pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    const valorMedio = pedidos.length > 0 ? valorTotal / pedidos.length : 0;

    // Status
    const pedidosPagos = pedidos.filter(p => 
      p.situacao === 'paid' || p.situacao === 'pago'
    ).length;
    const pedidosCancelados = pedidos.filter(p => 
      p.situacao === 'cancelled' || p.situacao === 'cancelado'
    ).length;
    const pedidosEntregues = pedidos.filter(p => 
      p.situacao === 'delivered' || p.situacao === 'entregue'
    ).length;
    const pedidosPendentes = pedidos.length - pedidosPagos - pedidosCancelados;

    // Taxas
    const total = pedidos.length || 1; // Evita divisão por zero
    const taxaPagamento = (pedidosPagos / total) * 100;
    const taxaCancelamento = (pedidosCancelados / total) * 100;
    const taxaEntrega = (pedidosEntregues / total) * 100;

    // Crescimento (simplificado para MVP)
    const crescimentoDiario = pedidosHoje.length;
    const crescimentoSemanal = ((pedidosSemana.length / 7) / (pedidosMes.length / 30) - 1) * 100;
    const crescimentoMensal = pedidosMes.length;

    return {
      totalPedidos: pedidos.length,
      pedidosHoje: pedidosHoje.length,
      pedidosSemana: pedidosSemana.length,
      pedidosMes: pedidosMes.length,
      
      valorTotal,
      valorMedio,
      ticketMedio: valorMedio,
      
      pedidosPendentes,
      pedidosPagos,
      pedidosCancelados,
      pedidosEntregues,
      
      taxaPagamento: Math.round(taxaPagamento * 100) / 100,
      taxaCancelamento: Math.round(taxaCancelamento * 100) / 100,
      taxaEntrega: Math.round(taxaEntrega * 100) / 100,
      
      crescimentoDiario,
      crescimentoSemanal: Math.round(crescimentoSemanal * 100) / 100,
      crescimentoMensal,
    };
  }

  /**
   * Detecta anomalias e padrões incomuns
   */
  detectAnomalies(pedidos: Pedido[], historical?: Pedido[]): PedidosInsights['anomalies'] {
    const anomalies: PedidosInsights['anomalies'] = [];
    
    if (!pedidos.length) return anomalies;

    // Valores médios para comparação
    const valorMedio = pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0) / pedidos.length;
    const valorMax = Math.max(...pedidos.map(p => p.valor_total || 0));
    
    // Detecta pedidos com valor muito acima da média (possível fraude ou VIP)
    pedidos.forEach(pedido => {
      if ((pedido.valor_total || 0) > valorMedio * 3) {
        anomalies.push({
          type: 'unusual_value',
          severity: 'medium',
          message: `Pedido ${pedido.numero} com valor ${(pedido.valor_total || 0).toFixed(2)} muito acima da média ${valorMedio.toFixed(2)}`,
          data: { pedidoId: pedido.id, valor: pedido.valor_total, media: valorMedio },
          timestamp: new Date()
        });
      }
    });

    // Detecta spike no volume (muitos pedidos em curto período)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = pedidos.filter(p => new Date(p.data_pedido) >= hoje);
    
    if (historical) {
      const mediaHistorica = historical.length / 30; // Média diária do último mês
      if (pedidosHoje.length > mediaHistorica * 2) {
        anomalies.push({
          type: 'spike',
          severity: 'high',
          message: `Volume de pedidos hoje (${pedidosHoje.length}) 2x maior que a média (${Math.round(mediaHistorica)})`,
          data: { hoje: pedidosHoje.length, media: mediaHistorica },
          timestamp: new Date()
        });
      }
    }

    return anomalies;
  }

  /**
   * Analisa tendências nos dados
   */
  analyzeTrends(pedidos: Pedido[]): PedidosInsights['trends'] {
    const trends: PedidosInsights['trends'] = [];
    
    if (pedidos.length < 7) return trends; // Dados insuficientes

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const lastWeek = pedidos.filter(p => {
      const date = new Date(p.data_pedido);
      return date >= weekAgo && date < today;
    });

    const previousWeek = pedidos.filter(p => {
      const date = new Date(p.data_pedido);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    // Tendência de volume
    if (previousWeek.length > 0) {
      const volumeChange = ((lastWeek.length - previousWeek.length) / previousWeek.length) * 100;
      trends.push({
        metric: 'volume',
        direction: volumeChange > 5 ? 'up' : volumeChange < -5 ? 'down' : 'stable',
        percentage: Math.abs(Math.round(volumeChange * 100) / 100),
        significance: Math.abs(volumeChange) > 20 ? 'high' : Math.abs(volumeChange) > 10 ? 'medium' : 'low'
      });
    }

    // Tendência de valor médio
    const valorMedioLastWeek = lastWeek.reduce((sum, p) => sum + (p.valor_total || 0), 0) / (lastWeek.length || 1);
    const valorMedioPreviousWeek = previousWeek.reduce((sum, p) => sum + (p.valor_total || 0), 0) / (previousWeek.length || 1);
    
    if (valorMedioPreviousWeek > 0) {
      const valorChange = ((valorMedioLastWeek - valorMedioPreviousWeek) / valorMedioPreviousWeek) * 100;
      trends.push({
        metric: 'ticket_medio',
        direction: valorChange > 5 ? 'up' : valorChange < -5 ? 'down' : 'stable',
        percentage: Math.abs(Math.round(valorChange * 100) / 100),
        significance: Math.abs(valorChange) > 15 ? 'high' : Math.abs(valorChange) > 7 ? 'medium' : 'low'
      });
    }

    return trends;
  }

  /**
   * Gera recomendações baseadas em análise
   */
  generateRecommendations(
    metrics: PedidosMetrics,
    anomalies: PedidosInsights['anomalies'],
    trends: PedidosInsights['trends']
  ): PedidosInsights['recommendations'] {
    const recommendations: PedidosInsights['recommendations'] = [];

    // Taxa de cancelamento alta
    if (metrics.taxaCancelamento > 15) {
      recommendations.push({
        title: 'Taxa de Cancelamento Elevada',
        description: `${metrics.taxaCancelamento.toFixed(1)}% dos pedidos foram cancelados. Investigar causas.`,
        priority: 'high',
        action: 'review_cancellations'
      });
    }

    // Muitos pedidos pendentes
    if (metrics.pedidosPendentes > metrics.totalPedidos * 0.3) {
      recommendations.push({
        title: 'Muitos Pedidos Pendentes',
        description: `${metrics.pedidosPendentes} pedidos aguardando processamento (${((metrics.pedidosPendentes / metrics.totalPedidos) * 100).toFixed(1)}%).`,
        priority: 'medium',
        action: 'process_pending'
      });
    }

    // Anomalias detectadas
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      recommendations.push({
        title: 'Anomalias Detectadas',
        description: `${highSeverityAnomalies.length} anomalia(s) de alta severidade requerem atenção.`,
        priority: 'high',
        action: 'review_anomalies'
      });
    }

    // Tendência negativa
    const negativeTrends = trends.filter(t => t.direction === 'down' && t.significance !== 'low');
    if (negativeTrends.length > 0) {
      recommendations.push({
        title: 'Tendência de Queda',
        description: `Detectada queda em ${negativeTrends.map(t => t.metric).join(', ')}.`,
        priority: 'medium',
        action: 'analyze_trends'
      });
    }

    return recommendations;
  }

  /**
   * Análise completa de pedidos com insights
   */
  analyze(pedidos: Pedido[], historical?: Pedido[]): PedidosInsights {
    const metrics = this.calculateMetrics(pedidos);
    const anomalies = this.detectAnomalies(pedidos, historical);
    const trends = this.analyzeTrends(historical || pedidos);
    const recommendations = this.generateRecommendations(metrics, anomalies, trends);

    return {
      anomalies,
      trends,
      predictions: [], // TODO: Implementar ML predictions
      recommendations
    };
  }

  /**
   * Exporta dados para análise externa
   */
  exportAnalytics(pedidos: Pedido[], format: 'json' | 'csv' = 'json'): string {
    const metrics = this.calculateMetrics(pedidos);
    
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    // CSV format
    const headers = Object.keys(metrics).join(',');
    const values = Object.values(metrics).join(',');
    return `${headers}\n${values}`;
  }
}

// Singleton instance
export const pedidosAnalytics = new PedidosAnalyticsService();

/**
 * Helper para formatar métricas para exibição
 */
export const formatMetric = (value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string => {
  switch (type) {
    case 'currency':
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return value.toLocaleString('pt-BR');
    default:
      return String(value);
  }
};
