// 🎯 Centralized OAuth flow management
// Secure OAuth handling with PKCE and state validation

import { useState, useCallback, useMemo, useEffect } from 'react';
import { UseOAuthFlowReturn, Provider, OAuthState, OAuthConfig } from '../types/integrations.types';
import { OAuthService } from '../services/OAuthService';
import { useToast } from '@/hooks/use-toast';

// OAuth configurations for each provider
const OAUTH_CONFIGS: Record<Provider, OAuthConfig | null> = {
  mercadolivre: {
    client_id: process.env.VITE_ML_CLIENT_ID || '',
    client_secret: process.env.VITE_ML_CLIENT_SECRET || '',
    authorization_url: 'https://auth.mercadolibre.com.ar/authorization',
    token_url: 'https://api.mercadolibre.com/oauth/token',
    redirect_uri: `${window.location.origin}/oauth/callback/mercadolivre`,
    scopes: ['read', 'write'],
    use_pkce: true,
  },
  shopee: {
    client_id: process.env.VITE_SHOPEE_CLIENT_ID || '',
    client_secret: process.env.VITE_SHOPEE_CLIENT_SECRET || '',
    authorization_url: 'https://partner.shopeemobile.com/api/v2/shop/auth_partner',
    token_url: 'https://partner.shopeemobile.com/api/v2/auth/token/get',
    redirect_uri: `${window.location.origin}/oauth/callback/shopee`,
    scopes: ['item.base', 'item.fullinfo', 'order.base'],
    use_pkce: false,
  },
  // Providers without OAuth
  tiny: null,
  amazon: null,
  telegram: null,
};

export const useOAuthFlow = (): UseOAuthFlowReturn => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthStates, setOAuthStates] = useState<Record<Provider, OAuthState | null>>({
    tiny: null,
    mercadolivre: null,
    shopee: null,
    amazon: null,
    telegram: null,
  });
  const { toast } = useToast();

  // Memoized service
  const oauthService = useMemo(() => new OAuthService(), []);

  // Generate secure random string for state/verifier
  const generateRandomString = useCallback((length: number = 32): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    return result;
  }, []);

  // Generate PKCE code challenge
  const generateCodeChallenge = useCallback(async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }, []);

  // Initiate OAuth flow
  const initiateFlow = useCallback(async (provider: Provider) => {
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      setAuthError(`OAuth não disponível para ${provider}`);
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const state = generateRandomString();
      const codeVerifier = config.use_pkce ? generateRandomString(128) : undefined;
      const codeChallenge = config.use_pkce && codeVerifier 
        ? await generateCodeChallenge(codeVerifier) 
        : undefined;

      // Store OAuth state
      const oauthState: OAuthState = {
        provider,
        state,
        code_verifier: codeVerifier,
        redirect_uri: config.redirect_uri,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        scopes: config.scopes,
      };

      setOAuthStates(prev => ({ ...prev, [provider]: oauthState }));

      // Build authorization URL
      const authUrl = new URL(config.authorization_url);
      authUrl.searchParams.set('client_id', config.client_id);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', config.redirect_uri);
      authUrl.searchParams.set('scope', config.scopes.join(' '));
      authUrl.searchParams.set('state', state);

      if (config.use_pkce && codeChallenge) {
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
      }

      // Open OAuth window
      const popup = window.open(
        authUrl.toString(),
        `oauth_${provider}`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
      }

      // Monitor popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsAuthenticating(false);
          
          // Check if we got the callback
          const currentState = oauthStates[provider];
          if (currentState) {
            setAuthError('Autenticação cancelada ou falhou');
          }
        }
      }, 1000);

      toast({
        title: "Abrindo autenticação",
        description: `Redirecionando para ${provider}...`,
      });

    } catch (error) {
      console.error(`OAuth initiation failed for ${provider}:`, error);
      setAuthError(error instanceof Error ? error.message : 'Falha na autenticação');
      setIsAuthenticating(false);
    }
  }, [oauthStates, generateRandomString, generateCodeChallenge, toast]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (provider: Provider, params: URLSearchParams) => {
    const config = OAUTH_CONFIGS[provider];
    const storedState = oauthStates[provider];

    if (!config || !storedState) {
      setAuthError('Estado OAuth inválido');
      return;
    }

    try {
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Parâmetros OAuth ausentes');
      }

      if (state !== storedState.state) {
        throw new Error('Estado OAuth inválido - possível ataque CSRF');
      }

      if (storedState.expires_at < new Date()) {
        throw new Error('Estado OAuth expirado');
      }

      // Exchange code for tokens
      const tokenData = await oauthService.exchangeCodeForTokens(provider, {
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri,
        code_verifier: storedState.code_verifier,
      });

      // Save tokens securely
      await oauthService.saveTokens(provider, tokenData);

      // Clear OAuth state
      setOAuthStates(prev => ({ ...prev, [provider]: null }));
      setIsAuthenticating(false);
      setAuthError(null);

      toast({
        title: "Autenticação concluída",
        description: `${provider} foi conectado com sucesso`,
      });

    } catch (error) {
      console.error(`OAuth callback failed for ${provider}:`, error);
      setAuthError(error instanceof Error ? error.message : 'Falha na autenticação');
      setIsAuthenticating(false);
    }
  }, [oauthStates, oauthService, toast]);

  // Refresh access token
  const refreshToken = useCallback(async (provider: Provider) => {
    try {
      await oauthService.refreshToken(provider);
      
      toast({
        title: "Token renovado",
        description: `Token do ${provider} foi renovado`,
      });
    } catch (error) {
      console.error(`Token refresh failed for ${provider}:`, error);
      setAuthError(error instanceof Error ? error.message : 'Falha ao renovar token');
    }
  }, [oauthService, toast]);

  // Revoke access
  const revokeAccess = useCallback(async (provider: Provider) => {
    try {
      await oauthService.revokeAccess(provider);
      
      toast({
        title: "Acesso revogado",
        description: `Acesso ao ${provider} foi revogado`,
        variant: "destructive"
      });
    } catch (error) {
      console.error(`Access revocation failed for ${provider}:`, error);
      setAuthError(error instanceof Error ? error.message : 'Falha ao revogar acesso');
    }
  }, [oauthService, toast]);

  // Cleanup expired states
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setOAuthStates(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        for (const [provider, state] of Object.entries(updated)) {
          if (state && state.expires_at < now) {
            updated[provider as Provider] = null;
            hasChanges = true;
          }
        }

        return hasChanges ? updated : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, provider, params } = event.data;
      if (type === 'oauth_callback' && provider && params) {
        handleCallback(provider, new URLSearchParams(params));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleCallback]);

  return {
    isAuthenticating,
    authError,
    initiateFlow,
    handleCallback,
    refreshToken,
    revokeAccess
  };
};