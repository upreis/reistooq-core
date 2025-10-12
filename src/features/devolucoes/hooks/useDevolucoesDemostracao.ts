/**
 * 🚀 HOOK PARA DEMONSTRAÇÃO EM TEMPO REAL
 * Atualiza automaticamente quando habilitado
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export function useDevolucoesDemostracao(
  enabled: boolean,
  onUpdate: (payload: any) => void
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Limpar channel se existir
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        toastShownRef.current = false;
      }
      return;
    }

    logger.info('Configurando listener tempo real para devoluções');
    
    const channel = supabase
      .channel('devolucoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devolucoes_avancadas'
        },
        (payload) => {
          logger.info('Atualização tempo real', payload);
          
          if (payload.eventType === 'INSERT') {
            const novaDevolucao = payload.new;
            onUpdate({
              type: 'INSERT',
              data: novaDevolucao
            });
            toast.success(`✅ Nova devolução: ${novaDevolucao.produto_titulo || 'Produto'}`);
          } else if (payload.eventType === 'UPDATE') {
            const devolucaoAtualizada = payload.new;
            onUpdate({
              type: 'UPDATE',
              data: devolucaoAtualizada
            });
            toast.info(`🔄 Devolução atualizada: ${devolucaoAtualizada.produto_titulo || 'Produto'}`);
          } else if (payload.eventType === 'DELETE') {
            const devolucaoRemovida = payload.old;
            onUpdate({
              type: 'DELETE',
              data: devolucaoRemovida
            });
            toast.info(`🗑️ Devolução removida`);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !toastShownRef.current) {
          toastShownRef.current = true;
          toast.success('🔴 Tempo real ativado para devoluções');
        }
      });

    channelRef.current = channel;

    return () => {
      logger.info('Removendo listener tempo real');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        toastShownRef.current = false;
      }
    };
  }, [enabled, onUpdate]);

  return {
    isConnected: !!channelRef.current
  };
}