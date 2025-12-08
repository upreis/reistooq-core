/**
 * 📦 VENDAS COM ENVIO - Hook de Polling
 * Polling automático após primeira busca manual (Combo 2.1)
 */

import { useEffect, useRef } from 'react';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { POLLING_INTERVAL_MS } from '../config';

interface UseVendasComEnvioPollingOptions {
  enabled?: boolean;
  onPoll?: () => void;
}

export function useVendasComEnvioPolling({ 
  enabled = true, 
  onPoll 
}: UseVendasComEnvioPollingOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDocumentVisibleRef = useRef(true);
  
  const { hasFetchedFromAPI, setShouldFetch } = useVendasComEnvioStore();

  // Monitorar visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Polling automático (apenas após primeira busca manual)
  useEffect(() => {
    // Limpar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Só iniciar polling se:
    // 1. Feature está habilitada
    // 2. Usuário já fez primeira busca manual
    if (!enabled || !hasFetchedFromAPI) {
      return;
    }

    console.log('[useVendasComEnvioPolling] Iniciando polling automático');

    intervalRef.current = setInterval(() => {
      // Só fazer polling se aba está visível
      if (!isDocumentVisibleRef.current) {
        console.log('[useVendasComEnvioPolling] Aba inativa, pulando polling');
        return;
      }

      // Só fazer polling se online
      if (!navigator.onLine) {
        console.log('[useVendasComEnvioPolling] Offline, pulando polling');
        return;
      }

      console.log('[useVendasComEnvioPolling] Executando polling');
      setShouldFetch(true);
      onPoll?.();
    }, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, hasFetchedFromAPI, setShouldFetch, onPoll]);

  return {
    isPollingActive: enabled && hasFetchedFromAPI,
  };
}
