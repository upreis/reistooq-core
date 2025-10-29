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
      
      // ✅ CORREÇÃO: Calcular delay com exponential backoff
      // attempt=0 (primeira falha): delay base (1s)
      // attempt=1 (segunda falha): delay * 2 (2s)
      // attempt=2 (terceira falha): delay * 4 (4s)
      let delay = opts.retryDelay * Math.pow(2, attempt);
      
      // ✅ ADICIONAR JITTER para evitar thundering herd
      if (opts.useJitter) {
        delay = addJitter(delay);
      }
      
      // Limitar delay máximo a 30 segundos
      delay = Math.min(delay, 30000);
      
      // ✅ MELHOR LOG: Só em desenvolvimento
      if (import.meta.env.DEV) {
        console.log(`⚠️ Tentativa ${attempt + 1}/${opts.maxRetries} falhou. Retentando em ${Math.round(delay)}ms...`);
        console.log(`   Erro: ${error instanceof Error ? error.message : String(error)}`);
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
    
    // ✅ CORREÇÃO: Combinar signals se usuário já passou um
    let combinedSignal = controller.signal;
    
    if (init?.signal) {
      // Criar um novo AbortController que responde a ambos os signals
      const userController = new AbortController();
      
      // Se qualquer um abortar, abortar o combinado
      const abortHandler = () => userController.abort();
      controller.signal.addEventListener('abort', abortHandler);
      init.signal.addEventListener('abort', abortHandler);
      
      combinedSignal = userController.signal;
    }
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: combinedSignal
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
  // ✅ VALIDAÇÃO: Verificar entrada
  if (!url || typeof url !== 'string') {
    throw new TypeError('URL deve ser uma string não vazia');
  }
  
  const { headers, ...retryOptions } = options || {};
  
  // ✅ VALIDAÇÃO: Verificar se body é serializável
  let serializedBody: string;
  try {
    serializedBody = JSON.stringify(body);
  } catch (error) {
    throw new TypeError('Body contém estrutura circular ou não serializável');
  }
  
  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: serializedBody
    },
    retryOptions
  );
  
  // ✅ VALIDAÇÃO: Verificar se resposta é JSON válido
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new TypeError(`Response não é JSON. Content-Type: ${contentType}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new TypeError('Resposta contém JSON inválido');
  }
}

/**
 * Helper para fazer GET com retry
 */
export async function getWithRetry<T = any>(
  url: string,
  options?: RetryOptions & { headers?: HeadersInit }
): Promise<T> {
  // ✅ VALIDAÇÃO: Verificar entrada
  if (!url || typeof url !== 'string') {
    throw new TypeError('URL deve ser uma string não vazia');
  }
  
  const { headers, ...retryOptions } = options || {};
  
  const response = await fetchWithRetry(
    url,
    {
      method: 'GET',
      headers
    },
    retryOptions
  );
  
  // ✅ VALIDAÇÃO: Verificar se resposta é JSON válido
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new TypeError(`Response não é JSON. Content-Type: ${contentType}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new TypeError('Resposta contém JSON inválido');
  }
}
