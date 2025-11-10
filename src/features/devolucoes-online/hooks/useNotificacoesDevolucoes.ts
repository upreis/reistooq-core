/**
 * 🔔 HOOK: Notificações de Devoluções
 * 
 * Hook customizado para gerenciar notificações de devoluções críticas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Notificacao {
  id: string;
  order_id: string;
  return_id: number;
  claim_id: number;
  tipo_notificacao: string;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  titulo: string;
  mensagem: string;
  dados_contexto: any;
  deadline_date?: string;
  horas_restantes?: number;
  lida: boolean;
  created_at: string;
}

export function useNotificacoesDevolucoes() {
  const queryClient = useQueryClient();

  // Buscar notificações não lidas
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes-devolucoes-nao-lidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devolucoes_notificacoes')
        .select('*')
        .eq('lida', false)
        .order('prioridade', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Notificacao[];
    },
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Contagem de não lidas
  const { data: count } = useQuery({
    queryKey: ['notificacoes-devolucoes-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notificacoes_nao_lidas_count');
      if (error) throw error;
      return data as number;
    },
    refetchInterval: 30000,
  });

  // Marcar como lida
  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('marcar_notificacao_lida', {
        p_notificacao_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-devolucoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-devolucoes-count'] });
    },
  });

  return {
    notificacoes: notificacoes || [],
    count: count || 0,
    isLoading,
    marcarComoLida: marcarComoLida.mutate,
    isMarking: marcarComoLida.isPending,
  };
}
