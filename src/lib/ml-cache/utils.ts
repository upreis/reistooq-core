/**
 * 🔄 ML ORDERS CACHE - SHARED UTILITIES
 * Funções utilitárias para validação e gerenciamento de cache
 */

import { MlOrderCacheEntry, CacheValidationResult, CacheQueryParams, DEFAULT_CACHE_CONFIG } from './types';

/**
 * Valida se dados do cache ainda são válidos baseado em TTL
 */
export function isCacheValid(cachedAt: string, ttlMinutes: number = DEFAULT_CACHE_CONFIG.ttl_minutes): boolean {
  const cached = new Date(cachedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - cached.getTime()) / (1000 * 60);
  
  return diffMinutes < ttlMinutes;
}

/**
 * Calcula data de expiração baseado em TTL
 */
export function calculateExpiresAt(ttlMinutes: number = DEFAULT_CACHE_CONFIG.ttl_minutes): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  return expiresAt.toISOString();
}

/**
 * Verifica se dados estão stale mas ainda utilizáveis
 */
export function isStale(cachedAt: string, ttlMinutes: number, maxAgeMinutes: number): boolean {
  const cached = new Date(cachedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - cached.getTime()) / (1000 * 60);
  
  return diffMinutes >= ttlMinutes && diffMinutes < maxAgeMinutes;
}

/**
 * Valida se contas selecionadas correspondem aos dados em cache
 */
export function validateAccountsMatch(
  requestedAccounts: string[],
  cachedEntries: MlOrderCacheEntry[]
): boolean {
  if (requestedAccounts.length === 0) return true;
  
  const cachedAccountIds = new Set(
    cachedEntries.map(entry => entry.integration_account_id)
  );
  
  // Todos os accounts requisitados devem estar no cache
  return requestedAccounts.every(accountId => cachedAccountIds.has(accountId));
}

/**
 * Gera chave única para cache baseado em parâmetros
 */
export function generateCacheKey(params: CacheQueryParams): string {
  const parts: string[] = [];
  
  if (params.integration_account_id) {
    parts.push(`acc:${params.integration_account_id}`);
  } else if (params.integration_account_ids && params.integration_account_ids.length > 0) {
    parts.push(`accs:${params.integration_account_ids.sort().join(',')}`);
  }
  
  if (params.date_from) parts.push(`from:${params.date_from}`);
  if (params.date_to) parts.push(`to:${params.date_to}`);
  
  return parts.join('|');
}

/**
 * Valida completude de dados em cache
 */
export function validateCacheCompleteness(
  cachedEntries: MlOrderCacheEntry[],
  expectedAccounts: string[]
): CacheValidationResult {
  if (cachedEntries.length === 0) {
    return {
      isValid: false,
      reason: 'no_data'
    };
  }
  
  // Verifica TTL
  const oldestEntry = cachedEntries.reduce((oldest, entry) => {
    return new Date(entry.cached_at) < new Date(oldest.cached_at) ? entry : oldest;
  }, cachedEntries[0]);
  
  if (!isCacheValid(oldestEntry.cached_at)) {
    return {
      isValid: false,
      reason: 'expired',
      expiresAt: oldestEntry.ttl_expires_at
    };
  }
  
  // Verifica se todas contas esperadas estão presentes
  if (expectedAccounts.length > 0 && !validateAccountsMatch(expectedAccounts, cachedEntries)) {
    return {
      isValid: false,
      reason: 'invalid_accounts'
    };
  }
  
  return {
    isValid: true,
    cachedOrders: cachedEntries.map(entry => entry.order_data),
    expiresAt: oldestEntry.ttl_expires_at
  };
}

/**
 * Filtra pedidos por range de datas
 */
export function filterOrdersByDateRange(
  orders: any[],
  dateFrom?: string,
  dateTo?: string
): any[] {
  if (!dateFrom && !dateTo) return orders;
  
  return orders.filter(order => {
    const orderDate = order.date_created || order.data_criacao;
    if (!orderDate) return true;
    
    const date = new Date(orderDate);
    
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (date < from) return false;
    }
    
    if (dateTo) {
      const to = new Date(dateTo);
      if (date > to) return false;
    }
    
    return true;
  });
}
