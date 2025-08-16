// 🎯 Hub central de integrações
// Dashboard unificado para gerenciar todas as integrações

import React, { useState, useCallback } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useIntegrationCore, useConfigManager, useOAuthFlow, useIntegrationHealth } from '@/features/integrations';
import { IntegrationCard } from '../IntegrationCards/IntegrationCard';
import { ConfigurationPanel } from '../ConfigurationPanel/ConfigurationPanel';
import { OAuthModal } from '../OAuthModal/OAuthModal';
import { HealthMini } from '../HealthDashboard/HealthMini';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Provider } from '@/features/integrations/types/integrations.types';

export const IntegrationsHub: React.FC = () => {
  const core = useIntegrationCore();
  const cfg = useConfigManager();
  const oauth = useOAuthFlow();
  const health = useIntegrationHealth();

  const [configProvider, setConfigProvider] = useState<Provider | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Handlers
  const handleConnect = useCallback(async (provider: Provider) => {
    await core.connectProvider(provider);
  }, [core]);

  const handleDisconnect = useCallback(async (provider: Provider) => {
    await core.disconnectProvider(provider);
  }, [core]);

  const handleTest = useCallback(async (provider: Provider) => {
    await core.testConnection(provider);
  }, [core]);

  const handleConfigure = useCallback((provider: Provider) => {
    setConfigProvider(provider);
    setShowConfigPanel(true);
  }, []);

  const handleOAuth = useCallback(async (provider: Provider) => {
    await oauth.initiateFlow(provider);
  }, [oauth]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      core.refreshIntegrations(),
      health.refreshHealth()
    ]);
  }, [core, health]);

  const handleCloseConfig = useCallback(() => {
    setShowConfigPanel(false);
    setConfigProvider(null);
  }, []);

  if (core.loading) {
    return (
      <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Carregando integrações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (core.error) {
    return (
      <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar integrações: {core.error.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6"
      data-testid="integrations-hub"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Gerencie suas conexões com plataformas externas
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={core.loading || health.loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${core.loading || health.loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Health Mini Dashboard */}
      <HealthMini className="mb-6" />

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {core.integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            health={health.healthStatus[integration.provider] || null}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onTest={handleTest}
            onConfigure={handleConfigure}
            onOAuth={handleOAuth}
            isAuthenticating={oauth.isAuthenticating}
          />
        ))}
      </div>

      {/* Empty State */}
      {core.integrations.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma integração encontrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure suas primeira integração para começar a sincronizar dados.
            </p>
            <Button onClick={handleRefresh}>
              Verificar integrações disponíveis
            </Button>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      <ConfigurationPanel
        provider={configProvider}
        open={showConfigPanel}
        onClose={handleCloseConfig}
      />

      {/* OAuth Modal */}
      <OAuthModal
        open={oauth.isAuthenticating}
        onClose={() => {/* OAuth handle seus próprios estados */}}
      />
    </div>
  );
};