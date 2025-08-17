// 🎯 Core integration business logic service
// Centralized integration operations with error handling
// ⚠️ SECURITY NOTE: Never access integration_secrets directly from client code
// All secret operations must be done through Edge Functions using:
// - encrypt_integration_secret() 
// - decrypt_integration_secret()

import { Integration, Provider, IntegrationError, IntegrationStatus } from '../types/integrations.types';
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
          account_identifier,
          is_active,
          created_at,
          updated_at,
          organization_id,
          cnpj,
          public_auth
        `)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch integrations: ${error.message}`);
      }

      return data.map(row => ({
        id: row.id,
        provider: row.provider as Provider,
        name: row.name,
        description: `Integração ${row.provider}`,
        status: row.is_active ? 'connected' : 'disconnected' as IntegrationStatus,
        health_score: 100, // Default
        last_sync: row.updated_at ? new Date(row.updated_at) : null,
        last_error: null,
        config: (row.public_auth as any) || {},
        enabled: row.is_active,
        auto_sync: true, // Default
        sync_interval: 60, // Default 60 minutes
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
      // Create or update integration account
      const { error: updateError } = await supabase
        .from('integration_accounts')
        .upsert({
          provider: provider as any, // Cast to match DB enum
          name: `Integração ${provider}`,
          is_active: true,
          organization_id: (await supabase.rpc('get_current_org_id')).data,
        });

      if (updateError) {
        throw new Error(`Failed to update integration status: ${updateError.message}`);
      }

      // Provider-specific connection logic
      await this.performProviderConnection(provider);

      // Clear cache
      this.cache.delete('all_integrations');
      this.cache.delete(`integration_${provider}`);

      // Log event
      await this.logIntegrationEvent('integration_connected', provider);

    } catch (error) {
      // Update status to error if integration exists
      await supabase
        .from('integration_accounts')
        .update({
          is_active: false,
        })
        .eq('provider', provider as any);

      throw error;
    }
  }

  // Disconnect provider
  async disconnectProvider(provider: Provider): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({
          is_active: false,
        })
        .eq('provider', provider as any);

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

      // Update integration status based on health
      await supabase
        .from('integration_accounts')
        .update({ 
          is_active: isHealthy,
          updated_at: new Date().toISOString()
        })
        .eq('provider', provider as any);

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
          updated_at: new Date().toISOString(),
        })
        .eq('provider', provider as any);

      // Clear cache
      this.cache.delete('all_integrations');

      // Log sync completion
      await this.logIntegrationEvent('sync_completed', provider);

    } catch (error) {
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

  // Log integration events (simplified - no events table)
  private async logIntegrationEvent(
    event: string,
    provider: Provider,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`Integration event: ${event}`, {
        provider,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }
}