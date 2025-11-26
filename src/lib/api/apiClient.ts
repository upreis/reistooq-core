/**
 * 🌐 UNIFIED API CLIENT
 * Centralized API client with validation, retry logic, and interceptors
 */

import { z } from 'zod';
import type {
  ApiClientConfig,
  RequestConfig,
  ApiResponse,
  ApiError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types';

class ApiClient {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 2,
      retryDelay: config.retryDelay || 1000,
      headers: config.headers || {},
    };
  }

  /**
   * Adiciona interceptor de requisição
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adiciona interceptor de resposta
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Adiciona interceptor de erro
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Processa interceptors de requisição
   */
  private async processRequestInterceptors(
    url: string,
    config: RequestConfig
  ): Promise<{ url: string; config: RequestConfig }> {
    let currentUrl = url;
    let currentConfig = config;

    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(currentUrl, currentConfig);
      currentUrl = result.url;
      currentConfig = result.config;
    }

    return { url: currentUrl, config: currentConfig };
  }

  /**
   * Processa interceptors de resposta
   */
  private async processResponseInterceptors<T>(
    response: ApiResponse<T>
  ): Promise<ApiResponse<T>> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }

    return currentResponse;
  }

  /**
   * Processa interceptors de erro
   */
  private async processErrorInterceptors(error: ApiError): Promise<never> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
    throw error;
  }

  /**
   * Constrói URL com query parameters
   */
  private buildURL(baseUrl: string, params?: Record<string, string | number | boolean>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    return url.toString();
  }

  /**
   * Executa requisição com retry logic
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = config.retries ?? this.config.retries;
    const timeout = config.timeout ?? this.config.timeout;

    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combinar signal do config com signal do timeout
      const combinedSignal = config.signal
        ? this.combineAbortSignals([config.signal, controller.signal])
        : controller.signal;

      // Executar fetch
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };

      // Se resposta não é OK, lançar erro
      if (!response.ok) {
        const error: ApiError = {
          message: data.message || `HTTP ${response.status}`,
          status: response.status,
          code: data.code,
          details: data,
        };
        throw error;
      }

      return apiResponse;
    } catch (error) {
      // Se é AbortError (timeout ou cancelamento)
      if (error instanceof Error && error.name === 'AbortError') {
        const apiError: ApiError = {
          message: config.signal?.aborted ? 'Request cancelled' : 'Request timeout',
          code: 'TIMEOUT',
        };
        
        // Não retry em caso de cancelamento explícito
        if (config.signal?.aborted) {
          throw apiError;
        }
        
        // Retry em caso de timeout
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.warn(`[ApiClient] Timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(delay);
          return this.executeRequest<T>(url, config, attempt + 1);
        }
        
        throw apiError;
      }

      // Se é ApiError
      const apiError = error as ApiError;

      // Retry em caso de erro de rede ou 5xx
      const shouldRetry = 
        !apiError.status || 
        (apiError.status >= 500 && apiError.status < 600);

      if (shouldRetry && attempt < maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        console.warn(`[ApiClient] Error ${apiError.status || 'network'}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await this.sleep(delay);
        return this.executeRequest<T>(url, config, attempt + 1);
      }

      // Se não deve retry, processar error interceptors
      await this.processErrorInterceptors(apiError);
      throw apiError;
    }
  }

  /**
   * Combina múltiplos AbortSignals
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort());
    }
    
    return controller.signal;
  }

  /**
   * Sleep helper para retry delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Requisição genérica com validação automática
   */
  async request<TSchema extends z.ZodTypeAny>(
    url: string,
    config: RequestConfig<TSchema> = {}
  ): Promise<z.infer<TSchema>> {
    try {
      // Processar request interceptors
      const { url: interceptedUrl, config: interceptedConfig } = 
        await this.processRequestInterceptors(url, config);

      // Construir URL com params
      const fullUrl = this.buildURL(
        this.config.baseURL + interceptedUrl,
        interceptedConfig.params
      );

      // Executar requisição com retry
      let response = await this.executeRequest<unknown>(fullUrl, interceptedConfig);

      // Processar response interceptors
      response = await this.processResponseInterceptors(response);

      // Validar resposta com schema (se fornecido)
      if (config.schema) {
        const result = config.schema.safeParse(response.data);
        if (!result.success) {
          console.error('[ApiClient] Validation failed:', result.error.issues);
          // TODO: Integrar com ErrorHandler quando criado na FASE 6
          throw {
            message: 'Response validation failed',
            code: 'VALIDATION_ERROR',
            details: result.error.issues,
          } as ApiError;
        }
        return result.data;
      }

      return response.data as z.infer<TSchema>;
    } catch (error) {
      // Log error (TODO: Integrar com ErrorHandler quando criado na FASE 6)
      console.error(`[ApiClient] Error in ${config.method || 'GET'} ${url}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<TSchema extends z.ZodTypeAny>(
    url: string,
    config?: Omit<RequestConfig<TSchema>, 'method' | 'body'>
  ): Promise<z.infer<TSchema>> {
    return this.request(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<TSchema extends z.ZodTypeAny>(
    url: string,
    body?: unknown,
    config?: Omit<RequestConfig<TSchema>, 'method' | 'body'>
  ): Promise<z.infer<TSchema>> {
    return this.request(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<TSchema extends z.ZodTypeAny>(
    url: string,
    body?: unknown,
    config?: Omit<RequestConfig<TSchema>, 'method' | 'body'>
  ): Promise<z.infer<TSchema>> {
    return this.request(url, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<TSchema extends z.ZodTypeAny>(
    url: string,
    body?: unknown,
    config?: Omit<RequestConfig<TSchema>, 'method' | 'body'>
  ): Promise<z.infer<TSchema>> {
    return this.request(url, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<TSchema extends z.ZodTypeAny>(
    url: string,
    config?: Omit<RequestConfig<TSchema>, 'method' | 'body'>
  ): Promise<z.infer<TSchema>> {
    return this.request(url, { ...config, method: 'DELETE' });
  }
}

// Exportar instância singleton
export const apiClient = new ApiClient({
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
});

export { ApiClient };
