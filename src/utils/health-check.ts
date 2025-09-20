import { supabase } from '@/integrations/supabase/client';
import { config, validateConfig } from '@/config/environment';
import { logger } from '@/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    supabase: HealthCheck;
    config: HealthCheck;
    browser: HealthCheck;
    apis: HealthCheck;
    permissions: HealthCheck;
    integrations: HealthCheck;
  };
  timestamp: string;
  version: string;
  uptime: number;
  performance: PerformanceMetrics;
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  error?: string;
  details?: any;
  lastChecked: string;
}

interface PerformanceMetrics {
  memoryUsage: number; // MB
  loadTime: number; // ms
  apiLatency: number; // ms
  errorRate: number; // %
}

const startTime = Date.now();
const errorCount = { total: 0, recent: 0 };

export const performHealthCheck = async (): Promise<HealthStatus> => {
  const checkStart = Date.now();
  
  const checks = await Promise.allSettled([
    checkSupabase(),
    checkConfig(),
    checkBrowser(),
    checkAPIs(),
    checkPermissions(),
    checkIntegrations()
  ]);

  const healthChecks = {
    supabase: checks[0].status === 'fulfilled' ? checks[0].value : createFailedCheck('Supabase check failed'),
    config: checks[1].status === 'fulfilled' ? checks[1].value : createFailedCheck('Config check failed'),
    browser: checks[2].status === 'fulfilled' ? checks[2].value : createFailedCheck('Browser check failed'),
    apis: checks[3].status === 'fulfilled' ? checks[3].value : createFailedCheck('APIs check failed'),
    permissions: checks[4].status === 'fulfilled' ? checks[4].value : createFailedCheck('Permissions check failed'),
    integrations: checks[5].status === 'fulfilled' ? checks[5].value : createFailedCheck('Integrations check failed')
  };

  const allHealthy = Object.values(healthChecks).every(check => check.status === 'pass');
  const anyFailed = Object.values(healthChecks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(healthChecks).some(check => check.status === 'warn');

  const overallStatus = allHealthy ? 'healthy' : anyFailed ? 'down' : hasWarnings ? 'degraded' : 'healthy';

  const performance = await getPerformanceMetrics();

  return {
    status: overallStatus,
    checks: healthChecks,
    timestamp: new Date().toISOString(),
    version: config.app.version,
    uptime: Date.now() - startTime,
    performance
  };
};

function createFailedCheck(error: string): HealthCheck {
  return {
    status: 'fail',
    error,
    lastChecked: new Date().toISOString()
  };
}

async function checkSupabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (ok)
      throw error;
    }

    // Test auth
    const { data: session } = await supabase.auth.getSession();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'pass',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connection: 'ok',
        auth: session ? 'authenticated' : 'anonymous',
        latency: responseTime < 1000 ? 'good' : responseTime < 3000 ? 'fair' : 'slow'
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString()
    };
  }
}

