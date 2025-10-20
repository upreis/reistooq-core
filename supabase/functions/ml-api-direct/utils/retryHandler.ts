/**
 * 🔄 RETRY HANDLER
 * Gerencia tentativas de retry com exponential backoff
 */

import { logger } from './logger.ts';

export async function fetchMLWithRetry(
  url: string, 
  accessToken: string, 
  integrationAccountId: string,
  maxRetries = 3
): Promise<Response> {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers });
      
      // Se sucesso ou erro não recuperável, retornar
      if (response.ok || response.status === 404) {
        return response;
      }
      
      // Se 429 (rate limit) ou 5xx, tentar novamente
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // exponential backoff
          logger.warn(`Retry ${attempt}/${maxRetries} para ${url.substring(0, 50)}... - aguardando ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`Erro na tentativa ${attempt}/${maxRetries} - aguardando ${delay}ms`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Falhou após ${maxRetries} tentativas: ${url}`);
}
