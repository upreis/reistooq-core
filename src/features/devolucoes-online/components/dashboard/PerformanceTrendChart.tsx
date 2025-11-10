import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * SPRINT 3: Gráfico de tendências de performance
 * Mostra evolução temporal das métricas usando Recharts
 */

interface TrendDataPoint {
  timestamp: string;
  avg_query_time: number;
  fill_rate: number;
  total_records: number;
}

interface PerformanceTrendChartProps {
  data: TrendDataPoint[];
  metric: 'query_time' | 'fill_rate' | 'records';
  title: string;
  description?: string;
}

export const PerformanceTrendChart = memo<PerformanceTrendChartProps>(({ 
  data, 
  metric, 
  title,
  description 
}) => {
  const getMetricConfig = () => {
    switch (metric) {
      case 'query_time':
        return {
          dataKey: 'avg_query_time',
          color: '#8884d8',
          unit: 'ms',
          icon: Activity
        };
      case 'fill_rate':
        return {
          dataKey: 'fill_rate',
          color: '#82ca9d',
          unit: '%',
          icon: TrendingUp
        };
      case 'records':
        return {
          dataKey: 'total_records',
          color: '#ffc658',
          unit: '',
          icon: TrendingDown
        };
      default:
        return {
          dataKey: 'avg_query_time',
          color: '#8884d8',
          unit: 'ms',
          icon: Activity
        };
    }
  };

  const config = getMetricConfig();
  const MetricIcon = config.icon;

  // Calcular tendência
  const trend = data.length >= 2 
    ? ((data[data.length - 1][config.dataKey as keyof TrendDataPoint] as number) - 
       (data[0][config.dataKey as keyof TrendDataPoint] as number)) > 0 
      ? 'up' 
      : 'down'
    : 'neutral';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MetricIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-semibold">
              {trend === 'up' ? 'Crescendo' : trend === 'down' ? 'Decrescendo' : 'Estável'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: config.unit, 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area 
              type="monotone" 
              dataKey={config.dataKey} 
              stroke={config.color} 
              fill={`url(#gradient-${metric})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

PerformanceTrendChart.displayName = 'PerformanceTrendChart';

/**
 * Gráfico de barras comparativo
 */
interface ComparisonBarChartProps {
  data: any[];
  title: string;
  description?: string;
}

export const ComparisonBarChart = memo<ComparisonBarChartProps>(({ data, title, description }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

ComparisonBarChart.displayName = 'ComparisonBarChart';
