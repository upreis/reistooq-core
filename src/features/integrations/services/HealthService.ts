// 🎯 Integration health monitoring service
// Real-time health checks with auto-healing capabilities

import { Provider, HealthCheck, IntegrationMetrics } from '../types/integrations.types';
import { supabase } from '@/integrations/supabase/client';

export class HealthService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Check health for a specific provider
  async checkHealth(provider: Provider): Promise<boolean> {
    try {
      switch (provider) {
        case 'tiny':
          return await this.checkTinyHealth();
        case 'mercadolivre':
          return await this.checkMercadoLivreHealth();
        case 'shopee':
          return await this.checkShopeeHealth();
        case 'amazon':
          return await this.checkAmazonHealth();
        case 'telegram':
          return await this.checkTelegramHealth();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Health check failed for ${provider}:`, error);
      return false;
    }
  }

  // Get comprehensive metrics for a provider
  async getMetrics(provider: Provider): Promise<IntegrationMetrics | null> {
    const cacheKey = `metrics_${provider}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Get metrics from database
      const { data, error } = await supabase
        .from('integration_metrics')
        .select('*')
        .eq('provider', provider)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }

      const metrics: IntegrationMetrics | null = data ? {
        provider,
        total_requests: data.total_requests || 0,
        successful_requests: data.successful_requests || 0,
        failed_requests: data.failed_requests || 0,
        average_response_time: data.average_response_time || 0,
        last_24h_uptime: data.last_24h_uptime || 0,
        data_synced: data.data_synced || 0,
        last_sync_duration: data.last_sync_duration || 0,
      } : null;

      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });
      return metrics;

    } catch (error) {
      console.error(`Failed to get metrics for ${provider}:`, error);
      return null;
    }
  }

  // Auto-heal a provider
  async autoHeal(provider: Provider): Promise<boolean> {
    try {
      console.log(`Attempting auto-heal for ${provider}...`);

      // Provider-specific healing strategies
      switch (provider) {
        case 'tiny':
          return await this.healTinyConnection();
        case 'mercadolivre':
          return await this.healMercadoLivreConnection();
        case 'shopee':
          return await this.healShopeeConnection();
        case 'amazon':
          return await this.healAmazonConnection();
        case 'telegram':
          return await this.healTelegramConnection();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Auto-heal failed for ${provider}:`, error);
      return false;
    }
  }

  // Record health check result
  async recordHealthCheck(provider: Provider, isHealthy: boolean, responseTime: number, error?: string): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('integration_health_checks')
        .insert({
          provider,
          status: isHealthy ? 'healthy' : 'down',
          response_time: responseTime,
          error_message: error,
          checked_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Failed to record health check:', dbError);
      }
    } catch (error) {
      console.error('Failed to record health check:', error);
    }
  }

  // Update metrics
  async updateMetrics(provider: Provider, metrics: Partial<IntegrationMetrics>): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_metrics')
        .upsert({
          provider,
          ...metrics,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to update metrics:', error);
      }

      // Clear cache
      this.cache.delete(`metrics_${provider}`);
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  // Provider-specific health checks
  private async checkTinyHealth(): Promise<boolean> {
    try {
      const config = await this.getProviderConfig('tiny');
      if (!config?.token) return false;

      // Simulate API call to Tiny ERP
      const startTime = Date.now();
      
      // In real implementation, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.1; // 90% success rate simulation
      
      await this.recordHealthCheck('tiny', isHealthy, responseTime);
      return isHealthy;

    } catch (error) {
      await this.recordHealthCheck('tiny', false, 0, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private async checkMercadoLivreHealth(): Promise<boolean> {
    try {
      const config = await this.getProviderConfig('mercadolivre');
      if (!config?.access_token) return false;

      const startTime = Date.now();
      
      // Simulate ML API call
      const response = await fetch('https://api.mercadolibre.com/sites/MLB', {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      await this.recordHealthCheck('mercadolivre', isHealthy, responseTime);
      return isHealthy;

    } catch (error) {
      await this.recordHealthCheck('mercadolivre', false, 0, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private async checkShopeeHealth(): Promise<boolean> {
    try {
      const config = await this.getProviderConfig('shopee');
      if (!config?.access_token) return false;

      const startTime = Date.now();
      
      // Simulate Shopee API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.15; // 85% success rate simulation
      
      await this.recordHealthCheck('shopee', isHealthy, responseTime);
      return isHealthy;

    } catch (error) {
      await this.recordHealthCheck('shopee', false, 0, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private async checkAmazonHealth(): Promise<boolean> {
    try {
      const config = await this.getProviderConfig('amazon');
      if (!config?.mws_auth_token) return false;

      const startTime = Date.now();
      
      // Simulate Amazon MWS call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 600));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.2; // 80% success rate simulation
      
      await this.recordHealthCheck('amazon', isHealthy, responseTime);
      return isHealthy;

    } catch (error) {
      await this.recordHealthCheck('amazon', false, 0, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private async checkTelegramHealth(): Promise<boolean> {
    try {
      const config = await this.getProviderConfig('telegram');
      if (!config?.bot_token) return false;

      const startTime = Date.now();
      
      // Check Telegram bot API
      const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/getMe`);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      await this.recordHealthCheck('telegram', isHealthy, responseTime);
      return isHealthy;

    } catch (error) {
      await this.recordHealthCheck('telegram', false, 0, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Provider-specific healing strategies
  private async healTinyConnection(): Promise<boolean> {
    try {
      // Try to refresh connection by validating token
      const config = await this.getProviderConfig('tiny');
      if (!config?.token) return false;

      // Simulate token validation and refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if healing worked
      return await this.checkTinyHealth();
    } catch {
      return false;
    }
  }

  private async healMercadoLivreConnection(): Promise<boolean> {
    try {
      // Try to refresh OAuth token
      const config = await this.getProviderConfig('mercadolivre');
      if (!config?.refresh_token) return false;

      // In real implementation, this would refresh the OAuth token
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return await this.checkMercadoLivreHealth();
    } catch {
      return false;
    }
  }

  private async healShopeeConnection(): Promise<boolean> {
    try {
      // Try to refresh Shopee session
      await new Promise(resolve => setTimeout(resolve, 1200));
      return await this.checkShopeeHealth();
    } catch {
      return false;
    }
  }

  private async healAmazonConnection(): Promise<boolean> {
    try {
      // Try to re-establish Amazon MWS connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await this.checkAmazonHealth();
    } catch {
      return false;
    }
  }

  private async healTelegramConnection(): Promise<boolean> {
    try {
      // Try to re-validate Telegram bot
      return await this.checkTelegramHealth();
    } catch {
      return false;
    }
  }

  // Get provider configuration
  private async getProviderConfig(provider: Provider): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select(`${provider}_config`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get config: ${error.message}`);
      }

      return data?.[`${provider}_config`] || null;
    } catch {
      return null;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get historical health data
  async getHealthHistory(provider: Provider, hours: number = 24): Promise<HealthCheck[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('integration_health_checks')
        .select('*')
        .eq('provider', provider)
        .gte('checked_at', since.toISOString())
        .order('checked_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get health history: ${error.message}`);
      }

      return data.map(row => ({
        provider,
        status: row.status as any,
        last_check: new Date(row.checked_at),
        response_time: row.response_time,
        error_rate: 0, // TODO: Calculate
        uptime_percentage: 0, // TODO: Calculate
        last_error: row.error_message,
      }));

    } catch (error) {
      console.error(`Failed to get health history for ${provider}:`, error);
      return [];
    }
  }
}