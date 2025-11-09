import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { ActivityCalendar } from '@/components/dashboard/ActivityCalendar';
import { useDevolucaoCalendarData } from '@/features/devolucoes/hooks/useDevolucaoCalendarData';

export default function DashboardVisaoGeral() {
  // Buscar dados reais de devoluções para o calendário
  const { data: calendarData, loading: calendarLoading, error: calendarError } = useDevolucaoCalendarData();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumo do Dia</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.231</div>
            <p className="text-xs text-muted-foreground">
              Total de vendas hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">123</div>
            <p className="text-xs text-muted-foreground">
              Pedidos processados hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">
              Em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Novo pedido #1234</p>
                <p className="text-xs text-muted-foreground">Cliente: João Silva - R$ 299,90</p>
              </div>
              <span className="text-xs text-muted-foreground">2 min</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Estoque atualizado</p>
                <p className="text-xs text-muted-foreground">Produto XYZ - 50 unidades adicionadas</p>
              </div>
              <span className="text-xs text-muted-foreground">5 min</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Alerta de estoque baixo</p>
                <p className="text-xs text-muted-foreground">Produto ABC - apenas 5 unidades restantes</p>
              </div>
              <span className="text-xs text-muted-foreground">1h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário de Devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Devoluções</CardTitle>
        </CardHeader>
        <CardContent>
          {calendarLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando dados do calendário...
            </div>
          )}
          
          {calendarError && (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar calendário: {calendarError}
            </div>
          )}
          
          {!calendarLoading && !calendarError && (
            <ActivityCalendar 
              data={calendarData}
              title="Prazos de Entrega e Revisão (3 meses atrás - 3 meses à frente)"
              monthsBack={3}
              monthsForward={3}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}