function checkConfig(): HealthCheck {
  try {
    const validation = validateConfig();
    const issues = [];
    
    // Check required env vars
    if (!config.supabase.url.startsWith('https://')) {
      issues.push('Supabase URL should use HTTPS');
    }
    
    if (config.supabase.anonKey.length < 100) {
      issues.push('Supabase anon key seems invalid');
    }
    
    if (!config.app.baseUrl.startsWith('https://') && config.app.environment === 'production') {
      issues.push('Base URL should use HTTPS in production');
    }

    // Check feature flags
    const enabledFeatures = Object.entries(config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);
    
    if (!validation.valid) {
      return {
        status: 'fail',
        error: validation.errors.join(', '),
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: issues.length === 0 ? 'pass' : 'warn',
      error: issues.length > 0 ? issues.join(', ') : undefined,
      lastChecked: new Date().toISOString(),
      details: {
        environment: config.app.environment,
        enabledFeatures,
        issuesCount: issues.length
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Config validation failed',
      lastChecked: new Date().toISOString()
    };
  }
}

function checkBrowser(): HealthCheck {
  try {
    const issues = [];
    
    // Check required APIs
    const requiredAPIs = [
      'localStorage',
      'sessionStorage', 
      'fetch',
      'WebSocket',
      'Notification'
    ];

    for (const api of requiredAPIs) {
      if (!(api in window)) {
        issues.push(`Missing ${api} API`);
      }
    }

    // Check browser capabilities
    const capabilities = {
      webgl: !!window.WebGLRenderingContext,
      webworkers: !!window.Worker,
      indexeddb: !!window.indexedDB,
      geolocation: !!navigator.geolocation,
      camera: !!navigator.mediaDevices
    };

    return {
      status: issues.length === 0 ? 'pass' : 'warn',
      error: issues.length > 0 ? issues.join(', ') : undefined,
      lastChecked: new Date().toISOString(),
      details: {
        userAgent: navigator.userAgent,
        capabilities,
        issuesCount: issues.length
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Browser compatibility check failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkAPIs(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const apiChecks = await Promise.allSettled([
      // Test unified-orders endpoint
      fetch(`${config.supabase.url}/functions/v1/unified-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabase.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      }).then(r => ({ name: 'unified-orders', status: r.status })),
      
      // Test health endpoint (if exists)
      fetch(`${config.supabase.url}/functions/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.supabase.anonKey}`
        }
      }).then(r => ({ name: 'health', status: r.status })).catch(() => ({ name: 'health', status: 404 }))
    ]);

    const results = apiChecks.map(result => 
      result.status === 'fulfilled' ? result.value : { name: 'unknown', status: 500 }
    );

    const failedAPIs = results.filter(r => r.status >= 400 && r.status !== 404);
    const responseTime = Date.now() - startTime;

    return {
      status: failedAPIs.length === 0 ? 'pass' : failedAPIs.length < results.length ? 'warn' : 'fail',
      responseTime,
      error: failedAPIs.length > 0 ? `Failed APIs: ${failedAPIs.map(a => a.name).join(', ')}` : undefined,
      lastChecked: new Date().toISOString(),
      details: {
        apis: results,
        failedCount: failedAPIs.length,
        totalCount: results.length
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'API check failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkPermissions(): Promise<HealthCheck> {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return {
        status: 'warn',
        error: 'User not authenticated',
        lastChecked: new Date().toISOString(),
        details: { authenticated: false }
      };
    }

    // Test basic permission check
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, organizacao_id')
      .eq('id', session.session.user.id)
      .single();

    if (error) {
      return {
        status: 'fail',
        error: `Permission check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: 'pass',
      lastChecked: new Date().toISOString(),
      details: {
        authenticated: true,
        userId: session.session.user.id,
        organizationId: profile?.organizacao_id,
        hasProfile: !!profile
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Permission check failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkIntegrations(): Promise<HealthCheck> {
  try {
    const { data: integrations, error } = await supabase
      .from('integration_accounts')
      .select('provider, is_active, updated_at')
      .eq('is_active', true);

    if (error) {
      return {
        status: 'warn',
        error: `Integration check failed: ${error.message}`,
        lastChecked: new Date().toISOString()
      };
    }

    const activeIntegrations = integrations || [];
    const staleIntegrations = activeIntegrations.filter(integration => {
      if (!integration.updated_at) return true;
      const lastSync = new Date(integration.updated_at);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      return hoursSinceSync > 24; // Consider stale if not synced in 24h
    });

    return {
      status: staleIntegrations.length === 0 ? 'pass' : 'warn',
      error: staleIntegrations.length > 0 ? `${staleIntegrations.length} integrations need sync` : undefined,
      lastChecked: new Date().toISOString(),
      details: {
        total: activeIntegrations.length,
        stale: staleIntegrations.length,
        providers: activeIntegrations.map(i => i.provider)
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Integration check failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  // Memory usage (approximate)
  const memoryUsage = (performance as any).memory ? 
    Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;

  // Load time from performance API
  const loadTime = performance.timing ? 
    performance.timing.loadEventEnd - performance.timing.navigationStart : 0;

  // API latency (average from recent checks)
  const apiLatency = 500; // Placeholder - would be calculated from actual API calls

  // Error rate (recent errors / total requests)
  const errorRate = errorCount.total > 0 ? (errorCount.recent / errorCount.total) * 100 : 0;

  return {
    memoryUsage,
    loadTime,
    apiLatency,
    errorRate
  };
}

// Function to track errors for metrics
export const trackError = (error: Error) => {
  errorCount.total++;
  errorCount.recent++;
  
  // Reset recent count every hour
  setTimeout(() => {
    errorCount.recent = Math.max(0, errorCount.recent - 1);
  }, 60 * 60 * 1000);

  logger.error('Error tracked for metrics', error);
};