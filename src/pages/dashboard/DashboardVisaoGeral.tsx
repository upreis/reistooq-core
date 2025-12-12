import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { HorizontalSemesterCalendar } from '@/components/dashboard/HorizontalSemesterCalendar';
import { QuickActionsWidget } from '@/features/dashboard/components/widgets/QuickActionsWidget';
import { FeaturesBentoGrid } from '@/features/dashboard/components/widgets/FeaturesBentoGrid';
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
    <div className="space-y-6 p-6 bg-card w-full">
      {/* Features Bento Grid */}
      <FeaturesBentoGrid />

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