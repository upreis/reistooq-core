import { useState, useEffect } from 'react';
import { useCompatibleToast } from '@/utils/toastUtils';
import { CurrencyService } from '@/services/currencyService';

export const useCurrencyRates = () => {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useCompatibleToast();

  const updateRates = async () => {
    try {
      setLoading(true);
      const newRates = await CurrencyService.getRealTimeRates();
      setRates(newRates);
      setLastUpdate(newRates.lastUpdate);
      
      toast({ title: "Cotações atualizadas", description: "Cotações de moedas atualizadas com sucesso!" });
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      toast({
        title: "Erro ao atualizar cotações",
        description: "Usando valores padrão. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega cotações iniciais
  useEffect(() => {
    updateRates();
  }, []);

  return { rates, updateRates, loading, lastUpdate };
};
