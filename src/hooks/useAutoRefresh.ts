/**
 * 🎯 HOOK DE AUTO-REFRESH ON-DEMAND OTIMIZADO
 * Sistema inteligente de refresh baseado em intervalos configuráveis
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoRefreshOptions {
  enabled: boolean;
  interval: number; // em segundos
  onRefresh: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number; // em segundos
}

export function useAutoRefresh({
  enabled,
  interval,
  onRefresh,
  maxRetries = 3,
  retryDelay = 5
}: AutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Função de refresh com retry
  const performRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      console.log('🔄 Auto-refresh executando...');
      await onRefresh();
      setLastRefresh(new Date());
      setRetryCount(0);
      console.log('✅ Auto-refresh concluído');
    } catch (error) {
      console.error('❌ Erro no auto-refresh:', error);
      
      if (retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        console.log(`🔄 Tentativa ${newRetryCount}/${maxRetries} em ${retryDelay}s...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          performRefresh();
        }, retryDelay * 1000);
      } else {
        console.log('❌ Máximo de tentativas atingido, parando auto-refresh');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing, retryCount, maxRetries, retryDelay]);

  // Configurar intervalo
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setNextRefresh(null);
      return;
    }

    // Calcular próximo refresh
    const calculateNextRefresh = () => {
      const next = new Date();
      next.setSeconds(next.getSeconds() + interval);
      setNextRefresh(next);
      return next;
    };

    // Iniciar intervalo
    intervalRef.current = setInterval(() => {
      performRefresh();
      calculateNextRefresh();
    }, interval * 1000);

    // Calcular primeiro refresh
    calculateNextRefresh();

    console.log(`⏰ Auto-refresh configurado para ${interval}s`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, interval, performRefresh]);

  // Refresh manual
  const manualRefresh = useCallback(async () => {
    // Limpar timers existentes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    await performRefresh();

    // Reconfigurar intervalo se habilitado
    if (enabled) {
      intervalRef.current = setInterval(() => {
        performRefresh();
      }, interval * 1000);
    }
  }, [enabled, interval, performRefresh]);

  // Pausar/retomar
  const pauseRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setNextRefresh(null);
  }, []);

  const resumeRefresh = useCallback(() => {
    if (enabled && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        performRefresh();
      }, interval * 1000);
    }
  }, [enabled, interval, performRefresh]);

  // Tempo até próximo refresh
  const getTimeUntilRefresh = useCallback(() => {
    if (!nextRefresh) return null;
    const now = new Date();
    const diff = nextRefresh.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 1000));
  }, [nextRefresh]);

  return {
    isRefreshing,
    lastRefresh,
    nextRefresh,
    retryCount,
    timeUntilRefresh: getTimeUntilRefresh(),
    manualRefresh,
    pauseRefresh,
    resumeRefresh
  };
}