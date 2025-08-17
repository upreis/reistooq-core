// 🎯 ENHANCED - Types para sistema de integrações melhorado
// Advanced type definitions with enhanced functionality

export type Provider = 'tiny' | 'mercadolivre' | 'shopee' | 'amazon' | 'telegram' | 'whatsapp';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'connecting' | 'syncing' | 'validating';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown' | 'maintenance';

export type SyncMode = 'manual' | 'auto' | 'scheduled' | 'realtime';

export interface EnhancedIntegration {
  id: string;
  provider: Provider;
  name: string;
  description: string;
  status: IntegrationStatus;
  health_score: number;
  last_sync: Date | null;
  last_error: string | null;
  config: AdvancedProviderConfig;
  enabled: boolean;
  auto_sync: boolean;
  sync_interval: number;
  sync_mode: SyncMode;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  dependencies: string[];
  webhook_url?: string;
  retry_config: RetryConfig;
  rate_limit: RateLimitConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  created_at: Date;
  updated_at: Date;
  last_config_change: Date;
  version: string;
}

export interface RetryConfig {
  max_attempts: number;
  initial_delay: number;
  max_delay: number;
  exponential_base: number;
  jitter: boolean;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  burst_size: number;
  window_size: number;
  queue_enabled: boolean;
}

export interface MonitoringConfig {
  alerts_enabled: boolean;
  alert_thresholds: {
    error_rate: number;
    response_time: number;
    uptime: number;
  };
  metrics_retention_days: number;
  health_check_interval: number;
}

export interface SecurityConfig {
  encryption_enabled: boolean;
  token_rotation_days: number;
  ip_whitelist: string[];
  require_ssl: boolean;
  audit_enabled: boolean;
}

export interface AdvancedProviderConfig {
  tiny?: EnhancedTinyConfig;
  mercadolivre?: MercadoLivreConfig;
  shopee?: ShopeeConfig;
  amazon?: AmazonConfig;
  telegram?: TelegramConfig;
  whatsapp?: WhatsAppConfig;
}

// Base configs from original types
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

export interface EnhancedTinyConfig {
  token: string;
  api_url: string;
  webhook_url?: string;
  sync_products: boolean;
  sync_stock: boolean;
  sync_orders: boolean;
  stock_sync_direction: 'bidirectional' | 'to_tiny' | 'from_tiny';
  price_sync_enabled: boolean;
  image_sync_enabled: boolean;
  category_mapping: Record<string, string>;
  custom_fields: Record<string, any>;
  batch_size: number;
  timeout_seconds: number;
}

export interface WhatsAppConfig {
  business_account_id: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token: string;
  template_messages: TemplateMessage[];
  auto_respond_enabled: boolean;
  business_hours: BusinessHours;
}

export interface TemplateMessage {
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  components: any[];
}

export interface BusinessHours {
  timezone: string;
  schedule: DaySchedule[];
  holiday_message: string;
}

export interface DaySchedule {
  day: number; // 0-6 (Sunday-Saturday)
  open: string; // HH:MM
  close: string; // HH:MM
  enabled: boolean;
}

export interface IntegrationMetrics {
  provider: Provider;
  period: 'hour' | 'day' | 'week' | 'month';
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  p95_response_time: number;
  uptime_percentage: number;
  data_synced: number;
  sync_duration: number;
  error_rate: number;
  throughput: number;
  concurrent_connections: number;
  bandwidth_usage: number;
  cost: number;
}

export interface IntegrationAlert {
  id: string;
  integration_id: string;
  provider: Provider;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  triggered_at: Date;
  resolved_at?: Date;
  acknowledged: boolean;
  alert_rule: AlertRule;
  metadata: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  enabled: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  endpoint: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
  params?: Record<string, any>;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface EnhancedIntegrationError {
  code: string;
  message: string;
  provider: Provider;
  timestamp: Date;
  details?: Record<string, any>;
  retry_count?: number;
  correlation_id?: string;
  stack_trace?: string;
}

export interface ValidationSuggestion {
  field: string;
  current_value: any;
  suggested_value: any;
  reason: string;
  auto_apply: boolean;
}

// Enhanced Hook Returns
export interface UseEnhancedIntegrationCoreReturn {
  integrations: EnhancedIntegration[];
  loading: boolean;
  error: EnhancedIntegrationError | null;
  metrics: Record<Provider, IntegrationMetrics>;
  alerts: IntegrationAlert[];
  refreshIntegrations: () => Promise<void>;
  connectProvider: (provider: Provider, config: any) => Promise<void>;
  disconnectProvider: (provider: Provider) => Promise<void>;
  testConnection: (provider: Provider) => Promise<ConnectionTestResult>;
  syncData: (provider: Provider, options?: SyncOptions) => Promise<SyncResult>;
  updateConfig: (provider: Provider, config: any) => Promise<void>;
  validateConfig: (provider: Provider, config: any) => Promise<ConfigValidationResult>;
  retryFailedOperations: (provider: Provider) => Promise<void>;
  pauseIntegration: (provider: Provider) => Promise<void>;
  resumeIntegration: (provider: Provider) => Promise<void>;
  getIntegrationLogs: (provider: Provider, limit?: number) => Promise<IntegrationLog[]>;
  exportConfiguration: () => Promise<string>;
  importConfiguration: (config: string) => Promise<void>;
}

export interface ConnectionTestResult {
  success: boolean;
  response_time: number;
  details: {
    api_version?: string;
    rate_limit_remaining?: number;
    server_region?: string;
    features_available?: string[];
  };
  errors?: string[];
  warnings?: string[];
}

export interface SyncOptions {
  force: boolean;
  incremental: boolean;
  entities: string[];
  batch_size?: number;
  dry_run?: boolean;
}

export interface SyncResult {
  success: boolean;
  duration: number;
  entities_processed: number;
  entities_created: number;
  entities_updated: number;
  entities_failed: number;
  errors: string[];
  warnings: string[];
  summary: Record<string, any>;
}

export interface IntegrationLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  provider: Provider;
  operation: string;
  duration?: number;
  metadata: Record<string, any>;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  provider: Provider;
  category: 'ecommerce' | 'erp' | 'marketplace' | 'notification' | 'analytics';
  config_template: any;
  validation_rules: ValidationRule[];
  setup_steps: SetupStep[];
  documentation_url: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimated_setup_time: number; // minutes
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'config' | 'oauth' | 'verification' | 'testing';
  required: boolean;
  estimated_time: number;
  dependencies: string[];
  validation: (data: any) => Promise<boolean>;
}

// Real-time updates
export interface IntegrationEvent {
  type: 'status_change' | 'sync_progress' | 'error' | 'config_update' | 'metric_update';
  provider: Provider;
  timestamp: Date;
  data: any;
}

export interface RealTimeSubscription {
  subscribe: (callback: (event: IntegrationEvent) => void) => () => void;
  unsubscribe: () => void;
  isConnected: boolean;
}

// Backup and restore
export interface ConfigurationBackup {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  created_by: string;
  integrations: EnhancedIntegration[];
  metadata: Record<string, any>;
  checksum: string;
}

// Performance optimization
export interface CacheConfig {
  ttl: number;
  max_size: number;
  strategy: 'lru' | 'fifo' | 'ttl';
  compression: boolean;
  namespace: string;
}

export interface PerformanceMetrics {
  cache_hit_ratio: number;
  average_query_time: number;
  memory_usage: number;
  cpu_usage: number;
  network_latency: number;
  error_rate: number;
  throughput: number;
}