/**
 * 🔄 UTILITÁRIO DE RETRY PARA CHAMADAS HTTP
 * Adiciona retry automático em caso de falhas de rede
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryOnStatus?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOnStatus: [408, 429, 500, 502, 503, 504]
};

/**
 * Função auxiliar para esperar
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
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
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se não deve retentar ou é a última tentativa, lançar erro
      if (!shouldRetry(error, opts.retryOnStatus) || attempt === opts.maxRetries) {
        throw error;
      }
      
      // Calcular delay com exponential backoff
      const delay = opts.retryDelay * Math.pow(2, attempt);
      console.log(`⚠️ Tentativa ${attempt + 1}/${opts.maxRetries} falhou. Retentando em ${delay}ms...`);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Wrapper para fetch com retry automático
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(input, init);
    
    // Verificar status HTTP
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  }, options);
}
