// 🎯 Core integration business logic service
// Centralized integration operations with error handling

import { Integration, Provider, IntegrationError } from '../types/integrations.types';
import { supabase } from '@/integrations/supabase/client';

export class IntegrationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get from cache or fetch
  private async getFromCacheOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Get all integrations
  async getAllIntegrations(): Promise<Integration[]> {
    return this.getFromCacheOrFetch('all_integrations', async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select(`
          id,
          provider,
          name,
          description,
          status,
          enabled,
          auto_sync,
          sync_interval,
          last_sync,
          last_error,
          health_score,
          config
        `)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch integrations: ${error.message}`);
      }

      return data.map(row => ({
        ...row,
        last_sync: row.last_sync ? new Date(row.last_sync) : null,
        health_score: row.health_score || 0,
      }));
    });
  }

  // Get integration by provider
  async getIntegration(provider: Provider): Promise<Integration | null> {
    const integrations = await this.getAllIntegrations();
    return integrations.find(i => i.provider === provider) || null;
  }

  // Connect provider
  async connectProvider(provider: Provider): Promise<void> {
    try {
      // Update status to connecting
      const { error: updateError } = await supabase
        .from('integration_accounts')
        .upsert({
          provider,
          status: 'connecting',
          enabled: true,
          last_sync: null,
          last_error: null,
        });

      if (updateError) {
        throw new Error(`Failed to update integration status: ${updateError.message}`);
      }

      // Provider-specific connection logic
      await this.performProviderConnection(provider);

      // Update status to connected
      const { error: finalError } = await supabase
        .from('integration_accounts')
        .update({
          status: 'connected',
          last_sync: new Date().toISOString(),
        })
        .eq('provider', provider);

      if (finalError) {
        throw new Error(`Failed to finalize connection: ${finalError.message}`);
      }

      // Clear cache
      this.cache.delete('all_integrations');
      this.cache.delete(`integration_${provider}`);

      // Log event
      await this.logIntegrationEvent('integration_connected', provider);

    } catch (error) {
      // Update status to error
      await supabase
        .from('integration_accounts')
        .update({
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('provider', provider);

      throw error;
    }
  }

  // Disconnect provider
  async disconnectProvider(provider: Provider): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({
          status: 'disconnected',
          enabled: false,
          last_error: null,
        })
        .eq('provider', provider);

      if (error) {
        throw new Error(`Failed to disconnect integration: ${error.message}`);
      }

      // Provider-specific disconnection logic
      await this.performProviderDisconnection(provider);

      // Clear cache
      this.cache.delete('all_integrations');
      this.cache.delete(`integration_${provider}`);

      // Log event
      await this.logIntegrationEvent('integration_disconnected', provider);

    } catch (error) {
      throw new Error(`Failed to disconnect ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection
  async testConnection(provider: Provider): Promise<boolean> {
    try {
      const integration = await this.getIntegration(provider);
      if (!integration || integration.status !== 'connected') {
        return false;
      }

      // Provider-specific health check
      const isHealthy = await this.performHealthCheck(provider, integration.config);

      // Update health score
      const healthScore = isHealthy ? 100 : 0;
      await supabase
        .from('integration_accounts')
        .update({ health_score: healthScore })
        .eq('provider', provider);

      return isHealthy;

    } catch (error) {
      console.error(`Health check failed for ${provider}:`, error);
      return false;
    }
  }

  // Sync data
  async syncData(provider: Provider): Promise<void> {
    try {
      const integration = await this.getIntegration(provider);
      if (!integration || integration.status !== 'connected') {
        throw new Error(`${provider} is not connected`);
      }

      // Log sync start
      await this.logIntegrationEvent('sync_started', provider);

      // Provider-specific sync logic
      await this.performDataSync(provider, integration.config);

      // Update last sync time
      await supabase
        .from('integration_accounts')
        .update({
          last_sync: new Date().toISOString(),
          last_error: null,
        })
        .eq('provider', provider);

      // Clear cache
      this.cache.delete('all_integrations');

      // Log sync completion
      await this.logIntegrationEvent('sync_completed', provider);

    } catch (error) {
      // Update error
      await supabase
        .from('integration_accounts')
        .update({
          last_error: error instanceof Error ? error.message : 'Sync failed',
        })
        .eq('provider', provider);

      // Log sync failure
      await this.logIntegrationEvent('sync_failed', provider, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  // Provider-specific connection logic
  private async performProviderConnection(provider: Provider): Promise<void> {
    switch (provider) {
      case 'tiny':
        // Validate Tiny ERP token and test connection
        await this.testTinyConnection();
        break;
      case 'mercadolivre':
        // OAuth flow should already be completed
        await this.testMercadoLivreConnection();
        break;
      case 'shopee':
        // OAuth flow should already be completed
        await this.testShopeeConnection();
        break;
      case 'telegram':
        // Test bot token
        await this.testTelegramConnection();
        break;
      case 'amazon':
        // Test MWS credentials
        await this.testAmazonConnection();
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Provider-specific disconnection logic
  private async performProviderDisconnection(provider: Provider): Promise<void> {
    switch (provider) {
      case 'mercadolivre':
      case 'shopee':
        // Revoke OAuth tokens if needed
        // This would be handled by the OAuth service
        break;
      default:
        // Most providers don't need special disconnection logic
        break;
    }
  }

  // Provider-specific health checks
  private async performHealthCheck(provider: Provider, config: any): Promise<boolean> {
    try {
      switch (provider) {
        case 'tiny':
          return await this.checkTinyHealth(config?.tiny);
        case 'mercadolivre':
          return await this.checkMercadoLivreHealth(config?.mercadolivre);
        case 'shopee':
          return await this.checkShopeeHealth(config?.shopee);
        case 'telegram':
          return await this.checkTelegramHealth(config?.telegram);
        case 'amazon':
          return await this.checkAmazonHealth(config?.amazon);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // Provider-specific data sync
  private async performDataSync(provider: Provider, config: any): Promise<void> {
    switch (provider) {
      case 'tiny':
        await this.syncTinyData(config?.tiny);
        break;
      case 'mercadolivre':
        await this.syncMercadoLivreData(config?.mercadolivre);
        break;
      case 'shopee':
        await this.syncShopeeData(config?.shopee);
        break;
      case 'amazon':
        await this.syncAmazonData(config?.amazon);
        break;
      default:
        throw new Error(`Sync not implemented for ${provider}`);
    }
  }

  // Tiny ERP methods
  private async testTinyConnection(): Promise<void> {
    // Implementation would test Tiny ERP API
    // This is a placeholder
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async checkTinyHealth(config: any): Promise<boolean> {
    if (!config?.token) return false;
    // Implementation would check Tiny ERP API health
    return true;
  }

  private async syncTinyData(config: any): Promise<void> {
    if (!config?.token) throw new Error('Tiny token not configured');
    // Implementation would sync data from Tiny ERP
  }

  // MercadoLivre methods
  private async testMercadoLivreConnection(): Promise<void> {
    // Implementation would test ML API with OAuth token
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async checkMercadoLivreHealth(config: any): Promise<boolean> {
    if (!config?.access_token) return false;
    // Implementation would check ML API health
    return true;
  }

  private async syncMercadoLivreData(config: any): Promise<void> {
    if (!config?.access_token) throw new Error('MercadoLivre token not configured');
    // Implementation would sync data from ML
  }

  // Shopee methods
  private async testShopeeConnection(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async checkShopeeHealth(config: any): Promise<boolean> {
    if (!config?.access_token) return false;
    return true;
  }

  private async syncShopeeData(config: any): Promise<void> {
    if (!config?.access_token) throw new Error('Shopee token not configured');
  }

  // Telegram methods
  private async testTelegramConnection(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async checkTelegramHealth(config: any): Promise<boolean> {
    if (!config?.bot_token) return false;
    return true;
  }

  // Amazon methods
  private async testAmazonConnection(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async checkAmazonHealth(config: any): Promise<boolean> {
    if (!config?.mws_auth_token) return false;
    return true;
  }

  private async syncAmazonData(config: any): Promise<void> {
    if (!config?.mws_auth_token) throw new Error('Amazon credentials not configured');
  }

  // Log integration events
  private async logIntegrationEvent(
    event: string,
    provider: Provider,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_events')
        .insert({
          event,
          provider,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to log integration event:', error);
      }
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }
}