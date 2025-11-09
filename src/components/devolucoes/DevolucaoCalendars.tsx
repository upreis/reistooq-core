/**
 * 📅 CALENDÁRIOS DE DEVOLUÇÕES
 * Visualização de datas importantes em formato de atividade
 */

import { useMemo } from 'react';
import { ActivityCalendar } from '@/components/dashboard/ActivityCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { MLReturn } from '@/features/devolucoes-online/types/devolucao.types';

interface DevolucaoCalendarsProps {
  devolucoes: MLReturn[];
}

export function DevolucaoCalendars({ devolucoes }: DevolucaoCalendarsProps) {
  // Processar datas de previsão de entrega
  const deliveryData = useMemo(() => {
    const dateMap = new Map<string, number>();
    
    devolucoes.forEach((dev) => {
      const dateStr = dev.estimated_delivery_date || dev.estimated_delivery_limit;
      if (!dateStr) return;
      
      try {
        const date = parseISO(dateStr);
        if (isValid(date)) {
          const isoDate = format(date, 'yyyy-MM-dd');
          dateMap.set(isoDate, (dateMap.get(isoDate) || 0) + 1);
        }
      } catch (error) {
        // Ignorar datas inválidas
      }
    });
    
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }, [devolucoes]);

  // Processar datas de prazo limite para revisão
  const reviewDeadlineData = useMemo(() => {
    const dateMap = new Map<string, number>();
    
    devolucoes.forEach((dev) => {
      const dateStr = dev.estimated_delivery_limit;
      if (!dateStr) return;
      
      try {
        const date = parseISO(dateStr);
        if (isValid(date)) {
          const isoDate = format(date, 'yyyy-MM-dd');
          dateMap.set(isoDate, (dateMap.get(isoDate) || 0) + 1);
        }
      } catch (error) {
        // Ignorar datas inválidas
      }
    });
    
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }, [devolucoes]);

  const totalDeliveries = deliveryData.reduce((sum, item) => sum + item.count, 0);
  const totalDeadlines = reviewDeadlineData.reduce((sum, item) => sum + item.count, 0);

  if (devolucoes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário de Devoluções
        </CardTitle>
        <CardDescription>
          Visualize as datas importantes de entregas e prazos de revisão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Previsões de Entrega ({totalDeliveries})
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Prazos de Revisão ({totalDeadlines})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deliveries" className="mt-6">
            {deliveryData.length > 0 ? (
              <ActivityCalendar 
                data={deliveryData} 
                title="Datas previstas para entrega das devoluções aos remetentes"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma previsão de entrega disponível
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="deadlines" className="mt-6">
            {reviewDeadlineData.length > 0 ? (
              <ActivityCalendar 
                data={reviewDeadlineData} 
                title="Prazos limite para revisão das devoluções"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum prazo de revisão disponível
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
