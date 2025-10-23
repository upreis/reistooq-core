/**
 * 🏷️ REASONS SERVICE
 * Gerencia busca de reasons do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class ReasonsService {
  /**
   * Buscar múltiplos reasons em paralelo
   */
  async fetchMultipleReasons(
    reasonIds: string[],
    accessToken: string,
    integrationAccountId: string
  ): Promise<Map<string, any>> {
    const reasonsMap = new Map<string, any>();
    
    if (reasonIds.length === 0) {
      return reasonsMap;
    }
    
    logger.debug(`Buscando ${reasonIds.length} reasons da API ML`);
    
    // Buscar em paralelo (mas com limite para não sobrecarregar)
    const BATCH_SIZE = 10;
    for (let i = 0; i < reasonIds.length; i += BATCH_SIZE) {
      const batch = reasonIds.slice(i, i + BATCH_SIZE);
      const promises = batch.map(reasonId => 
        this.fetchReasonDetail(reasonId, accessToken, integrationAccountId)
      );
      
      const results = await Promise.all(promises);
      results.forEach((data, index) => {
        if (data) {
          reasonsMap.set(batch[index], data);
        }
      });
    }
    
    logger.info(`${reasonsMap.size} reasons carregados da API`);
    return reasonsMap;
  }
  
  /**
   * Buscar detalhes de um reason específico
   */
  private async fetchReasonDetail(
    reasonId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any | null> {
    const url = `https://api.mercadolibre.com/post-purchase/reasons/${reasonId}`;
    
    try {
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
      return response.ok ? response.json() : null;
    } catch (error) {
      logger.debug(`Erro ao buscar reason ${reasonId}`, error);
      return null;
    }
  }
}
