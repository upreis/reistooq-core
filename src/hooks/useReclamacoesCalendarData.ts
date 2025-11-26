import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { calculateAnalysisDeadline } from '@/features/devolucao2025/utils/businessDays';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ReclamacaoCalendarDay {
  date: string;
  count: number;
  claims?: Array<{
    dateType: 'created' | 'deadline';
    claim_id: string;
    type?: string;
    status?: string;
    resource_id?: string;
    buyer_nickname?: string;
    [key: string]: any;
  }>;
}

export const useReclamacoesCalendarData = () => {
  const [data, setData] = useState<ReclamacaoCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      const { data: reclamacoes, error: fetchError } = await supabase
        .from('reclamacoes')
        .select('*')
        .gte('date_created', sixtyDaysAgo)
        .order('date_created', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!reclamacoes || reclamacoes.length === 0) {
        console.log('📊 Sem reclamações encontradas (últimos 60 dias)');
        setData([]);
        setLoading(false);
        return;
      }

      console.log('📊 🔄 Carregando dados de reclamações para calendário (REALTIME):', {
        totalReclamacoes: reclamacoes.length,
        periodo: '60 dias'
      });

      // Agrupar reclamações por data (criação e prazo de análise)
      const groupedByDate = reclamacoes.reduce((acc: Record<string, ReclamacaoCalendarDay>, reclamacao: any) => {
        // Processar data de criação
        if (reclamacao.date_created) {
          const dateStr = format(parseISO(reclamacao.date_created), 'yyyy-MM-dd');
          
          if (!acc[dateStr]) {
            acc[dateStr] = {
              date: dateStr,
              count: 0,
              claims: []
            };
          }
          
          acc[dateStr].count += 1;
          acc[dateStr].claims!.push({
            dateType: 'created',
            claim_id: reclamacao.claim_id,
            type: reclamacao.type,
            status: reclamacao.status,
            resource_id: reclamacao.resource_id,
            buyer_nickname: reclamacao.buyer_nickname
          });
        }
        
        // Processar data de prazo de análise (3 dias úteis)
        if (reclamacao.date_created) {
          const deadlineDate = calculateAnalysisDeadline(reclamacao.date_created);
          
          if (deadlineDate) {
            const dateStr = format(deadlineDate, 'yyyy-MM-dd');
            
            if (!acc[dateStr]) {
              acc[dateStr] = {
                date: dateStr,
                count: 0,
                claims: []
              };
            }
            
            acc[dateStr].count += 1;
            acc[dateStr].claims!.push({
              dateType: 'deadline',
              claim_id: reclamacao.claim_id,
              type: reclamacao.type,
              status: reclamacao.status,
              resource_id: reclamacao.resource_id,
              buyer_nickname: reclamacao.buyer_nickname
            });
          }
        }
        
        return acc;
      }, {});

      const finalData = Object.values(groupedByDate) as ReclamacaoCalendarDay[];
      console.log('✅ Dados do calendário de reclamações processados:', {
        total: finalData.length,
        criadas: finalData.filter((d: ReclamacaoCalendarDay) => d.claims?.some(r => r.dateType === 'created')).length,
        prazos: finalData.filter((d: ReclamacaoCalendarDay) => d.claims?.some(r => r.dateType === 'deadline')).length
      });
      setData(finalData);
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário de reclamações:', err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Buscar dados iniciais
    fetchData();

    // Configurar Supabase Realtime para atualizações automáticas
    console.log('🔄 Ativando Realtime para calendário de reclamações...');
    
    const channel = supabase
      .channel('reclamacoes-calendar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'reclamacoes'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em reclamações:', payload.eventType);
          fetchData(); // Recarregar dados automaticamente
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado para calendário de reclamações');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔴 Realtime desconectado para calendário de reclamações');
      }
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
