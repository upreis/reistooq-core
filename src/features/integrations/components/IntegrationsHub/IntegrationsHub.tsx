// 🎯 Hub unificado de configurações e integrações
// Dashboard principal com anúncios, integrações e configurações

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';

import { useIntegrationCore } from '../../hooks/useIntegrationCore';
import { useOAuthFlow } from '../../hooks/useOAuthFlow';
import type { Provider } from '../../types/integrations.types';

import { IntegrationCard } from '../IntegrationCards/IntegrationCard';
import { ConfigurationPanel } from '../ConfigurationPanel/ConfigurationPanel';
import { OAuthModal } from '../OAuthModal/OAuthModal';
import { HealthMini } from '../HealthDashboard/HealthMini';
import { AnnouncementManager } from '../../../announcements/components/AnnouncementManager';
import { AdminDashboard } from '../../../admin/components/AdminDashboard';
import { MercadoLivreConnection } from '@/components/integrations/MercadoLivreConnection';
import { ShopeeConnection } from '@/components/integrations/ShopeeConnection';
import { FEATURES } from '@/config/features';

export const IntegrationsHub: React.FC = () => {
  const {
    integrations,
    loading,
    error,
    connectProvider,
    disconnectProvider,
    testConnection,
    refreshIntegrations
  } = useIntegrationCore();

  const { isAuthenticating, authError } = useOAuthFlow();

  const [configProvider, setConfigProvider] = React.useState<Provider | null>(null);
  const [showConfigPanel, setShowConfigPanel] = React.useState(false);

  // Event handlers
  const handleConnect = React.useCallback(async (provider: Provider) => {
    await connectProvider(provider);
  }, [connectProvider]);

  const handleDisconnect = React.useCallback(async (provider: Provider) => {
    await disconnectProvider(provider);
  }, [disconnectProvider]);

  const handleTest = React.useCallback(async (provider: Provider) => {
    await testConnection(provider);
  }, [testConnection]);

  const handleConfigure = React.useCallback((provider: Provider) => {
    // Skip ConfigurationPanel for Shopee since it has its own custom modal
    if (provider === 'shopee') {
      return; // ShopeeConnection component handles its own configuration modal
    }
    setConfigProvider(provider);
    setShowConfigPanel(true);
  }, []);

  const handleOAuth = React.useCallback((provider: Provider) => {
    // OAuth logic handled by individual integration cards
    console.log('OAuth initiated for:', provider);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    await refreshIntegrations();
  }, [refreshIntegrations]);

  const handleCloseConfig = React.useCallback(() => {
    setShowConfigPanel(false);
    setConfigProvider(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          {error?.message || 'Erro desconhecido'}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mercado Livre Integration - Layout completo para contas conectadas */}
      {FEATURES.MERCADO_LIVRE && <MercadoLivreConnection />}
      
      {/* Grid compacto apenas para integrações não conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shopee Integration - Card compacto */}
        {FEATURES.SHOPEE && <ShopeeConnection />}
      </div>
      
      {/* Outras integrações dinâmicas */}
      {integrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations
            .filter(integration => integration.provider !== 'shopee') 
            .map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onTest={handleTest}
              onConfigure={handleConfigure}
              onOAuth={handleOAuth}
            />
          ))}
        </div>
      )}

      {/* Configuration Panel - Skip for Shopee since it has custom modal */}
      {configProvider && configProvider !== 'shopee' && (
        <ConfigurationPanel
          provider={configProvider}
          open={showConfigPanel}
          onClose={handleCloseConfig}
        />
      )}

      {/* OAuth Modal */}
      <OAuthModal
        open={isAuthenticating}
        onClose={() => {/* handled by useOAuthFlow */}}
      />
    </div>
  );
};