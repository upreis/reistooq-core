// 🎯 ENHANCED - Hook principal para integrações avançadas
// Advanced integration management with real-time updates and performance optimization

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  UseEnhancedIntegrationCoreReturn,
  EnhancedIntegration,
  Provider,
  IntegrationMetrics,
  IntegrationAlert,
  EnhancedIntegrationError,
  ConnectionTestResult,
  SyncResult,
  SyncOptions,
  ConfigValidationResult,
  IntegrationLog,
  IntegrationEvent,
  RealTimeSubscription
} from '../types/enhanced-integrations.types';
import { EnhancedIntegrationService } from '../services/EnhancedIntegrationService';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

export const useEnhancedIntegrationCore = (): UseEnhancedIntegrationCoreReturn => {
  // ========== STATE MANAGEMENT ==========
  const [integrations, setIntegrations] = useState<EnhancedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EnhancedIntegrationError | null>(null);
  const [metrics, setMetrics] = useState<Record<Provider, IntegrationMetrics>>({} as Record<Provider, IntegrationMetrics>);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  
  // ========== REFS & UTILITIES ==========
  const { toast } = useToast();
  const debouncedError = useDebounce(error, 500);
  const serviceRef = useRef<EnhancedIntegrationService>();
  const realTimeRef = useRef<RealTimeSubscription | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const alertsIntervalRef = useRef<NodeJS.Timeout>();

  // ========== MEMOIZED SERVICE ==========
  const service = useMemo(() => {
    if (!serviceRef.current) {
      serviceRef.current = new EnhancedIntegrationService();
    }
    return serviceRef.current;
  }, []);

  // ========== CORE OPERATIONS ==========

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [integrationsData, alertsData] = await Promise.all([
        service.getAllIntegrations(),
        service.getAlerts()
      ]);
      
      setIntegrations(integrationsData);
      setAlerts(alertsData);
      
      // Load metrics for each integration
      const metricsPromises = integrationsData.map(async (integration) => {
        const metrics = await service.getMetrics(integration.provider);
        return { provider: integration.provider, metrics };
      });
      
      const metricsResults = await Promise.allSettled(metricsPromises);
      const metricsMap = {} as Record<Provider, IntegrationMetrics>;
      
      metricsResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          metricsMap[result.value.provider] = result.value.metrics;
        }
      });
      
      setMetrics(metricsMap);
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'LOAD_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load integrations',
        provider: 'tiny',
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const refreshIntegrations = useCallback(async () => {
    await loadIntegrations();
  }, [loadIntegrations]);

  const connectProvider = useCallback(async (provider: Provider, config: any) => {
    try {
      // Optimistic update
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'connecting' }
          : integration
      ));

      await service.connectProvider(provider, config, { validate: true, test: true });
      
      toast({
        title: "✅ Integração conectada",
        description: `${provider} foi conectado com sucesso`,
      });

      await refreshIntegrations();
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'CONNECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to connect provider',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);

      // Revert optimistic update
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'error' }
          : integration
      ));
    }
  }, [service, toast, refreshIntegrations]);

  const disconnectProvider = useCallback(async (provider: Provider) => {
    try {
      // Optimistic update
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'disconnected' }
          : integration
      ));

      await service.disconnectProvider(provider);
      
      toast({
        title: "🔌 Integração desconectada",
        description: `${provider} foi desconectado`,
        variant: "destructive"
      });

      await refreshIntegrations();
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'DISCONNECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to disconnect provider',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);
    }
  }, [service, toast, refreshIntegrations]);

  const testConnection = useCallback(async (provider: Provider): Promise<ConnectionTestResult> => {
    try {
      const result = await service.testConnection(provider);
      
      toast({
        title: result.success ? "🟢 Conexão OK" : "🔴 Conexão falhou",
        description: result.success 
          ? `${provider} está respondendo em ${result.response_time}ms`
          : `${provider}: ${result.errors?.join(', ')}`,
        variant: result.success ? "default" : "destructive"
      });

      return result;
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'TEST_FAILED',
        message: err instanceof Error ? err.message : 'Failed to test connection',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);
      
      return {
        success: false,
        response_time: 0,
        details: {},
        errors: [error.message]
      };
    }
  }, [service, toast]);

  const syncData = useCallback(async (provider: Provider, options?: SyncOptions): Promise<SyncResult> => {
    try {
      // Show sync progress
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'syncing' }
          : integration
      ));

      const result = await service.syncData(provider, options);
      
      toast({
        title: result.success ? "🔄 Sincronização concluída" : "⚠️ Sincronização com problemas",
        description: result.success 
          ? `${result.entities_processed} itens processados em ${Math.round(result.duration / 1000)}s`
          : `${result.entities_failed} itens falharam: ${result.errors.join(', ')}`,
        variant: result.success ? "default" : "destructive"
      });

      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { 
              ...integration, 
              status: result.success ? 'connected' : 'error',
              last_sync: new Date()
            }
          : integration
      ));

      return result;
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'SYNC_FAILED',
        message: err instanceof Error ? err.message : 'Failed to sync data',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);

      // Revert status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, status: 'error' }
          : integration
      ));

      throw error;
    }
  }, [service, toast]);

  // ========== ADVANCED OPERATIONS ==========

  const updateConfig = useCallback(async (provider: Provider, config: any) => {
    try {
      await service.connectProvider(provider, config, { validate: true, test: false });
      
      toast({
        title: "⚙️ Configuração atualizada",
        description: `Configurações do ${provider} foram salvas`,
      });

      await refreshIntegrations();
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'CONFIG_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to update configuration',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);
    }
  }, [service, toast, refreshIntegrations]);

  const validateConfig = useCallback(async (provider: Provider, config: any): Promise<ConfigValidationResult> => {
    return await service.validateConfig(provider, config);
  }, [service]);

  const retryFailedOperations = useCallback(async (provider: Provider) => {
    try {
      await service.retryFailedOperations(provider);
      
      toast({
        title: "🔄 Reprocessando operações",
        description: `Tentando reprocessar operações falhadas do ${provider}`,
      });
      
    } catch (err) {
      const error: EnhancedIntegrationError = {
        code: 'RETRY_FAILED',
        message: err instanceof Error ? err.message : 'Failed to retry operations',
        provider,
        timestamp: new Date(),
        correlation_id: generateCorrelationId()
      };
      setError(error);
    }
  }, [service, toast]);

  const pauseIntegration = useCallback(async (provider: Provider) => {
    await service.pauseIntegration(provider);
    toast({
      title: "⏸️ Integração pausada",
      description: `${provider} foi pausado temporariamente`,
      variant: "default"
    });
    await refreshIntegrations();
  }, [service, toast, refreshIntegrations]);

  const resumeIntegration = useCallback(async (provider: Provider) => {
    await service.resumeIntegration(provider);
    toast({
      title: "▶️ Integração retomada",
      description: `${provider} foi reativado`,
    });
    await refreshIntegrations();
  }, [service, toast, refreshIntegrations]);

  const getIntegrationLogs = useCallback(async (provider: Provider, limit?: number): Promise<IntegrationLog[]> => {
    return await service.getIntegrationLogs(provider, limit);
  }, [service]);

  const exportConfiguration = useCallback(async (): Promise<string> => {
    try {
      const config = await service.exportConfiguration();
      toast({
        title: "📤 Configuração exportada",
        description: "Configurações foram exportadas com sucesso",
      });
      return config;
    } catch (err) {
      toast({
        title: "❌ Erro na exportação",
        description: "Falha ao exportar configurações",
        variant: "destructive"
      });
      throw err;
    }
  }, [service, toast]);

  const importConfiguration = useCallback(async (config: string) => {
    try {
      await service.importConfiguration(config);
      toast({
        title: "📥 Configuração importada",
        description: "Configurações foram importadas com sucesso",
      });
      await refreshIntegrations();
    } catch (err) {
      toast({
        title: "❌ Erro na importação",
        description: "Falha ao importar configurações",
        variant: "destructive"
      });
      throw err;
    }
  }, [service, toast, refreshIntegrations]);

  // ========== REAL-TIME UPDATES ==========

  const setupRealTimeUpdates = useCallback(() => {
    // Implementation would set up WebSocket or SSE connection
    // for real-time integration status updates
    
    const subscription: RealTimeSubscription = {
      subscribe: (callback: (event: IntegrationEvent) => void) => {
        // Setup real-time subscription
        return () => {
          // Cleanup subscription
        };
      },
      unsubscribe: () => {
        // Cleanup
      },
      isConnected: true
    };

    realTimeRef.current = subscription;
    
    return subscription.subscribe((event: IntegrationEvent) => {
      switch (event.type) {
        case 'status_change':
          setIntegrations(prev => prev.map(integration => 
            integration.provider === event.provider 
              ? { ...integration, status: event.data.status }
              : integration
          ));
          break;
        case 'sync_progress':
          // Update sync progress
          break;
        case 'metric_update':
          setMetrics(prev => ({
            ...prev,
            [event.provider]: event.data
          }));
          break;
      }
    });
  }, []);

  // ========== PERIODIC UPDATES ==========

  const setupPeriodicUpdates = useCallback(() => {
    // Update metrics every 30 seconds
    metricsIntervalRef.current = setInterval(async () => {
      try {
        const metricsPromises = integrations.map(async (integration) => {
          const metrics = await service.getMetrics(integration.provider);
          return { provider: integration.provider, metrics };
        });
        
        const results = await Promise.allSettled(metricsPromises);
        const newMetrics = {} as Record<Provider, IntegrationMetrics>;
        
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            newMetrics[result.value.provider] = result.value.metrics;
          }
        });
        
        setMetrics(newMetrics);
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    }, 30000);

    // Update alerts every 60 seconds
    alertsIntervalRef.current = setInterval(async () => {
      try {
        const alertsData = await service.getAlerts();
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to update alerts:', error);
      }
    }, 60000);
  }, [service, integrations]);

  // ========== ERROR HANDLING ==========

  useEffect(() => {
    if (debouncedError) {
      toast({
        title: "❌ Erro na integração",
        description: debouncedError.message,
        variant: "destructive"
      });
    }
  }, [debouncedError, toast]);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    loadIntegrations();
    setupRealTimeUpdates();
    
    return () => {
      if (realTimeRef.current) {
        realTimeRef.current.unsubscribe();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      if (alertsIntervalRef.current) {
        clearInterval(alertsIntervalRef.current);
      }
    };
  }, [loadIntegrations, setupRealTimeUpdates]);

  useEffect(() => {
    if (integrations.length > 0) {
      setupPeriodicUpdates();
    }
    
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      if (alertsIntervalRef.current) {
        clearInterval(alertsIntervalRef.current);
      }
    };
  }, [integrations, setupPeriodicUpdates]);

  // ========== RETURN INTERFACE ==========

  return {
    integrations,
    loading,
    error,
    metrics,
    alerts,
    refreshIntegrations,
    connectProvider,
    disconnectProvider,
    testConnection,
    syncData,
    updateConfig,
    validateConfig,
    retryFailedOperations,
    pauseIntegration,
    resumeIntegration,
    getIntegrationLogs,
    exportConfiguration,
    importConfiguration
  };
};

// ========== UTILITY FUNCTIONS ==========

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}