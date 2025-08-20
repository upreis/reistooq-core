// 🎯 Centralized MercadoLibre OAuth Popup Utility
// Standardizes all OAuth popup flows to prevent inconsistencies

export interface MLPopupConfig {
  width?: number;
  height?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onClosed?: () => void;
}

export function openMlPopup(config: MLPopupConfig = {}) {
  const {
    width = 600,
    height = 700,
    onSuccess,
    onError,
    onClosed
  } = config;

  // Standardized OAuth parameters
  const CLIENT_ID = (import.meta.env?.VITE_ML_CLIENT_ID as string) || '2053972567766696';
  const REDIRECT_URI = 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolibre-oauth-callback';
  const AUTHORIZATION_DOMAIN = 'https://auth.mercadolivre.com.br/authorization';

  // Generate state (base64 encoded JSON)
  const stateObj = { redirect_uri: REDIRECT_URI, org_id: 'default' };
  const stateB64 = btoa(JSON.stringify(stateObj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Build authorization URL
  const authUrl = new URL(AUTHORIZATION_DOMAIN);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('state', stateB64);

  const url = authUrl.toString();

  console.info('[ML-OAUTH] open', url);

  // Open popup with standardized dimensions
  const popup = window.open(
    url,
    'ml_oauth',
    `width=${width},height=${height},scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
  }

  // Setup message listener for OAuth completion
  const handleMessage = (event: MessageEvent) => {
    console.info('[ML-OAUTH] message.received', event.data);
    
    // Accept messages from Supabase edge functions
    if (!event.origin.includes('supabase.co') && event.origin !== window.location.origin) {
      return;
    }

    const successV1 = event.data?.type === 'oauth_success' && event.data?.provider === 'mercadolivre';
    const successLegacy = event.data?.source === 'mercadolibre-oauth-callback' && event.data?.connected === true;
    const errorV1 = event.data?.type === 'oauth_error' && event.data?.provider === 'mercadolivre';

    if (successV1 || successLegacy) {
      popup.close();
      window.removeEventListener('message', handleMessage);
      onSuccess?.(event.data);
      
    } else if (errorV1) {
      popup.close();
      window.removeEventListener('message', handleMessage);
      
      const errorMsg = event.data.error || 'Falha desconhecida';
      onError?.(errorMsg);
    }
  };

  console.info('[ML-OAUTH] message.listener.ready');
  window.addEventListener('message', handleMessage);

  // Monitor popup for manual closure
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      onClosed?.();
    }
  }, 1000);

  return {
    popup,
    cleanup: () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
      }
    }
  };
}