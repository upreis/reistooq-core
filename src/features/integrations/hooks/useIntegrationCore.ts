// 🎯 Core integration orchestration hook
// Centralized integration management with performance optimization

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UseIntegrationCoreReturn, Integration, Provider, IntegrationError } from '../types/integrations.types';
import { IntegrationService } from '../services/IntegrationService';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

export const useIntegrationCore = (): UseIntegrationCoreReturn => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<IntegrationError | null>(null);
  const { toast } = useToast();

  // Debounced error state para evitar spam de notificações
  const debouncedError = useDebounce(error, 500);

  // Memoized service instance
  const integrationService = useMemo(() => new IntegrationService(), []);

  // Load integrations on mount
  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getAllIntegrations();
      setIntegrations(data);
    } catch (err) {
      const error: IntegrationError = {
        code: 'LOAD_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load integrations',
        provider: 'tiny', // fallback
        timestamp: new Date()
      };
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [integrationService]);

  // Refresh integrations
  const refreshIntegrations = useCallback(async () => {
    await loadIntegrations();
  }, [loadIntegrations]);

  // Connect provider with optimistic updates
  const connectProvider = useCallback(async (provider: Provider) => {
    try {
      // Optimistic update
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'connecting' }
          : integration
      ));

      await integrationService.connectProvider(provider);
      
      toast({
        title: "Integração conectada",
        description: `${provider} foi conectado com sucesso`,
      });

      // Refresh to get updated state
      await refreshIntegrations();
    } catch (err) {
      const error: IntegrationError = {
        code: 'CONNECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to connect provider',
        provider,
        timestamp: new Date()
      };
      setError(error);

      // Revert optimistic update
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'disconnected' }
          : integration
      ));
    }
  }, [integrationService, toast, refreshIntegrations]);

  // Disconnect provider
  const disconnectProvider = useCallback(async (provider: Provider) => {
    try {
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'disconnected' }
          : integration
      ));

      await integrationService.disconnectProvider(provider);
      
      toast({
        title: "Integração desconectada",
        description: `${provider} foi desconectado`,
        variant: "destructive"
      });

      await refreshIntegrations();
    } catch (err) {
      const error: IntegrationError = {
        code: 'DISCONNECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to disconnect provider',
        provider,
        timestamp: new Date()
      };
      setError(error);
    }
  }, [integrationService, toast, refreshIntegrations]);

  // Test connection
  const testConnection = useCallback(async (provider: Provider): Promise<boolean> => {
    try {
      const isHealthy = await integrationService.testConnection(provider);
      
      toast({
        title: isHealthy ? "Conexão OK" : "Conexão falhou",
        description: isHealthy 
          ? `${provider} está respondendo corretamente`
          : `${provider} não está respondendo`,
        variant: isHealthy ? "default" : "destructive"
      });

      return isHealthy;
    } catch (err) {
      const error: IntegrationError = {
        code: 'TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to test connection',
        provider,
        timestamp: new Date()
      };
      setError(error);
      return false;
    }
  }, [integrationService, toast]);

  // Sync data
  const syncData = useCallback(async (provider: Provider) => {
    try {
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, last_sync: new Date() }
          : integration
      ));

      await integrationService.syncData(provider);
      
      toast({
        title: "Sincronização concluída",
        description: `Dados do ${provider} foram sincronizados`,
      });

      await refreshIntegrations();
    } catch (err) {
      const error: IntegrationError = {
        code: 'SYNC_FAILED',
        message: err instanceof Error ? err.message : 'Failed to sync data',
        provider,
        timestamp: new Date()
      };
      setError(error);
    }
  }, [integrationService, toast, refreshIntegrations]);

  // Show error toast when debounced error changes
  useEffect(() => {
    if (debouncedError) {
      toast({
        title: "Erro na integração",
        description: debouncedError.message,
        variant: "destructive"
      });
    }
  }, [debouncedError, toast]);

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  return {
    integrations,
    loading,
    error,
    refreshIntegrations,
    connectProvider,
    disconnectProvider,
    testConnection,
    syncData
  };
};