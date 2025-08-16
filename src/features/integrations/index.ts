// 🎯 Centralized exports for integrations feature
// Single point of import for all integration-related functionality

// Types
export * from './types/integrations.types';

// Hooks
export { useIntegrationCore } from './hooks/useIntegrationCore';
export { useConfigManager } from './hooks/useConfigManager';
export { useOAuthFlow } from './hooks/useOAuthFlow';
export { useIntegrationHealth } from './hooks/useIntegrationHealth';

// Services
export { IntegrationService } from './services/IntegrationService';
export { ConfigService } from './services/ConfigService';
export { OAuthService } from './services/OAuthService';
export { HealthService } from './services/HealthService';

// Re-export commonly used types for convenience
export type {
  Integration,
  Provider,
  IntegrationStatus,
  HealthStatus,
  ProviderConfig,
  TinyConfig,
  MercadoLivreConfig,
  ShopeeConfig,
  AmazonConfig,
  TelegramConfig,
  HealthCheck,
  IntegrationMetrics,
  OAuthState,
  OAuthConfig,
  IntegrationError,
  ConfigValidationResult,
  UseIntegrationCoreReturn,
  UseConfigManagerReturn,
  UseOAuthFlowReturn,
  UseIntegrationHealthReturn
} from './types/integrations.types';