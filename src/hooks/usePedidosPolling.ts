/**
 * 🔄 HOOK DE POLLING AUTOMÁTICO - ETAPA 1 REFATORAÇÃO
 * Atualização automática de dados a cada 60s (conforme PDF recomendado)
 * Mantém sincronização sem sobrecarregar o sistema
 */

import { useEffect, useRef, useCallback } from 'react';

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
  
  // Detectar interação do usuário
  useEffect(() => {
    if (!pauseOnInteraction) return;
    
    const handleInteractionStart = () => {
      isInteractingRef.current = true;
    };
    
    const handleInteractionEnd = () => {
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 2000); // 2s de grace period após interação
    };
    
    // Eventos de interação
    window.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('keydown', handleInteractionStart);
    window.addEventListener('keyup', handleInteractionEnd);
    
    return () => {
      window.removeEventListener('mousedown', handleInteractionStart);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('keydown', handleInteractionStart);
      window.removeEventListener('keyup', handleInteractionEnd);
    };
  }, [pauseOnInteraction]);
  
  // Função de refresh com validação
  const safeRefresh = useCallback(() => {
    // Não atualizar se usuário está interagindo
    if (pauseOnInteraction && isInteractingRef.current) {
      console.log('🔄 [POLLING] Refresh pausado - usuário interagindo');
      return;
    }
    
    // Não atualizar se a última atualização foi muito recente (< 30s)
    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current.getTime();
    if (timeSinceLastRefresh < 30000) {
      console.log('🔄 [POLLING] Refresh muito recente, aguardando...');
      return;
    }
    
    console.log('🔄 [POLLING] Atualizando dados automaticamente...');
    lastRefreshRef.current = new Date();
    onRefresh();
  }, [onRefresh, pauseOnInteraction]);
  
  // Iniciar/parar polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🔄 [POLLING] Desativado');
      }
      return;
    }
    
    console.log(`🔄 [POLLING] Ativado - intervalo de ${intervalMs}ms (${intervalMs / 1000}s)`);
    
    // Limpar interval anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Criar novo interval
    intervalRef.current = setInterval(safeRefresh, intervalMs);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🔄 [POLLING] Limpo');
      }
    };
  }, [enabled, intervalMs, safeRefresh]);
  
  return {
    lastRefresh: lastRefreshRef.current,
    isActive: enabled && intervalRef.current !== null,
    forceRefresh: () => {
      lastRefreshRef.current = new Date();
      onRefresh();
    }
  };
}
