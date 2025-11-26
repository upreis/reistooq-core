import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ContributionDay {
  date: string;
  count: number;
  returns?: Array<{
    dateType: 'delivery' | 'review';
    order_id: string;
    status_devolucao?: string;
    produto_titulo?: string;
    [key: string]: any;
  }>;
}

export const useDevolucaoCalendarData = () => {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      const { data: devolucoes, error: fetchError } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .gte('data_criacao', sixtyDaysAgo)
        .order('data_criacao', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!devolucoes || devolucoes.length === 0) {
        console.log('📊 Sem devoluções encontradas (últimos 60 dias)');
        setData([]);
        setLoading(false);
        return;
      }

      console.log('📊 🔄 Carregando dados de devoluções para calendário (REALTIME):', {
        totalDevolucoes: devolucoes.length,
        periodo: '60 dias'
      });

      // Agrupar devoluções por data (chegada e análise)
      const groupedByDate = devolucoes.reduce((acc: Record<string, ContributionDay>, devolucao: any) => {
        // Processar data de chegada (delivery)
        if (devolucao.data_chegada_produto) {
          const dateStr = format(parseISO(devolucao.data_chegada_produto), 'yyyy-MM-dd');
          
          if (!acc[dateStr]) {
            acc[dateStr] = {
              date: dateStr,
              count: 0,
              returns: []
            };
          }
          
          acc[dateStr].count += 1;
          acc[dateStr].returns!.push({
            dateType: 'delivery',
            order_id: devolucao.order_id,
            status_devolucao: devolucao.status_devolucao,
            produto_titulo: devolucao.produto_titulo,
            sku: devolucao.sku
          });
        }
        
        // Processar data de análise/fechamento (review)
        if (devolucao.data_fechamento_devolucao) {
          const dateStr = format(parseISO(devolucao.data_fechamento_devolucao), 'yyyy-MM-dd');
          
          if (!acc[dateStr]) {
            acc[dateStr] = {
              date: dateStr,
              count: 0,
              returns: []
            };
          }
          
          acc[dateStr].count += 1;
          acc[dateStr].returns!.push({
            dateType: 'review',
            order_id: devolucao.order_id,
            status_devolucao: devolucao.status_devolucao,
            produto_titulo: devolucao.produto_titulo,
            sku: devolucao.sku
          });
        }
        
        return acc;
      }, {});

      const finalData = Object.values(groupedByDate) as ContributionDay[];
      console.log('✅ Dados do calendário de devoluções processados:', {
        total: finalData.length,
        entregas: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'delivery')).length,
        revisoes: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'review')).length
      });
      setData(finalData);
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário de devoluções:', err);
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
    console.log('🔄 Ativando Realtime para calendário de devoluções...');
    
    const channel = supabase
      .channel('devolucoes-calendar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'devolucoes_avancadas'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em devoluções:', payload.eventType);
          fetchData(); // Recarregar dados automaticamente
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado para calendário de devoluções');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔴 Realtime desconectado para calendário de devoluções');
      }
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
