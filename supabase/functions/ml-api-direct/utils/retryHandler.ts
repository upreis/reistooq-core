/**
 * 🔄 RETRY HANDLER
 * Gerencia tentativas de retry com exponential backoff
 */

import { logger } from './logger.ts';

export async function fetchMLWithRetry(
  url: string, 
  accessToken: string, 
  integrationAccountId: string,
  maxRetriesOrHeaders: number | Record<string, string> = 3,
  maxRetries?: number
): Promise<Response> {
  // ✅ Detectar se o 4º parâmetro é customHeaders (objeto) ou maxRetries (número)
  let customHeaders: Record<string, string> = {};
  let actualMaxRetries = 3;
  
  if (typeof maxRetriesOrHeaders === 'object') {
    customHeaders = maxRetriesOrHeaders;
    actualMaxRetries = maxRetries || 3;
  } else {
    actualMaxRetries = maxRetriesOrHeaders;
  }
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...customHeaders
  };
  
  // ✅ CORREÇÃO: Loop de 0 até actualMaxRetries-1 (total de actualMaxRetries tentativas)
  for (let attempt = 0; attempt < actualMaxRetries; attempt++) {
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
        if (attempt < actualMaxRetries - 1) {
          // ✅ CORREÇÃO: Exponential backoff com jitter
          // attempt=0: 1s, attempt=1: 2s, attempt=2: 4s
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = baseDelay * 0.25;
          const delay = Math.min(
            baseDelay + (Math.random() * jitter * 2 - jitter),
            30000
          );
          
          logger.warn(`Retry ${attempt + 1}/${actualMaxRetries} para ${url.substring(0, 50)}... - aguardando ${Math.round(delay)}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error: any) {
      // ✅ Melhorar mensagem de timeout
      if (error.name === 'AbortError') {
        logger.warn(`Timeout na tentativa ${attempt + 1}/${actualMaxRetries} para ${url.substring(0, 50)}...`);
      }
      
      if (attempt === actualMaxRetries - 1) {
        throw error;
      }
      
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = baseDelay * 0.25;
      const delay = Math.min(
        baseDelay + (Math.random() * jitter * 2 - jitter),
        30000
      );
      
      logger.warn(`Erro na tentativa ${attempt + 1}/${actualMaxRetries} - aguardando ${Math.round(delay)}ms`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Falhou após ${actualMaxRetries} tentativas: ${url}`);
}
