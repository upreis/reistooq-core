import { supabase } from '@/integrations/supabase/client';

export interface SecretPayload {
  integration_account_id: string;
  provider: string;
  client_id?: string;
  client_secret?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  payload?: Record<string, any>;
}

export interface GetSecretRequest {
  integration_account_id: string;
  provider: string;
}

/**
 * Service for handling integration secrets
 * Uses Edge Functions with strict permission checks; tokens never returned to the browser
 */
export class SecretsService {
  /**
   * Save secret via Edge Function
   */
  static async saveSecret(payload: SecretPayload) {
    try {
      const { data, error } = await supabase.functions.invoke('integrations-store-secret', {
        body: payload
      });

      if (error) throw error;

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to save secret');
      }

      return data;
    } catch (error) {
      console.error('Error saving secret:', error);
      throw error;
    }
  }

  /**
   * Get secret via Edge Function
   */
  static async getSecret(request: GetSecretRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('integrations-get-secret', {
        body: request
      });

      if (error) throw error;

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to get secret');
      }

      return data.secret;
    } catch (error) {
      console.error('Error getting secret:', error);
      throw error;
    }
  }

  /**
   * Check if a secret exists for an integration account
   */
  static async hasSecret(integration_account_id: string, provider: string): Promise<boolean> {
    try {
      const secret = await this.getSecret({ integration_account_id, provider });
      return !!(secret?.has_access_token || secret?.has_refresh_token);
    } catch (error) {
      // If secret doesn't exist or not authorized, return false
      return false;
    }
  }

  /**
   * Update OAuth tokens for an existing secret
   */
  static async updateTokens(integration_account_id: string, provider: string, tokens: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
  }) {
    try {
      // Atualiza apenas os tokens informados (sem expor segredos existentes)
      const payload: SecretPayload = {
        integration_account_id,
        provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      };
      return await this.saveSecret(payload);
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw error;
    }
  }
}