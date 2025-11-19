/**
 * 🔴 NOTIFICAÇÃO EM TEMPO REAL - RECLAMAÇÕES
 * Sistema de updates automáticos via Supabase Realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useReclamacoesRealtime = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ Handler de mudanças com useCallback para evitar re-renders
  const handleChange = useCallback((payload: any) => {
    console.log('🔴 Mudança detectada em reclamações:', payload);

    // Invalidar cache e recarregar dados
    queryClient.invalidateQueries({ queryKey: ['reclamacoes'] });
    setLastSync(new Date());

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
  }, [queryClient, toast]);

  // 🔌 Conectar ao canal realtime
  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;

    console.log('🔴 Ativando notificações em tempo real para reclamações...');

    try {
      // Criar canal realtime para tabela devolucoes_avancadas
      const channel = supabase
        .channel('reclamacoes-realtime', {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'devolucoes_avancadas',
          },
          handleChange
        )
        .subscribe((status, err) => {
          console.log('🔴 Status do canal realtime:', status);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setLastSync(new Date());
            console.log('✅ Canal realtime conectado com sucesso');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            console.error('❌ Erro no canal realtime:', err);
            
            // Tentar reconectar após 5 segundos
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Tentando reconectar ao canal realtime...');
              disconnect();
              connect();
            }, 5000);
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            console.warn('⏱️ Timeout do canal realtime');
            
            // Reconectar imediatamente
            disconnect();
            connect();
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            console.log('🔴 Canal realtime fechado');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Erro ao criar canal realtime:', error);
      setIsConnected(false);
    }
  }, [enabled, handleChange]);

  // 🔌 Desconectar do canal realtime
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      console.log('🔴 Desconectando canal realtime...');
      
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('❌ Erro ao remover canal:', error);
      }
      
      channelRef.current = null;
      setIsConnected(false);
    }

    // Limpar timeout de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 🎬 Conectar/desconectar baseado no estado enabled
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup ao desmontar
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return { 
    realtimeEnabled: enabled,
    isConnected,
    lastSync,
    reconnect: () => {
      disconnect();
      connect();
    }
  };
};
