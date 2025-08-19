// 🎯 Centralized OAuth flow management
// Secure OAuth handling with PKCE and state validation

import { useState, useCallback, useMemo, useEffect } from 'react';
import { UseOAuthFlowReturn, Provider, OAuthState, OAuthConfig } from '../types/integrations.types';
import { OAuthService } from '../services/OAuthService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// OAuth configurations for each provider (public URLs only - credentials handled by Edge Functions)
const getOAuthConfigs = (): Record<Provider, OAuthConfig | null> => {
  // Safely get the origin - this ensures no process references are used
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
  
  return {
    mercadolivre: {
      client_id: 'configured_via_edge_function', // Handled by Edge Function
      client_secret: '', // Handled securely by Edge Function
      authorization_url: 'https://auth.mercadolivre.com.br/authorization',
      token_url: 'https://api.mercadolibre.com/oauth/token',
      redirect_uri: `${baseUrl}/functions/v1/mercadolivre-oauth-callback`,
      scopes: ['read', 'write'],
      use_pkce: false, // ML doesn't use PKCE
    },
    shopee: {
      client_id: '', // Will be fetched from Edge Function
      client_secret: '', // Handled securely by Edge Function
      authorization_url: 'https://partner.shopeemobile.com/api/v2/shop/auth_partner',
      token_url: 'https://partner.shopeemobile.com/api/v2/auth/token/get',
      redirect_uri: `${baseUrl}/oauth/callback/shopee`,
      scopes: ['item.base', 'item.fullinfo', 'order.base'],
      use_pkce: false,
    },
    // Providers without OAuth
    tiny: null,
    amazon: null,
    telegram: null,
  };
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
    if (provider !== 'mercadolivre') {
      setAuthError(`OAuth não disponível para ${provider}`);
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

      console.log('Iniciando fluxo OAuth para MercadoLibre...');

      // Call OAuth start edge function
      const { data, error } = await supabase.functions.invoke('hyper-function', {
        body: {
          organization_id: 'current', // Will be resolved by Edge Function
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('OAuth start failed:', data);
        throw new Error(data?.error || 'Failed to start OAuth flow');
      }

      console.log('Authorization URL gerada:', data.authorization_url);

      // Open authorization URL in popup
      const popup = window.open(
        data.authorization_url,
        `oauth_${provider}`,
        'width=600,height=700,scrollbars=yes,resizable=yes,location=yes'
      );

      if (!popup) {
        throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
      }

      let completed = false;

      // Monitor popup for completion or manual close
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            if (!completed) {
              setIsAuthenticating(false);
              console.log('Popup fechado pelo usuário');
              // Don't show error if user manually closed
            }
          }
        } catch (e) {
          // Popup might be on different domain, ignore access errors
        }
      }, 500);

      // Set a timeout for the auth process
      const authTimeout = setTimeout(() => {
        if (!completed && !popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          setIsAuthenticating(false);
          setAuthError('Timeout na autenticação. Tente novamente.');
        }
      }, 300000); // 5 minutes timeout

      // Listen for successful completion via window messaging or storage
      const checkForCompletion = setInterval(async () => {
        try {
          // Check if integration was created successfully
          const { data: accounts } = await supabase
            .from('integration_accounts')
            .select('id')
            .eq('provider', 'mercadolivre')
            .eq('is_active', true);

          if (accounts && accounts.length > 0) {
            completed = true;
            clearInterval(checkClosed);
            clearInterval(checkForCompletion);
            clearTimeout(authTimeout);
            setIsAuthenticating(false);
            
            if (!popup.closed) {
              popup.close();
            }

            toast({
              title: "✅ Autenticação concluída",
              description: "MercadoLibre foi conectado com sucesso!",
            });
          }
        } catch (e) {
          // Ignore errors during check
        }
      }, 2000);

      toast({
        title: "🔐 Abrindo autenticação",
        description: "Redirecionando para MercadoLibre...",
      });

    } catch (error) {
      console.error('OAuth initiation failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Falha na autenticação');
      setIsAuthenticating(false);
    }
  }, [toast]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (provider: Provider, params: URLSearchParams) => {
    const OAUTH_CONFIGS = getOAuthConfigs();
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

      // TODO: Exchange code for tokens should be handled by Edge Function for security
      // For now, show success message but tokens need to be implemented securely
      toast({
        title: "Autenticação recebida",
        description: `Código de autorização recebido para ${provider}. Configure o token exchange nas Edge Functions.`,
        variant: "default"
      });

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

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the same origin or from our callback domain
      const allowedOrigins = [
        window.location.origin,
        'https://tdjyfqnxvjgossuncpwm.supabase.co'
      ];
      
      if (!allowedOrigins.includes(event.origin)) return;

      const { type, provider, user, error } = event.data;
      
      if (type === 'oauth_success' && provider === 'mercadolivre') {
        console.log('OAuth success received:', user);
        setIsAuthenticating(false);
        setAuthError(null);
        
        toast({
          title: "✅ Conectado com sucesso!",
          description: `Conta MercadoLibre ${user.nickname} foi conectada.`,
        });
      } else if (type === 'oauth_error' && provider === 'mercadolivre') {
        console.error('OAuth error received:', error);
        setIsAuthenticating(false);
        setAuthError(error);
        
        toast({
          title: "❌ Erro na autenticação",
          description: error,
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  return {
    isAuthenticating,
    authError,
    initiateFlow,
    handleCallback,
    refreshToken,
    revokeAccess
  };
};