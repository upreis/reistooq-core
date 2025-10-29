/**
 * 🔄 RETRY UTILITIES PARA EDGE FUNCTIONS
 * Utilitários de retry otimizados para Deno Edge Functions
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
  timeout: 30000,
  useJitter: true
};

/**
 * Adiciona jitter (variação aleatória) ao delay
 */
function addJitter(delay: number): number {
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
 * Executa uma função fetch com retry automático
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    // ✅ IMPORTANTE: Manter referência do timeoutId para limpeza correta
    let timeoutId: number | undefined;
    
    try {
      // Adicionar timeout usando AbortController
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), opts.timeout);
      
      // Combinar signals se usuário já passou um
      let combinedSignal = controller.signal;
      
      if (init?.signal) {
        const userController = new AbortController();
        
        // ✅ CORREÇÃO: Usar { once: true } para evitar memory leak
        const abortHandler = () => userController.abort();
        controller.signal.addEventListener('abort', abortHandler, { once: true });
        init.signal.addEventListener('abort', abortHandler, { once: true });
        
        combinedSignal = userController.signal;
      }
      
      const response = await fetch(input, {
        ...init,
        signal: combinedSignal
      });
      
      // ✅ CORREÇÃO: Limpar timeout corretamente
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      // Verificar status HTTP (apenas 4xx e 5xx são erros)
      if (response.status >= 400) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // Se não deve retentar ou é a última tentativa, lançar erro
        if (!shouldRetry(error, opts.retryOnStatus) || attempt === opts.maxRetries - 1) {
          throw error;
        }
        
        // Calcular delay com exponential backoff
        let delay = opts.retryDelay * Math.pow(2, attempt);
        if (opts.useJitter) {
          delay = addJitter(delay);
        }
        delay = Math.min(delay, 30000);
        
        console.warn(`⚠️ Tentativa ${attempt + 1}/${opts.maxRetries} falhou (${response.status}). Retentando em ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error: any) {
      // ✅ CORREÇÃO: Limpar timeout em caso de erro
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      lastError = error;
      
      // Se não deve retentar ou é a última tentativa, lançar erro
      if (!shouldRetry(error, opts.retryOnStatus) || attempt === opts.maxRetries - 1) {
        throw error;
      }
      
      // Calcular delay com exponential backoff
      let delay = opts.retryDelay * Math.pow(2, attempt);
      if (opts.useJitter) {
        delay = addJitter(delay);
      }
      delay = Math.min(delay, 30000);
      
      console.warn(`⚠️ Tentativa ${attempt + 1}/${opts.maxRetries} falhou. Retentando em ${Math.round(delay)}ms...`);
      console.warn(`   Erro: ${error instanceof Error ? error.message : String(error)}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
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
  
  return await response.json();
}
