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
 * Service for handling encrypted integration secrets
 * Uses Edge Functions to encrypt/decrypt secrets securely
 */
export class SecretsService {
  /**
   * Save encrypted secret via Edge Function
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
   * Get decrypted secret via Edge Function
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
      return !!(secret?.access_token || secret?.client_secret);
    } catch (error) {
      // If secret doesn't exist or fails to decrypt, return false
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
      // Get existing secret first to preserve client credentials
      const existingSecret = await this.getSecret({ integration_account_id, provider });
      
      // Update with new tokens while preserving existing data
      const updatedPayload: SecretPayload = {
        integration_account_id,
        provider,
        client_id: existingSecret?.client_id,
        client_secret: existingSecret?.client_secret,
        access_token: tokens.access_token ?? existingSecret?.access_token,
        refresh_token: tokens.refresh_token ?? existingSecret?.refresh_token,
        expires_at: tokens.expires_at ?? existingSecret?.expires_at,
        payload: existingSecret?.payload || {}
      };

      return await this.saveSecret(updatedPayload);
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw error;
    }
  }
}