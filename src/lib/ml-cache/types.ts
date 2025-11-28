/**
 * 🔄 ML ORDERS CACHE - SHARED TYPES
 * Tipos compartilhados para sistema unificado de cache do Mercado Livre
 */

export interface MlOrderCacheEntry {
  id: string;
  organization_id: string; // ✅ CORREÇÃO PROBLEMA 4
  integration_account_id: string;
  order_id: string;
  order_data: any; // JSON completo do pedido enriquecido
  cached_at: string;
  ttl_expires_at: string;
}

export interface CacheQueryParams {
  integration_account_id?: string;
  integration_account_ids?: string[];
  date_from?: string;
  date_to?: string;
}

export interface CacheValidationResult {
  isValid: boolean;
  reason?: 'expired' | 'missing' | 'invalid_accounts' | 'no_data';
  cachedOrders?: any[];
  expiresAt?: string;
}

export interface MlOrdersCacheConfig {
  ttl_minutes: number; // TTL padrão em minutos
  max_age_minutes: number; // Idade máxima antes de forçar refresh
  stale_while_revalidate: boolean; // Permitir dados stale enquanto revalida
}

export const DEFAULT_CACHE_CONFIG: MlOrdersCacheConfig = {
  ttl_minutes: 15, // 15 minutos de TTL
  max_age_minutes: 60, // Máximo 1 hora antes de forçar refresh
  stale_while_revalidate: true
};
