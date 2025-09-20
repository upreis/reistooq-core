// Configuração centralizada do ambiente
interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'staging';
    baseUrl: string;
    supportEmail: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enableDebugMode: boolean;
    maintenanceMode: boolean;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    rateLimit: {
      requests: number;
      windowMs: number;
    };
  };
}

// Função para validar env vars obrigatórias
function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
}

// Configuração principal
export const config: AppConfig = {
  app: {
    name: 'REISTOQ',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE as 'development' | 'production' | 'staging',
    baseUrl: import.meta.env.VITE_APP_URL || 'https://app.reistoq.com.br',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'suporte@reistoq.com.br'
  },
  supabase: {
    url: 'https://tdjyfqnxvjgossuncpwm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk',
    projectId: 'tdjyfqnxvjgossuncpwm'
  },
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    enableDebugMode: import.meta.env.MODE === 'development',
    maintenanceMode: import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  },
  api: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
    rateLimit: {
      requests: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS || '100'),
      windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || '60000')
    }
  }
};

// Helpers úteis
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isStaging = config.app.environment === 'staging';

// Validação da configuração
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.supabase.url.startsWith('https://')) {
    errors.push('Supabase URL deve começar com https://');
  }

  if (config.supabase.anonKey.length < 100) {
    errors.push('Supabase anon key parece inválida');
  }

  if (!config.app.baseUrl.startsWith('https://') && isProduction) {
    errors.push('Base URL deve usar HTTPS em produção');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Log da configuração (apenas em desenvolvimento)
if (isDevelopment) {
  console.log('🔧 App Config:', {
    environment: config.app.environment,
    version: config.app.version,
    baseUrl: config.app.baseUrl,
    features: config.features
  });

  const validation = validateConfig();
  if (!validation.valid) {
    console.warn('⚠️ Config validation errors:', validation.errors);
  }
}