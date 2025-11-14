/**
 * 🔔 HOOK PARA NOTIFICAÇÕES EM TEMPO REAL
 * Escuta novas notificações de devoluções via Supabase Realtime
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

interface DevolucaoNotificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo_notificacao: string;
  prioridade: string;
  claim_id: number;
  order_id: string;
  lida: boolean;
  created_at: string;
}

export const useRealtimeNotifications = (organizationId: string | null) => {
  const [notifications, setNotifications] = useState<DevolucaoNotificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!organizationId) return;

    // Buscar notificações não lidas iniciais
    const fetchInitialNotifications = async () => {
      const { data, error } = await supabase
        .from('devolucoes_notificacoes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('lida', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    fetchInitialNotifications();

    // Configurar listener de realtime
    const channel = supabase
      .channel('devolucoes-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'devolucoes_notificacoes',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload);
          
          const newNotification = payload.new as DevolucaoNotificacao;
          
          // Adicionar à lista
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Mostrar toast com som
          const priorityVariant = newNotification.prioridade === 'alta' ? 'destructive' : 'default';
          
          toast({
            title: newNotification.titulo,
            description: newNotification.mensagem,
            variant: priorityVariant,
            duration: 5000,
          });

          // Tocar som de notificação
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => console.log('Audio play failed'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('devolucoes_notificacoes')
      .update({ 
        lida: true, 
        lida_em: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lida: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('devolucoes_notificacoes')
      .update({ 
        lida: true, 
        lida_em: new Date().toISOString() 
      })
      .eq('organization_id', organizationId!)
      .eq('lida', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
