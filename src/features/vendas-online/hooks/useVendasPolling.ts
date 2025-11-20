/**
 * 🔄 HOOK PARA POLLING AUTOMÁTICO - VENDAS ONLINE
 * Inspirado na arquitetura de referência /pedidos
 * 
 * Features:
 * - Atualização automática periódica de dados
 * - Configurável (ativado/desativado)
 * - Intervalo customizável
 * - Pausa automática quando aba está inativa
 * - Notificação de novos dados
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseVendasPollingOptions {
  enabled?: boolean;
  interval?: number; // em milissegundos
  onNewData?: (count: number) => void;
}

const DEFAULT_POLLING_INTERVAL = 60000; // 1 minuto

export const useVendasPolling = ({
  enabled = false,
  interval = DEFAULT_POLLING_INTERVAL,
  onNewData
}: UseVendasPollingOptions = {}) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisibleRef = useRef(true);

  // Função de polling
  const poll = useCallback(async () => {
    if (!isTabVisibleRef.current || !enabled) {
      return;
    }

    try {
      console.log('🔄 [VENDAS POLLING] Iniciando atualização automática...');
      
      // Invalidar query para forçar refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['vendas-ml'],
        exact: false 
      });
      
      console.log('✅ [VENDAS POLLING] Dados atualizados com sucesso');
      
      // Notificar sobre novos dados se callback fornecido
      if (onNewData) {
        // Aqui poderia comparar dados antigos vs novos e contar diferenças
        onNewData(0);
      }
    } catch (error) {
      console.error('❌ [VENDAS POLLING] Erro ao atualizar dados:', error);
    }
  }, [enabled, queryClient, onNewData]);

  // Detectar visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (isTabVisibleRef.current && enabled) {
        console.log('👁️ [VENDAS POLLING] Aba visível - retomando polling');
        poll(); // Atualizar imediatamente ao voltar à aba
      } else {
        console.log('🙈 [VENDAS POLLING] Aba oculta - pausando polling');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, poll]);

  // Configurar intervalo de polling
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ [VENDAS POLLING] Polling desabilitado');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`⏰ [VENDAS POLLING] Polling ativado (intervalo: ${interval / 1000}s)`);
    
    // Executar primeira atualização imediatamente
    poll();
    
    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      poll();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, poll]);

  // Função para forçar atualização manual
  const forceRefresh = useCallback(() => {
    console.log('🔄 [VENDAS POLLING] Atualização manual forçada');
    poll();
  }, [poll]);

  return {
    forceRefresh,
    isPolling: enabled && isTabVisibleRef.current
  };
};
