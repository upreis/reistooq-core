/**
 * 🔄 HOOK DE POLLING AUTOMÁTICO - ETAPA 1 REFATORAÇÃO (CORRIGIDO)
 * Atualização automática de dados a cada 60s (conforme PDF recomendado)
 * Mantém sincronização sem sobrecarregar o sistema
 * 
 * CORREÇÕES APLICADAS:
 * - ✅ Polling funciona mesmo com lista vazia
 * - ✅ Timeout cancelado corretamente no cleanup
 * - ✅ Logs apenas em desenvolvimento
 * - ✅ Race conditions eliminadas
 */

import { useEffect, useRef, useCallback } from 'react';

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
}

export function usePedidosPolling({
  enabled,
  intervalMs = 60000, // 60 segundos (recomendação do PDF)
  onRefresh,
  pauseOnInteraction = true
}: UsePedidosPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());
  const isInteractingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ FIX: Ref para cancelar timeout
  
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
    // ✅ NOTA: Refs (isInteractingRef, lastRefreshRef) são intencionalmente omitidas
    // das dependências pois são estáveis e não causam re-renders
    
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
  }, [onRefresh, pauseOnInteraction]); // ✅ Refs estáveis não precisam estar aqui
  
  // Iniciar/parar polling
  useEffect(() => {
    // ✅ FIX: Sempre limpar interval anterior primeiro (evita race conditions)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (!enabled) {
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
  }, [enabled, intervalMs]); // ✅ CRÍTICO: removido safeRefresh das deps para evitar loop infinito
  
  return {
    lastRefresh: lastRefreshRef.current,
    isActive: enabled && intervalRef.current !== null,
    forceRefresh: () => {
      lastRefreshRef.current = new Date();
      onRefresh();
    }
  };
}
