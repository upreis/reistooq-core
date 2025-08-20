// src/features/integrations/utils/openMlPopup.ts
// 🎯 Centralized MercadoLibre OAuth Popup Utility

export interface MLPopupConfig {
  width?: number;
  height?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onClosed?: () => void;
}

export function openMlPopup(config: MLPopupConfig = {}) {
  const { width = 600, height = 700, onSuccess, onError, onClosed } = config;

  // Padronizados
  const CLIENT_ID =
    (import.meta as any).env?.VITE_ML_CLIENT_ID || '2053972567766696';
  if (!CLIENT_ID) {
    alert('VITE_ML_CLIENT_ID não está definido. Adicione no .env');
    throw new Error('VITE_ML_CLIENT_ID ausente');
  }

  const REDIRECT_URI =
    'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service';
  const AUTHORIZATION_DOMAIN =
    'https://auth.mercadolivre.com.br/authorization';

  // state = JSON base64url (inclui redirect/org para o smooth-service)
  const stateObj = { redirect_uri: REDIRECT_URI, org_id: 'default' };
  const stateB64 = btoa(JSON.stringify(stateObj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // URL de autorização
  const authUrl = new URL(AUTHORIZATION_DOMAIN);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('state', stateB64);
  const url = authUrl.toString();

  console.info('[ML-OAUTH] open', { url, CLIENT_ID, REDIRECT_URI });

  // ✅ 1) PRÉ-ABRE a janela (gesto do usuário) e DEPOIS navega
  const features = `width=${width},height=${height},scrollbars=yes,resizable=yes`;
  const popup = window.open('', 'ml_oauth', features);
  if (!popup) {
    throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
  }
  try {
    popup.location.href = url;
  } catch {
    // fallback raro
    popup.close();
    const p2 = window.open(url, 'ml_oauth', features);
    if (!p2) throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
  }

  // ✅ 3) Aceitar só mensagens do nosso Supabase OU da própria app
  const allowedOrigins = new Set<string>([
    window.location.origin,
    new URL(REDIRECT_URI).origin,
  ]);

  const handleMessage = (event: MessageEvent) => {
    console.info('[ML-OAUTH] message.received', event.origin, event.data);
    if (!allowedOrigins.has(event.origin)) return;

    const data = event.data || {};
    const okV1 = data.type === 'oauth_success' && data.provider === 'mercadolivre';
    const errV1 = data.type === 'oauth_error' && data.provider === 'mercadolivre';
    const okLegacy = data.source === 'smooth-service' && data.connected === true;

    if (okV1 || okLegacy) {
      cleanup();
      onSuccess?.(data);
    } else if (errV1) {
      cleanup();
      onError?.(data.error || 'Falha desconhecida');
    }
  };

  console.info('[ML-OAUTH] message.listener.ready');
  window.addEventListener('message', handleMessage);

  // Monitorar fechamento manual
  const checkClosed = window.setInterval(() => {
    if (popup.closed) {
      cleanup();
      onClosed?.();
    }
  }, 800);

  function cleanup() {
    window.removeEventListener('message', handleMessage);
    window.clearInterval(checkClosed);
    try {
      if (!popup.closed) popup.close();
    } catch {}
  }

  return { popup, cleanup };
}
