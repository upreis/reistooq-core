/**
 * 🔌 INTEGRATION ACCOUNT SCHEMAS
 * Zod validation schemas for Integration Accounts
 */

import { z } from 'zod';

// Token Status Schema
export const TokenStatusSchema = z.enum([
  'active',
  'expired',
  'invalid',
  'pending',
  'revoked',
]).or(z.string());

// Provider Schema
export const ProviderSchema = z.enum([
  'mercadolivre',
  'shopee',
  'tiny',
  'bling',
  'custom',
]).or(z.string());

// Base Integration Account Schema
export const BaseIntegrationAccountSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  provider: ProviderSchema,
  account_name: z.string(),
  is_active: z.boolean().optional().default(true),
  token_status: TokenStatusSchema.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Full Integration Account Schema
export const FullIntegrationAccountSchema = BaseIntegrationAccountSchema.extend({
  user_id: z.string().optional().nullable(),
  external_user_id: z.string().optional().nullable(),
  
  // Token information
  token_expires_at: z.string().optional().nullable(),
  last_token_refresh: z.string().optional().nullable(),
  refresh_token_expires_at: z.string().optional().nullable(),
  
  // Sync metadata
  last_sync_at: z.string().optional().nullable(),
  last_sync_status: z.string().optional().nullable(),
  sync_error_message: z.string().optional().nullable(),
  
  // Configuration
  config: z.record(z.string(), z.any()).optional(),
  
  // Stats
  total_orders_synced: z.number().optional().nullable(),
  total_products_synced: z.number().optional().nullable(),
});

// Export types
export type TokenStatus = z.infer<typeof TokenStatusSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type BaseIntegrationAccount = z.infer<typeof BaseIntegrationAccountSchema>;
export type FullIntegrationAccount = z.infer<typeof FullIntegrationAccountSchema>;

/**
 * Safe parse with fallback
 */
export function parseIntegrationAccount(data: unknown): FullIntegrationAccount | null {
  const result = FullIntegrationAccountSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[parseIntegrationAccount] Validation failed:', result.error.issues);
  return null;
}

export function parseIntegrationAccounts(data: unknown[]): FullIntegrationAccount[] {
  return data
    .map(item => parseIntegrationAccount(item))
    .filter((acc): acc is FullIntegrationAccount => acc !== null);
}
