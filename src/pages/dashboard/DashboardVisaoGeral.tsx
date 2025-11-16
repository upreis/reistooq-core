import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { ActivityCalendar } from '@/components/dashboard/ActivityCalendar';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoCalendarData } from '@/hooks/useDevolucaoCalendarData';

export default function DashboardVisaoGeral() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Buscar dados reais de devoluções para o calendário
  const { data: calendarData, loading: calendarLoading, error: calendarError, refresh } = useDevolucaoCalendarData();

  useEffect(() => {
    const fetchOrganizationId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();
        
        if (data?.organizacao_id) {
          setOrganizationId(data.organizacao_id);
        }
      }
    };
    
    fetchOrganizationId();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header com notificações */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">Acompanhe suas métricas em tempo real</p>
        </div>
        <NotificationsBell organizationId={organizationId} />
      </div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Calendário de Devoluções</CardTitle>
            {!calendarLoading && calendarData.length > 0 && (
              <p className="text-xs text-muted-foreground">
                📦 {calendarData.reduce((sum, day) => sum + day.count, 0)} devoluções em {calendarData.length} dias
              </p>
            )}
          </div>
          <button
            onClick={() => refresh()}
            disabled={calendarLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg 
              className={`w-3 h-3 ${calendarLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {calendarLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </CardHeader>
        <CardContent>
          {calendarLoading ? (
            <div className="space-y-4">
              {/* Loading Skeleton */}
              <div className="flex gap-2 items-center">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
              
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-2">
                  <div className="flex flex-col gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="h-8 w-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 26 }).map((_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => (
                          <div 
                            key={dayIndex} 
                            className="w-8 h-8 bg-muted animate-pulse rounded-md"
                            style={{ animationDelay: `${(weekIndex * 7 + dayIndex) * 20}ms` }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              </div>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                Carregando dados de devoluções...
              </div>
            </div>
          ) : (
            <ActivityCalendar 
              data={calendarData}
              title="Prazos de Entrega e Revisão (3 meses atrás - 3 meses à frente)"
              monthsBack={3}
              monthsForward={3}
            />
          )}
          
          {calendarError && (
            <div className="text-center text-sm text-destructive mt-4">
              ⚠️ {calendarError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}