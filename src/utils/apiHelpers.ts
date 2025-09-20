import { toast } from "sonner";
import { logger } from "./logger";

// Circuit Breaker para APIs que falharam recentemente
class CircuitBreaker {
  private failures = new Map<string, number>();
  private lastFailure = new Map<string, number>();
  private readonly threshold = 5; // Máximo de falhas
  private readonly timeout = 5 * 60 * 1000; // 5 minutos

  isOpen(endpoint: string): boolean {
    const failures = this.failures.get(endpoint) || 0;
    const lastFail = this.lastFailure.get(endpoint) || 0;
    
    if (failures >= this.threshold) {
      const timeSinceLastFail = Date.now() - lastFail;
      return timeSinceLastFail < this.timeout;
    }
    
    return false;
  }

  recordFailure(endpoint: string): void {
    const current = this.failures.get(endpoint) || 0;
    this.failures.set(endpoint, current + 1);
    this.lastFailure.set(endpoint, Date.now());
    
    logger.warn(`Circuit breaker: ${endpoint} failed ${current + 1} times`);
  }

  recordSuccess(endpoint: string): void {
    this.failures.delete(endpoint);
    this.lastFailure.delete(endpoint);
  }

  reset(endpoint: string): void {
    this.failures.delete(endpoint);
    this.lastFailure.delete(endpoint);
  }
}

export const circuitBreaker = new CircuitBreaker();

// Cache simples para reduzir chamadas desnecessárias
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();

// Retry com backoff exponencial
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Timeout para chamadas de API
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 30000,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Wrapper para chamadas de API com circuit breaker, cache e retry
export async function safeApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  options: {
    useCache?: boolean;
    cacheKey?: string;
    cacheTTL?: number;
    maxRetries?: number;
    timeout?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<T | null> {
  const {
    useCache = false,
    cacheKey = endpoint,
    cacheTTL,
    maxRetries = 3,
    timeout = 30000,
    onError
  } = options;

  // Verificar circuit breaker
  if (circuitBreaker.isOpen(endpoint)) {
    const error = new Error(`Circuit breaker aberto para ${endpoint}`);
    logger.warn(error.message);
    onError?.(error);
    return null;
  }

  // Verificar cache
  if (useCache) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit para ${cacheKey}`);
      return cached;
    }
  }

  try {
    const result = await retryWithBackoff(
      () => withTimeout(apiCall(), timeout),
      maxRetries
    );
    
    // Marcar sucesso no circuit breaker
    circuitBreaker.recordSuccess(endpoint);
    
    // Salvar no cache
    if (useCache) {
      apiCache.set(cacheKey, result, cacheTTL);
    }
    
    return result;
  } catch (error) {
    // Marcar falha no circuit breaker
    circuitBreaker.recordFailure(endpoint);
    
    logger.error(`API call failed for ${endpoint}:`, error);
    onError?.(error as Error);
    
    return null;
  }
}

// Helpers para diferentes tipos de erro
export function getErrorMessage(error: any): string {
  if (error?.message?.includes('expired')) {
    return 'Token expirado - reconecte a integração';
  }
  
  if (error?.message?.includes('unauthorized') || error?.status === 401) {
    return 'Sem permissão - verifique as credenciais';
  }
  
  if (error?.message?.includes('rate limit') || error?.status === 429) {
    return 'Muitas requisições - tente novamente em alguns minutos';
  }
  
  if (error?.message?.includes('timeout')) {
    return 'Timeout na conexão - verifique sua internet';
  }
  
  if (error?.status >= 500) {
    return 'Erro no servidor da API - tente novamente';
  }
  
  return error?.message || 'Erro desconhecido na API';
}

// Mostrar toast com mensagem de erro específica
export function showApiError(error: any, context = 'API'): void {
  const message = getErrorMessage(error);
  toast.error(`${context}: ${message}`);
}

// Status das integrações
export interface IntegrationStatus {
  provider: string;
  status: 'connected' | 'error' | 'disconnected' | 'rate_limited';
  lastError?: string;
  lastSuccess?: Date;
  errorCount: number;
}

class IntegrationMonitor {
  private statuses = new Map<string, IntegrationStatus>();

  updateStatus(provider: string, success: boolean, error?: Error): void {
    const current = this.statuses.get(provider) || {
      provider,
      status: 'disconnected',
      errorCount: 0
    };

    if (success) {
      current.status = 'connected';
      current.lastSuccess = new Date();
      current.errorCount = 0;
      current.lastError = undefined;
    } else {
      current.errorCount++;
      current.lastError = error?.message;
      
      if (error?.message?.includes('rate limit')) {
        current.status = 'rate_limited';
      } else {
        current.status = 'error';
      }
    }

    this.statuses.set(provider, current);
  }

  getStatus(provider: string): IntegrationStatus | null {
    return this.statuses.get(provider) || null;
  }

  getAllStatuses(): IntegrationStatus[] {
    return Array.from(this.statuses.values());
  }
}

export const integrationMonitor = new IntegrationMonitor();