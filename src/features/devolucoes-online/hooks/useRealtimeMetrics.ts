import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePerformanceMetrics } from './usePerformanceMetrics';

/**
 * SPRINT 3: Hook para métricas em tempo real
 * Monitora mudanças em devolucoes_avancadas e atualiza métricas automaticamente
 */

interface RealtimeMetricsData {
  totalRecords: number;
  recentUpdates: number;
  avgQueryTime: number;
  criticalAlerts: number;
  lastUpdate: Date;
}

export function useRealtimeMetrics() {
  const [realtimeData, setRealtimeData] = useState<RealtimeMetricsData>({
    totalRecords: 0,
    recentUpdates: 0,
    avgQueryTime: 0,
    criticalAlerts: 0,
    lastUpdate: new Date()
  });

  const { data: metrics, refetch } = usePerformanceMetrics(false);

  useEffect(() => {
    // Configurar listener de realtime para mudanças na tabela
    const channel = supabase
      .channel('devolucoes-performance-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devolucoes_avancadas'
        },
        async (payload) => {
          console.log('Realtime update detectado:', payload.eventType);
          
          // Refetch métricas quando houver mudanças
          await refetch();
          
          // Atualizar contador de updates recentes
          setRealtimeData(prev => ({
            ...prev,
            recentUpdates: prev.recentUpdates + 1,
            lastUpdate: new Date()
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Atualizar dados quando métricas mudarem
  useEffect(() => {
    if (metrics) {
      setRealtimeData(prev => ({
        ...prev,
        avgQueryTime: metrics.summary.avg_query_time,
        criticalAlerts: metrics.query_performance.filter(
          q => q.avg_execution_time_ms > 300
        ).length
      }));
    }
  }, [metrics]);

  // Buscar total de registros periodicamente
  useEffect(() => {
    const fetchTotalRecords = async () => {
      const { count } = await supabase
        .from('devolucoes_avancadas')
        .select('*', { count: 'exact', head: true });
      
      setRealtimeData(prev => ({
        ...prev,
        totalRecords: count || 0
      }));
    };

    fetchTotalRecords();
    const interval = setInterval(fetchTotalRecords, 30000); // A cada 30s

    return () => clearInterval(interval);
  }, []);

  return {
    realtimeData,
    metrics,
    refetch
  };
}
