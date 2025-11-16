import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: devolucoes, error: fetchError } = await supabase
        .from('devolucoes_avancadas')
        .select('order_id, data_chegada_produto, data_fechamento_devolucao, status_devolucao, produto_titulo, sku')
        .or('data_chegada_produto.not.is.null,data_fechamento_devolucao.not.is.null')
        .order('data_chegada_produto', { ascending: true });

      if (fetchError) throw fetchError;

      // Agrupar devoluções por data (chegada e análise)
      const groupedByDate = (devolucoes || []).reduce((acc, devolucao) => {
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
      }, {} as Record<string, ContributionDay>);

      setData(Object.values(groupedByDate));
    } catch (err: any) {
      console.error('Erro ao buscar dados do calendário:', err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, refresh };
};
