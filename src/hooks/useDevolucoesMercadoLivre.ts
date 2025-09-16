import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DevolucaoML {
  id: string;
  integration_account_id: string;
  claim_id?: string;
  return_id?: string;
  order_id: string;
  order_number?: string;
  buyer_nickname?: string;
  buyer_email?: string;
  item_title?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  claim_type: 'claim' | 'return' | 'cancellation';
  claim_status: string;
  claim_stage?: string;
  resolution?: string;
  reason_description?: string;
  amount_claimed?: number;
  amount_refunded: number;
  currency: string;
  date_created: string;
  date_closed?: string;
  date_last_update?: string;
  processed_status: 'pending' | 'reviewed' | 'resolved';
  internal_notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  raw_data: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_return?: any;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface FiltrosDevolucao {
  search: string;
  status: string;
  tipo: string;
  prioridade: string;
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  processedStatus: string;
}

export const useDevolucoesMercadoLivre = (filtros: FiltrosDevolucao, enabled = true) => {
  return useQuery({
    queryKey: ['devolucoes-ml', filtros],
    queryFn: async () => {
      let query = supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*');

      // Aplicar filtros
      if (filtros.accountIds.length > 0) {
        query = query.in('integration_account_id', filtros.accountIds);
      }
      
      if (filtros.search) {
        query = query.or(`order_id.ilike.%${filtros.search}%,buyer_nickname.ilike.%${filtros.search}%,item_title.ilike.%${filtros.search}%,sku.ilike.%${filtros.search}%`);
      }
      
      if (filtros.status !== 'all') {
        query = query.eq('claim_status', filtros.status);
      }
      
      if (filtros.tipo !== 'all') {
        query = query.eq('claim_type', filtros.tipo);
      }
      
      if (filtros.prioridade !== 'all') {
        query = query.eq('priority', filtros.prioridade);
      }
      
      if (filtros.processedStatus !== 'all') {
        query = query.eq('processed_status', filtros.processedStatus);
      }
      
      if (filtros.dateFrom) {
        query = query.gte('date_created', filtros.dateFrom);
      }
      
      if (filtros.dateTo) {
        query = query.lte('date_created', filtros.dateTo + 'T23:59:59.999Z');
      }
      
      const { data, error } = await query
        .order('date_created', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as DevolucaoML[];
    },
    enabled: enabled && filtros.accountIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useContasML = () => {
  return useQuery({
    queryKey: ['ml-accounts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useSincronizarDevolucoes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountIds, dateFrom, dateTo }: { 
      accountIds: string[], 
      dateFrom: string, 
      dateTo: string 
    }) => {
      console.log('🔄 [Sincronização] Iniciando para contas:', accountIds);
      
      const syncPromises = accountIds.map(accountId => 
        supabase.functions.invoke('ml-devolucoes-sync', {
          body: {
            integration_account_id: accountId,
            mode: 'enriched',
            include_messages: true,
            include_shipping: true,
            include_buyer_details: true,
            enrich_level: 'complete',
            date_from: dateFrom,
            date_to: dateTo
          }
        })
      );

      console.log('📤 [Sincronização] Enviando requisições...');
      const results = await Promise.allSettled(syncPromises);
      
      console.log('📥 [Sincronização] Resultados recebidos:', results);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length > 0) {
        console.error('❌ [Sincronização] Erros encontrados:', failed);
        const errors = failed.map(r => (r as PromiseRejectedResult).reason);
        throw new Error(`${failed.length} contas falharam: ${errors.map(e => e.message || e).join(', ')}`);
      }
      
      console.log(`✅ [Sincronização] ${successful} contas sincronizadas com sucesso`);
      return { successful, failed: failed.length };
    },
    onMutate: () => {
      console.log('🚀 [Sincronização] Iniciando processo...');
    },
    onSuccess: (data) => {
      console.log('✅ [Sincronização] Concluída com sucesso:', data);
      toast.success(`Sincronização concluída! ${data.successful} contas atualizadas.`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['devolucoes-ml'] });
      queryClient.refetchQueries({ queryKey: ['devolucoes-ml'] });
    },
    onError: (error) => {
      console.error('❌ [Sincronização] Erro:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });
};

export const useUpdateDevolucaoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      processed_status, 
      internal_notes 
    }: { 
      id: string, 
      processed_status: 'pending' | 'reviewed' | 'resolved', 
      internal_notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .update({ 
          processed_status, 
          internal_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-ml'] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });
};

export const useUpdateDevolucaoPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      priority 
    }: { 
      id: string, 
      priority: 'low' | 'normal' | 'high' | 'urgent'
    }) => {
      const { data, error } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Prioridade atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-ml'] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar prioridade: ${error.message}`);
    }
  });
};