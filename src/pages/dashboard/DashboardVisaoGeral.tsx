import React, { useEffect, useState } from 'react';
import { BarChart3, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HorizontalSemesterCalendar } from '@/components/dashboard/HorizontalSemesterCalendar';
import { QuickActionsWidget } from '@/features/dashboard/components/widgets/QuickActionsWidget';
import { ProductStockCard } from '@/components/dashboard/ProductStockCard';
import SimpleDashboard from '@/components/pedidos/dashboard/SimpleDashboard';
import { formatMoney } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoCalendarData } from '@/hooks/useDevolucaoCalendarData';
import { useReclamacoesCalendarData } from '@/hooks/useReclamacoesCalendarData';
import { useEstoqueProducts } from '@/hooks/useEstoqueProducts';

export default function DashboardVisaoGeral() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Dados mockados de vendas (temporário)
  const vendasMes = {
    total: 0,
    quantidade: 0,
    pendentes: 0,
    entregues: 0
  };
  
  // Buscar dados de estoque
  const { highStockProducts, lowStockProducts, loading: stockLoading } = useEstoqueProducts();
  
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
    <div className="space-y-6 p-6 bg-card w-full">
      {/* Cards Analíticos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.7fr_1.5fr_0.65fr]">
        {/* Card 1: Vendas */}
        <Card className="bg-background border-border overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-semibold text-foreground">Vendas do Mês</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {formatMoney(vendasMes.total)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {vendasMes.quantidade} pedidos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Order Status */}
        <Card className="bg-background border-border overflow-hidden">
          <CardContent className="p-6">
            <SimpleDashboard 
              data={{
                total: vendasMes.quantidade,
                valorTotal: vendasMes.total,
                pedidosPendentes: vendasMes.pendentes,
                pedidosEntregues: vendasMes.entregues
              }}
            />
          </CardContent>
        </Card>

        {/* Card 3: Produtos com Maior Estoque */}
        <div>
          {stockLoading ? (
            <Card className="p-6 bg-background">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </Card>
          ) : (
            <ProductStockCard
              title="📈 Produtos com Maior Estoque"
              products={highStockProducts}
              type="high"
            />
          )}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <QuickActionsWidget />

      {/* Grid: Baixo Estoque + Calendário na mesma linha */}
      <div className="grid gap-6 lg:grid-cols-[0.65fr_2fr] items-stretch">
        {/* Card 4: Produtos com Menor Estoque */}
        <div>
          {stockLoading ? (
            <Card className="p-6 bg-background h-full">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </Card>
          ) : (
            <ProductStockCard
              title="📦 Produtos com Menor Estoque"
              products={lowStockProducts}
              type="low"
            />
          )}
        </div>

        {/* Calendário de Atividades */}
        <div>
          {calendarLoading ? (
            <Card className="p-6 bg-background h-full">
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
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive mt-4">
              ⚠️ {calendarError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}