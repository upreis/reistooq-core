export const FEATURES = {
  // Core features - always active
  ESTOQUE: true,
  PEDIDOS: true,
  SCANNER: true,
  ANALYTICS: true,
  
  // Integrations - controlled activation
  MERCADO_LIVRE: true, // OAuth configurado e funcional
  SHOPEE: false,        // Not implemented
  TINY_ERP: false,      // Disabled until credentials validated
  AMAZON: false,        // Not implemented
  
  // Advanced features
  SCANNER_V2: true,
  MOBILE_SCANNER: true,
  OFFLINE_MODE: false,
  ADVANCED_ANALYTICS: true,
  VOICE_COMMANDS: true,
  SMART_CACHE: true,
  BATCH_OPERATIONS: true,
  IMAGE_UPLOAD_SCAN: true,
  
  // System features
  ADMIN_PANEL: true,
  ANNOUNCEMENTS: true,
  USER_MANAGEMENT: true
} as const;

export type FeatureFlags = typeof FEATURES;