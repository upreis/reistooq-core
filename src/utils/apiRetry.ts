/**
 * 🔄 UTILITÁRIO DE RETRY PARA CHAMADAS HTTP
 * Adiciona retry automático em caso de falhas de rede
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryOnStatus?: number[];
  timeout?: number;
  useJitter?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  timeout: 30000, // 30 segundos
  useJitter: true
};

/**
 * Função auxiliar para esperar
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Adiciona jitter (variação aleatória) ao delay para evitar thundering herd
 */
function addJitter(delay: number): number {
  // Adiciona variação de ±25%
  const jitter = delay * 0.25;
  return delay + (Math.random() * jitter * 2 - jitter);
}

/**
 * Verifica se o erro deve ser retentado
 */
function shouldRetry(error: any, retryOnStatus: number[]): boolean {
  // Erros de rede
  if (error.name === 'NetworkError' || error.message?.includes('Failed to fetch')) {
    return true;
  }
  
  // Erros HTTP específicos
  if (error.status && retryOnStatus.includes(error.status)) {
    return true;
  }
  
  // Erros de timeout
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.name === 'AbortError') {
    return true;
  }
  
  // Erros de conexão
  if (error.message?.includes('ERR_') || error.message?.includes('net::')) {
    return true;
  }
  
  return false;
}

/**
 * Executa uma função com retry automático
 * 
 * @example
 * const data = await withRetry(() => fetch('/api/data'), { maxRetries: 5 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  // ✅ CORREÇÃO: Loop vai de 0 até maxRetries-1 (total de maxRetries tentativas)
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se não deve retentar ou é a última tentativa, lançar erro
      if (!shouldRetry(error, opts.retryOnStatus) || attempt === opts.maxRetries - 1) {
        throw error;
      }
      
      // ✅ CORREÇÃO: Calcular delay com exponential backoff começando do attempt atual
      // Primeira retry (attempt=0): delay base
      // Segunda retry (attempt=1): delay * 2
      // Terceira retry (attempt=2): delay * 4
      let delay = opts.retryDelay * Math.pow(2, attempt);
      
      // ✅ ADICIONAR JITTER para evitar thundering herd
      if (opts.useJitter) {
        delay = addJitter(delay);
      }
      
      // Limitar delay máximo a 30 segundos
      delay = Math.min(delay, 30000);
      
      // ✅ MELHOR LOG: Só em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.log(`⚠️ Tentativa ${attempt + 1}/${opts.maxRetries} falhou. Retentando em ${Math.round(delay)}ms...`);
        console.log(`   Erro: ${error.message}`);
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Wrapper para fetch com retry automático e timeout
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return withRetry(async () => {
    // ✅ ADICIONAR TIMEOUT usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // ✅ CORREÇÃO: Verificar apenas erros genuínos (4xx e 5xx)
      // Permitir 2xx e 3xx (success e redirects)
      if (response.status >= 400) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Se foi abort por timeout, melhorar a mensagem
      if (error.name === 'AbortError') {
        const timeoutError: any = new Error(`Request timeout after ${opts.timeout}ms`);
        timeoutError.name = 'TimeoutError';
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      
      throw error;
    }
  }, options);
}

/**
 * Helper para fazer POST com retry
 */
export async function postWithRetry<T = any>(
  url: string,
  body: any,
  options?: RetryOptions & { headers?: HeadersInit }
): Promise<T> {
  const { headers, ...retryOptions } = options || {};
  
  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    },
    retryOptions
  );
  
  return response.json();
}

/**
 * Helper para fazer GET com retry
 */
export async function getWithRetry<T = any>(
  url: string,
  options?: RetryOptions & { headers?: HeadersInit }
): Promise<T> {
  const { headers, ...retryOptions } = options || {};
  
  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers
    },
    retryOptions
  );
  
  return response.json();
}
