// Hook corrigido para cotações de moedas com cleanup adequado
import { useState, useEffect } from 'react';
import { CurrencyService } from '@/services/currencyService';
import { useToastFeedback } from '@/hooks/useToastFeedback';

export function useCurrencyRatesFixed() {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { showSuccess, showError } = useToastFeedback();

  const updateRates = async () => {
    try {
      setLoading(true);
      const newRates = await CurrencyService.getRealTimeRates();
      setRates(newRates);
      setLastUpdate(newRates.lastUpdate);
      
      showSuccess("Cotações de moedas atualizadas com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      showError("Usando valores padrão. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Carrega cotações iniciais com cleanup
  useEffect(() => {
    let mounted = true;

    const loadRates = async () => {
      if (mounted) {
        await updateRates();
      }
    };

    loadRates();

    return () => {
      mounted = false;
    };
  }, []);

  return { rates, updateRates, loading, lastUpdate };
}
