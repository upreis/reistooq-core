// src/features/integrations/utils/openMlPopup.ts
import { supabase } from '@/integrations/supabase/client';

export interface MLPopupConfig {
  width?: number;
  height?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onClosed?: () => void;
}

export async function openMlPopup(config: MLPopupConfig = {}) {
  const { width = 600, height = 700, onSuccess, onError, onClosed } = config;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado');
    }

    // 1) Garante organização para o usuário atual (idempotente)
    try {
      const { data: ensured, error: ensureErr } = await supabase.rpc('ensure_current_org');
      console.info('[ML-OAUTH] ensure_current_org:', { ensured, ensureErr });
      // Mesmo que falhe, o fluxo pode continuar — só registramos
    } catch (e) {
      console.warn('[ML-OAUTH] ensure_current_org exception (continuando):', e);
    }

    // 2) Pede a URL de autorização para a Edge (gera state + PKCE e grava oauth_states)
    const { data, error } = await supabase.functions.invoke('mercadolibre-oauth-start', {
      body: {} // sem payload adicional por enquanto
    });

    if (error) throw new Error(error.message || 'Falha ao iniciar OAuth (start)');
    if (!data?.success || !data?.authorization_url) {
      throw new Error(data?.error || 'Start retornou dados inválidos');
    }

    const url = data.authorization_url as string;
    console.info('[ML-OAUTH] open', url);

    const features = `width=${width},height=${height},resizable=yes,scrollbars=yes`;
    const popup = window.open(url, 'ml_oauth', features);
    if (!popup) throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');

    // 3) Listener do callback (mensagem enviada pela Edge de callback)
    const allowed = [
      window.location.origin,
      // seu supabase project origin:
      'https://tdjyfqnxvjgossuncpwm.supabase.co',
    ];

    const handleMessage = (event: MessageEvent) => {
      if (!allowed.includes(event.origin)) return;
      const d = event.data;

      if (d?.type === 'oauth_success' && d?.provider === 'mercadolivre') {
        console.info('[ML-OAUTH] success', d);
        cleanup();
        onSuccess?.(d);
      } else if (d?.type === 'oauth_error' && d?.provider === 'mercadolivre') {
        console.error('[ML-OAUTH] error', d);
        cleanup();
        onError?.(d?.error || 'Falha no OAuth');
      }
    };

    window.addEventListener('message', handleMessage);

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          onClosed?.();
        }
      } catch { /* ignore cross-origin while aberto */ }
    }, 1000);

    const cleanup = () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
      try { if (popup && !popup.closed) popup.close(); } catch {}
    };

    return { popup, cleanup };
  } catch (e: any) {
    console.error('[ML-OAUTH] start failed:', e);
    onError?.(e?.message || String(e));
    throw e;
  }
}