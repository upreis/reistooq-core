/**
 * 🎯 SWR GLOBAL CONFIGURATION - FASE 6
 * Configuração centralizada de cache para toda a aplicação
 */

import { SWRConfiguration } from 'swr';
import { toast } from 'react-hot-toast';

// Tempo de cache em milissegundos
export const CACHE_TIMES = {
  REALTIME: 10 * 1000,      // 10 segundos (dados em tempo real)
  SHORT: 60 * 1000,          // 1 minuto (dados frequentes)
  MEDIUM: 5 * 60 * 1000,     // 5 minutos (dados semi-estáticos)
  LONG: 30 * 60 * 1000,      // 30 minutos (dados estáticos)
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 horas (dados raros)
} as const;

// Chaves de cache para invalidação seletiva
export const CACHE_KEYS = {
  DEVOLUCOES: 'devolucoes',
  ORDERS: 'orders',
  CLAIMS: 'claims',
  METRICS: 'metrics',
  PERFORMANCE: 'performance',
  BACKGROUND_JOBS: 'background_jobs',
} as const;

/**
 * Configuração global do SWR para cache inteligente
 */
export const swrGlobalConfig: SWRConfiguration = {
  // Revalidação
  revalidateOnFocus: false, // Não revalidar ao focar na janela
  revalidateOnReconnect: true, // Revalidar ao reconectar internet
  revalidateIfStale: false, // Não revalidar se dados estão stale
  
  // Deduplicação
  dedupingInterval: 5000, // 5 segundos de deduplicação para evitar requests duplicados
  
  // Performance
  suspense: false, // Não usar Suspense (pode causar waterfall de requests)
  loadingTimeout: 3000, // 3 segundos de timeout para loading
  
  // Retry
  errorRetryCount: 3, // Tentar 3 vezes em caso de erro
  errorRetryInterval: 5000, // 5 segundos entre retries
  shouldRetryOnError: true,
  
  // Callbacks globais
  onError: (error, key) => {
    console.error('[SWR] Erro global:', { key, error });
    
    // Não mostrar toast para requests cancelados ou deduplicados
    if (error?.name === 'AbortError' || error?.message?.includes('duplicate')) {
      return;
    }
    
    // Toast para erros reais
    toast.error(`Erro ao carregar dados: ${error?.message || 'Erro desconhecido'}`);
  },
  
  onSuccess: (data, key) => {
    // Log de sucesso apenas em dev
    if (import.meta.env.DEV) {
      console.log('[SWR] Cache atualizado:', key, {
        records: Array.isArray(data) ? data.length : 'N/A',
        timestamp: new Date().toISOString(),
      });
    }
  },
  
  // Fallback data
  fallback: {},
  
  // Provider para persistência
  provider: () => new Map(),
};

/**
 * Helper para criar chaves de cache consistentes
 */
export function createCacheKey(
  baseKey: string,
  params?: Record<string, unknown>
): string | null {
  if (!params) return baseKey;
  
  // Ordenar params para garantir consistência
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key];
      // Ignorar valores null/undefined
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  
  // Se não há params válidos, retornar null para evitar fetch
  if (Object.keys(sortedParams).length === 0) {
    return null;
  }
  
  return `${baseKey}:${JSON.stringify(sortedParams)}`;
}

/**
 * Configuração de cache por tipo de dado
 */
export const cacheConfigs = {
  // Devoluções - dados que mudam com frequência
  devolucoes: {
    refreshInterval: CACHE_TIMES.SHORT,
    dedupingInterval: CACHE_TIMES.REALTIME,
  },
  
  // Métricas - pode cachear por mais tempo
  metrics: {
    refreshInterval: CACHE_TIMES.MEDIUM,
    dedupingInterval: CACHE_TIMES.SHORT,
  },
  
  // Performance - dados semi-estáticos
  performance: {
    refreshInterval: CACHE_TIMES.LONG,
    dedupingInterval: CACHE_TIMES.MEDIUM,
  },
  
  // Background jobs - status muda frequentemente
  backgroundJobs: {
    refreshInterval: CACHE_TIMES.REALTIME,
    dedupingInterval: CACHE_TIMES.REALTIME,
  },
} as const;

/**
 * Utilitário para invalidar cache específico
 */
export function invalidateCache(mutate: any, pattern: string) {
  return mutate(
    (key: string) => typeof key === 'string' && key.startsWith(pattern),
    undefined,
    { revalidate: true }
  );
}

/**
 * Utilitário para limpar todo o cache
 */
export function clearAllCache(mutate: any) {
  return mutate(() => true, undefined, { revalidate: false });
}
