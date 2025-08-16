// 🎯 OAuth service for secure authentication flows
// Centralized OAuth handling with PKCE and token management

import { Provider, OAuthState } from '../types/integrations.types';
import { supabase } from '@/integrations/supabase/client';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface TokenExchangeParams {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  code_verifier?: string;
}

export class OAuthService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(provider: Provider, params: TokenExchangeParams): Promise<TokenData> {
    const tokenUrl = this.getTokenUrl(provider);
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: params.client_id,
      client_secret: params.client_secret,
      redirect_uri: params.redirect_uri,
    });

    // Add PKCE verifier if present
    if (params.code_verifier) {
      body.append('code_verifier', params.code_verifier);
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const tokenData: TokenData = await response.json();
      
      // Validate required fields
      if (!tokenData.access_token) {
        throw new Error('Invalid token response: missing access_token');
      }

      return tokenData;

    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Save tokens securely
  async saveTokens(provider: Provider, tokenData: TokenData): Promise<void> {
    try {
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      // Update integration config with tokens
      const config = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt?.toISOString(),
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
      };

      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          id: 1,
          [`${provider}_config`]: config,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to save tokens: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(`tokens_${provider}`);

      // Log OAuth success
      await this.logOAuthEvent('oauth_completed', provider);

    } catch (error) {
      await this.logOAuthEvent('oauth_failed', provider, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get saved tokens
  async getTokens(provider: Provider): Promise<TokenData | null> {
    try {
      const cacheKey = `tokens_${provider}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
        return cached.data;
      }

      const { data, error } = await supabase
        .from('configuracoes')
        .select(`${provider}_config`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get tokens: ${error.message}`);
      }

      const config = data?.[`${provider}_config`];
      if (!config?.access_token) {
        return null;
      }

      const tokenData: TokenData = {
        access_token: config.access_token,
        refresh_token: config.refresh_token,
        token_type: config.token_type || 'Bearer',
        scope: config.scope,
      };

      // Calculate expires_in from expires_at
      if (config.expires_at) {
        const expiresAt = new Date(config.expires_at);
        const expiresIn = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        tokenData.expires_in = expiresIn;
      }

      this.cache.set(cacheKey, { data: tokenData, timestamp: Date.now() });
      return tokenData;

    } catch (error) {
      console.error(`Failed to get tokens for ${provider}:`, error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken(provider: Provider): Promise<TokenData> {
    const currentTokens = await this.getTokens(provider);
    
    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const tokenUrl = this.getTokenUrl(provider);
    const config = await this.getProviderConfig(provider);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentTokens.refresh_token,
      client_id: config.client_id,
      client_secret: config.client_secret,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const newTokenData: TokenData = await response.json();
      
      // Keep existing refresh token if not provided
      if (!newTokenData.refresh_token) {
        newTokenData.refresh_token = currentTokens.refresh_token;
      }

      // Save new tokens
      await this.saveTokens(provider, newTokenData);
      
      return newTokenData;

    } catch (error) {
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Revoke access tokens
  async revokeAccess(provider: Provider): Promise<void> {
    try {
      const tokens = await this.getTokens(provider);
      
      if (tokens?.access_token) {
        // Try to revoke token on provider side
        await this.revokeTokenOnProvider(provider, tokens.access_token);
      }

      // Clear tokens from database
      const { error } = await supabase
        .from('configuracoes')
        .update({
          [`${provider}_config`]: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (error) {
        throw new Error(`Failed to clear tokens: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(`tokens_${provider}`);

      // Log revocation
      await this.logOAuthEvent('oauth_revoked', provider);

    } catch (error) {
      throw new Error(`Failed to revoke access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if token is expired
  isTokenExpired(tokenData: TokenData): boolean {
    if (!tokenData.expires_in) return false;
    
    // Consider token expired if it expires in less than 5 minutes
    return tokenData.expires_in < 300;
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(provider: Provider): Promise<string | null> {
    try {
      let tokens = await this.getTokens(provider);
      
      if (!tokens) return null;

      // Refresh if expired
      if (this.isTokenExpired(tokens) && tokens.refresh_token) {
        tokens = await this.refreshToken(provider);
      }

      return tokens.access_token;

    } catch (error) {
      console.error(`Failed to get valid access token for ${provider}:`, error);
      return null;
    }
  }

  // Provider-specific token URLs
  private getTokenUrl(provider: Provider): string {
    const urls = {
      mercadolivre: 'https://api.mercadolibre.com/oauth/token',
      shopee: 'https://partner.shopeemobile.com/api/v2/auth/token/get',
      tiny: '', // Not OAuth
      amazon: '', // Different auth method
      telegram: '', // Not OAuth
    };

    const url = urls[provider];
    if (!url) {
      throw new Error(`Token URL not configured for ${provider}`);
    }

    return url;
  }

  // Get provider configuration
  private async getProviderConfig(provider: Provider): Promise<any> {
    const { data, error } = await supabase
      .from('configuracoes')
      .select(`${provider}_config`)
      .single();

    if (error) {
      throw new Error(`Failed to get provider config: ${error.message}`);
    }

    const config = data?.[`${provider}_config`];
    if (!config) {
      throw new Error(`Configuration not found for ${provider}`);
    }

    return config;
  }

  // Revoke token on provider side
  private async revokeTokenOnProvider(provider: Provider, accessToken: string): Promise<void> {
    try {
      switch (provider) {
        case 'mercadolivre':
          // MercadoLivre doesn't have a standard revocation endpoint
          // The token will expire naturally
          break;
        
        case 'shopee':
          // Shopee token revocation would go here
          break;
        
        default:
          // Provider doesn't support revocation
          break;
      }
    } catch (error) {
      // Log but don't throw - we'll still clear local tokens
      console.warn(`Failed to revoke token on ${provider}:`, error);
    }
  }

  // Log OAuth events
  private async logOAuthEvent(
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
        console.error('Failed to log OAuth event:', error);
      }
    } catch (error) {
      console.error('Failed to log OAuth event:', error);
    }
  }

  // Clear all cached data
  clearCache(): void {
    this.cache.clear();
  }

  // Validate OAuth state
  validateState(storedState: OAuthState, receivedState: string): boolean {
    return storedState.state === receivedState && 
           storedState.expires_at > new Date();
  }
}
