// 🚨 DEPRECADO - Use useOAuthFlow ou MercadoLivreService
// Esta implementação estava bypassando segurança PKCE

export interface MLPopupConfig {
  width?: number;
  height?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onClosed?: () => void;
}

export function openMlPopup(config: MLPopupConfig = {}) {
  console.warn('🚨 openMlPopup DEPRECADO - Redirecionando para fluxo seguro');
  
  const { onError } = config;
  
  // Redirecionar para página de integrações com fluxo seguro
  const redirectUrl = '/configuracoes/integracoes?connect=mercadolivre&secure=true';
  
  // Notificar erro para que componentes saibam que o fluxo mudou
  onError?.('openMlPopup foi deprecado. Use MercadoLivreService.connect() ou useOAuthFlow.');
  
  // Redirect em vez de popup inseguro
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 1000);
  
  return {
    popup: null,
    cleanup: () => {}
  };
}