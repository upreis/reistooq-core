import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { integrationMonitor, IntegrationStatus } from '@/utils/apiHelpers';
import { logger } from '@/utils/logger';

export function useIntegrationStatus() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para verificar status de uma integração
  const checkIntegrationHealth = async (accountId: string, provider: string) => {
    try {
      logger.debug(`Verificando saúde da integração ${provider} (${accountId})`);

      const { data, error } = await supabase.functions.invoke('integration-health-check', {
        body: {
          integration_account_id: accountId,
          provider
        }
      });

      if (error) {
        integrationMonitor.updateStatus(provider, false, error);
        return false;
      }

      integrationMonitor.updateStatus(provider, data?.success || false);
      return data?.success || false;
    } catch (error) {
      logger.error(`Erro ao verificar saúde da integração ${provider}:`, error);
      integrationMonitor.updateStatus(provider, false, error as Error);
      return false;
    }
  };

  // Buscar todas as contas de integração e verificar status
  const refreshStatuses = async () => {
    try {
      setLoading(true);

      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('is_active', true);

      if (error) {
        logger.error('Erro ao buscar contas de integração:', error);
        return;
      }

      // Verificar saúde de cada integração
      const healthChecks = accounts?.map(account => 
        checkIntegrationHealth(account.id, account.provider)
      ) || [];

      await Promise.allSettled(healthChecks);

      // Atualizar estado com estatísticas do monitor
      setStatuses(integrationMonitor.getAllStatuses());
    } catch (error) {
      logger.error('Erro ao atualizar status das integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para reconectar uma integração
  const reconnectIntegration = async (accountId: string, provider: string) => {
    try {
      logger.info(`Iniciando reconexão da integração ${provider} (${accountId})`);

      if (provider === 'mercadolivre') {
        // Tentar refresh de token
        const { data, error } = await supabase.functions.invoke('mercadolibre-token-refresh', {
          body: { integration_account_id: accountId }
        });

        if (data?.success) {
          integrationMonitor.updateStatus(provider, true);
          await refreshStatuses();
          return { success: true, message: 'Token MercadoLibre renovado com sucesso' };
        } else {
          return { 
            success: false, 
            message: 'Falha ao renovar token - reconexão OAuth necessária',
            requiresOAuth: true 
          };
        }
      }

      if (provider === 'shopee') {
        // Para Shopee, verificar se pode sincronizar pedidos
        const { data, error } = await supabase.functions.invoke('shopee-orders', {
          body: { 
            integration_account_id: accountId,
            action: 'sync_orders' 
          }
        });

        if (data?.success) {
          integrationMonitor.updateStatus(provider, true);
          await refreshStatuses();
          return { success: true, message: 'Conexão Shopee verificada com sucesso' };
        } else {
          return { 
            success: false, 
            message: 'Falha na verificação - reconexão necessária',
            requiresOAuth: true 
          };
        }
      }

      return { success: false, message: 'Provider não suportado para reconexão automática' };
    } catch (error) {
      logger.error(`Erro ao reconectar integração ${provider}:`, error);
      return { success: false, message: `Erro na reconexão: ${(error as Error).message}` };
    }
  };

  useEffect(() => {
    refreshStatuses();

    // Atualizar status a cada 5 minutos
    const interval = setInterval(refreshStatuses, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    statuses,
    loading,
    refreshStatuses,
    reconnectIntegration,
    checkIntegrationHealth
  };
}