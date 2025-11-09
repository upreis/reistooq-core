import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, addMonths } from 'date-fns';

interface ContributionDay {
  date: string;
  count: number;
  returns: any[]; // Array de devoluções daquele dia
}

/**
 * 📅 Hook para buscar dados de devoluções para o calendário
 * Busca dados de 3 meses atrás até 3 meses para frente
 */
export function useDevolucaoCalendarData() {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const fetchCalendarData = async () => {
      // Evitar chamadas duplicadas
      if (hasFetched.current) {
        console.log('⏭️ [CALENDAR] Chamada ignorada - já foi executada');
        return;
      }

      hasFetched.current = true;
      setLoading(true);
      setError(null);

      try {
        // Buscar contas ML ativas
        console.log('📅 [CALENDAR] Passo 1: Buscando contas ML ativas...');
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
          console.log('⚠️ [CALENDAR] Nenhuma conta ML ativa encontrada');
          setData([]);
          setLoading(false);
          return;
        }

        const accountIds = accounts.map(acc => acc.id);
        console.log('✅ [CALENDAR] Passo 1 concluído:', accountIds.length, 'contas encontradas');

        // Calcular período: 3 meses atrás até 3 meses para frente
        const startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        const endDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

        console.log('📅 [CALENDAR] Passo 2: Chamando edge function ml-returns...', {
          startDate,
          endDate,
          accountsCount: accountIds.length,
          accountIds
        });

        // Criar promise com timeout de 120 segundos
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout: A requisição demorou mais de 120 segundos. Tente recarregar a página.'));
          }, 120000);
        });

        const apiPromise = supabase.functions.invoke('ml-returns', {
          body: {
            accountIds: accountIds,
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

        // Chamar edge function com timeout
        const { data: response, error: apiError } = await Promise.race([
          apiPromise,
          timeoutPromise
        ]) as any;

        // Limpar timeout se sucesso
        if (timeoutId) clearTimeout(timeoutId);

        console.log('✅ [CALENDAR] Passo 2 concluído - Resposta recebida');

        if (apiError) {
          console.error('❌ [CALENDAR] Erro na API ml-returns:', apiError);
          throw apiError;
        }

        if (!response) {
          console.error('❌ [CALENDAR] Resposta da API está vazia');
          throw new Error('Resposta da API está vazia');
        }

        console.log('📦 [CALENDAR] Passo 3: Processando resposta da API...', {
          success: response?.success,
          hasData: !!response?.data,
          hasReturns: !!(response as any)?.returns,
          keys: response ? Object.keys(response) : []
        });

        // A API ml-returns retorna { returns: [...] }
        const returns = (response as any)?.returns || [];
        console.log(`✅ [CALENDAR] Passo 3 concluído: ${returns.length} devoluções recebidas`);

        console.log('🔄 [CALENDAR] Passo 4: Agrupando devoluções por data...');

        // Processar dados: agrupar por data E armazenar as devoluções
        const dateReturnsMap = new Map<string, any[]>();

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
            const existing = dateReturnsMap.get(dateStr) || [];
            existing.push({ ...dev, dateType: 'delivery' });
            dateReturnsMap.set(dateStr, existing);
            console.log(`✅ [CALENDAR] Data adicionada: ${dateStr}, count: ${existing.length}`);
          }

          // Adicionar data de revisão (se diferente)
          if (reviewDate && reviewDate !== deliveryDate) {
            const dateStr = format(new Date(reviewDate), 'yyyy-MM-dd');
            const existing = dateReturnsMap.get(dateStr) || [];
            // Só adiciona se ainda não estiver na lista (evitar duplicatas)
            if (!existing.find(r => r.id === dev.id)) {
              existing.push({ ...dev, dateType: 'review' });
              dateReturnsMap.set(dateStr, existing);
              console.log(`✅ [CALENDAR] Data de revisão adicionada: ${dateStr}, count: ${existing.length}`);
            }
          }
        });

        // Converter para array com detalhes
        const calendarData: ContributionDay[] = Array.from(dateReturnsMap.entries()).map(
          ([date, returns]) => ({
            date: new Date(date).toISOString(),
            count: returns.length,
            returns: returns
          })
        );

        console.log('✅ [CALENDAR] Passo 4 concluído - Dados agrupados');
        console.log('📊 [CALENDAR] Passo 5: Finalizando...', {
          totalDays: calendarData.length,
          totalReturns: returns.length,
          primeiras5Datas: calendarData.slice(0, 5)
        });

        console.log('🎉 [CALENDAR] SUCESSO - Calendário carregado com sucesso!');
        
        // Só atualizar se não foi cancelado
        if (!isCancelled) {
          setData(calendarData);
        }
      } catch (err: any) {
        console.error('❌ [CALENDAR] ERRO FATAL:', {
          message: err.message,
          stack: err.stack,
          error: err
        });
        if (!isCancelled) {
          setError(err.message || 'Erro ao carregar dados');
          setData([]);
        }
      } finally {
        console.log('🏁 [CALENDAR] Finalizando (loading = false)');
        if (!isCancelled) {
          setLoading(false);
        }
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    fetchCalendarData();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log('🧹 [CALENDAR] Limpeza: timeout cancelado');
      }
    };
  }, []);

  return { data, loading, error };
}
