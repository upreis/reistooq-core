/**
 * 🔴 NOTIFICAÇÃO EM TEMPO REAL - RECLAMAÇÕES
 * Sistema de updates automáticos via Supabase Realtime
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useReclamacoesRealtime = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    console.log('🔴 Ativando notificações em tempo real para reclamações...');

    // Criar canal realtime para tabela devolucoes_avancadas
    const channel = supabase
      .channel('reclamacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'devolucoes_avancadas'
        },
        (payload) => {
          console.log('🔴 Mudança detectada em reclamações:', payload);

          // Invalidar cache e recarregar dados
          queryClient.invalidateQueries({ queryKey: ['reclamacoes'] });

          // Notificar usuário baseado no tipo de evento
          if (payload.eventType === 'INSERT') {
            toast({
              title: '🆕 Nova reclamação',
              description: 'Uma nova reclamação foi registrada.',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: '🔄 Reclamação atualizada',
              description: 'Uma reclamação foi modificada.',
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: '🗑️ Reclamação removida',
              description: 'Uma reclamação foi excluída.',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Status do canal realtime:', status);
      });

    // Cleanup ao desmontar
    return () => {
      console.log('🔴 Desativando notificações em tempo real...');
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, toast]);

  return { realtimeEnabled: enabled };
};
