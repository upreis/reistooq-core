import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useSyncDevolucoes() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    error: null
  });

  const syncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isRunning: true, error: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-devolucoes-ml', {
        body: { manual_sync: true }
      });

      if (error) throw error;

      setSyncStatus({
        isRunning: false,
        lastSync: new Date(),
        error: null
      });

      toast.success('Sincronização concluída com sucesso', {
        description: `${data?.stats?.total || 0} devoluções sincronizadas`
      });

      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao sincronizar';
      setSyncStatus({
        isRunning: false,
        lastSync: null,
        error: errorMsg
      });

      toast.error('Erro na sincronização', {
        description: errorMsg
      });

      throw error;
    }
  };

  return {
    syncStatus,
    syncNow
  };
}
