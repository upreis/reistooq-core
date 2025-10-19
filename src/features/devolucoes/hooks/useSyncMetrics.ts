import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  lastSyncTime: Date | null;
  totalRecordsSynced: number;
}

export function useSyncMetrics() {
  return useQuery({
    queryKey: ['sync-metrics'],
    queryFn: async (): Promise<SyncMetrics> => {
      // Buscar logs de auditoria relacionados a sincronização
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'sync_devolucoes')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const totalSyncs = logs?.length || 0;
      const successfulSyncs = logs?.filter(log => {
        const newValues = log.new_values as any;
        return newValues?.success === true;
      }).length || 0;
      const failedSyncs = totalSyncs - successfulSyncs;

      const durations = logs?.map(log => 
        log.duration_ms || 0
      ).filter(d => d > 0) || [];
      
      const averageDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      const lastSyncTime = logs?.[0]?.created_at 
        ? new Date(logs[0].created_at)
        : null;

      const totalRecordsSynced = logs?.reduce((sum, log) => {
        const newValues = log.new_values as any;
        return sum + (newValues?.total || 0);
      }, 0) || 0;

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        averageDuration,
        lastSyncTime,
        totalRecordsSynced
      };
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}
