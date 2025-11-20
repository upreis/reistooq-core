/**
 * 🔄 HOOK DE POLLING AUTOMÁTICO - DEVOLUÇÕES
 * Atualiza dados automaticamente em intervalo configurável
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseDevolucoesPollingOptions {
  enabled?: boolean;
  interval?: number; // ms
  onNewData?: (newCount: number) => void;
  pauseOnInteraction?: boolean;
}

export function useDevolucoesPolling({
  enabled = false,
  interval = 60000, // 1 minuto default
  onNewData,
  pauseOnInteraction = true,
}: UseDevolucoesPollingOptions) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  const isInteractingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef<number>(0);

  // Detectar interação do usuário
  useEffect(() => {
    if (!pauseOnInteraction) return;

    const handleInteractionStart = () => {
      isInteractingRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleInteractionEnd = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 3000); // 3s sem interação = retomar polling
    };

    window.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('keydown', handleInteractionStart);
    window.addEventListener('keyup', handleInteractionEnd);

    return () => {
      window.removeEventListener('mousedown', handleInteractionStart);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('keydown', handleInteractionStart);
      window.removeEventListener('keyup', handleInteractionEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pauseOnInteraction]);

  // Função de polling
  const poll = useCallback(async () => {
    const now = Date.now();
    
    // Verificar se deve pausar por interação
    if (pauseOnInteraction && isInteractingRef.current) {
      console.log('⏸️ Polling pausado: usuário interagindo');
      return;
    }

    // Throttle: mínimo 30s entre polls
    if (now - lastRefreshRef.current < 30000) {
      console.log('⏸️ Polling throttled: muito cedo');
      return;
    }

    console.log('🔄 Polling: verificando novos dados...');
    lastRefreshRef.current = now;

    // ✅ CORREÇÃO CRÍTICA 1: Usar refetch() ao invés de invalidateQueries + setTimeout
    // Buscar dados atuais do cache
    const currentData = queryClient.getQueryData(['devolucoes-2025']) as any[] | undefined;
    const oldCount = currentData?.length || 0;
    lastCountRef.current = oldCount;

    // Refetch para buscar novos dados imediatamente (garante dados atualizados)
    const result = await queryClient.refetchQueries({ queryKey: ['devolucoes-2025'] });
    
    // Verificar novos dados após refetch concluído
    const newData = queryClient.getQueryData(['devolucoes-2025']) as any[] | undefined;
    const newCount = newData?.length || 0;

    if (newCount > oldCount && onNewData) {
      const diff = newCount - oldCount;
      console.log(`✨ Novos dados detectados: +${diff} devoluções`);
      onNewData(diff);
    }
  }, [queryClient, onNewData, pauseOnInteraction]);

  // Configurar intervalo de polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`🔄 Polling ativado: intervalo ${interval}ms`);
    
    // Poll inicial
    poll();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      poll();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, poll]);

  // Função para forçar refresh manual
  const forceRefresh = useCallback(() => {
    console.log('🔄 Refresh manual forçado');
    poll();
  }, [poll]);

  return {
    forceRefresh,
    isPolling: enabled && intervalRef.current !== null,
    lastRefresh: lastRefreshRef.current,
  };
}
