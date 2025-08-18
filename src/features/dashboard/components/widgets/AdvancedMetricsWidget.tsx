// 📊 Widget de Métricas Avançadas
// Análises profundas e comparações temporais

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, Target, Clock,
  Percent, Calculator, Award, Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdvancedMetricsProps {
  timeRange: string;
}

export function AdvancedMetricsWidget({ timeRange }: AdvancedMetricsProps) {
  // Dados mockados para demonstração
  const performanceData = [
    { name: 'Jan', vendas: 4000, meta: 5000 },
    { name: 'Fev', vendas: 3000, meta: 4500 },
    { name: 'Mar', vendas: 5000, meta: 5500 },
    { name: 'Abr', vendas: 4500, meta: 5000 },
    { name: 'Mai', vendas: 6000, meta: 6500 },
    { name: 'Jun', vendas: 5500, meta: 6000 },
  ];

  const efficiencyMetrics = [
    { label: 'Taxa de Conversão', value: 23.5, target: 25, color: 'success' },
    { label: 'Tempo Médio de Processo', value: 87, target: 90, color: 'warning' },
    { label: 'Satisfação do Cliente', value: 94, target: 95, color: 'primary' },
    { label: 'Produtividade', value: 78, target: 85, color: 'destructive' },
  ];

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'destructive': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Métricas Avançadas
          <Badge variant="outline" className="ml-auto">
            {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : timeRange === '90d' ? '3 meses' : '1 ano'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Performance vs Meta */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance vs Meta
          </h4>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="vendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#vendas)"
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Média Atual:</span>
              <span className="font-semibold">R$ 4.667</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Meta Média:</span>
              <span className="font-semibold">R$ 5.333</span>
            </div>
          </div>
        </div>

        {/* Métricas de Eficiência */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Eficiência Operacional
          </h4>
          
          <div className="space-y-4">
            {efficiencyMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {metric.value}% / {metric.target}%
                    </span>
                    {metric.value >= metric.target ? (
                      <Award className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <Progress value={metric.value} className="h-2" />
                  <div 
                    className="absolute top-0 w-0.5 h-2 bg-muted-foreground"
                    style={{ left: `${metric.target}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Automáticos */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Insights Automáticos
          </h4>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-success" />
              <span>Vendas cresceram 15% comparado ao período anterior</span>
            </li>
            <li className="flex items-center gap-2">
              <Percent className="h-3 w-3 text-warning" />
              <span>Taxa de conversão pode melhorar 6% com otimizações</span>
            </li>
            <li className="flex items-center gap-2">
              <Target className="h-3 w-3 text-primary" />
              <span>Faltam 12% para atingir a meta mensal</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}