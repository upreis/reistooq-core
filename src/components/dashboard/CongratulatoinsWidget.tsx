import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface CongratualtionsWidgetProps {
  salesGrowth: number;
  userName?: string;
  stats: {
    newOrders: number;
    onHold: number;
    delivered: number;
  };
  chartData: Array<{ value: number }>;
}

export function CongratualtionsWidget({ 
  salesGrowth, 
  userName = 'Usuário',
  stats,
  chartData 
}: CongratualtionsWidgetProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left: Congratulations */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Parabéns, {userName}! 🎉
              </h2>
              <p className="text-muted-foreground">
                Você fez <span className="font-semibold text-primary">{salesGrowth}%</span> mais vendas hoje.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.newOrders} novos pedidos</p>
                  <p className="text-xs text-muted-foreground">Processando</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.onHold} pedidos</p>
                  <p className="text-xs text-muted-foreground">Em espera</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.delivered} pedidos</p>
                  <p className="text-xs text-muted-foreground">Entregues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="url(#salesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Pedidos: <span className="text-primary">276k</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Vendas: $4,679 (↑ 28.14%)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
