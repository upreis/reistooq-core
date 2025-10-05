import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Package, Building2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartData {
  dailySales: Array<{ data: string; vendas: number; valor: number }>;
  topProducts: Array<{ nome: string; quantidade: number; valor: number }>;
  salesByChannel: Array<{ empresa: string; vendas: number; valor: number }>;
  monthlyGoal: number;
  currentMonthSales: number;
}

interface DashboardChartsProps {
  data: ChartData;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const [activeChart, setActiveChart] = useState<'line' | 'bar' | 'pie'>('line');

  const gaugePercentage = (data.currentMonthSales / data.monthlyGoal) * 100;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart - Sales Evolution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolução de Vendas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeChart === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('line')}
              >
                Temporal
              </Button>
              <Button
                variant={activeChart === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('bar')}
              >
                Produtos
              </Button>
              <Button
                variant={activeChart === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('pie')}
              >
                Canais
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeChart === 'line' && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {activeChart === 'bar' && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="quantidade" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {activeChart === 'pie' && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.salesByChannel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ empresa, percent }: any) => `${empresa}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="vendas"
                >
                  {data.salesByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gauge Chart - Monthly Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meta Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${(gaugePercentage / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-1000"
                />
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-4xl font-bold fill-current"
                >
                  {Math.min(gaugePercentage, 100).toFixed(0)}%
                </text>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">
                {data.currentMonthSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm text-muted-foreground">
                Meta: {data.monthlyGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products Mini List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm truncate max-w-[150px]">{product.nome}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{product.quantidade}</div>
                  <div className="text-xs text-muted-foreground">vendas</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
