export const FEATURES = {
  SCANNER_V2: true,
  MOBILE_SCANNER: true,
  OFFLINE_MODE: false,
  ADVANCED_ANALYTICS: true,
  VOICE_COMMANDS: true,
  SMART_CACHE: true,
  BATCH_OPERATIONS: true,
  IMAGE_UPLOAD_SCAN: true
} as const;

export type FeatureFlags = typeof FEATURES;