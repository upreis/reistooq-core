import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, addMonths } from 'date-fns';

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

        console.log('📅 [CALENDAR] Buscando dados de devoluções para calendário', {
          startDate,
          endDate,
          accountsCount: accountIds.length,
          accountIds
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
          console.error('❌ [CALENDAR] Erro na API ml-returns:', apiError);
          throw apiError;
        }

        console.log('✅ [CALENDAR] Resposta da API:', {
          success: response?.success,
          hasData: !!response?.data,
          hasReturns: !!(response as any)?.returns,
          keys: response ? Object.keys(response) : []
        });

        // A API ml-returns retorna { returns: [...] } ao invés de { data: { devolucoes: [...] } }
        const returns = (response as any)?.returns || [];
        console.log(`📦 [CALENDAR] ${returns.length} devoluções recebidas da API`);

        // Processar dados: agrupar por data
        const dateCountMap = new Map<string, number>();

        returns.forEach((dev: any) => {
          // Usar estimated_delivery_date ou estimated_delivery_limit
          const deliveryDate = dev.estimated_delivery_date || dev.estimated_delivery_limit;
          const reviewDate = dev.estimated_delivery_limit;

          console.log(`🔍 [CALENDAR] Processando devolução ${dev.id}:`, {
            deliveryDate,
            reviewDate,
            estimated_delivery_date: dev.estimated_delivery_date,
            estimated_delivery_limit: dev.estimated_delivery_limit
          });

          // Adicionar data de entrega
          if (deliveryDate) {
            const dateStr = format(new Date(deliveryDate), 'yyyy-MM-dd');
            dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
            console.log(`✅ [CALENDAR] Data adicionada: ${dateStr}, count: ${dateCountMap.get(dateStr)}`);
          }

          // Adicionar data de revisão (se diferente)
          if (reviewDate && reviewDate !== deliveryDate) {
            const dateStr = format(new Date(reviewDate), 'yyyy-MM-dd');
            dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
            console.log(`✅ [CALENDAR] Data de revisão adicionada: ${dateStr}, count: ${dateCountMap.get(dateStr)}`);
          }
        });

        // Converter para array
        const calendarData: ContributionDay[] = Array.from(dateCountMap.entries()).map(
          ([date, count]) => ({
            date: new Date(date).toISOString(),
            count
          })
        );

        console.log('📊 [CALENDAR] Dados do calendário processados:', {
          totalDays: calendarData.length,
          totalReturns: returns.length,
          calendarData: calendarData.slice(0, 5) // Primeiras 5 datas para debug
        });

        setData(calendarData);
      } catch (err: any) {
        console.error('❌ [CALENDAR] Erro ao buscar dados do calendário:', err);
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
