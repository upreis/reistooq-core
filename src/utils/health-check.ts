import { supabase } from '@/integrations/supabase/client';
import { config, validateConfig } from '@/config/environment';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    supabase: HealthCheck;
    config: HealthCheck;
    browser: HealthCheck;
  };
  timestamp: string;
  version: string;
}

interface HealthCheck {
  status: 'pass' | 'fail';
  responseTime?: number;
  error?: string;
}

export const performHealthCheck = async (): Promise<HealthStatus> => {
  const checks = {
    supabase: await checkSupabase(),
    config: checkConfig(),
    browser: checkBrowser()
  };

  const allHealthy = Object.values(checks).every(check => check.status === 'pass');
  const anyFailed = Object.values(checks).some(check => check.status === 'fail');

  return {
    status: allHealthy ? 'healthy' : anyFailed ? 'down' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: config.app.version
  };
};

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

    return {
      status: 'pass',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function checkConfig(): HealthCheck {
  try {
    const validation = validateConfig();
    
    if (!validation.valid) {
      return {
        status: 'fail',
        error: validation.errors.join(', ')
      };
    }

    return { status: 'pass' };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Config validation failed'
    };
  }
}

function checkBrowser(): HealthCheck {
  try {
    // Verificar APIs essenciais do browser
    const requiredAPIs = [
      'localStorage',
      'sessionStorage',
      'fetch',
      'WebSocket'
    ];

    for (const api of requiredAPIs) {
      if (!(api in window)) {
        throw new Error(`Missing browser API: ${api}`);
      }
    }

    return { status: 'pass' };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Browser compatibility check failed'
    };
  }
}