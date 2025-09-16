/**
 * 📊 PAINEL DE MÉTRICAS AVANÇADAS - FASE 5
 * Dashboard com insights das 42 novas colunas
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Shield, 
  DollarSign,
  Activity,
  Star,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DevolucaoMetrics } from '../types/devolucao-avancada.types';
// Utility functions
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

interface DevolucaoMetricsPanelProps {
  metricas: DevolucaoMetrics;
  periodo?: string;
  comparacao?: DevolucaoMetrics | null;
  compactMode?: boolean;
}

export function DevolucaoMetricsPanel({
  metricas,
  periodo = '30 dias',
  comparacao = null,
  compactMode = false
}: DevolucaoMetricsPanelProps) {

  // ===== CÁLCULOS DE COMPARAÇÃO =====
  const calcularTendencia = (atual: number, anterior?: number) => {
    if (!anterior || anterior === 0) return null;
    const percentual = ((atual - anterior) / anterior) * 100;
    return {
      percentual: Math.abs(percentual),
      direcao: percentual >= 0 ? 'up' : 'down',
      isPositive: percentual >= 0
    };
  };

  const TendenciaIcon = ({ tendencia }: { tendencia: any }) => {
    if (!tendencia) return null;
    
    const Icon = tendencia.direcao === 'up' ? TrendingUp : TrendingDown;
    const color = tendencia.isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {tendencia.percentual.toFixed(1)}%
        </span>
      </div>
    );
  };

  // ===== COMPONENTES DE MÉTRICA =====
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = "blue",
    tendencia,
    progress,
    badge
  }: any) => (
    <Card>
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${compactMode ? 'pb-2' : 'pb-2'}`}>
        <CardTitle className={`text-sm font-medium ${compactMode ? 'text-xs' : ''}`}>
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold`}>
              {value}
            </div>
            {subtitle && (
              <p className={`text-xs text-muted-foreground ${compactMode ? 'hidden' : ''}`}>
                {subtitle}
              </p>
            )}
          </div>
          {tendencia && <TendenciaIcon tendencia={tendencia} />}
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2" />
        )}
      </CardContent>
    </Card>
  );

  // ===== DISTRIBUIÇÃO POR PRIORIDADE =====
  const PriorityDistribution = () => {
    const total = metricas.total_count;
    const priorities = ['critical', 'high', 'medium', 'low'];
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500', 
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Distribuição por Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {priorities.map(priority => {
              const count = metricas.by_priority[priority] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[priority as keyof typeof colors]}`} />
                    <span className="text-sm capitalize">{priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count}</span>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== MÉTRICAS DE TEMPO =====
  const TimeMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Métricas de Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tempo médio de resposta</span>
            <span className="font-semibold">
              {formatDuration(metricas.avg_response_time * 60)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tempo médio de resolução</span>
            <span className="font-semibold">
              {formatDuration(metricas.avg_resolution_time * 60)}
            </span>
          </div>
          
          {/* Barra de progresso para satisfação */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Satisfação média</span>
              <span className="font-semibold">{metricas.avg_satisfaction.toFixed(1)}/5</span>
            </div>
            <Progress value={(metricas.avg_satisfaction / 5) * 100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ===== ALERTAS E AÇÕES =====
  const AlertsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Alertas e Ações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metricas.overdue_actions_count > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-md">
              <span className="text-sm text-red-800">Ações em atraso</span>
              <Badge variant="destructive">{metricas.overdue_actions_count}</Badge>
            </div>
          )}
          
          {metricas.high_priority_count > 0 && (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
              <span className="text-sm text-orange-800">Alta prioridade</span>
              <Badge variant="secondary">{metricas.high_priority_count}</Badge>
            </div>
          )}
          
          {metricas.unread_messages_count > 0 && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
              <span className="text-sm text-blue-800">Mensagens não lidas</span>
              <Badge variant="outline">{metricas.unread_messages_count}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ===== IMPACTO FINANCEIRO =====
  const FinancialImpact = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          Impacto Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor total retido</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(metricas.total_value)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Custos de envio</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(metricas.financial_impact.shipping_costs)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Compensações</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(metricas.financial_impact.compensation_costs)}
            </span>
          </div>
          
          <hr />
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Impacto líquido</span>
            <span className="font-bold text-red-600">
              {formatCurrency(
                metricas.total_value + 
                metricas.financial_impact.shipping_costs + 
                metricas.financial_impact.compensation_costs
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ===== RENDER PRINCIPAL =====
  const gridCols = compactMode ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className={`grid ${gridCols} gap-4`}>
        <MetricCard
          title="Total de Devoluções"
          value={metricas.total_count.toLocaleString()}
          subtitle={`Últimos ${periodo}`}
          icon={BarChart3}
          color="blue"
          tendencia={comparacao ? calcularTendencia(metricas.total_count, comparacao.total_count) : null}
        />
        
        <MetricCard
          title="Alta Prioridade"
          value={metricas.high_priority_count}
          subtitle="Críticas + Altas"
          icon={AlertTriangle}
          color="orange"
          badge={metricas.high_priority_count > 0 ? "Atenção" : undefined}
        />
        
        <MetricCard
          title="Taxa de Escalação"
          value={`${metricas.escalation_rate.toFixed(1)}%`}
          subtitle="Para o Mercado Livre"
          icon={Shield}
          color="red"
          progress={metricas.escalation_rate}
        />
        
        <MetricCard
          title="Taxa de Mediação"
          value={`${metricas.mediation_rate.toFixed(1)}%`}
          subtitle="Em processo de mediação"
          icon={Activity}
          color="purple"
          progress={metricas.mediation_rate}
        />
      </div>

      {/* Dashboards detalhados */}
      {!compactMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PriorityDistribution />
          <TimeMetrics />
          <AlertsPanel />
        </div>
      )}

      {/* Impacto financeiro */}
      {!compactMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialImpact />
          
          {/* Card de resumo executivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>{metricas.total_count}</strong> devoluções no período,
                  com <strong>{metricas.high_priority_count}</strong> casos de alta prioridade.
                </p>
                
                <p>
                  Tempo médio de resposta: <strong>{formatDuration(metricas.avg_response_time * 60)}</strong>.
                  Satisfação: <strong>{metricas.avg_satisfaction.toFixed(1)}/5</strong>.
                </p>
                
                {metricas.overdue_actions_count > 0 && (
                  <p className="text-red-600">
                    ⚠️ <strong>{metricas.overdue_actions_count}</strong> ações em atraso requerem atenção imediata.
                  </p>
                )}
                
                {metricas.unread_messages_count > 0 && (
                  <p className="text-orange-600">
                    📧 <strong>{metricas.unread_messages_count}</strong> mensagens não lidas.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}