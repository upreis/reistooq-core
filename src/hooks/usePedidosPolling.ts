/**
 * 🔄 HOOK DE POLLING AUTOMÁTICO - ETAPA 2 OTIMIZADO
 * Atualização automática de dados a cada 60s (conforme PDF recomendado)
 * Mantém sincronização sem sobrecarregar o sistema
 * 
 * OTIMIZAÇÕES APLICADAS (FASE 2):
 * - ✅ Polling funciona mesmo com lista vazia
 * - ✅ Timeout cancelado corretamente no cleanup
 * - ✅ Logs apenas em desenvolvimento
 * - ✅ Race conditions eliminadas
 * - ✅ NOVO: Pausa quando aba está inativa (visibilitychange)
 * - ✅ NOVO: Pausa quando usuário está offline
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const isDev = process.env.NODE_ENV === 'development';

interface UsePedidosPollingOptions {
  enabled: boolean;
  intervalMs?: number;
  onRefresh: () => void;
  /**
   * Pausa o polling quando usuário está interagindo com a página
   * (evita atualizar dados enquanto usuário está selecionando/editando)
   */
  pauseOnInteraction?: boolean;
  /**
   * Pausa o polling quando aba está em background
   */
  pauseOnHidden?: boolean;
}

export function usePedidosPolling({
  enabled,
  intervalMs = 60000, // 60 segundos (recomendação do PDF)
  onRefresh,
  pauseOnInteraction = true,
  pauseOnHidden = true // ✅ FASE 2: Novo - pausa quando aba inativa
}: UsePedidosPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());
  const isInteractingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ FASE 2: Estado para visibilidade da aba e conexão
  const [isTabVisible, setIsTabVisible] = useState<boolean>(!document.hidden);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // ✅ FASE 2: Detectar visibilidade da aba
  useEffect(() => {
    if (!pauseOnHidden) return;
    
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      
      if (isDev) {
        console.log(`🔄 [POLLING] Aba ${visible ? 'visível' : 'oculta'}`);
      }
      
      // Se a aba voltou a ficar visível e faz tempo desde último refresh, atualizar
      if (visible && enabled) {
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current.getTime();
        if (timeSinceLastRefresh >= intervalMs) {
          if (isDev) console.log('🔄 [POLLING] Aba reativada - atualizando dados...');
          lastRefreshRef.current = new Date();
          onRefresh();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnHidden, enabled, intervalMs, onRefresh]);
  
  // ✅ FASE 2: Detectar conexão online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isDev) console.log('🔄 [POLLING] Conexão restaurada');
      
      // Atualizar dados quando volta online
      if (enabled) {
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current.getTime();
        if (timeSinceLastRefresh >= 30000) { // Mínimo 30s desde último refresh
          if (isDev) console.log('🔄 [POLLING] Online novamente - atualizando dados...');
          lastRefreshRef.current = new Date();
          onRefresh();
        }
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      if (isDev) console.log('🔄 [POLLING] Conexão perdida - polling pausado');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, onRefresh]);
  
  // Detectar interação do usuário
  useEffect(() => {
    if (!pauseOnInteraction) return;
    
    const handleInteractionStart = () => {
      isInteractingRef.current = true;
      if (isDev) console.log('🔄 [POLLING] Interação detectada');
    };
    
    const handleInteractionEnd = () => {
      // ✅ FIX: Limpar timeout anterior antes de criar novo
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
        timeoutRef.current = null;
        if (isDev) console.log('🔄 [POLLING] Interação finalizada, polling liberado');
      }, 2000); // 2s de grace period após interação
    };
    
    // Eventos de interação
    window.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('keydown', handleInteractionStart);
    window.addEventListener('keyup', handleInteractionEnd);
    
    return () => {
      // ✅ FIX: Cleanup completo - cancelar timeout pendente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      window.removeEventListener('mousedown', handleInteractionStart);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('keydown', handleInteractionStart);
      window.removeEventListener('keyup', handleInteractionEnd);
    };
  }, [pauseOnInteraction]);
  
  // Função de refresh com validação
  const safeRefresh = useCallback(() => {
    // ✅ FASE 2: Não atualizar se aba está oculta ou offline
    if (pauseOnHidden && !isTabVisible) {
      if (isDev) console.log('🔄 [POLLING] Refresh pausado - aba oculta');
      return;
    }
    
    if (!isOnline) {
      if (isDev) console.log('🔄 [POLLING] Refresh pausado - offline');
      return;
    }
    
    // Não atualizar se usuário está interagindo
    if (pauseOnInteraction && isInteractingRef.current) {
      if (isDev) console.log('🔄 [POLLING] Refresh pausado - usuário interagindo');
      return;
    }
    
    // Não atualizar se a última atualização foi muito recente (< 30s)
    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current.getTime();
    if (timeSinceLastRefresh < 30000) {
      if (isDev) console.log('🔄 [POLLING] Refresh muito recente, aguardando...', `(${Math.round(timeSinceLastRefresh/1000)}s atrás)`);
      return;
    }
    
    if (isDev) console.log('🔄 [POLLING] Atualizando dados automaticamente...');
    lastRefreshRef.current = new Date();
    onRefresh();
  }, [onRefresh, pauseOnInteraction, pauseOnHidden, isTabVisible, isOnline]);
  
  // Iniciar/parar polling
  useEffect(() => {
    // ✅ FIX: Sempre limpar interval anterior primeiro (evita race conditions)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // ✅ FASE 2: Não iniciar polling se condições não permitem
    if (!enabled || !isOnline || (pauseOnHidden && !isTabVisible)) {
      return;
    }
    
    // ✅ FIX: Criar novo interval (anterior já foi limpo acima)
    intervalRef.current = setInterval(safeRefresh, intervalMs);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, safeRefresh, isOnline, isTabVisible, pauseOnHidden]);
  
  return {
    lastRefresh: lastRefreshRef.current,
    isActive: enabled && intervalRef.current !== null && isOnline && isTabVisible,
    isOnline,
    isTabVisible,
    forceRefresh: () => {
      lastRefreshRef.current = new Date();
      onRefresh();
    }
  };
}
