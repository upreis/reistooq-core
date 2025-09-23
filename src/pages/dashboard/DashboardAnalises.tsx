import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

export default function DashboardAnalises() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+24%</div>
            <p className="text-xs text-muted-foreground">Comparado ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-green-600">+0.5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.5%</div>
            <p className="text-xs text-green-600">+2.1% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2x</div>
            <p className="text-xs text-green-600">Retorno sobre investimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Eletrônicos</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">80%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Roupas</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="w-3/5 h-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">60%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Casa & Jardim</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-orange-500"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">40%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Tendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vendas em alta</p>
                  <p className="text-xs text-muted-foreground">Produtos eletrônicos</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sazonalidade detectada</p>
                  <p className="text-xs text-muted-foreground">Roupas de inverno</p>
                </div>
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Oportunidade</p>
                  <p className="text-xs text-muted-foreground">Categoria casa & jardim</p>
                </div>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}