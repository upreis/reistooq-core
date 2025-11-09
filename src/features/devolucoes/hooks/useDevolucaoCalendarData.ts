import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, addMonths } from 'date-fns';

interface ContributionDay {
  date: string;
  count: number;
  returns: any[];
}

/**
 * 📅 Hook otimizado para buscar dados de devoluções para o calendário
 * Usa SWR para cache, revalidação automática e melhor performance
 */

// Fetcher function para SWR
async function fetchCalendarData(): Promise<ContributionDay[]> {
  console.log('📅 [CALENDAR] Iniciando busca...');

  // Buscar contas ML ativas
  const { data: accounts, error: accountsError } = await supabase
    .from('integration_accounts')
    .select('id')
    .eq('provider', 'mercadolivre')
    .eq('is_active', true);

  if (accountsError) {
    console.error('❌ [CALENDAR] Erro ao buscar contas:', accountsError);
    throw accountsError;
  }

  if (!accounts || accounts.length === 0) {
    console.log('⚠️ [CALENDAR] Nenhuma conta ML ativa');
    return [];
  }

  const accountIds = accounts.map(acc => acc.id);
  const startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
  const endDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

  console.log('📅 [CALENDAR] Buscando devoluções:', { startDate, endDate, accounts: accountIds.length });

  // Chamar edge function (SWR gerencia timeout e retry)
  const { data: response, error: apiError } = await supabase.functions.invoke('ml-returns', {
    body: {
      accountIds,
      filters: { dateFrom: startDate, dateTo: endDate },
      pagination: { limit: 1000, offset: 0 }
    }
  });

  if (apiError) {
    console.error('❌ [CALENDAR] Erro na API:', apiError);
    throw apiError;
  }

  if (!response) {
    throw new Error('Resposta vazia da API');
  }

  const returns = (response as any)?.returns || [];
  console.log(`✅ [CALENDAR] ${returns.length} devoluções recebidas`);

  // Processar e agrupar por data
  const dateReturnsMap = new Map<string, any[]>();

  returns.forEach((dev: any) => {
    const deliveryDate = dev.estimated_delivery_date || dev.estimated_delivery_limit;
    const reviewDate = dev.estimated_delivery_limit;

    // Adicionar data de entrega
    if (deliveryDate) {
      const dateStr = format(new Date(deliveryDate), 'yyyy-MM-dd');
      const existing = dateReturnsMap.get(dateStr) || [];
      existing.push({ ...dev, dateType: 'delivery' });
      dateReturnsMap.set(dateStr, existing);
    }

    // Adicionar data de revisão (se diferente)
    if (reviewDate && reviewDate !== deliveryDate) {
      const dateStr = format(new Date(reviewDate), 'yyyy-MM-dd');
      const existing = dateReturnsMap.get(dateStr) || [];
      if (!existing.find(r => r.id === dev.id)) {
        existing.push({ ...dev, dateType: 'review' });
        dateReturnsMap.set(dateStr, existing);
      }
    }
  });

  const calendarData: ContributionDay[] = Array.from(dateReturnsMap.entries()).map(
    ([date, returns]) => ({
      date: new Date(date).toISOString(),
      count: returns.length,
      returns
    })
  );

  console.log('✅ [CALENDAR] Processado:', calendarData.length, 'dias com eventos');
  return calendarData;
}

export function useDevolucaoCalendarData() {
  // Usar SWR com cache e revalidação automática
  const { data, error, isLoading, mutate } = useSWR(
    'calendar-devolucoes',
    fetchCalendarData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Não buscar novamente por 1 minuto
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      onSuccess: (data) => {
        console.log('🎉 [CALENDAR] Cache atualizado com sucesso!', data.length, 'dias');
      },
      onError: (err) => {
        console.error('❌ [CALENDAR] Erro:', err);
      }
    }
  );

  return {
    data: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh: () => mutate() // Função de refresh manual
  };
}
