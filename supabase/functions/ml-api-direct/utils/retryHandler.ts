/**
 * 🔄 RETRY HANDLER
 * Gerencia tentativas de retry com exponential backoff
 */

import { logger } from './logger.ts';

export async function fetchMLWithRetry(
  url: string, 
  accessToken: string, 
  integrationAccountId: string,
  customHeaders: Record<string, string> = {},
  maxRetries = 3
): Promise<Response> {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...customHeaders  // ✅ Permite adicionar headers customizados
  };
  
  // ✅ CORREÇÃO: Loop de 0 até maxRetries-1 (total de maxRetries tentativas)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // ✅ ADICIONAR TIMEOUT de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      // Se sucesso ou erro não recuperável, retornar
      if (response.ok || response.status === 404) {
        return response;
      }
      
      // Se 429 (rate limit) ou 5xx, tentar novamente
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          // ✅ CORREÇÃO: Exponential backoff com jitter
          // attempt=0: 1s, attempt=1: 2s, attempt=2: 4s
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = baseDelay * 0.25;
          const delay = Math.min(
            baseDelay + (Math.random() * jitter * 2 - jitter),
            30000
          );
          
          logger.warn(`Retry ${attempt + 1}/${maxRetries} para ${url.substring(0, 50)}... - aguardando ${Math.round(delay)}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error: any) {
      // ✅ Melhorar mensagem de timeout
      if (error.name === 'AbortError') {
        logger.warn(`Timeout na tentativa ${attempt + 1}/${maxRetries} para ${url.substring(0, 50)}...`);
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = baseDelay * 0.25;
      const delay = Math.min(
        baseDelay + (Math.random() * jitter * 2 - jitter),
        30000
      );
      
      logger.warn(`Erro na tentativa ${attempt + 1}/${maxRetries} - aguardando ${Math.round(delay)}ms`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Falhou após ${maxRetries} tentativas: ${url}`);
}
