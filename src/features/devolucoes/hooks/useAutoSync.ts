import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSyncOptions {
  integrationAccountId?: string;
  enabled?: boolean;
  intervalMinutes?: number;
}

export function useAutoSync({
  integrationAccountId,
  enabled = true,
  intervalMinutes = 30,
}: UseAutoSyncOptions) {
  const { toast } = useToast();
  const lastSyncRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !integrationAccountId) {
      return;
    }

    const triggerAutoSync = async () => {
      try {
        console.log('[AutoSync] Triggering automatic sync...');
        
        const { data, error } = await supabase.functions.invoke('sync-devolucoes-background', {
          body: {
            integration_account_id: integrationAccountId,
            trigger: 'auto'
          }
        });

        if (error) {
          // Se já está rodando (409), aguardar silenciosamente
          if (error.message?.includes('non-2xx')) {
            console.log('[AutoSync] Sincronização já em andamento, aguardando...');
            return;
          }
          console.error('[AutoSync] Error:', error);
          return;
        }

        // Verificar se retornou 409 (já rodando)
        if (data && !data.success && data.error?.includes('andamento')) {
          console.log('[AutoSync] Sincronização já em andamento, aguardando...');
          return;
        }

        lastSyncRef.current = new Date();
        console.log('[AutoSync] Sync triggered successfully');
      } catch (error) {
        console.error('[AutoSync] Failed to trigger sync:', error);
      }
    };

    // Executar primeiro sync após 10 segundos
    const initialTimeout = setTimeout(() => {
      triggerAutoSync();
    }, 10000);

    // Configurar interval para syncs periódicos
    if (intervalMinutes > 0) {
      intervalRef.current = setInterval(() => {
        triggerAutoSync();
      }, intervalMinutes * 60 * 1000);
    }

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [integrationAccountId, enabled, intervalMinutes]);

  // Monitorar mudanças na tabela sync_control via realtime
  useEffect(() => {
    if (!enabled || !integrationAccountId) {
      return;
    }

    const channel = supabase
      .channel('sync-control-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sync_control',
          filter: `integration_account_id=eq.${integrationAccountId}`
        },
        (payload: any) => {
          const newData = payload.new;
          
          // Notificar quando sync completar com sucesso
          if (newData.status === 'completed' && payload.old?.status === 'running') {
            toast({
              title: 'Sincronização concluída',
              description: `${newData.total_claims} devoluções sincronizadas`,
            });
          }
          
          // Notificar erros
          if (newData.status === 'error' && payload.old?.status === 'running') {
            toast({
              title: 'Erro na sincronização',
              description: newData.error_message || 'Erro desconhecido',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [integrationAccountId, enabled, toast]);

  return {
    lastSync: lastSyncRef.current,
  };
}
