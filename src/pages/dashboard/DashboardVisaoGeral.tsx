import React, { useEffect, useState } from 'react';
import { BarChart3, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HorizontalSemesterCalendar } from '@/components/dashboard/HorizontalSemesterCalendar';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { QuickActionsWidget } from '@/features/dashboard/components/widgets/QuickActionsWidget';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoCalendarData } from '@/hooks/useDevolucaoCalendarData';
import { useReclamacoesCalendarData } from '@/hooks/useReclamacoesCalendarData';

export default function DashboardVisaoGeral() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Buscar dados reais de devoluções para o calendário
  const { data: calendarDataDevolucoes, loading: calendarLoadingDevolucoes, error: calendarErrorDevolucoes, refresh: refreshDevolucoes } = useDevolucaoCalendarData();
  
  // Buscar dados reais de reclamações para o calendário
  const { data: calendarDataReclamacoes, loading: calendarLoadingReclamacoes, error: calendarErrorReclamacoes, refresh: refreshReclamacoes } = useReclamacoesCalendarData();
  
  // Combinar dados de devoluções e reclamações
  const calendarData = [...calendarDataDevolucoes, ...calendarDataReclamacoes];
  const calendarLoading = calendarLoadingDevolucoes || calendarLoadingReclamacoes;
  const calendarError = calendarErrorDevolucoes || calendarErrorReclamacoes;
  
  const refresh = () => {
    refreshDevolucoes();
    refreshReclamacoes();
  };

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
    <div className="space-y-6 p-6 bg-card">
      {/* Header com notificações */}
      <div className="flex items-center justify-end">
        <NotificationsBell organizationId={organizationId} />
      </div>

      {/* Atalhos Rápidos - Card Unificado */}
      <Card className="bg-background p-0 overflow-hidden">
        <div className="flex items-stretch">
          {/* Seção de Título */}
          <div className="flex items-center justify-center px-8 py-6 border-r-2 border-border min-w-[240px]">
            <div className="space-y-1">
              <h1 className="text-xl font-bold whitespace-nowrap">Acesso Rápido</h1>
              <p className="text-sm text-muted-foreground">
                Acesse rapidamente<br />
                suas páginas favoritas
              </p>
            </div>
          </div>

          {/* Seção de Ícones */}
          <div className="flex-1 flex items-center py-2">
            <QuickActionsWidget />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-background">
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

        <Card className="bg-background">
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

        <Card className="bg-background">
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

      {/* Calendário de Atividades */}
      {calendarLoading ? (
        <Card className="p-6 bg-background">
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
              Carregando dados de atividades...
            </div>
          </div>
        </Card>
      ) : (
        <HorizontalSemesterCalendar 
          data={calendarData}
        />
      )}
      
      {calendarError && (
        <div className="text-center text-sm text-destructive mt-4">
          ⚠️ {calendarError}
        </div>
      )}
    </div>
  );
}