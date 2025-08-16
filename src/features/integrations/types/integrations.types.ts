// 🎯 Types centralizados para sistema de integrações
// Unified type definitions for integrations architecture

export type Provider = 'tiny' | 'mercadolivre' | 'shopee' | 'amazon' | 'telegram';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface Integration {
  id: string;
  provider: Provider;
  name: string;
  description: string;
  status: IntegrationStatus;
  health_score: number;
  last_sync: Date | null;
  last_error: string | null;
  config: ProviderConfig;
  enabled: boolean;
  auto_sync: boolean;
  sync_interval: number; // minutes
}

export interface ProviderConfig {
  tiny?: TinyConfig;
  mercadolivre?: MercadoLivreConfig;
  shopee?: ShopeeConfig;
  amazon?: AmazonConfig;
  telegram?: TelegramConfig;
}

export interface TinyConfig {
  token: string;
  api_url: string;
  webhook_url?: string;
  sync_products: boolean;
  sync_stock: boolean;
  sync_orders: boolean;
}

export interface MercadoLivreConfig {
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  user_id?: string;
  redirect_uri: string;
}

export interface ShopeeConfig {
  partner_id: string;
  partner_key: string;
  shop_id?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
}

export interface AmazonConfig {
  marketplace_id: string;
  seller_id: string;
  mws_auth_token: string;
  access_key_id: string;
  secret_access_key: string;
}

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  webhook_url?: string;
  notifications_enabled: boolean;
}

export interface HealthCheck {
  provider: Provider;
  status: HealthStatus;
  last_check: Date;
  response_time: number;
  error_rate: number;
  uptime_percentage: number;
  last_error?: string;
}

export interface OAuthState {
  provider: Provider;
  state: string;
  code_verifier?: string;
  redirect_uri: string;
  expires_at: Date;
  scopes?: string[];
}

export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  authorization_url: string;
  token_url: string;
  redirect_uri: string;
  scopes: string[];
  use_pkce: boolean;
}

export interface IntegrationError {
  code: string;
  message: string;
  provider: Provider;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface IntegrationMetrics {
  provider: Provider;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  last_24h_uptime: number;
  data_synced: number;
  last_sync_duration: number;
}

// Hook return types
export interface UseIntegrationCoreReturn {
  integrations: Integration[];
  loading: boolean;
  error: IntegrationError | null;
  refreshIntegrations: () => Promise<void>;
  connectProvider: (provider: Provider) => Promise<void>;
  disconnectProvider: (provider: Provider) => Promise<void>;
  testConnection: (provider: Provider) => Promise<boolean>;
  syncData: (provider: Provider) => Promise<void>;
}

export interface UseConfigManagerReturn {
  configs: ProviderConfig;
  loading: boolean;
  errors: Record<string, string[]>;
  isValid: boolean;
  saveConfig: (provider: Provider, config: any) => Promise<void>;
  bulkUpdateConfigs: (configs: Partial<ProviderConfig>) => Promise<void>;
  validateConfig: (provider: Provider, config: any) => ConfigValidationResult;
  resetConfig: (provider: Provider) => void;
}

export interface UseOAuthFlowReturn {
  isAuthenticating: boolean;
  authError: string | null;
  initiateFlow: (provider: Provider) => Promise<void>;
  handleCallback: (provider: Provider, params: URLSearchParams) => Promise<void>;
  refreshToken: (provider: Provider) => Promise<void>;
  revokeAccess: (provider: Provider) => Promise<void>;
}

export interface UseIntegrationHealthReturn {
  healthStatus: Record<Provider, HealthCheck>;
  overallHealth: HealthStatus;
  loading: boolean;
  refreshHealth: () => Promise<void>;
  getMetrics: (provider: Provider) => IntegrationMetrics | null;
  autoHeal: (provider: Provider) => Promise<boolean>;
}

// Event types for analytics
export type IntegrationEvent = 
  | 'integration_connected'
  | 'integration_disconnected'
  | 'config_updated'
  | 'oauth_completed'
  | 'oauth_failed'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'health_check'
  | 'auto_heal_triggered'
  | 'error_occurred';

export interface IntegrationEventData {
  event: IntegrationEvent;
  provider: Provider;
  timestamp: Date;
  metadata?: Record<string, any>;
  user_id?: string;
}