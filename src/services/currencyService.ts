// src/services/currencyService.ts
export class CurrencyService {
  private static readonly BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  static async getRealTimeRates(): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/USD`);
      const data = await response.json();
      
      if (!data.rates) {
        throw new Error('Invalid API response');
      }
      
      // Criar objeto com todas as conversões para USD
      const rates: any = {
        USD_BRL: data.rates.BRL || 5.20,
        lastUpdate: new Date().toISOString()
      };

      // Adicionar conversões de todas as moedas para USD
      Object.entries(data.rates).forEach(([currency, rate]) => {
        if (currency !== 'USD' && typeof rate === 'number') {
          rates[`${currency}_USD`] = 1 / rate;
          rates[currency] = rate; // Manter também a taxa direta
        }
      });

      return rates;
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      // Retorna valores padrão em caso de erro
      return {
        CNY_USD: 0.14,
        USD_BRL: 5.20,
        EUR_USD: 1.08,
        JPY_USD: 0.0067,
        GBP_USD: 1.27,
        CAD_USD: 0.74,
        AUD_USD: 0.67,
        CHF_USD: 1.10,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  static async getCurrencyHistory(currency: string, days: number = 30): Promise<any> {
    try {
      // Implementação futura para histórico de cotações
      return {};
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return {};
    }
  }
}