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
      
      return {
        CNY_USD: 1 / (data.rates.CNY || 7.1), // Fallback se não existir
        USD_BRL: data.rates.BRL || 5.20,
        EUR_USD: 1 / (data.rates.EUR || 0.92),
        JPY_USD: 1 / (data.rates.JPY || 149),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      // Retorna valores padrão em caso de erro
      return {
        CNY_USD: 0.14,
        USD_BRL: 5.20,
        EUR_USD: 1.08,
        JPY_USD: 0.0067,
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