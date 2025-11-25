import React, { useEffect, useState } from 'react';
import { BarChart3, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HorizontalSemesterCalendar } from '@/components/dashboard/HorizontalSemesterCalendar';
import { QuickActionsWidget } from '@/features/dashboard/components/widgets/QuickActionsWidget';
import { ProductStockCard } from '@/components/dashboard/ProductStockCard';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoCalendarData } from '@/hooks/useDevolucaoCalendarData';
import { useReclamacoesCalendarData } from '@/hooks/useReclamacoesCalendarData';
import { useEstoqueProducts } from '@/hooks/useEstoqueProducts';

export default function DashboardVisaoGeral() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.7fr_1.5fr_auto]">
        {/* Card 1: Vendas */}
        <Card className="bg-background border-border overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas</p>
                  <h3 className="text-3xl font-bold mt-1">R$ 45.231</h3>
                  <span className="inline-flex items-center text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full mt-2">
                    +8.2%
                  </span>
                </div>
              </div>
              
              <div className="flex items-end justify-between h-32 gap-2">
                {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div 
                      className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground text-center mt-1">
                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Mercado Livre</span>
                  </div>
                  <span className="font-medium">58%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-muted-foreground">Shopee</span>
                  </div>
                  <span className="font-medium">42%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Status dos Pedidos */}
        <Card className="bg-background border-border overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Status dos Pedidos</h3>
                <p className="text-sm text-muted-foreground">Visão geral de hoje</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">84</p>
                    <p className="text-xs text-muted-foreground">Novos pedidos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Em separação</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estoque Agrupados */}
        <div className="flex gap-1 self-start justify-end">
          {/* Card 3: Produtos com Maior Estoque */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Estoque Alto</h3>
            {stockLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ProductStockCard 
                products={highStockProducts}
                title="Maior Estoque"
                type="high"
                cardWidth={220}
                cardHeight={380}
              />
            )}
          </div>

          {/* Card 4: Produtos com Menor Estoque */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Estoque Baixo</h3>
            {stockLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ProductStockCard 
                products={lowStockProducts}
                title="Baixo Estoque"
                type="low"
                cardWidth={220}
                cardHeight={380}
              />
            )}
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <QuickActionsWidget />

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