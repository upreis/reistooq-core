/**
 * 🔐 API INTERCEPTORS
 * Request/Response interceptors for authentication, tokens, etc.
 */

import { supabase } from '@/integrations/supabase/client';
import type { RequestInterceptor, ErrorInterceptor } from './types';

/**
 * Interceptor que adiciona token de autenticação às requisições
 */
export const authInterceptor: RequestInterceptor = async (url, config) => {
  // Buscar sessão atual
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    // Adicionar Authorization header
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  
  return { url, config };
};

/**
 * Interceptor que trata erros 401 (não autorizado) tentando refresh do token
 */
export const tokenRefreshInterceptor: ErrorInterceptor = async (error) => {
  if (error.status === 401) {
    console.warn('[tokenRefreshInterceptor] Token expirado, tentando refresh...');
    
    try {
      // Tentar refresh automático via Supabase
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !data.session) {
        console.error('[tokenRefreshInterceptor] Refresh falhou:', refreshError);
        // Redirecionar para login se refresh falhar
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error;
      }
      
      console.log('[tokenRefreshInterceptor] Token refreshed com sucesso');
      // Token foi refreshed, mas requisição original deve ser retentada pelo caller
      throw error; // Re-throw para retry logic pegar
    } catch (refreshError) {
      console.error('[tokenRefreshInterceptor] Erro ao tentar refresh:', refreshError);
      throw error;
    }
  }
  
  // Outros erros passam direto
  throw error;
};

/**
 * Interceptor que adiciona organização atual às requisições
 */
export const organizationInterceptor: RequestInterceptor = (url, config) => {
  // Buscar organization_id do localStorage ou contexto
  const organizationId = localStorage.getItem('current_organization_id');
  
  if (organizationId) {
    config.params = {
      ...config.params,
      organization_id: organizationId,
    };
  }
  
  return { url, config };
};

/**
 * Interceptor de logging para debug
 */
export const loggingInterceptor: RequestInterceptor = (url, config) => {
  console.log(`[API Request] ${config.method || 'GET'} ${url}`, {
    params: config.params,
    headers: config.headers,
  });
  
  return { url, config };
};
