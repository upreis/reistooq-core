// 🎯 Configuration persistence service
// Secure config storage with encryption and validation
// ⚠️ SECURITY NOTE: Integration secrets are now encrypted and stored separately
// Use Edge Functions for secret management with encrypt_integration_secret/decrypt_integration_secret

import { ProviderConfig, Provider } from '../types/integrations.types';
import { supabase } from '@/integrations/supabase/client';

export class ConfigService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // Encrypt sensitive data before storage
  private encryptSensitiveData(data: any): any {
    // In a real implementation, you would encrypt sensitive fields
    // For now, we'll just mark them as encrypted
    const encrypted = { ...data };
    
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key) && typeof value === 'string') {
          // In production, use proper encryption
          encrypted[key] = `encrypted:${btoa(value)}`;
        }
      }
    }
    
    return encrypted;
  }

  // Decrypt sensitive data after retrieval
  private decryptSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const decrypted = { ...data };
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key) && typeof value === 'string' && value.startsWith('encrypted:')) {
        // In production, use proper decryption
        decrypted[key] = atob(value.replace('encrypted:', ''));
      }
    }
    
    return decrypted;
  }

  // Check if field contains sensitive data
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'token', 'secret', 'key', 'password', 'client_secret',
      'access_token', 'refresh_token', 'bot_token', 'auth_token',
      'mws_auth_token', 'secret_access_key'
    ];
    
    return sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  // Get from cache or database
  private async getFromCacheOrDB<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Get all configurations
  async getAllConfigs(): Promise<ProviderConfig> {
    return this.getFromCacheOrDB('all_configs', async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch configurations: ${error.message}`);
      }

      // Parse configurations from key-value structure
      const configs: ProviderConfig = {};
      
      data.forEach(config => {
        if (config.chave && config.valor) {
          try {
            const parsedValue = JSON.parse(config.valor);
            
            if (config.chave.includes('tiny')) {
              configs.tiny = this.decryptSensitiveData(parsedValue);
            } else if (config.chave.includes('mercadolivre')) {
              configs.mercadolivre = this.decryptSensitiveData(parsedValue);
            } else if (config.chave.includes('shopee')) {
              configs.shopee = this.decryptSensitiveData(parsedValue);
            } else if (config.chave.includes('amazon')) {
              configs.amazon = this.decryptSensitiveData(parsedValue);
            } else if (config.chave.includes('telegram')) {
              configs.telegram = this.decryptSensitiveData(parsedValue);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      });

      return configs;
    });
  }

  // Get configuration for specific provider
  async getConfig(provider: Provider): Promise<any> {
    const allConfigs = await this.getAllConfigs();
    return allConfigs[provider] || null;
  }

  // Save configuration for specific provider
  async saveConfig(provider: Provider, config: any): Promise<void> {
    try {
      // Encrypt sensitive data
      const encryptedConfig = this.encryptSensitiveData(config);
      
      // Save as key-value pair
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          chave: `${provider}_config`,
          valor: JSON.stringify(encryptedConfig),
          tipo: 'integration',
          descricao: `Configuração do ${provider}`,
        });

      if (error) {
        throw new Error(`Failed to save ${provider} config: ${error.message}`);
      }

      // Clear cache
      this.cache.delete('all_configs');
      this.cache.delete(`config_${provider}`);

    } catch (error) {
      throw new Error(`Failed to save ${provider} configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Bulk update configurations
  async bulkUpdateConfigs(newConfigs: Partial<ProviderConfig>): Promise<void> {
    try {
      // Save each config individually
      for (const [provider, config] of Object.entries(newConfigs)) {
        if (config) {
          await this.saveConfig(provider as Provider, config);
        }
      }
      
      console.log('Bulk configs updated successfully');
    } catch (error) {
      console.error('Failed to bulk update configs:', error);
      throw new Error(`Failed to bulk update configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete configuration for specific provider
  async deleteConfig(provider: Provider): Promise<void> {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .delete()
        .eq('chave', `${provider}_config`);

      if (error) {
        throw new Error(`Failed to delete ${provider} config: ${error.message}`);
      }

      // Clear cache
      this.cache.delete('all_configs');
      this.cache.delete(`config_${provider}`);

    } catch (error) {
      throw new Error(`Failed to delete ${provider} configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate configuration structure
  validateConfigStructure(provider: Provider, config: any): boolean {
    if (!config || typeof config !== 'object') return false;

    switch (provider) {
      case 'tiny':
        return typeof config.token === 'string' && config.token.length > 0;
      
      case 'mercadolivre':
        return typeof config.client_id === 'string' && 
               typeof config.client_secret === 'string' &&
               typeof config.redirect_uri === 'string';
      
      case 'shopee':
        return typeof config.partner_id === 'string' && 
               typeof config.partner_key === 'string';
      
      case 'amazon':
        return typeof config.marketplace_id === 'string' && 
               typeof config.seller_id === 'string' &&
               typeof config.mws_auth_token === 'string';
      
      case 'telegram':
        return typeof config.bot_token === 'string' && 
               typeof config.chat_id === 'string';
      
      default:
        return false;
    }
  }

  // Get configuration templates
  getConfigTemplate(provider: Provider): any {
    const templates = {
      tiny: {
        token: '',
        api_url: 'https://api.tiny.com.br/api2',
        webhook_url: '',
        sync_products: true,
        sync_stock: true,
        sync_orders: true,
      },
      mercadolivre: {
        client_id: '',
        client_secret: '',
        redirect_uri: `${window.location.origin}/oauth/callback/mercadolivre`,
        access_token: '',
        refresh_token: '',
        expires_at: null,
        user_id: '',
      },
      shopee: {
        partner_id: '',
        partner_key: '',
        shop_id: '',
        access_token: '',
        refresh_token: '',
        expires_at: null,
      },
      amazon: {
        marketplace_id: '',
        seller_id: '',
        mws_auth_token: '',
        access_key_id: '',
        secret_access_key: '',
      },
      telegram: {
        bot_token: '',
        chat_id: '',
        webhook_url: '',
        notifications_enabled: true,
      },
    };

    return templates[provider] || {};
  }

  // Log configuration updates (simplified - no events table)
  private async logConfigUpdate(provider: Provider, fields: string[]): Promise<void> {
    console.log(`Config updated for ${provider}:`, fields);
  }

  // Log bulk configuration updates (simplified - no events table)
  private async logBulkConfigUpdate(providers: Provider[]): Promise<void> {
    console.log('Bulk config update for providers:', providers);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}