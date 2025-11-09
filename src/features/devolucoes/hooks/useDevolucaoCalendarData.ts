import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, addMonths } from 'date-fns';
import { logger } from '@/utils/logger';

interface ContributionDay {
  date: string;
  count: number;
}

/**
 * 📅 Hook para buscar dados de devoluções para o calendário
 * Busca dados de 3 meses atrás até 3 meses para frente
 */
export function useDevolucaoCalendarData() {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar contas ML ativas
        const { data: accounts } = await supabase
          .from('integration_accounts')
          .select('id')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);

        if (!accounts || accounts.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const accountIds = accounts.map(acc => acc.id);

        // Calcular período: 3 meses atrás até 3 meses para frente
        const startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        const endDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

        logger.info('📅 Buscando dados de devoluções para calendário', {
          startDate,
          endDate,
          accountsCount: accountIds.length
        });

        // Chamar edge function ml-returns para buscar devoluções
        const { data: response, error: apiError } = await supabase.functions.invoke('ml-returns', {
          body: {
            accountIds: accountIds, // ✅ Corrigido: usar 'accountIds' ao invés de 'integration_account_ids'
            filters: {
              dateFrom: startDate,
              dateTo: endDate,
            },
            pagination: {
              limit: 1000,
              offset: 0,
            }
          }
        });

        if (apiError) {
          throw apiError;
        }

        if (!response?.success || !response?.data) {
          logger.warn('Resposta vazia da API ml-returns');
          setData([]);
          setLoading(false);
          return;
        }

        const devolucoes = response.data.devolucoes || [];

        // Processar dados: agrupar por data
        const dateCountMap = new Map<string, number>();

        devolucoes.forEach((dev: any) => {
          // Usar estimated_delivery_date ou estimated_delivery_limit
          const deliveryDate = dev.estimated_delivery_date || dev.estimated_delivery_limit;
          const reviewDate = dev.estimated_delivery_limit;

          // Adicionar data de entrega
          if (deliveryDate) {
            const dateStr = format(new Date(deliveryDate), 'yyyy-MM-dd');
            dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
          }

          // Adicionar data de revisão (se diferente)
          if (reviewDate && reviewDate !== deliveryDate) {
            const dateStr = format(new Date(reviewDate), 'yyyy-MM-dd');
            dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
          }
        });

        // Converter para array
        const calendarData: ContributionDay[] = Array.from(dateCountMap.entries()).map(
          ([date, count]) => ({
            date: new Date(date).toISOString(),
            count
          })
        );

        logger.info('📊 Dados do calendário processados', {
          totalDays: calendarData.length,
          totalDevolucoes: devolucoes.length
        });

        setData(calendarData);
      } catch (err: any) {
        logger.error('Erro ao buscar dados do calendário', err);
        setError(err.message || 'Erro ao carregar dados');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  return { data, loading, error };
}
