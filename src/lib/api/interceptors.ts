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
 * Interceptor que trata erros 401 (não autorizado)
 * 
 * IMPORTANTE: Este interceptor apenas loga 401 e redireciona para login.
 * Para retry automático com token refresh, use manualmente:
 * 
 * try {
 *   return await apiClient.get('/protected');
 * } catch (error) {
 *   if (error.status === 401) {
 *     await supabase.auth.refreshSession();
 *     return await apiClient.get('/protected'); // Retry
 *   }
 *   throw error;
 * }
 */
export const unauthorizedInterceptor: ErrorInterceptor = async (error) => {
  if (error.status === 401) {
    console.error('[unauthorizedInterceptor] 401 Unauthorized - token inválido ou expirado');
    
    // Redirecionar para login após pequeno delay
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }
  
  // Sempre re-throw para caller tratar
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
