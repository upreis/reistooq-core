import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SyncControlStatus {
  id: string;
  integration_account_id: string;
  provider: string;
  last_sync_date: string | null;
  total_claims: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  error_message: string | null;
  progress_current: number;
  progress_total: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSyncControl(integrationAccountId?: string) {
  return useQuery<SyncControlStatus | null, Error>({
    queryKey: ['sync-control', integrationAccountId],
    queryFn: async () => {
      if (!integrationAccountId) {
        return null;
      }

      try {
        const response = await supabase
          .from('sync_control')
          .select('*')
          .eq('integration_account_id', integrationAccountId)
          .eq('provider', 'mercadolivre')
          .maybeSingle();

        if (response.error) {
          console.error('Erro ao buscar sync_control:', response.error);
          return null;
        }

        const data: any = response.data;
        if (!data) return null;

        return data as SyncControlStatus;
      } catch (error) {
        console.error('Erro ao buscar status de sincronização:', error);
        return null;
      }
    },
    refetchInterval: 3000,
    enabled: !!integrationAccountId,
  });
}
