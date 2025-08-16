// 🎯 Integration health monitoring hook
// Real-time health checks with auto-healing capabilities

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UseIntegrationHealthReturn, HealthCheck, Provider, HealthStatus, IntegrationMetrics } from '../types/integrations.types';
import { HealthService } from '../services/HealthService';
import { useToast } from '@/hooks/use-toast';

export const useIntegrationHealth = (): UseIntegrationHealthReturn => {
  const [healthStatus, setHealthStatus] = useState<Record<Provider, HealthCheck>>({
    tiny: createInitialHealthCheck('tiny'),
    mercadolivre: createInitialHealthCheck('mercadolivre'),
    shopee: createInitialHealthCheck('shopee'),
    amazon: createInitialHealthCheck('amazon'),
    telegram: createInitialHealthCheck('telegram'),
  });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<Provider, IntegrationMetrics | null>>({
    tiny: null,
    mercadolivre: null,
    shopee: null,
    amazon: null,
    telegram: null,
  });
  const { toast } = useToast();

  // Memoized service
  const healthService = useMemo(() => new HealthService(), []);

  // Calculate overall health
  const overallHealth = useMemo((): HealthStatus => {
    const statuses = Object.values(healthStatus).map(check => check.status);
    
    if (statuses.every(status => status === 'healthy')) return 'healthy';
    if (statuses.some(status => status === 'down')) return 'down';
    if (statuses.some(status => status === 'degraded')) return 'degraded';
    return 'unknown';
  }, [healthStatus]);

  // Check health for single provider
  const checkProviderHealth = useCallback(async (provider: Provider): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const isHealthy = await healthService.checkHealth(provider);
      const responseTime = Date.now() - startTime;

      const healthCheck: HealthCheck = {
        provider,
        status: isHealthy ? 'healthy' : 'down',
        last_check: new Date(),
        response_time: responseTime,
        error_rate: 0, // TODO: Calculate from historical data
        uptime_percentage: isHealthy ? 100 : 0, // TODO: Calculate from historical data
      };

      return healthCheck;
    } catch (error) {
      return {
        provider,
        status: 'down',
        last_check: new Date(),
        response_time: 0,
        error_rate: 100,
        uptime_percentage: 0,
        last_error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [healthService]);

  // Refresh health for all providers
  const refreshHealth = useCallback(async () => {
    try {
      setLoading(true);
      
      const providers: Provider[] = ['tiny', 'mercadolivre', 'shopee', 'amazon', 'telegram'];
      const healthChecks = await Promise.allSettled(
        providers.map(provider => checkProviderHealth(provider))
      );

      const newHealthStatus: Record<Provider, HealthCheck> = {} as any;
      
      healthChecks.forEach((result, index) => {
        const provider = providers[index];
        if (result.status === 'fulfilled') {
          newHealthStatus[provider] = result.value;
        } else {
          newHealthStatus[provider] = {
            provider,
            status: 'unknown',
            last_check: new Date(),
            response_time: 0,
            error_rate: 100,
            uptime_percentage: 0,
            last_error: 'Health check failed',
          };
        }
      });

      setHealthStatus(newHealthStatus);
      
      // Load metrics for each provider
      const metricsData: Record<Provider, IntegrationMetrics | null> = {} as any;
      for (const provider of providers) {
        try {
          metricsData[provider] = await healthService.getMetrics(provider);
        } catch {
          metricsData[provider] = null;
        }
      }
      setMetrics(metricsData);

    } catch (error) {
      console.error('Failed to refresh health:', error);
      toast({
        title: "Erro ao verificar saúde",
        description: "Não foi possível verificar o status das integrações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [checkProviderHealth, healthService, toast]);

  // Get metrics for specific provider
  const getMetrics = useCallback((provider: Provider): IntegrationMetrics | null => {
    return metrics[provider];
  }, [metrics]);

  // Auto-heal provider
  const autoHeal = useCallback(async (provider: Provider): Promise<boolean> => {
    try {
      const success = await healthService.autoHeal(provider);
      
      if (success) {
        // Refresh health after healing
        const newHealth = await checkProviderHealth(provider);
        setHealthStatus(prev => ({ ...prev, [provider]: newHealth }));
        
        toast({
          title: "Auto-recuperação bem-sucedida",
          description: `${provider} foi recuperado automaticamente`,
        });
      } else {
        toast({
          title: "Auto-recuperação falhou",
          description: `Não foi possível recuperar ${provider} automaticamente`,
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error(`Auto-heal failed for ${provider}:`, error);
      toast({
        title: "Erro na auto-recuperação",
        description: `Falha ao tentar recuperar ${provider}`,
        variant: "destructive"
      });
      return false;
    }
  }, [healthService, checkProviderHealth, toast]);

  // Monitor health status changes and trigger alerts
  useEffect(() => {
    const previousStatus = JSON.stringify(healthStatus);
    
    Object.entries(healthStatus).forEach(([provider, check]) => {
      if (check.status === 'down' && check.last_error) {
        // Only show toast for new failures
        const prevCheck = JSON.parse(previousStatus || '{}')[provider];
        if (!prevCheck || prevCheck.status !== 'down') {
          toast({
            title: `${provider} está offline`,
            description: check.last_error,
            variant: "destructive"
          });
        }
      }
    });
  }, [healthStatus, toast]);

  // Set up periodic health checks
  useEffect(() => {
    // Initial health check
    refreshHealth();

    // Set up interval for regular checks (every 5 minutes)
    const interval = setInterval(refreshHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Auto-healing for critical providers
  useEffect(() => {
    const criticalProviders: Provider[] = ['tiny', 'mercadolivre'];
    
    criticalProviders.forEach(provider => {
      const check = healthStatus[provider];
      if (check.status === 'down' && check.last_check) {
        const timeSinceLastCheck = Date.now() - check.last_check.getTime();
        
        // Auto-heal if down for more than 2 minutes
        if (timeSinceLastCheck > 2 * 60 * 1000) {
          autoHeal(provider);
        }
      }
    });
  }, [healthStatus, autoHeal]);

  return {
    healthStatus,
    overallHealth,
    loading,
    refreshHealth,
    getMetrics,
    autoHeal
  };
};

// Helper function to create initial health check
function createInitialHealthCheck(provider: Provider): HealthCheck {
  return {
    provider,
    status: 'unknown',
    last_check: new Date(),
    response_time: 0,
    error_rate: 0,
    uptime_percentage: 0,
  };
}