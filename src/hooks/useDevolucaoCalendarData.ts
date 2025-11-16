import { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'devolucoes_venda_persistent_state';

export const useDevolucaoCalendarData = () => {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados do cache (mesma estratégia da página de devoluções)
      const cached = localStorage.getItem(STORAGE_KEY);
      
      if (!cached) {
        console.log('📊 Sem dados em cache para o calendário');
        setData([]);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(cached);
      const devolucoes = parsed.devolucoes || [];
      
      console.log('📊 Carregando dados do cache para calendário:', {
        totalDevolucoes: devolucoes.length,
        cacheAge: Math.round((Date.now() - parsed.cachedAt) / 1000) + 's'
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
      console.log('📊 Dados do calendário processados do cache:', {
        total: finalData.length,
        entregas: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'delivery')).length,
        revisoes: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'review')).length,
        sample: finalData.slice(0, 3)
      });
      setData(finalData);
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário:', err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Escutar mudanças no localStorage (quando a página de devoluções atualiza)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        console.log('🔄 Cache atualizado, recarregando calendário...');
        fetchData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, refresh };
};
