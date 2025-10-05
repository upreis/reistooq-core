import { useState, useEffect } from 'react';
import { HistoricoAnalyticsService } from '@/features/historico/services/historicoAnalyticsService';
import { HistoricoAnalytics } from '@/features/historico/types/historicoTypes';

interface DateRange {
  dataInicio?: string;
  dataFim?: string;
}

export function useSalesAnalytics(dateRange: DateRange = {}) {
  const [analytics, setAnalytics] = useState<HistoricoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await HistoricoAnalyticsService.getAnalytics(
          dateRange.dataInicio,
          dateRange.dataFim
        );
        setAnalytics(data);
      } catch (err) {
        setError(err as Error);
        console.error('Erro ao buscar analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange.dataInicio, dateRange.dataFim]);

  const refetch = () => {
    HistoricoAnalyticsService.clearCache();
    setIsLoading(true);
    setError(null);
  };

  return {
    analytics,
    isLoading,
    error,
    refetch
  };
}
