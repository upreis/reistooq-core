// 🎯 Centralized MercadoLibre OAuth Popup Utility (PKCE READY)

export interface MLPopupConfig {
  width?: number;
  height?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onClosed?: () => void;
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const randVerifier = (len = 64) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
};

export function openMlPopup(config: MLPopupConfig = {}) {
  const { width = 600, height = 700, onSuccess, onError, onClosed } = config;

  const CLIENT_ID = (import.meta.env?.VITE_ML_CLIENT_ID as string) || "2053972567766696";
  const REDIRECT_URI = "https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service";
  const AUTHORIZATION_URL = "https://auth.mercadolivre.com.br/authorization";

  // Abre o popup imediatamente para não ser bloqueado, depois navegamos para a URL real
  const popup = window.open("about:blank", "ml_oauth", `width=${width},height=${height},scrollbars=yes,resizable=yes`);
  if (!popup) throw new Error("Pop-up bloqueado. Permita pop-ups para continuar.");

  // Gera PKCE e monta a URL assíncronamente
  (async () => {
    const code_verifier = randVerifier(64);
    const data = new TextEncoder().encode(code_verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const code_challenge = b64url(new Uint8Array(digest));

    // Incluímos o code_verifier DENTRO do state (base64url JSON) para o backend usar no /oauth/token
    const stateObj = { redirect_uri: REDIRECT_URI, org_id: "default", code_verifier };
    const stateB64 = btoa(JSON.stringify(stateObj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

    const url =
      AUTHORIZATION_URL +
      "?response_type=code" +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(stateB64)}` +
      `&code_challenge=${encodeURIComponent(code_challenge)}` +
      `&code_challenge_method=S256`;

    console.info("[ML-OAUTH] open", url);
    try {
      popup.location.href = url;
    } catch {
      // se der erro de navegação, feche o popup
      try { popup.close(); } catch {}
      onError?.("Falha ao abrir popup de autenticação");
    }
  })();

  // Listener de retorno
  const handleMessage = (event: MessageEvent) => {
    console.info("[ML-OAUTH] message.received", event.data);

    // Aceita da mesma origem ou do domínio do Supabase
    if (!event.origin.includes("supabase.co") && event.origin !== window.location.origin) return;

    const ok = event.data?.type === "oauth_success" && event.data?.provider === "mercadolivre";
    const err = event.data?.type === "oauth_error" && event.data?.provider === "mercadolivre";

    if (ok) {
      try { popup.close(); } catch {}
      window.removeEventListener("message", handleMessage);
      onSuccess?.(event.data);
    } else if (err) {
      try { popup.close(); } catch {}
      window.removeEventListener("message", handleMessage);
      onError?.(event.data?.error || "Falha na autenticação");
    }
  };

  console.info("[ML-OAUTH] message.listener.ready");
  window.addEventListener("message", handleMessage);

  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener("message", handleMessage);
      onClosed?.();
    }
  }, 1000);

  return {
    popup,
    cleanup: () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(checkClosed);
      if (!popup.closed) popup.close();
    },
  };
}

